import { ethers } from "hardhat";
import { saveAddress } from "./utils";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deployer: ${deployer.address}`);

  const factory = await ethers.getContractFactory("WELTX");
  const weltx = await factory.deploy();
  await weltx.deployed();
  console.log(`WELTX deployed at ${weltx.address}`);
  await saveAddress("WELTX", weltx.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
