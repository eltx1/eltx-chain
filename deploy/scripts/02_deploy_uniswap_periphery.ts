import { ethers } from "hardhat";
import { readAddresses, saveAddress } from "./utils";

async function main() {
  const addresses = await readAddresses();
  const factoryAddress = addresses["UniswapV2Factory"];
  const weltxAddress = addresses["WELTX"];

  if (!factoryAddress || !weltxAddress) {
    throw new Error("Missing factory or WELTX address. Run previous deployment steps.");
  }

  const Router = await ethers.getContractFactory("UniswapV2Router02");
  const router = await Router.deploy(factoryAddress, weltxAddress);
  await router.deployed();
  console.log(`UniswapV2Router02 deployed at ${router.address}`);
  await saveAddress("UniswapV2Router02", router.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
