const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NakharaX L1 Smart Contracts Suite", function () {
  let nakToken, faucetTreasury, jobMarketplace, loraHub, agentRegistry;
  let owner, worker1, submitter1, user1;
  const INITIAL_SUPPLY = 1_000_000_000_000n; // 1 Trillion NAK
  const HUNDRED_NAK = ethers.parseEther("100");

  beforeEach(async function () {
    [owner, worker1, submitter1, user1] = await ethers.getSigners();

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
      expect(await nakToken.decimals()).to.equal(18);
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
      expect(await faucetTreasury.cooldownTime()).to.equal(3600);
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
      expect(job1.status).to.equal(0); // Pending
      expect(job1.reward).to.equal(reward);
      expect(job1.submitter).to.equal(submitter1.address);

      // 3. Worker is assigned to job
      await jobMarketplace.connect(worker1).assignJob(1);
      const jobAssigned = await jobMarketplace.getJob(1);
      expect(jobAssigned.status).to.equal(1); // Assigned
      expect(jobAssigned.worker).to.equal(worker1.address);

      // 4. Worker submits result & PoPC STARK proof
      const resultHash = ethers.keccak256(ethers.toUtf8Bytes("output: reasoning tokens"));
      const proofHash = ethers.keccak256(ethers.toUtf8Bytes("stark_fri_proof_valid"));
      await jobMarketplace.connect(worker1).submitResult(1, resultHash, proofHash);

      const jobCompleted = await jobMarketplace.getJob(1);
      expect(jobCompleted.status).to.equal(2); // Completed
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
  });

  describe("4. LoRAAdapterHub", function () {
    it("should register a LoRA adapter with Merkle root and record merges", async function () {
      const adapterId = "lora-financial-deepseek-r1";
      const merkleRoot = ethers.keccak256(ethers.toUtf8Bytes("weights-tree-v1"));
      await loraHub.registerAdapter(adapterId, "Financial Specialist LoRA", "DeepSeek-R1", merkleRoot);

      expect(await loraHub.getAdapterCount()).to.equal(1);
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

      expect(await agentRegistry.getAgentCount()).to.equal(1);
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
});
