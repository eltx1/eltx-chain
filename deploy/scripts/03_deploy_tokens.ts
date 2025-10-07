import { ethers } from "hardhat";
import { saveAddress } from "./utils";

const TREASURY = process.env.TREASURY_ADDRESS || "0x695658fC245ABbaDD7a276fF73Ed44f7374275D1";

async function main() {
  if (!ethers.isAddress(TREASURY)) {
    throw new Error(`Invalid treasury address: ${TREASURY}`);
  }

  const ELTXFactory = await ethers.getContractFactory("ELTXToken");
  const eltx = await ELTXFactory.deploy(TREASURY);
  await eltx.deployed();
  console.log(`ELTXToken deployed at ${eltx.address}`);
  await saveAddress("ELTXToken", eltx.address);

  const USDTEFactory = await ethers.getContractFactory("USDTE");
  const usdte = await USDTEFactory.deploy(TREASURY);
  await usdte.deployed();
  console.log(`USDTE deployed at ${usdte.address}`);
  await saveAddress("USDTE", usdte.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
