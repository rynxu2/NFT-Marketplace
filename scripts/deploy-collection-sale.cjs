const hre = require("hardhat");

async function main() {
  console.log("Deploying NexusCollectionSale to", hre.network.name, "...");

  const NexusCollectionSale = await hre.ethers.getContractFactory("NexusCollectionSale");
  const sale = await NexusCollectionSale.deploy();
  await sale.waitForDeployment();

  const address = await sale.getAddress();
  console.log("NexusCollectionSale deployed to:", address);
  console.log("");
  console.log("Add this to your .env.local:");
  console.log(`NEXT_PUBLIC_COLLECTION_SALE_CONTRACT=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
