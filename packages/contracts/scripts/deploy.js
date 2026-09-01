const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("=================================================================");
  console.log("  🚀 Deploying NakharaX Core Smart Contracts Suite (Chain ID: 86137)");
  console.log("=================================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);

  // 1. Deploy $tNAK Token (1 Trillion Supply as per genesis.json)
  const Token = await hre.ethers.getContractFactory("NakharaxToken");
  const token = await Token.deploy(1000000000000); // 1,000,000,000,000 $tNAK
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ [1/8] NakharaxToken ($tNAK) deployed to:", tokenAddress);

  // 2. Deploy Faucet Treasury
  const Faucet = await hre.ethers.getContractFactory("FaucetTreasury");
  const faucet = await Faucet.deploy(tokenAddress);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("✅ [2/8] FaucetTreasury deployed to:", faucetAddress);

  // Fund Faucet Treasury with 50M tNAK
  const txFund = await token.transfer(faucetAddress, hre.ethers.parseEther("50000000"));
  await txFund.wait();
  console.log("   -> Funded Faucet Treasury with 50M $tNAK");

  // 3. Deploy PoPC Liquid Staking Pool ($sNAK)
  const Staking = await hre.ethers.getContractFactory("PoPCStakingPool");
  const staking = await Staking.deploy(
    tokenAddress,
    300, // 300 seconds (5 min cooldown for testnet)
    hre.ethers.parseEther("10") // min stake 10 tNAK
  );
  await staking.waitForDeployment();
  const stakingAddress = await staking.getAddress();
  console.log("✅ [3/8] PoPCStakingPool ($sNAK 8.4% APY) deployed to:", stakingAddress);

  // 4. Deploy JobMarketplaceStandalone (DeAI Escrow)
  const Marketplace = await hre.ethers.getContractFactory("JobMarketplaceStandalone");
  const marketplace = await Marketplace.deploy(
    tokenAddress,
    hre.ethers.parseEther("100"), // min stake 100 tNAK
    100, // 1% platform fee
    300 // 5 min dispute period
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ [4/8] JobMarketplaceStandalone (Escrow) deployed to:", marketplaceAddress);

  // 5. Deploy SovereignAgentRegistry (DID / ERC-725)
  const AgentRegistry = await hre.ethers.getContractFactory("SovereignAgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("✅ [5/8] SovereignAgentRegistry (Agent DID) deployed to:", agentRegistryAddress);

  // 6. Deploy LoRAAdapterHub (TIES / DARE Weight Merging)
  const LoRAHub = await hre.ethers.getContractFactory("LoRAAdapterHub");
  const loraHub = await LoRAHub.deploy();
  await loraHub.waitForDeployment();
  const loraHubAddress = await loraHub.getAddress();
  console.log("✅ [6/8] LoRAAdapterHub deployed to:", loraHubAddress);

  // 7. Deploy TokenVesting
  const Vesting = await hre.ethers.getContractFactory("TokenVesting");
  const vesting = await Vesting.deploy(tokenAddress);
  await vesting.waitForDeployment();
  const vestingAddress = await vesting.getAddress();
  console.log("✅ [7/8] TokenVesting deployed to:", vestingAddress);

  // 8. Deploy StarkFRIVerifier (ZK Proof Verifier)
  const ZkVerifier = await hre.ethers.getContractFactory("StarkFRIVerifier");
  const zkVerifier = await ZkVerifier.deploy();
  await zkVerifier.waitForDeployment();
  const zkVerifierAddress = await zkVerifier.getAddress();
  console.log("✅ [8/8] StarkFRIVerifier (STARK-FRI) deployed to:", zkVerifierAddress);

  // Export Deployed Addresses Manifest
  const deploymentManifest = {
    chainId: 86137,
    network: "nakharax-testnet",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      NakharaxToken: tokenAddress,
      FaucetTreasury: faucetAddress,
      PoPCStakingPool: stakingAddress,
      JobMarketplaceStandalone: marketplaceAddress,
      SovereignAgentRegistry: agentRegistryAddress,
      LoRAAdapterHub: loraHubAddress,
      TokenVesting: vestingAddress,
      StarkFRIVerifier: zkVerifierAddress,
    },
  };

  const outputPath = path.join(__dirname, "../deployed-contracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentManifest, null, 2));
  console.log("=================================================================");
  console.log("🎉 All 8 Core Contracts Deployed! Manifest written to:", outputPath);
  console.log("=================================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
