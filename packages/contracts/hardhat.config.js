require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      chainId: 86137,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 86137,
    },
    nakharaxTestnet: {
      url: process.env.RPC_URL || "https://rpc.nakharax.com",
      chainId: 86137,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
    },
  },
};
