import { ethers } from "hardhat";
import { saveAddress } from "./utils";

const TREASURY = process.env.TREASURY_ADDRESS || "0x695658fC245ABbaDD7a276fF73Ed44f7374275D1";

async function main() {
  const Factory = await ethers.getContractFactory("UniswapV2Factory");
  const factory = await Factory.deploy(TREASURY);
  await factory.deployed();
  console.log(`UniswapV2Factory deployed at ${factory.address}`);
  await saveAddress("UniswapV2Factory", factory.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
