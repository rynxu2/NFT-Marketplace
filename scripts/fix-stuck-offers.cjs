const hre = require("hardhat");

async function main() {
  const ESCROW = "0x99b05f86aa98081bfc28a0134d38324e8ed6a364";
  const escrow = await hre.ethers.getContractAt("NexusEscrow", ESCROW);

  // Check total offers
  const total = await escrow.totalOffers();
  console.log("Total offers on-chain:", Number(total));

  // Check each offer
  for (let i = 0; i < Number(total); i++) {
    const o = await escrow.getOffer(i);
    const statusMap = ["Active", "Accepted", "Cancelled", "Rejected"];
    console.log(`\nOffer #${i}:`);
    console.log("  Buyer:", o[0]);
    console.log("  Seller:", o[1]);
    console.log("  Amount:", hre.ethers.formatEther(o[4]), "POL");
    console.log("  Status:", statusMap[Number(o[5])]);
  }

  // Cancel active offers (as the deployer/signer)
  const [signer] = await hre.ethers.getSigners();
  console.log("\nSigner:", signer.address);

  for (let i = 0; i < Number(total); i++) {
    const o = await escrow.getOffer(i);
    if (Number(o[5]) === 0) { // Active
      if (o[0].toLowerCase() === signer.address.toLowerCase()) {
        console.log(`\nCancelling offer #${i} as buyer...`);
        const tx = await escrow.cancelOffer(i);
        await tx.wait();
        console.log(`Offer #${i} cancelled! Refunded ${hre.ethers.formatEther(o[4])} POL`);
      } else if (o[1].toLowerCase() === signer.address.toLowerCase()) {
        console.log(`\nRejecting offer #${i} as seller...`);
        const tx = await escrow.rejectOffer(i);
        await tx.wait();
        console.log(`Offer #${i} rejected! Refunded ${hre.ethers.formatEther(o[4])} POL to buyer`);
      } else {
        console.log(`\nOffer #${i}: signer is neither buyer nor seller, cannot cancel.`);
        console.log(`  Buyer needs to call cancelOffer(${i}) from their wallet.`);
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
