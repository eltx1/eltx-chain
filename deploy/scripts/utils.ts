import { promises as fs } from "fs";
import path from "path";

const ADDRESSES_FILE = path.resolve(__dirname, "../verify_addresses.json");

export interface DeploymentMap {
  [key: string]: string;
}

export async function saveAddress(name: string, address: string) {
  const current = await readAddresses();
  current[name] = address;
  await fs.writeFile(ADDRESSES_FILE, JSON.stringify(current, null, 2));
  console.log(`[saved] ${name} -> ${address}`);
}

export async function readAddresses(): Promise<DeploymentMap> {
  try {
    const file = await fs.readFile(ADDRESSES_FILE, "utf-8");
    return JSON.parse(file) as DeploymentMap;
  } catch (err: any) {
    if (err.code === "ENOENT") {
      return {};
    }
    throw err;
  }
}
