import Head from "next/head";
import Image from "next/image";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useMemo, useState } from "react";
import { formatUnits, parseUnits } from "viem";
import { erc20Abi, routerAbi } from "../lib/abis";
import {
  chainId,
  chainName,
  eltxAddress,
  explorerUrl,
  routerAddress,
  usdteAddress,
  weltxAddress,
  factoryAddress,
  rpcUrl
} from "../lib/config";

interface TokenInfo {
  decimals: number;
  symbol: string;
  balance: string;
}

const defaultToken: TokenInfo = { decimals: 18, symbol: "ELTX", balance: "0" };

export default function Home() {
  const { isConnected, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const [eltx, setEltx] = useState<TokenInfo>(defaultToken);
  const [usdte, setUsdte] = useState<TokenInfo>({ decimals: 6, symbol: "USDTE", balance: "0" });
  const [amountIn, setAmountIn] = useState("0");
  const [amountOut, setAmountOut] = useState("0");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canQuote = useMemo(() => Number(amountIn) > 0 && isConnected, [amountIn, isConnected]);

  useEffect(() => {
    if (!publicClient) return;
    async function loadMetadata() {
      if (!eltxAddress || !usdteAddress) return;
      const [eltxDecimals, eltxSymbol, usdteDecimals, usdteSymbol] = await Promise.all([
        publicClient.readContract({ address: eltxAddress as `0x${string}`, abi: erc20Abi, functionName: "decimals" }),
        publicClient.readContract({ address: eltxAddress as `0x${string}`, abi: erc20Abi, functionName: "symbol" }),
        publicClient.readContract({ address: usdteAddress as `0x${string}`, abi: erc20Abi, functionName: "decimals" }),
        publicClient.readContract({ address: usdteAddress as `0x${string}`, abi: erc20Abi, functionName: "symbol" })
      ]);
      setEltx((prev) => ({ ...prev, decimals: Number(eltxDecimals), symbol: eltxSymbol as string }));
      setUsdte((prev) => ({ ...prev, decimals: Number(usdteDecimals), symbol: usdteSymbol as string }));
    }
    loadMetadata().catch((err) => console.error(err));
  }, [publicClient]);

  useEffect(() => {
    if (!publicClient || !address || !eltxAddress || !usdteAddress) return;
    async function loadBalances() {
      const [eltxBal, usdteBal] = await Promise.all([
        publicClient.readContract({
          address: eltxAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as `0x${string}`]
        }),
        publicClient.readContract({
          address: usdteAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [address as `0x${string}`]
        })
      ]);
      setEltx((prev) => ({ ...prev, balance: formatUnits(eltxBal as bigint, prev.decimals) }));
      setUsdte((prev) => ({ ...prev, balance: formatUnits(usdteBal as bigint, prev.decimals) }));
    }
    loadBalances().catch((err) => console.error(err));
  }, [publicClient, address, amountOut]);

  useEffect(() => {
    if (!canQuote || !publicClient || !routerAddress) {
      setAmountOut("0");
      return;
    }
    const controller = new AbortController();
    async function quote() {
      try {
        const amount = parseUnits(amountIn || "0", eltx.decimals);
        if (amount === BigInt(0)) {
          setAmountOut("0");
          return;
        }
        const amounts = (await publicClient.readContract({
          address: routerAddress as `0x${string}`,
          abi: routerAbi,
          functionName: "getAmountsOut",
          args: [amount, [eltxAddress, usdteAddress]]
        })) as bigint[];
        setAmountOut(formatUnits(amounts[1], usdte.decimals));
      } catch (err) {
        console.error(err);
      }
    }
    quote();
    return () => controller.abort();
  }, [amountIn, canQuote, publicClient, eltx.decimals, usdte.decimals]);

  const handleAddNetwork = async () => {
    if (!(window as any).ethereum) {
      alert("Wallet not detected");
      return;
    }
    try {
      await (window as any).ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: `0x${chainId.toString(16)}`,
            chainName,
            nativeCurrency: { name: "ELTX", symbol: "ELTX", decimals: 18 },
            rpcUrls: [rpcUrl],
            blockExplorerUrls: [explorerUrl]
          }
        ]
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSwap = async () => {
    if (!walletClient || !publicClient || !address) return;
    try {
      setLoading(true);
      setStatus("Checking allowance...");
      const amount = parseUnits(amountIn, eltx.decimals);
      const minOut = parseUnits(amountOut, usdte.decimals) * BigInt(97) / BigInt(100);

      const allowance = (await publicClient.readContract({
        address: eltxAddress as `0x${string}`,
        abi: erc20Abi,
        functionName: "allowance",
        args: [address as `0x${string}`, routerAddress as `0x${string}`]
      })) as bigint;

      if (allowance < amount) {
        setStatus("Approving router...");
        await walletClient.writeContract({
          account: address as `0x${string}`,
          address: eltxAddress as `0x${string}`,
          abi: erc20Abi,
          functionName: "approve",
          args: [routerAddress, amount]
        });
      }

      setStatus("Submitting swap...");
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);
      const hash = await walletClient.writeContract({
        account: address as `0x${string}`,
        address: routerAddress as `0x${string}`,
        abi: routerAbi,
        functionName: "swapExactTokensForTokens",
        args: [amount, minOut, [eltxAddress, usdteAddress], address, deadline]
      });
      setStatus(`Transaction submitted: ${hash}`);
    } catch (error) {
      console.error(error);
      setStatus((error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>ELTX Swap</title>
        <meta name="description" content="Swap ELTX and USDTE on the native DEX" />
      </Head>
      <main className="flex flex-col items-center justify-center py-16 px-4">
        <div className="max-w-xl w-full bg-slate-900/70 border border-eltx-accent/40 rounded-2xl p-8 shadow-lg space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">ELTX Swap</h1>
              <p className="text-sm text-slate-300">Factory: {factoryAddress || 'TBD'}</p>
            </div>
            <Image src="/branding/eltx-logo.svg" width={64} height={64} alt="ELTX logo" />
          </div>

          <div className="flex justify-between items-center">
            <ConnectButton />
            <button
              onClick={handleAddNetwork}
              className="px-4 py-2 bg-eltx-accent text-black rounded-md hover:bg-sky-400"
            >
              Add ELTX Network
            </button>
          </div>

          <section className="space-y-4">
            <div>
              <label className="block text-sm mb-1">From ({eltx.symbol})</label>
              <input
                type="number"
                min="0"
                value={amountIn}
                onChange={(e) => setAmountIn(e.target.value)}
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-4 py-3"
              />
              <p className="text-xs text-slate-400 mt-1">Balance: {parseFloat(eltx.balance || "0").toFixed(4)}</p>
            </div>
            <div>
              <label className="block text-sm mb-1">To ({usdte.symbol})</label>
              <input
                type="number"
                value={amountOut}
                readOnly
                className="w-full rounded-md bg-slate-800 border border-slate-700 px-4 py-3"
              />
              <p className="text-xs text-slate-400 mt-1">Balance: {parseFloat(usdte.balance || "0").toFixed(2)}</p>
            </div>
          </section>

          <button
            disabled={!isConnected || loading || Number(amountIn) === 0}
            onClick={handleSwap}
            className="w-full py-3 rounded-md bg-eltx-accent text-black font-semibold disabled:bg-slate-600"
          >
            {loading ? "Swapping..." : "Swap"}
          </button>

          {status && <p className="text-xs text-slate-300 break-words">{status}</p>}

          <div className="text-xs text-slate-400 space-y-1">
            <p>Router: {routerAddress}</p>
            <p>WELTX: {weltxAddress}</p>
            <p>
              Need gas? Visit the faucet or explorer: <a href={explorerUrl} className="text-eltx-accent underline">Explorer</a>
            </p>
          </div>
        </div>
      </main>
    </>
  );
}
