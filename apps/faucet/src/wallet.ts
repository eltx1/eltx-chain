import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config({ path: require("path").resolve(__dirname, "../../.env") });

const rpcUrl = process.env.RPC_URL || "https://rpc.eltx.online";
const privateKey = process.env.FAUCET_PRIVATE_KEY;

if (!privateKey) {
  throw new Error("FAUCET_PRIVATE_KEY is required");
}

export const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
export const wallet = new ethers.Wallet(privateKey, provider);

export async function drip(target: string, amount: bigint) {
  const tx = await wallet.sendTransaction({
    to: target,
    value: amount,
    gasPrice: await provider.getGasPrice(),
    gasLimit: 21000n
  });
  return tx.wait();
}

export async function getHotWalletBalance() {
  return provider.getBalance(wallet.address);
}
