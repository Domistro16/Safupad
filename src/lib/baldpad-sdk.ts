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

export type UseBaldPadSDKResult = {
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
 * useBaldPadSDK
 * - Initializes SafuPadSDK instance synchronized with RainbowKit wallet connection
 * - Supports BSC Mainnet (56) and BSC Testnet (97)
 * - Defaults to BSC Testnet when wallet is not connected
 */
export function useBaldPadSDK(): UseBaldPadSDKResult {
  const [sdk, setSdk] = useState<SafuPadSDK | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<unknown | null>(null);

  // Get current chain from wallet connection
  const { chain } = useAccount();
  const { data: walletClient } = useWalletClient();

  // Support BSC Mainnet (56) and BSC Testnet (97)
  const chainId = chain?.id ?? 97;
  const network: "bsc" | "bscTestnet" = chainId === 56 ? "bsc" : "bscTestnet";

  const { data: client } = useConnectorClient<Config>({ chainId });
  const provClient = useClient<Config>({ chainId });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      // Wait for both clients to be available

      if (!provClient) {
        return;
      }

      console.log(
        `🔧 BaldPad SDK: Initializing for BSC (Chain ID: ${chainId})...`
      );

      setIsInitializing(true);
      setError(null);

      try {
        console.log(
          `🔧 BaldPad SDK: Getting BSC provider...`
        );

        const provider = clientToProvider(provClient);

        console.log(
          `🔧 BaldPad SDK: Creating SDK instance with network: ${network}...`
        );
        console.log(await provider.getNetwork())
        const instance = new SafuPadSDK({
          network: network,
          provider: provider,
          alchemyApiKey: process.env.NEXT_PUBLIC_ALCHEMY_API_KEY,
          subgraphUrl:
            "https://api.studio.thegraph.com/query/112443/safupad-subgraph/v0.0.11",
        });

        console.log("🔧 BaldPad SDK: Calling initialize()...");
        await instance.initialize();

        // UPDATE THE SIGNER AFTER INITIALIZATION
        console.log("🔧 BaldPad SDK: Updating signer...");
        if (client) {
          const signer = clientToSigner(client);
          instance.updateSigner(signer);
        }
        if (cancelled) {
          console.log("⚠️ BaldPad SDK: Initialization cancelled");
          return;
        }

        console.log(`✅ BaldPad SDK: Successfully initialized on BSC (${network})!`);
        setSdk(instance);
      } catch (e: any) {
        if (cancelled) return;

        console.error("❌ BaldPad SDK: Initialization failed:", e);
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
    console.log("🔗 BaldPad SDK: Connect called");

    if (!walletClient) {
      console.warn(
        "⚠️ BaldPad SDK: No wallet connected. Please connect via RainbowKit first."
      );
      return null;
    }

    if (!sdk) {
      console.error("❌ BaldPad SDK: Cannot connect - SDK not initialized");
      return null;
    }

    try {
      // SDK should already be connected via walletClient
      const address = walletClient.account?.address;
      console.log("✅ BaldPad SDK: Using connected address:", address);
      return address ?? null;
    } catch (e: any) {
      console.error("❌ BaldPad SDK: Connection failed:", e);
      setError(e);
      return null;
    }
  };

  return { sdk, isInitializing, error, connect, network, chainId };
}
