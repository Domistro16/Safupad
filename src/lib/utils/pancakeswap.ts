import SafuPadSDK from "@safupad/sdk";
import { ethers, BigNumberish } from "ethers";

export interface PancakeSwapStats {
  priceInBNB: number;
  priceInUSD: number;
  marketCapUSD: number;
  liquidityUSD: number;
  totalSupply: number;
  pairAddress: string;
}

export async function getTokenStats(
  tokenAddress: string,
  provider: any,
  sdk?: any
): Promise<PancakeSwapStats> {
  const WBNB = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"; // BSC Testnet
  const FACTORY = "0x6725F303b657a9451d8BA641348b6761A6CC7a17"; // Testnet

  // Get pair
  const factory = new ethers.Contract(
    FACTORY,
    ["function getPair(address,address) view returns (address)"],
    provider
  );

  const pairAddress = await factory.getPair(tokenAddress, WBNB);

  // Get reserves
  const pair = new ethers.Contract(
    pairAddress,
    [
      "function getReserves() view returns (uint112,uint112,uint32)",
      "function token0() view returns (address)",
    ],
    provider
  );

  const [reserve0, reserve1] = await pair.getReserves();
  const token0 = await pair.token0();

  const isToken0 = token0.toLowerCase() === tokenAddress.toLowerCase();
  const tokenReserve = isToken0 ? reserve0 : reserve1;
  const wbnbReserve = isToken0 ? reserve1 : reserve0;

  // Calculate price
  const priceInBNB =
    Number(ethers.formatEther(wbnbReserve)) /
    Number(ethers.formatEther(tokenReserve));

  // Get total supply for market cap
  const token = new ethers.Contract(
    tokenAddress,
    ["function totalSupply() view returns (uint256)"],
    provider
  );
  const totalSupply = await token.totalSupply();
  const supply = Number(ethers.formatEther(totalSupply));

  // Get BNB price using SDK price oracle if available
  let bnbPrice: number;
  if (sdk?.priceOracle) {
    try {
      // Get USD value for 1 BNB
      const oneBNB = ethers.parseEther("1");
      const bnbPriceWei = await sdk.priceOracle.bnbToUSD(oneBNB);
      bnbPrice = Number(ethers.formatEther(bnbPriceWei));
    } catch (error) {
      console.warn(
        "Failed to get BNB price from SDK, falling back to CoinGecko:",
        error
      );
      const res = await fetch(
        "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd"
      );
      const data = await res.json();
      bnbPrice = data.binancecoin.usd;
    }
  } else {
    // Fallback to CoinGecko if SDK not provided
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd"
    );
    const data = await res.json();
    bnbPrice = data.binancecoin.usd;
  }

  const priceInUSD = priceInBNB * bnbPrice;
  const wbnbLiq = Number(ethers.formatEther(wbnbReserve));

  return {
    priceInBNB,
    priceInUSD,
    marketCapUSD: priceInUSD * supply,
    liquidityUSD: wbnbLiq * bnbPrice * 2,
    totalSupply: supply,
    pairAddress,
  };
}

const RPC = "https://bsc-dataseed.binance.org/";
const provider = new ethers.JsonRpcProvider(RPC);

// Pancake V2 Router (BSC mainnet)
const ROUTER_ADDRESS = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1";
const WBNB_ADDRESS = "0xae13d989dac2f0debff460ac112a837c89baa7cd"; // WBNB

const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner,address spender) external view returns (uint256)",
  "function balanceOf(address) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
] as const;

const ROUTER_ABI = [
  "function getAmountsOut(uint amountIn, address[] memory path) view returns (uint[] memory amounts)",
  "function swapExactTokensForETHSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external",
  "function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint amountIn,uint amountOutMin,address[] calldata path,address to,uint deadline) external",
  "function swapExactETHForTokensSupportingFeeOnTransferTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) external payable",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) external",
] as const;

type TxReceipt = ethers.TransactionReceipt;

/**
 * Parse a human-readable token amount (like 1.5) into token base units using token decimals.
 * If `amount` is already BigNumberish (string of wei, BigNumber, etc.) it will be returned unchanged.
 */
export async function parseTokenAmount(
  tokenAddress: string,
  amount: number | string | BigNumberish
): Promise<BigInt> {
  if (typeof amount === "number") {
    const token = new ethers.Contract(tokenAddress, ERC20_ABI, provider);
    const decimals: number = await token.decimals();
    const amountStr = amount.toString();
    return ethers.parseUnits(amountStr, decimals);
  }
  return BigInt(amount as BigNumberish);
}

