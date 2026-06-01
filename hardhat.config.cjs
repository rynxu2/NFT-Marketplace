require("dotenv").config({ path: ".env.local" });
require("@nomicfoundation/hardhat-toolbox");

const POLYGON_PRIVATE_KEY = process.env.POLYGON_PRIVATE_KEY || "";
const POLYGON_RPC = process.env.NEXT_PUBLIC_POLYGON_RPC || "https://rpc-amoy.polygon.technology/";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      evmVersion: "cancun",
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    amoy: {
      url: POLYGON_RPC,
      chainId: 80002,
      accounts: POLYGON_PRIVATE_KEY ? [POLYGON_PRIVATE_KEY] : [],
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test-contracts",
    cache: "./cache-hardhat",
    artifacts: "./artifacts-hardhat",
  },
};
