/**
 * SAFU Domain Name Service Contract Addresses
 * These contracts enable .safu domain name resolution on BSC
 */

// Get addresses from environment variables or use placeholder
const SAFU_REGISTRY = (process.env.NEXT_PUBLIC_SAFU_REGISTRY || '0x0000000000000000000000000000000000000000') as `0x${string}`;
const SAFU_REVERSE_REGISTRAR = (process.env.NEXT_PUBLIC_SAFU_REVERSE_REGISTRAR || '0x0000000000000000000000000000000000000000') as `0x${string}`;

// BSC Mainnet Addresses
const BSC_MAINNET_ADDRESSES = {
  Registry: SAFU_REGISTRY,
  ReverseRegistrar: SAFU_REVERSE_REGISTRAR,
};

// BSC Testnet Addresses
const BSC_TESTNET_ADDRESSES = {
  Registry: SAFU_REGISTRY,
  ReverseRegistrar: SAFU_REVERSE_REGISTRAR,
};

/**
 * Get the appropriate contract addresses based on the current chain ID
 */
function getConstants(chainId?: number) {
  // Default to testnet (97) if no chainId provided
  const currentChainId = chainId ?? 97;

  if (currentChainId === 56) {
    // BSC Mainnet
    return BSC_MAINNET_ADDRESSES;
  } else {
    // BSC Testnet (97) or fallback
    return BSC_TESTNET_ADDRESSES;
  }
}

// Export constants for the current network
// Note: Configure NEXT_PUBLIC_SAFU_REGISTRY and NEXT_PUBLIC_SAFU_REVERSE_REGISTRAR
// in your environment variables with actual deployed contract addresses
export const constants = getConstants();

// Export function to get constants for specific chain
export { getConstants };