/** Parse a human BNB amount (e.g., 0.1) into wei BigNumber. */
export function parseBNBAmount(amount: number | string | BigNumberish): BigInt {
  if (typeof amount === "number") {
    return ethers.parseEther(amount.toString());
  }
  // allow string like "0.1" or wei string
  try {
    // try as decimal ether string
    return ethers.parseEther(amount as string);
  } catch {
    return BigInt(amount as BigNumberish);
  }
}

/**
 * Sell token -> BNB using PancakeSwap V2 Router.
 * - tokenAddress: address of the token you want to sell
 * - amountInRaw: BigNumberish in token base units (wei for ERC20) OR from parseTokenAmount
 * - slippagePercent: e.g. 1 for 1%
 */
export async function sellTokenForBNB(
  tokenAddress: string,
  amountInRaw: BigNumberish,
  slippagePercent = 1,
  sdk: SafuPadSDK
): Promise<TxReceipt | undefined> {
  if (!ethers.isAddress(tokenAddress)) throw new Error("Invalid token address");
  if (slippagePercent < 0 || slippagePercent >= 100)
    throw new Error("slippagePercent must be in [0,100)");

  const signer = sdk.getSigner();

  if (!signer) return;
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
  const token = new ethers.Contract(tokenAddress, ERC20_ABI, signer);
  const owner = await signer.getAddress();
  const amountIn = BigInt(amountInRaw);

  // Approve router for exact amount if needed
  const allowance: bigint = await token.allowance(owner, ROUTER_ADDRESS);
  if (allowance < (amountIn)) {
    const approveTx = await token.approve(ROUTER_ADDRESS, amountIn);
    await approveTx.wait(1);
    console.log(`Approved router for ${amountIn.toString()} tokens`);
  }

  const path = [tokenAddress, WBNB_ADDRESS];
  const amountsOut: BigNumberish[] = await router.getAmountsOut(amountIn, path);
  const expectedOut: bigint = BigInt(amountsOut[amountsOut.length - 1]);
  const amountOutMin = expectedOut * BigInt((100 - slippagePercent)) / BigInt(100);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10; // 10 mins

  // Use supportingFee variant to handle fee-on-transfer tokens
  const swapTx =
    await router.swapExactTokensForETHSupportingFeeOnTransferTokens(
      amountIn,
      amountOutMin,
      path,
      owner,
      deadline,
      { gasLimit: 400000 }
    );
  console.log("Sell tx sent:", swapTx.hash);
  const receipt: TxReceipt = await swapTx.wait(1);
  console.log("Sell tx mined:", receipt.hash);
  return receipt;
}

/**
 * Buy token using BNB (BNB -> TOKEN).
 * - tokenAddress: address of token to buy
 * - bnbAmount: number | string | BigNumberish (human BNB or wei). Use parseBNBAmount helper.
 * - slippagePercent: e.g. 1 for 1%
 *
 * This uses swapExactETHForTokensSupportingFeeOnTransferTokens so fee-on-transfer tokens are supported.
 */
export async function buyTokenWithBNB(
  tokenAddress: string,
  bnbAmount: number | string | BigNumberish,
  slippagePercent = 1,
  sdk: SafuPadSDK
): Promise<TxReceipt | undefined> {
  if (!ethers.isAddress(tokenAddress)) throw new Error("Invalid token address");
  if (slippagePercent < 0 || slippagePercent >= 100)
    throw new Error("slippagePercent must be in [0,100)");

  const signer = sdk.getSigner();

  if (!signer) return;
  const router = new ethers.Contract(ROUTER_ADDRESS, ROUTER_ABI, signer);
  const owner = await signer.getAddress();
  const amountIn = parseBNBAmount(bnbAmount);

  // Path WBNB -> TOKEN
  const path = [WBNB_ADDRESS, tokenAddress];

  // Simulate expected token output using getAmountsOut
  const amountsOut: BigNumberish[] = await router.getAmountsOut(amountIn, path);
  const expectedOut: bigint = BigInt(amountsOut[amountsOut.length - 1]);
  const amountOutMin = (expectedOut * BigInt((100 - slippagePercent))) / BigInt(100);
  const deadline = Math.floor(Date.now() / 1000) + 60 * 10;

  // Execute swap; pass value as BNB (wei)
  const swapTx =
    await router.swapExactETHForTokensSupportingFeeOnTransferTokens(
      amountOutMin,
      path,
      owner,
      deadline,
      { value: amountIn, gasLimit: 500000 }
    );
  console.log("Buy tx sent:", swapTx.hash);
  const receipt: TxReceipt = await swapTx.wait(1);
  console.log("Buy tx mined:", receipt.hash);
  return receipt;
}

export default {
  parseTokenAmount,
  parseBNBAmount,
  sellTokenForBNB,
  buyTokenWithBNB,
};
