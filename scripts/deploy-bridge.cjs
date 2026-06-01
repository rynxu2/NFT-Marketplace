const hre = require("hardhat");

async function main() {
  console.log("Deploying NexusBridge to", hre.network.name, "...");

  const NexusBridge = await hre.ethers.getContractFactory("NexusBridge");
  const bridge = await NexusBridge.deploy();
  await bridge.waitForDeployment();

  const address = await bridge.getAddress();
  console.log("NexusBridge deployed to:", address);
  console.log("");
  console.log("Add this to your .env.local:");
  console.log(`NEXT_PUBLIC_BRIDGE_CONTRACT=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
