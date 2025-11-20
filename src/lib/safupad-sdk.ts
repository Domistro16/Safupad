"use client";

import { useEffect, useRef, useState } from "react";
import {
  BrowserProvider,
  FallbackProvider,
  JsonRpcProvider,
  JsonRpcSigner,
} from "ethers";
import type { Account, Chain, Client, Transport } from "viem";
import {
  type Config,
  useClient,
  useWalletClient,
  useAccount,
  useConnectorClient,
} from "wagmi";
import { SafuPadSDK } from "@safupad/sdk";

export type UseSafuPadSDKResult = {
  sdk: SafuPadSDK | null;
  isInitializing: boolean;
  error: unknown | null;
  connect: () => Promise<string | null>;
  network: "bsc" | "bscTestnet";
  chainId: number;
};

/**
 * Gets the appropriate provider for the configured network
 */
function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  if (transport.type === "fallback") {
    const providers = (transport.transports as ReturnType<Transport>[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network)
    );
    if (providers.length === 1) return providers[0];
    return new FallbackProvider(providers);
  }
  return new JsonRpcProvider(transport.url, network);
}

export function clientToSigner(client: Client<Transport, Chain, Account>) {
  const { account, chain, transport } = client;
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  };
  const provider = new BrowserProvider(transport, network);
  const signer = new JsonRpcSigner(provider, account.address);
  return signer;
}

/**
 * useSafuPadSDK
 * - Initializes SafuPadSDK instance synchronized with RainbowKit wallet connection
 * - Network automatically switches based on connected wallet's chain
 * - Supports BSC Mainnet (56) and BSC Testnet (97)
 * - Defaults to BSC Testnet when wallet is not connected
 */
export function useSafuPadSDK(): UseSafuPadSDKResult {
  const [sdk, setSdk] = useState<SafuPadSDK | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // Get current chain from wallet connection
  const { chain } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Determine network based on connected chain, default to BSC testnet (97)
  const chainId = chain?.id ?? 97;
  const network: "bsc" | "bscTestnet" = chainId === 97 ? "bscTestnet" : "bsc";

  const { data: client } = useConnectorClient<Config>({ chainId });
  const provClient = useClient<Config>({ chainId });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Wait for both clients to be available
      if (!client || !provClient) {
        console.log(
          `⏳ SafuPad SDK: Waiting for clients... (chain: ${chainId})`
        );
        setSdk(null); // Clear SDK while waiting
        return;
      }

      console.log(
        `🔧 SafuPad SDK: Initializing for ${network === "bsc" ? "BSC Mainnet" : "BSC Testnet"} (Chain ID: ${chainId})...`
      );

      setIsInitializing(true);
      setError(null);

      try {
        console.log(
          `🔧 SafuPad SDK: Getting ${network === "bsc" ? "BSC Mainnet" : "BSC Testnet"} provider...`
        );

        const signer = clientToSigner(client);
        const provider = clientToProvider(provClient);
      
        console.log(
          `🔧 SafuPad SDK: Creating SDK instance with network: ${network}...`
        );
        console.log(await provider.getNetwork())
        const instance = new SafuPadSDK({
          network: network,
          provider: provider,
          alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
          subgraphUrl:
            "https://api.studio.thegraph.com/query/112443/safupad-subgraph/v0.0.11",
        });

        console.log("🔧 SafuPad SDK: Calling initialize()...");
        await instance.initialize();

        // UPDATE THE SIGNER AFTER INITIALIZATION
        console.log("🔧 SafuPad SDK: Updating signer...");
        instance.updateSigner(signer);

        if (cancelled) {
          console.log("⚠️ SafuPad SDK: Initialization cancelled");
          return;
        }

        console.log(`✅ SafuPad SDK: Successfully initialized on ${network}!`);
        setSdk(instance);
      } catch (e: any) {
        if (cancelled) return;

        console.error("❌ SafuPad SDK: Initialization failed:", e);
        console.error("Error details:", {
          message: e?.message,
          code: e?.code,
          data: e?.data,
        });

        setError(e);
        setSdk(null);
      } finally {
        if (!cancelled) {
          setIsInitializing(false);
        }
      }
    }

    init();

    return () => {
      cancelled = true;
      setSdk(null);
    };
  }, [chainId, network, client, provClient]);
  const connect = async () => {
    console.log("🔗 SafuPad SDK: Connect called");

    if (!walletClient) {
      console.warn(
        "⚠️ SafuPad SDK: No wallet connected. Please connect via RainbowKit first."
      );
      return null;
    }

    if (!sdk) {
      console.error("❌ SafuPad SDK: Cannot connect - SDK not initialized");
      return null;
    }

    try {
      // SDK should already be connected via walletClient
      const address = walletClient.account?.address;
      console.log("✅ SafuPad SDK: Using connected address:", address);
      return address ?? null;
    } catch (e: any) {
      console.error("❌ SafuPad SDK: Connection failed:", e);
      setError(e);
      return null;
    }
  };

  return { sdk, isInitializing, error, connect, network, chainId };
}
