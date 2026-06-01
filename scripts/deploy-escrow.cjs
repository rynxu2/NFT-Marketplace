const hre = require("hardhat");

async function main() {
  console.log("Deploying NexusEscrow to", hre.network.name, "...");

  const NexusEscrow = await hre.ethers.getContractFactory("NexusEscrow");
  const escrow = await NexusEscrow.deploy();
  await escrow.waitForDeployment();

  const address = await escrow.getAddress();
  console.log("NexusEscrow deployed to:", address);
  console.log("");
  console.log("Add this to your .env.local:");
  console.log(`NEXT_PUBLIC_ESCROW_CONTRACT=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
