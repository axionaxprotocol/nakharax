const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying NakharaX Core Smart Contracts Suite to L1 (Chain ID: 86137)...");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Address:", deployer.address);

  // 1. Deploy $tNAK Token (1 Billion Supply)
  const Token = await hre.ethers.getContractFactory("NakharaxToken");
  const token = await Token.deploy(1000000000);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ NakharaxToken ($tNAK) deployed to:", tokenAddress);

  // 2. Deploy Faucet Treasury
  const Faucet = await hre.ethers.getContractFactory("FaucetTreasury");
  const faucet = await Faucet.deploy(tokenAddress);
  await faucet.waitForDeployment();
  const faucetAddress = await faucet.getAddress();
  console.log("✅ FaucetTreasury deployed to:", faucetAddress);

  // Transfer 50,000,000 tNAK to Faucet Treasury
  const txFund = await token.transfer(faucetAddress, hre.ethers.parseEther("50000000"));
  await txFund.wait();
  console.log("✅ Funded Faucet Treasury with 50M tNAK");

  // 3. Deploy JobMarketplaceStandalone (Escrow)
  const Marketplace = await hre.ethers.getContractFactory("JobMarketplaceStandalone");
  const marketplace = await Marketplace.deploy(
    tokenAddress,
    hre.ethers.parseEther("100"), // min stake 100 tNAK
    100, // 1% platform fee
    300 // 5 min dispute period
  );
  await marketplace.waitForDeployment();
  const marketplaceAddress = await marketplace.getAddress();
  console.log("✅ JobMarketplaceStandalone (DeAI Escrow) deployed to:", marketplaceAddress);

  // 4. Deploy SovereignAgentRegistry
  const AgentRegistry = await hre.ethers.getContractFactory("SovereignAgentRegistry");
  const agentRegistry = await AgentRegistry.deploy();
  await agentRegistry.waitForDeployment();
  const agentRegistryAddress = await agentRegistry.getAddress();
  console.log("✅ SovereignAgentRegistry deployed to:", agentRegistryAddress);

  // 5. Deploy LoRAAdapterHub
  const LoRAHub = await hre.ethers.getContractFactory("LoRAAdapterHub");
  const loraHub = await LoRAHub.deploy();
  await loraHub.waitForDeployment();
  const loraHubAddress = await loraHub.getAddress();
  console.log("✅ LoRAAdapterHub deployed to:", loraHubAddress);

  // Export Deployed Addresses Manifest
  const deploymentManifest = {
    chainId: 86137,
    network: "nakharax-testnet",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
    contracts: {
      NakharaxToken: tokenAddress,
      FaucetTreasury: faucetAddress,
      JobMarketplaceStandalone: marketplaceAddress,
      SovereignAgentRegistry: agentRegistryAddress,
      LoRAAdapterHub: loraHubAddress,
    },
  };

  const outputPath = path.join(__dirname, "../deployed-contracts.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentManifest, null, 2));
  console.log("🎉 Deployment Manifest written to:", outputPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
