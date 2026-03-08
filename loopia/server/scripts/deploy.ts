import { ethers } from "hardhat";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying ItemShop with account:", deployer.address);

  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", ethers.formatEther(balance), "AVAX");

  const ItemShop = await ethers.getContractFactory("ItemShop");
  const shop = await ItemShop.deploy();
  await shop.waitForDeployment();

  const address = await shop.getAddress();
  console.log("ItemShop deployed to:", address);
  console.log("\nAdd this to your .env:");
  console.log(`SHOP_CONTRACT_ADDRESS=${address}`);
  console.log(`\nVerify on Snowtrace: https://testnet.snowtrace.io/address/${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
