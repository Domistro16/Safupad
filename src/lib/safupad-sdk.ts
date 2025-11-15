"use client";

import { useEffect, useRef, useState } from "react";
import { FallbackProvider, JsonRpcProvider } from "ethers";
import type { Chain, Client, Transport } from "viem";
import { type Config, useClient, useWalletClient, useAccount } from "wagmi";
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
 * Falls back to JsonRpcProvider if wallet is not connected
 */

function clientToProvider(client: Client<Transport, Chain>) {
  const { chain, transport } = client
  const network = {
    chainId: chain.id,
    name: chain.name,
    ensAddress: chain.contracts?.ensRegistry?.address,
  }
  if (transport.type === 'fallback') {
    const providers = (transport.transports as ReturnType<Transport>[]).map(
      ({ value }) => new JsonRpcProvider(value?.url, network),
    )
    if (providers.length === 1) return providers[0]
    return new FallbackProvider(providers)
  }
  return new JsonRpcProvider(transport.url, network)
}


/**
 * useSafuPadSDK
 * - Initializes SafuPadSDK instance synchronized with RainbowKit wallet connection
 * - Network automatically switches based on connected wallet's chain
 * - Supports BSC Mainnet (56) and BSC Testnet (97)
 * - Falls back to NEXT_PUBLIC_NETWORK env var when wallet is not connected
 */
export function useSafuPadSDK(): UseSafuPadSDKResult {
  const [sdk, setSdk] = useState<SafuPadSDK | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const initAttempted = useRef(false);

  // Get current chain from wallet connection
  const { chain } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Determine network based on connected chain, fallback to env var
  const chainId = chain?.id || (process.env.NEXT_PUBLIC_NETWORK === "bscTestnet" ? 97 : 56);
  const network: "bsc" | "bscTestnet" = chainId === 97 ? "bscTestnet" : "bsc";

  const client = useClient<Config>({ chainId });

  useEffect(() => {
    // Reset initialization flag when wallet connection or chain changes
    initAttempted.current = false;
  }, [walletClient, chainId]);

  useEffect(() => {
    // Prevent double initialization
    if (initAttempted.current) return;
    initAttempted.current = true;

    let cancelled = false;

    async function init() {
      console.log(`🔧 SafuPad SDK: Starting initialization for ${network === "bsc" ? "BSC Mainnet" : "BSC Testnet"} (Chain ID: ${chainId})...`);

      setIsInitializing(true);
      setError(null);

      try {
        console.log(`🔧 SafuPad SDK: Getting ${network === "bsc" ? "BSC Mainnet" : "BSC Testnet"} provider...`);

        const provider = await clientToProvider(client);

        console.log(`🔧 SafuPad SDK: Creating SDK instance with network: ${network}...`);

        const instance = new SafuPadSDK({
          network: network,
          provider: provider,
          alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
        });

        console.log("🔧 SafuPad SDK: Calling initialize()...");
        await instance.initialize();

        if (cancelled) {
          console.log("⚠️ SafuPad SDK: Initialization cancelled");
          return;
        }

        console.log("✅ SafuPad SDK: Successfully initialized!");
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
    };
  }, [walletClient, client, network, chainId]); // Re-initialize when wallet connection or network changes

  const connect = async () => {
    console.log("🔗 SafuPad SDK: Connect called");
    
    if (!walletClient) {
      console.warn("⚠️ SafuPad SDK: No wallet connected. Please connect via RainbowKit first.");
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