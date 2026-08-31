const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NakharaX L1 Smart Contracts Suite", function () {
  let nakToken, faucetTreasury, jobMarketplace, loraHub, agentRegistry, tokenVesting, starkVerifier, stakingPool;
  let owner, worker1, submitter1, user1, validator1, staker1;
  const INITIAL_SUPPLY = 1_000_000_000_000n; // 1 Trillion NAK
  const HUNDRED_NAK = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, worker1, submitter1, user1, validator1, staker1] = await ethers.getSigners();

    // 1. Deploy NakharaxToken
    const TokenFactory = await ethers.getContractFactory("NakharaxToken");
    nakToken = await TokenFactory.deploy(INITIAL_SUPPLY);
    await nakToken.waitForDeployment();

    // 2. Deploy FaucetTreasury
    const FaucetFactory = await ethers.getContractFactory("FaucetTreasury");
    faucetTreasury = await FaucetFactory.deploy(await nakToken.getAddress());
    await faucetTreasury.waitForDeployment();

    // 3. Deploy JobMarketplaceStandalone (minStake: 1000 NAK, platformFeeRate: 100 bps = 1%, disputePeriod: 3600s)
    const MarketplaceFactory = await ethers.getContractFactory("JobMarketplaceStandalone");
    jobMarketplace = await MarketplaceFactory.deploy(
      await nakToken.getAddress(),
      ethers.parseEther("1000"),
      100, // 1%
      3600 // 1 hour
    );
    await jobMarketplace.waitForDeployment();

    // 4. Deploy LoRAAdapterHub
    const LoraFactory = await ethers.getContractFactory("LoRAAdapterHub");
    loraHub = await LoraFactory.deploy();
    await loraHub.waitForDeployment();

    // 5. Deploy SovereignAgentRegistry
    const AgentFactory = await ethers.getContractFactory("SovereignAgentRegistry");
    agentRegistry = await AgentFactory.deploy();
    await agentRegistry.waitForDeployment();

    // 6. Deploy TokenVesting
    const VestingFactory = await ethers.getContractFactory("TokenVesting");
    tokenVesting = await VestingFactory.deploy(await nakToken.getAddress());
    await tokenVesting.waitForDeployment();

    // 7. Deploy StarkFRIVerifier
    const VerifierFactory = await ethers.getContractFactory("StarkFRIVerifier");
    starkVerifier = await VerifierFactory.deploy();
    await starkVerifier.waitForDeployment();

    // 8. Deploy PoPCStakingPool (unbondingPeriod: 300s, minStake: 10 NAK)
    const StakingFactory = await ethers.getContractFactory("PoPCStakingPool");
    stakingPool = await StakingFactory.deploy(
      await nakToken.getAddress(),
      300, // 300s unbonding cooldown for tests
      ethers.parseEther("10")
    );
    await stakingPool.waitForDeployment();

    // Fund submitter and worker with tokens
    await nakToken.transfer(submitter1.address, ethers.parseEther("100000"));
    await nakToken.transfer(worker1.address, ethers.parseEther("100000"));
    // Fund faucet treasury
    await nakToken.transfer(await faucetTreasury.getAddress(), ethers.parseEther("1000000"));
  });

  describe("1. NakharaxToken ($tNAK)", function () {
    it("should initialize with 1 Trillion supply and correct metadata", async function () {
      expect(await nakToken.name()).to.equal("NakharaX Token");
      expect(await nakToken.symbol()).to.equal("tNAK");
      expect(await nakToken.decimals()).to.equal(18n);
      const expectedSupply = INITIAL_SUPPLY * 10n ** 18n;
      expect(await nakToken.totalSupply()).to.equal(expectedSupply);
    });

    it("should perform standard transfer and approval", async function () {
      await nakToken.connect(submitter1).transfer(user1.address, HUNDRED_NAK);
      expect(await nakToken.balanceOf(user1.address)).to.equal(HUNDRED_NAK);

      await nakToken.connect(user1).approve(submitter1.address, HUNDRED_NAK);
      expect(await nakToken.allowance(user1.address, submitter1.address)).to.equal(HUNDRED_NAK);

      await nakToken.connect(submitter1).transferFrom(user1.address, owner.address, HUNDRED_NAK);
      expect(await nakToken.balanceOf(user1.address)).to.equal(0n);
    });

    it("should allow owner to mint and reject non-owner", async function () {
      await nakToken.mint(user1.address, HUNDRED_NAK);
      expect(await nakToken.balanceOf(user1.address)).to.equal(HUNDRED_NAK);

      await expect(
        nakToken.connect(user1).mint(user1.address, HUNDRED_NAK)
      ).to.be.revertedWith("Only owner");
    });
  });

  describe("2. FaucetTreasury", function () {
    it("should dispense 100 tNAK and enforce cooldown", async function () {
      const initialBal = await nakToken.balanceOf(user1.address);
      await faucetTreasury.connect(user1).requestTokens();
      expect(await nakToken.balanceOf(user1.address)).to.equal(initialBal + HUNDRED_NAK);

      // Second request immediately should revert due to cooldown
      await expect(
        faucetTreasury.connect(user1).requestTokens()
      ).to.be.revertedWith("Cooldown active: please wait before requesting again");
    });

    it("should allow admin to update dispense amount and cooldown", async function () {
      const newAmount = ethers.parseEther("200");
      await faucetTreasury.setDispenseAmount(newAmount);
      expect(await faucetTreasury.dispenseAmount()).to.equal(newAmount);

      await faucetTreasury.setCooldown(3600);
      expect(await faucetTreasury.cooldownTime()).to.equal(3600n);
    });
  });

  describe("3. JobMarketplaceStandalone (DeAI Escrow & PoPC)", function () {
    it("should register a compute worker with stake", async function () {
      const stakeAmount = ethers.parseEther("2000");
      await nakToken.connect(worker1).approve(await jobMarketplace.getAddress(), stakeAmount);
      await jobMarketplace.connect(worker1).registerWorker(stakeAmount);

      const profile = await jobMarketplace.getWorker(worker1.address);
      expect(profile.active).to.be.true;
      expect(profile.stake).to.equal(stakeAmount);
      expect(profile.jobsCompleted).to.equal(0n);
    });

    it("should allow job creation, assignment, completion, and reward claiming with PoPC proof", async function () {
      // 1. Worker registers
      const stakeAmount = ethers.parseEther("2000");
      await nakToken.connect(worker1).approve(await jobMarketplace.getAddress(), stakeAmount);
      await jobMarketplace.connect(worker1).registerWorker(stakeAmount);

      // 2. Submitter creates job (Job ID 1)
      const reward = ethers.parseEther("500");
      const totalDeposit = (reward * 11n) / 10n; // reward + 10% deposit
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("prompt: DeepSeek-R1 test"));
      await nakToken.connect(submitter1).approve(await jobMarketplace.getAddress(), totalDeposit);
      await jobMarketplace.connect(submitter1).createJob(0, reward, 600, inputHash);

      const job1 = await jobMarketplace.getJob(1);
      expect(job1.status).to.equal(0n); // Pending
      expect(job1.reward).to.equal(reward);
      expect(job1.submitter).to.equal(submitter1.address);

      // 3. Worker is assigned to job
      await jobMarketplace.connect(worker1).assignJob(1);
      const jobAssigned = await jobMarketplace.getJob(1);
      expect(jobAssigned.status).to.equal(1n); // Assigned
      expect(jobAssigned.worker).to.equal(worker1.address);

      // 4. Worker submits result & PoPC STARK proof
      const resultHash = ethers.keccak256(ethers.toUtf8Bytes("output: reasoning tokens"));
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("stark_fri_proof_valid"));
      await jobMarketplace.connect(worker1).submitResult(1, resultHash, proofHash);

      const jobCompleted = await jobMarketplace.getJob(1);
      expect(jobCompleted.status).to.equal(2n); // Completed
      expect(jobCompleted.proofHash).to.equal(proofHash);
      expect(jobCompleted.resultHash).to.equal(resultHash);

      // 5. Fast-forward past dispute period (3600 seconds) and claim reward
      await ethers.provider.send("evm_increaseTime", [3601]);
      await ethers.provider.send("evm_mine", []);

      const workerBalBefore = await nakToken.balanceOf(worker1.address);
      await jobMarketplace.connect(worker1).claimReward(1);
      const workerBalAfter = await nakToken.balanceOf(worker1.address);

      // Fee is 1%, so worker gets 99% of reward (495 NAK)
      const expectedPayout = (reward * 99n) / 100n;
      expect(workerBalAfter - workerBalBefore).to.equal(expectedPayout);
    });

    it("should allow submitter to cancel a pending job and receive full refund", async function () {
      const reward = ethers.parseEther("1000");
      const totalDeposit = (reward * 11n) / 10n; // 1100 NAK
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("prompt: cancel test"));

      await nakToken.connect(submitter1).approve(await jobMarketplace.getAddress(), totalDeposit);
      await jobMarketplace.connect(submitter1).createJob(0, reward, 600, inputHash);

      const subBalBefore = await nakToken.balanceOf(submitter1.address);
      await jobMarketplace.connect(submitter1).cancelJob(1);
      const subBalAfter = await nakToken.balanceOf(submitter1.address);

      expect(subBalAfter - subBalBefore).to.equal(totalDeposit);
      const job = await jobMarketplace.getJob(1);
      expect(job.status).to.equal(4n); // Cancelled
    });

    it("should support dispute and slashing for malicious/Byzantine workers", async function () {
      // 1. Worker registers with 2,000 NAK stake
      const stakeAmount = ethers.parseEther("2000");
      await nakToken.connect(worker1).approve(await jobMarketplace.getAddress(), stakeAmount);
      await jobMarketplace.connect(worker1).registerWorker(stakeAmount);

      // 2. Submitter creates job
      const reward = ethers.parseEther("500");
      const totalDeposit = (reward * 11n) / 10n;
      const inputHash = ethers.keccak256(ethers.toUtf8Bytes("prompt: fake AI task"));
      await nakToken.connect(submitter1).approve(await jobMarketplace.getAddress(), totalDeposit);
      await jobMarketplace.connect(submitter1).createJob(0, reward, 600, inputHash);

      // 3. Worker assigned & submits fake proof
      await jobMarketplace.connect(worker1).assignJob(1);
      const fakeResultHash = ethers.keccak256(ethers.toUtf8Bytes("fake result"));
      const fakeProofHash = ethers.keccak256(ethers.toUtf8Bytes("invalid proof"));
      await jobMarketplace.connect(worker1).submitResult(1, fakeResultHash, fakeProofHash);

      // 4. Submitter disputes within dispute window
      await expect(jobMarketplace.connect(submitter1).disputeJob(1))
        .to.emit(jobMarketplace, "JobDisputed")
        .withArgs(1, submitter1.address);

      const disputedJob = await jobMarketplace.getJob(1);
      expect(disputedJob.status).to.equal(3n); // Disputed

      // 5. DAO/Admin resolves dispute with 1,500 NAK slash against worker
      const slashAmount = ethers.parseEther("1500");
      const subBalBefore = await nakToken.balanceOf(submitter1.address);

      await expect(jobMarketplace.connect(owner).resolveDispute(1, true, slashAmount))
        .to.emit(jobMarketplace, "SlashApplied")
        .withArgs(worker1.address, slashAmount);

      // Submitter is refunded deposit + reward
      const subBalAfter = await nakToken.balanceOf(submitter1.address);
      expect(subBalAfter - subBalBefore).to.equal(totalDeposit);

      // Worker stake is reduced from 2,000 to 500 NAK
      const workerProfile = await jobMarketplace.getWorker(worker1.address);
      expect(workerProfile.stake).to.equal(ethers.parseEther("500"));
      expect(workerProfile.active).to.be.false; // Deactivated because stake < minStake (1,000)
      expect(workerProfile.jobsFailed).to.equal(1n);
    });

    it("should allow admin to slash worker directly for verified fraud", async function () {
      const stakeAmount = ethers.parseEther("2000");
      await nakToken.connect(worker1).approve(await jobMarketplace.getAddress(), stakeAmount);
      await jobMarketplace.connect(worker1).registerWorker(stakeAmount);

      await jobMarketplace.connect(owner).slashWorker(worker1.address, ethers.parseEther("1200"));
      const workerProfile = await jobMarketplace.getWorker(worker1.address);
      expect(workerProfile.stake).to.equal(ethers.parseEther("800"));
      expect(workerProfile.active).to.be.false; // Deactivated since stake < minStake (1,000)
    });
  });

  describe("4. LoRAAdapterHub", function () {
    it("should register a LoRA adapter with Merkle root and record merges", async function () {
      const adapterId = "lora-financial-deepseek-r1";
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("weights-tree-v1"));
      await loraHub.registerAdapter(adapterId, "Financial Specialist LoRA", "DeepSeek-R1", merkleRoot);

      expect(await loraHub.getAdapterCount()).to.equal(1n);
      const adapter = await loraHub.adapters(adapterId);
      expect(adapter.name).to.equal("Financial Specialist LoRA");
      expect(adapter.author).to.equal(owner.address);

      // Record a TIES merge
      const mergedRoot = ethers.keccak256(ethers.toUtf8Bytes("merged-ties-v1"));
      await expect(
        loraHub.recordMerge("DeepSeek-R1", "TIES-MERGE", mergedRoot)
      ).to.emit(loraHub, "AdaptersMerged");
    });
  });

  describe("5. SovereignAgentRegistry", function () {
    it("should mint an autonomous agent DID and equip skills", async function () {
      const did = "did:nak:agent-quant-sentinel-01";
      const skills = ["mcp:sec-edgar", "mcp:mt5-risk-shield"];
      await agentRegistry.mintAgent(did, "QuantSentinel Agent", skills, { value: ethers.parseEther("0.5") });

      expect(await agentRegistry.getAgentCount()).to.equal(1n);
      const agent = await agentRegistry.agents(did);
      expect(agent.name).to.equal("QuantSentinel Agent");
      expect(agent.owner).to.equal(owner.address);
      expect(agent.balance).to.equal(ethers.parseEther("0.5"));

      // Equip new skill
      await agentRegistry.equipSkill(did, "mcp:web-search");
      const updatedAgent = await agentRegistry.agents(did);
      expect(updatedAgent.active).to.be.true;
    });
  });

  describe("6. TokenVesting (4-Year Cryptographic Release)", function () {
    const TOTAL_ALLOCATION = ethers.parseEther("1000000"); // 1 Million NAK
    const ONE_YEAR = 365n * 24n * 3600n; // 31,536,000 seconds
    const ONE_YEAR_NUM = 365 * 24 * 3600;
    const FOUR_YEARS = 4n * ONE_YEAR;

    it("should create a 4-year linear vesting schedule with 1-year cliff", async function () {
      const block = await ethers.provider.getBlock("latest");
      const startTime = block.timestamp;

      await nakToken.approve(await tokenVesting.getAddress(), TOTAL_ALLOCATION);
      const tx = await tokenVesting.createVestingSchedule(
        user1.address,
        TOTAL_ALLOCATION,
        startTime,
        ONE_YEAR,
        FOUR_YEARS,
        true // revocable
      );

      expect(await tokenVesting.getScheduleCount()).to.equal(1n);
      const schedules = await tokenVesting.getSchedulesByBeneficiary(user1.address);
      expect(schedules.length).to.equal(1);

      const schedule = await tokenVesting.getSchedule(schedules[0]);
      expect(schedule.beneficiary).to.equal(user1.address);
      expect(schedule.totalAmount).to.equal(TOTAL_ALLOCATION);
      expect(schedule.releasedAmount).to.equal(0n);
      expect(schedule.cliffDuration).to.equal(ONE_YEAR);
    });

    it("should lock tokens and reject release before cliff timestamp", async function () {
      const block = await ethers.provider.getBlock("latest");
      const startTime = block.timestamp;

      await nakToken.approve(await tokenVesting.getAddress(), TOTAL_ALLOCATION);
      await tokenVesting.createVestingSchedule(
        user1.address,
        TOTAL_ALLOCATION,
        startTime,
        ONE_YEAR,
        FOUR_YEARS,
        false // non-revocable
      );

      const schedules = await tokenVesting.getSchedulesByBeneficiary(user1.address);
      const scheduleId = schedules[0];

      // Fast-forward 6 months (halfway to cliff)
      await ethers.provider.send("evm_increaseTime", [Math.floor(ONE_YEAR_NUM / 2)]);
      await ethers.provider.send("evm_mine", []);

      expect(await tokenVesting.getClaimableAmount(scheduleId)).to.equal(0n);

      await expect(
        tokenVesting.release(scheduleId)
      ).to.be.revertedWith("TokenVesting: no tokens due for release");
    });

    it("should release 50% at 2-year mark and 100% at 4-year mark", async function () {
      const block = await ethers.provider.getBlock("latest");
      const startTime = block.timestamp;

      await nakToken.approve(await tokenVesting.getAddress(), TOTAL_ALLOCATION);
      await tokenVesting.createVestingSchedule(
        user1.address,
        TOTAL_ALLOCATION,
        startTime,
        ONE_YEAR,
        FOUR_YEARS,
        false
      );

      const schedules = await tokenVesting.getSchedulesByBeneficiary(user1.address);
      const scheduleId = schedules[0];

      // Fast-forward to 2-year mark (50% duration)
      await ethers.provider.send("evm_increaseTime", [2 * ONE_YEAR_NUM + 1]);
      await ethers.provider.send("evm_mine", []);

      const userBalBefore = await nakToken.balanceOf(user1.address);
      await tokenVesting.release(scheduleId);
      const userBalAfter = await nakToken.balanceOf(user1.address);

      const released50 = userBalAfter - userBalBefore;
      // Allow slight delta for block timestamp precision
      expect(released50).to.be.closeTo(TOTAL_ALLOCATION / 2n, ethers.parseEther("100"));

      // Fast-forward to 4-year mark (100% completion)
      await ethers.provider.send("evm_increaseTime", [2 * ONE_YEAR_NUM]);
      await ethers.provider.send("evm_mine", []);

      await tokenVesting.release(scheduleId);
      const finalBal = await nakToken.balanceOf(user1.address);
      expect(finalBal).to.equal(TOTAL_ALLOCATION);
    });

    it("should allow owner to revoke revocable schedule and refund unvested tokens", async function () {
      const block = await ethers.provider.getBlock("latest");
      const startTime = block.timestamp;

      await nakToken.approve(await tokenVesting.getAddress(), TOTAL_ALLOCATION);
      await tokenVesting.createVestingSchedule(
        user1.address,
        TOTAL_ALLOCATION,
        startTime,
        ONE_YEAR,
        FOUR_YEARS,
        true // revocable
      );

      const schedules = await tokenVesting.getSchedulesByBeneficiary(user1.address);
      const scheduleId = schedules[0];

      // Fast-forward to 2 years (50% vested)
      await ethers.provider.send("evm_increaseTime", [2 * ONE_YEAR_NUM]);
      await ethers.provider.send("evm_mine", []);

      const ownerBalBefore = await nakToken.balanceOf(owner.address);
      const userBalBefore = await nakToken.balanceOf(user1.address);

      await tokenVesting.connect(owner).revoke(scheduleId);

      const ownerBalAfter = await nakToken.balanceOf(owner.address);
      const userBalAfter = await nakToken.balanceOf(user1.address);

      // Beneficiary gets the 50% vested
      expect(userBalAfter - userBalBefore).to.be.closeTo(TOTAL_ALLOCATION / 2n, ethers.parseEther("100"));
      // Owner receives the 50% unvested back
      expect(ownerBalAfter - ownerBalBefore).to.be.closeTo(TOTAL_ALLOCATION / 2n, ethers.parseEther("100"));
    });
  });

  describe("7. StarkFRIVerifier (On-Chain Zero-Knowledge FRI Engine)", function () {
    it("should verify valid Merkle authentication path on-chain", async function () {
      const leaf0 = ethers.keccak256(ethers.toUtf8Bytes("trace_eval_0"));
      const leaf1 = ethers.keccak256(ethers.toUtf8Bytes("trace_eval_1"));
      const leaf2 = ethers.keccak256(ethers.toUtf8Bytes("trace_eval_2"));
      const leaf3 = ethers.keccak256(ethers.toUtf8Bytes("trace_eval_3"));

      // Tree layer 1
      const parent01 = ethers.keccak256(ethers.concat([leaf0, leaf1]));
      const parent23 = ethers.keccak256(ethers.concat([leaf2, leaf3]));
      // Root
      const root = ethers.keccak256(ethers.concat([parent01, parent23]));

      // Merkle proof for leaf0 (index 0): sibling leaf1, then parent23
      const proofForLeaf0 = [leaf1, parent23];
      const isValid = await starkVerifier.verifyMerkleProof(leaf0, proofForLeaf0, 0, root);
      expect(isValid).to.be.true;

      // Tampered leaf should fail
      const fakeLeaf = ethers.keccak256(ethers.toUtf8Bytes("tampered_eval"));
      const isInvalid = await starkVerifier.verifyMerkleProof(fakeLeaf, proofForLeaf0, 0, root);
      expect(isInvalid).to.be.false;
    });

    it("should verify full multi-query STARK FRI proof batch", async function () {
      const leaf0 = ethers.keccak256(ethers.toUtf8Bytes("eval_0"));
      const leaf1 = ethers.keccak256(ethers.toUtf8Bytes("eval_1"));
      const leaf2 = ethers.keccak256(ethers.toUtf8Bytes("eval_2"));
      const leaf3 = ethers.keccak256(ethers.toUtf8Bytes("eval_3"));

      const parent01 = ethers.keccak256(ethers.concat([leaf0, leaf1]));
      const parent23 = ethers.keccak256(ethers.concat([leaf2, leaf3]));
      const initialRoot = ethers.keccak256(ethers.concat([parent01, parent23]));

      const queries = [
        { leaf: leaf0, proof: [leaf1, parent23], index: 0 },
        { leaf: leaf2, proof: [leaf3, parent01], index: 2 },
      ];
      const intermediateRoots = [initialRoot];

      const verified = await starkVerifier.verifyFRIProof.staticCall(
        initialRoot,
        intermediateRoots,
        queries
      );
      expect(verified).to.be.true;
    });
  });

  describe("8. PoPCStakingPool (Liquid Staking & Validator Delegation)", function () {
    const STAKE_AMOUNT = ethers.parseEther("1000");

    beforeEach(async function () {
      await nakToken.transfer(staker1.address, ethers.parseEther("50000"));
    });

    it("should register a validator node with commission rate", async function () {
      await stakingPool.registerValidator(validator1.address, 500); // 5% commission
      const val = await stakingPool.getValidator(validator1.address);
      expect(val.active).to.be.true;
      expect(val.commissionRate).to.equal(500n);
    });

    it("should allow user to stake $tNAK, delegate, and receive liquid $sNAK shares", async function () {
      await stakingPool.registerValidator(validator1.address, 500);

      await nakToken.connect(staker1).approve(await stakingPool.getAddress(), STAKE_AMOUNT);
      await stakingPool.connect(staker1).stake(STAKE_AMOUNT, validator1.address);

      const shares = await stakingPool.userShares(staker1.address);
      expect(shares).to.equal(STAKE_AMOUNT);
      expect(await stakingPool.totalStaked()).to.equal(STAKE_AMOUNT);

      const underlying = await stakingPool.getUnderlyingBalance(staker1.address);
      expect(underlying).to.equal(STAKE_AMOUNT);

      const val = await stakingPool.getValidator(validator1.address);
      expect(val.totalDelegated).to.equal(STAKE_AMOUNT);
    });

    it("should increase underlying $tNAK value when PoPC rewards are injected", async function () {
      await stakingPool.registerValidator(validator1.address, 500);

      // User stakes 1,000 $tNAK
      await nakToken.connect(staker1).approve(await stakingPool.getAddress(), STAKE_AMOUNT);
      await stakingPool.connect(staker1).stake(STAKE_AMOUNT, validator1.address);

      // Protocol injects 100 $tNAK in PoPC consensus rewards
      const REWARD = ethers.parseEther("100");
      await nakToken.approve(await stakingPool.getAddress(), REWARD);
      await stakingPool.injectPoPCRewards(REWARD);

      // Total staked is now 1,100 $tNAK, but total shares remain 1,000 $sNAK
      expect(await stakingPool.totalStaked()).to.equal(STAKE_AMOUNT + REWARD);
      const underlying = await stakingPool.getUnderlyingBalance(staker1.address);
      expect(underlying).to.equal(STAKE_AMOUNT + REWARD);
    });

    it("should enforce unbonding period and release tokens when cooldown expires", async function () {
      await stakingPool.registerValidator(validator1.address, 500);

      await nakToken.connect(staker1).approve(await stakingPool.getAddress(), STAKE_AMOUNT);
      await stakingPool.connect(staker1).stake(STAKE_AMOUNT, validator1.address);

      // Initiate unbonding of 500 $sNAK
      const UNBOND_SHARES = ethers.parseEther("500");
      await stakingPool.connect(staker1).initiateUnbonding(UNBOND_SHARES);

      // Immediate claim should fail (cooldown not met)
      await expect(stakingPool.connect(staker1).claimUnbonded()).to.be.revertedWith(
        "PoPCStakingPool: no unlocked tokens ready"
      );

      // Fast-forward 301 seconds past unbonding cooldown
      await ethers.provider.send("evm_increaseTime", [301]);
      await ethers.provider.send("evm_mine", []);

      const balBefore = await nakToken.balanceOf(staker1.address);
      await stakingPool.connect(staker1).claimUnbonded();
      const balAfter = await nakToken.balanceOf(staker1.address);

      expect(balAfter - balBefore).to.equal(UNBOND_SHARES);
    });

    it("should slash a Byzantine validator proportionally", async function () {
      await stakingPool.registerValidator(validator1.address, 500);

      await nakToken.connect(staker1).approve(await stakingPool.getAddress(), STAKE_AMOUNT);
      await stakingPool.connect(staker1).stake(STAKE_AMOUNT, validator1.address);

      // Slash validator 50% (5000 bps)
      await stakingPool.slashValidator(validator1.address, 5000);

      const val = await stakingPool.getValidator(validator1.address);
      expect(val.totalDelegated).to.equal(ethers.parseEther("500"));
      expect(val.active).to.be.false; // Slashed >= 50% deactivates validator
    });
  });
});
