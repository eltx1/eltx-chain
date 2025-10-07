import "../styles/globals.css";
import type { AppProps } from "next/app";
import { WagmiConfig, configureChains, createConfig } from "wagmi";
import { jsonRpcProvider } from "wagmi/providers/jsonRpc";
import { RainbowKitProvider, getDefaultWallets, darkTheme } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { chainId, chainName, explorerUrl, rpcUrl } from "../lib/config";

const eltxChain = {
  id: chainId,
  name: chainName,
  network: "eltx",
  rpcUrls: {
    default: { http: [rpcUrl] },
    public: { http: [rpcUrl] }
  },
  blockExplorers: {
    default: { name: "ELTX Explorer", url: explorerUrl }
  },
  nativeCurrency: {
    name: "ELTX",
    symbol: "ELTX",
    decimals: 18
  },
  testnet: false
} as const;

const { chains, publicClient, webSocketPublicClient } = configureChains(
  [eltxChain],
  [
    jsonRpcProvider({
      rpc: () => ({ http: rpcUrl })
    })
  ]
);

const { connectors } = getDefaultWallets({
  appName: "ELTX Swap",
  projectId: "eltx-swap",
  chains
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
  webSocketPublicClient
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <WagmiConfig config={wagmiConfig}>
      <RainbowKitProvider chains={chains} theme={darkTheme({ accentColor: "#38bdf8" })}>
        <Component {...pageProps} />
      </RainbowKitProvider>
    </WagmiConfig>
  );
}
