import { ethers } from "hardhat";
import { readAddresses } from "./utils";

const TREASURY = process.env.TREASURY_ADDRESS || "0x695658fC245ABbaDD7a276fF73Ed44f7374275D1";
const LIQ_ELTX = process.env.LIQUIDITY_INITIAL_ELTX || "10000";
const LIQ_USDTE = process.env.LIQUIDITY_INITIAL_USDTE || "30000";

async function main() {
  const [signer] = await ethers.getSigners();
  console.log(`Funding signer: ${signer.address}`);

  const addresses = await readAddresses();
  const routerAddress = addresses["UniswapV2Router02"];
  const eltxAddress = addresses["ELTXToken"];
  const usdteAddress = addresses["USDTE"];

  if (!routerAddress || !eltxAddress || !usdteAddress) {
    throw new Error("Missing deployed addresses. Run deployment scripts first.");
  }

  const eltx = await ethers.getContractAt("ELTXToken", eltxAddress, signer);
  const usdte = await ethers.getContractAt("USDTE", usdteAddress, signer);
  const router = await ethers.getContractAt("UniswapV2Router02", routerAddress, signer);

  const eltxAmount = ethers.parseUnits(LIQ_ELTX, 18);
  const usdteAmount = ethers.parseUnits(LIQ_USDTE, 6);

  if (signer.address.toLowerCase() !== TREASURY.toLowerCase()) {
    console.warn("[!] Signer is not the treasury address. Ensure allowances are configured.");
  } else {
    const tx = await usdte.mint(TREASURY, usdteAmount);
    await tx.wait();
    console.log(`Minted ${LIQ_USDTE} USDTE to treasury`);
  }

  await (await eltx.approve(routerAddress, eltxAmount)).wait();
  await (await usdte.approve(routerAddress, usdteAmount)).wait();

  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);
  const tx = await router.addLiquidity(
    eltxAddress,
    usdteAddress,
    eltxAmount,
    usdteAmount,
    (eltxAmount * 99n) / 100n,
    (usdteAmount * 99n) / 100n,
    TREASURY,
    deadline
  );
  await tx.wait();

  console.log(`Seeded ${LIQ_ELTX} ELTX and ${LIQ_USDTE} USDTE liquidity`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
