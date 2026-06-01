const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("═══════════════════════════════════════════");
  console.log("  NEXUS NFT — Polygon Amoy Deployment");
  console.log("═══════════════════════════════════════════");
  console.log(`Deployer:  ${deployer.address}`);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log(`Balance:   ${ethers.formatEther(balance)} POL`);
  console.log("───────────────────────────────────────────");

  if (balance === 0n) {
    throw new Error(
      "Deployer has 0 POL. Get testnet POL from https://faucet.polygon.technology/"
    );
  }

  console.log("Deploying NexusNFT...");
  const NexusNFT = await ethers.getContractFactory("NexusNFT");
  const nft = await NexusNFT.deploy();
  await nft.waitForDeployment();

  const address = await nft.getAddress();

  console.log("───────────────────────────────────────────");
  console.log(`✅ NexusNFT deployed to: ${address}`);
  console.log(`   Explorer: https://amoy.polygonscan.com/address/${address}`);
  console.log("");
  console.log("📋 Next steps:");
  console.log(`   1. Copy this address to .env.local:`);
  console.log(`      NEXT_PUBLIC_POLYGON_CONTRACT_ADDRESS=${address}`);
  console.log(`   2. Restart your dev server (npm run dev)`);
  console.log("═══════════════════════════════════════════");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
