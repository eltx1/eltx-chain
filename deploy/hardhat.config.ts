import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-etherscan";
import "@typechain/hardhat";
import "@nomicfoundation/hardhat-chai-matchers";
import dotenv from "dotenv";
import { promises as fs } from "fs";
import path from "path";

dotenv.config({ path: require("path").resolve(__dirname, "../.env") });


const config: HardhatUserConfig = {
  solidity: {
    compilers: [
      {
        version: "0.8.24",
        settings: {
          optimizer: { enabled: true, runs: 200 }
        }
      },
      {
        version: "0.6.6",
        settings: { optimizer: { enabled: true, runs: 200 } }
      },
      {
        version: "0.5.16",
        settings: { optimizer: { enabled: true, runs: 200 } }
      }
    ]
  },
  paths: {
    root: path.resolve(__dirname),
    sources: path.resolve(__dirname, "contracts"),
    tests: path.resolve(__dirname, "test"),
    cache: path.resolve(__dirname, "cache"),
    artifacts: path.resolve(__dirname, "artifacts")
  },
  networks: {
    hardhat: {
      chainId: 20256,
      forking: process.env.FORK_RPC
        ? {
            url: process.env.FORK_RPC,
            blockNumber: process.env.FORK_BLOCK ? Number(process.env.FORK_BLOCK) : undefined
          }
        : undefined
    },
    eltx: {
      url: process.env.RPC_URL || "https://rpc.eltx.online",
      chainId: 20256,
      accounts: process.env.DEPLOYER_KEY ? [process.env.DEPLOYER_KEY] : []
    }
  },
  etherscan: {
    apiKey: process.env.BLOCKSCOUT_API_KEY || ""
  }
};

task("deploy-all", "Deploys wrapped ELTX, Uniswap, and ERC20 tokens").setAction(async (_, hre) => {
  await hre.run("compile");
  const network = hre.network.name;
  const outputPath = `${__dirname}/scripts/deployments/${network}.json`;
  await hre.run("run", { script: "scripts/00_deploy_weltx.ts" });
  await hre.run("run", { script: "scripts/01_deploy_uniswap_core.ts" });
  await hre.run("run", { script: "scripts/02_deploy_uniswap_periphery.ts" });
  await hre.run("run", { script: "scripts/03_deploy_tokens.ts" });
  await fs.mkdir(require("path").dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, await fs.readFile(`${__dirname}/verify_addresses.json`, "utf-8"));
  console.log(`Deployment addresses written to ${outputPath}`);
});

task("seed-liquidity", "Add initial ELTX/USDTE liquidity").setAction(async (_, hre) => {
  await hre.run("run", { script: "scripts/04_seed_liquidity.ts" });
});

task("print-addresses", "Prints deployed addresses from verify_addresses.json").setAction(async () => {
  const file = `${__dirname}/verify_addresses.json`;
  try {
    const data = JSON.parse(await fs.readFile(file, "utf-8"));
    console.table(data);
  } catch (err) {
    console.error(`Unable to read ${file}:`, err);
  }
});

export default config;
