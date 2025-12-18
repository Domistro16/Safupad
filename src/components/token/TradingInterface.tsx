"use client";

import { useState, useEffect } from "react";
import { Token } from "@/types/token";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownUp,
  TrendingUp,
  TrendingDown,
  Loader2,
  Settings,
  ChevronDown,
  Lock,
} from "lucide-react";
import { formatCurrency, formatPrice } from "@/lib/utils/format";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import { ethers, parseEther } from "ethers";
import { toast } from "sonner";
import { useBalance, useAccount } from "wagmi";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { sellTokenForBNB } from "@/lib/utils/pancakeswap";

interface TradingInterfaceProps {
  token: Token;
  pancakeSwapPrice?: number;
  pancakeSwapPriceInBNB?: number;
  graduatedToPancakeSwap?: boolean;
}

const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export function TradingInterface({
  token,
  pancakeSwapPrice,
  pancakeSwapPriceInBNB,
  graduatedToPancakeSwap = false,
}: TradingInterfaceProps) {
  const { sdk } = useSafuPadSDK();
  const [tradeType, setTradeType] = useState<"buy" | "sell">("buy");
  const [amount, setAmount] = useState("");
  const [monAmount, setBnbAmount] = useState("");
  const [isTrading, setIsTrading] = useState(false);
  const [monBalance, setBnbBalance] = useState<string | null>(null);
  const [tokenBalance, setTokenBalance] = useState<string | null>(null);
  const [loadingBalances, setLoadingBalances] = useState(true);
  const [slippage, setSlippage] = useState("0.5");
  const { address } = useAccount();
  const [showSlippageSettings, setShowSlippageSettings] = useState(false);

  // Use PancakeSwap price if available and graduated, otherwise use token price
  const effectivePrice =
    graduatedToPancakeSwap && pancakeSwapPrice
      ? pancakeSwapPrice
      : token.currentPrice;
  const effectivePriceInBNB =
    graduatedToPancakeSwap && pancakeSwapPriceInBNB
      ? pancakeSwapPriceInBNB
      : null;
  const isPancakeSwapPrice = graduatedToPancakeSwap && !!pancakeSwapPrice;
  console.log(effectivePriceInBNB);
  // Trading logic:
  // - For project-raise tokens: Buys disabled ONLY when graduated to PancakeSwap
  // - For instant-launch tokens: Buys disabled when graduated (original behavior)
  // - Sells only disabled when graduated but NOT yet migrated to PancakeSwap
  const isProjectRaise = token.launchType === "project-raise";
  const isBuyDisabled = token.graduated && !graduatedToPancakeSwap;
  const isSellDisabled = token.graduated && !graduatedToPancakeSwap;

  const provider = new ethers.JsonRpcProvider(
    `https://mon-testnet.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`
  );
  const tokenCon = new ethers.Contract(token.contractAddress, abi, provider);
  // Fetch balances
  useEffect(() => {
    let cancelled = false;

    const fetchBalances = async () => {
      if (!sdk) {
        setLoadingBalances(true);
        return;
      }

      try {
        setLoadingBalances(true);

        // Get connected wallet address

        // Fetch BNB balance
        const monBal = await provider.getBalance(address!);
        if (!cancelled) {
          setBnbBalance(ethers.formatEther(monBal));
        }

        // Fetch token balance
        const tokenBal = await tokenCon.balanceOf(address);
        if (!cancelled) {
          setTokenBalance(ethers.formatEther(tokenBal));
        }
      } catch (error) {
        console.error("Error fetching balances:", error);
        if (!cancelled) {
          setBnbBalance("0");
          setTokenBalance("0");
        }
      } finally {
        if (!cancelled) {
          setLoadingBalances(false);
        }
      }
    };

    fetchBalances();

    // Refresh balances every 10 seconds
    const interval = setInterval(fetchBalances, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sdk, token.contractAddress, address]);

  const handleTrade = async () => {
    // Check if trade is allowed
    if (tradeType === "buy" && isBuyDisabled) {
      toast.error(
        "Buying is disabled. This token has graduated to PancakeSwap."
      );
      return;
    }

    if (tradeType === "sell" && isSellDisabled) {
      if (!token.graduated) {
        toast.error("Token must graduate before selling is enabled.");
      } else {
        toast.error(
          "Selling will be enabled after migration to PancakeSwap completes."
        );
      }
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!sdk) {
      toast.error("SDK not initialized");
      return;
    }

    const signer = sdk.getSigner();
    setIsTrading(true);
    console.log(signer);
    try {
      if (tradeType === "buy") {
        // Buy tokens with BNB
        if (graduatedToPancakeSwap && isProjectRaise) {
          const expectedAmount = parseFloat(amount);
          const slippagePercent = parseFloat(slippage);
          const minTokenOut = (
            Number(expectedAmount) *
            (1 - slippagePercent / 100)
          ).toFixed(18);

          console.log("Post-graduation buy:", {
            tokenAddress: token.contractAddress,
            tokenAmount: amount,
            minTokenOut,
            expectedAmount,
            slippagePercent,
          });
          const contract = new ethers.Contract(
            token.contractAddress,
            [
              "function approve(address spender, uint256 value) external returns (bool)",
            ],
            signer
          );

          const approve = await contract.approve(
            sdk.launchpad.getAddress(),
            Number(amount + 1).toString()
          );
          await approve.wait();
          const tx = await sdk.launchpad.handlePostGraduationBuy(
            token.contractAddress,
            monAmount,
            minTokenOut
          );

          toast.success(
            `Successfully bought ${amount} ${token.symbol} on PancakeSwap!`
          );
          console.log("Post-graduation buy transaction:", tx?.hash);
        } else {
          const slippagePercent = parseFloat(slippage);
          const expectedAmount = parseFloat(amount);
          const minTokenOut = (
            Number(expectedAmount) *
            (1 - slippagePercent / 100)
          ).toFixed(18);
          const tx = await sdk.bondingDex.buyTokens(
            token.contractAddress,
            monAmount,
            Number(minTokenOut)
          );

          toast.success(`Successfully bought ${amount} ${token.symbol}!`);
          console.log("Buy transaction:", tx);
        }
      } else {
        // Sell tokens for BNB
        // Use post-graduation sell for project-raise tokens that graduated to PancakeSwap
        if (graduatedToPancakeSwap && isProjectRaise) {
          // Calculate minimum BNB out with slippage protection
          const expectedBnb = parseFloat(monAmount);
          const slippagePercent = parseFloat(slippage);
          const minBNBOut = (expectedBnb * (1 - slippagePercent / 100)).toFixed(
            18
          );

          console.log("Post-graduation sell:", {
            tokenAddress: token.contractAddress,
            tokenAmount: amount,
            minBNBOut,
            expectedBnb,
            slippagePercent,
          });
          const contract = new ethers.Contract(
            token.contractAddress,
            [
              "function approve(address spender, uint256 value) external returns (bool)",
            ],
            signer
          );

          const approve = await contract.approve(
            sdk.launchpad.getAddress(),
            Number(amount + 1).toString()
          );
          await approve.wait();
          const tx = await sdk.launchpad.handlePostGraduationSell(
            token.contractAddress,
            amount,
            minBNBOut
          );

          toast.success(
            `Successfully sold ${amount} ${token.symbol} on PancakeSwap!`
          );
          console.log("Post-graduation sell transaction:", tx?.hash);
        } else {
          // Regular bonding curve sell
          const contract = new ethers.Contract(
            token.contractAddress,
            [
              "function approve(address spender, uint256 value) external returns (bool)",
            ],
            signer
          );

          const approve = await contract.approve(
            sdk.bondingDex.getAddress(),
            parseEther(Number(amount).toString())
          );
          await approve.wait();
          const tx = await sdk.bondingDex.sellTokens(
            token.contractAddress,
            amount
          );
          await tx.wait();
          toast.success(`Successfully sold ${amount} ${token.symbol}!`);
          console.log("Sell transaction:", tx);
        }
      }

      // Reset form
      setAmount("");
      setBnbAmount("");

      // Refresh balances after trade
      const address = await sdk.getAddress();
      const monBal = await sdk.getBalance(address);
      setBnbBalance(ethers.formatEther(monBal));
      const tokenBal = await tokenCon.balanceOf(address);
      setTokenBalance(ethers.formatEther(tokenBal));
    } catch (error: any) {
      console.error("Trade error:", error);
      const reason = ethers.toUtf8String("0x" + error.data.slice(138));
      console.log("Decoded reason:", reason);
      toast.error(error?.message || "Transaction failed");
    } finally {
      setIsTrading(false);
    }
  };

  const calculateBnb = async (tokenAmount: string) => {
    if (!tokenAmount || !sdk) return "";

    try {
      if (graduatedToPancakeSwap) {
        // ✅ Use PancakeSwap Router for graduated tokens
        const pancakeRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // BSC Testnet Router
        const routerAbi = [
          "function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)",
        ];

        const router = new ethers.Contract(
          pancakeRouterAddress,
          routerAbi,
          provider
        );

        const path = [
          token.contractAddress,
          "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
        ]; // Token -> WBNB
        const amounts = await router.getAmountsOut(
          ethers.parseEther(tokenAmount),
          path
        );

        return ethers.formatEther(amounts[1]); // BNB out
      } else {
        // ✅ Use Bonding Curve for non-graduated tokens
        const quote = await sdk.bondingDex.getSellQuote(
          token.contractAddress,
          ethers.parseEther(tokenAmount).toString()
        );

        return ethers.formatEther(quote.pricePerToken);
      }
    } catch (error) {
      console.error("Error calculating BNB:", error);
      return "";
    }
  };

  const calculateTokens = async (mon: string) => {
    if (!mon || !sdk) return "";

    try {
      if (graduatedToPancakeSwap) {
        // ✅ Use PancakeSwap Router for graduated tokens
        const pancakeRouterAddress = "0xD99D1c33F9fC3444f8101754aBC46c52416550D1"; // BSC Testnet Router
        const routerAbi = [
          "function getAmountsOut(uint amountIn, address[] memory path) external view returns (uint[] memory amounts)",
        ];

        const router = new ethers.Contract(
          pancakeRouterAddress,
          routerAbi,
          provider
        );

        const path = [
          "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd",
          token.contractAddress,
        ]; // WBNB -> Token
        const amounts = await router.getAmountsOut(ethers.parseEther(mon), path);

        return parseFloat(ethers.formatEther(amounts[1])).toFixed(2); // Tokens out
      } else {
        // ✅ Use Bonding Curve for non-graduated tokens
        const quote = await sdk.bondingDex.getBuyQuote(
          token.contractAddress,
          ethers.parseEther(mon).toString()
        );

        return parseFloat(ethers.formatEther(quote.tokensOut)).toFixed(2);
      }
    } catch (error) {
      console.error("Error calculating tokens:", error);
      return "";
    }
  };

  const handleAmountChange = async (value: string) => {
    setAmount(value);
    const mon = await calculateBnb(value);
    setBnbAmount(mon);
  };

  const handleBnbChange = async (value: string) => {
    setBnbAmount(value);
    const tokens = await calculateTokens(value);
    setAmount(tokens);
  };

  const formatBalance = (balance: string | null, loading: boolean) => {
    if (loading) return "Loading...";
    if (balance === null) return "0.00";
    const num = parseFloat(balance);
    return num.toFixed(4);
  };

  return (
    <Card className="p-6 sticky top-24">
      {/* Trading Status Alert */}
      {isBuyDisabled && (
        <Alert className="mb-4 bg-primary/10 border-primary/30">
          <Lock className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Buying Disabled</strong> — This token has graduated.
            {!isSellDisabled
              ? " Only selling is available while migration completes."
              : " Trading will resume on PancakeSwap after migration."}
          </AlertDescription>
        </Alert>
      )}

      {/* PancakeSwap Price Badge */}
      {isPancakeSwapPrice && (
        <div className="mb-4 p-3 bg-secondary/10 border-2 border-secondary/30 rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-secondary rounded-full animate-pulse" />
            <span className="text-xs font-bold text-secondary">
              Using PancakeSwap Price
            </span>
          </div>
        </div>
      )}

      {/* Compact Slippage Settings */}
      <div className="mb-4">
        <button
          onClick={() => setShowSlippageSettings(!showSlippageSettings)}
          className="w-full flex items-center justify-between p-3 bg-card/50 hover:bg-card/70 border-2 border-primary/20 hover:border-primary/40 rounded-lg transition-all group"
          disabled={isBuyDisabled && isSellDisabled}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            <span className="text-sm font-bold text-foreground/90">
              SLIPPAGE
            </span>
            <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary border border-primary/30 rounded font-mono font-bold">
              {slippage}%
            </span>
          </div>
          <ChevronDown
            className={`w-4 h-4 text-muted-foreground transition-transform ${showSlippageSettings ? "rotate-180" : ""}`}
          />
        </button>

        {showSlippageSettings && (
          <div className="mt-2 p-4 bg-gradient-to-br from-card/80 to-card/60 border-2 border-primary/30 rounded-lg space-y-3 glow-effect">
            <div className="grid grid-cols-4 gap-2">
              {["0.1", "0.5", "1.0", "2.0"].map((val) => (
                <button
                  key={val}
                  onClick={() => setSlippage(val)}
                  disabled={isBuyDisabled && isSellDisabled}
                  className={`
                    px-3 py-2 text-xs font-black rounded border-2 transition-all
                    ${slippage === val
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(131,110,249,0.5)]"
                      : "bg-card/30 text-foreground/70 border-primary/20 hover:border-primary/40 hover:bg-card/50"
                    }
                    ${isBuyDisabled && isSellDisabled ? "opacity-50 cursor-not-allowed" : ""}
                  `}
                >
                  {val}%
                </button>
              ))}
            </div>

            <div className="relative">
              <Input
                id="slippage"
                type="number"
                placeholder="Custom %"
                value={slippage}
                onChange={(e) => setSlippage(e.target.value)}
                step="0.1"
                min="0.1"
                max="50"
                disabled={isBuyDisabled && isSellDisabled}
                className="pr-10 text-center font-mono font-bold bg-background/50 border-primary/30"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-primary">
                %
              </span>
            </div>

            <p className="text-[10px] text-muted-foreground leading-tight">
              ⚠️ Transaction reverts if price moves unfavorably beyond this
              threshold
            </p>
          </div>
        )}
      </div>

      <Tabs
        value={tradeType}
        onValueChange={(v) => setTradeType(v as "buy" | "sell")}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger
            value="buy"
            className="data-[state=active]:bg-green-500/20"
            disabled={isBuyDisabled}
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Buy
          </TabsTrigger>
          <TabsTrigger
            value="sell"
            className="data-[state=active]:bg-red-500/20"
            disabled={isSellDisabled}
          >
            <TrendingDown className="w-4 h-4 mr-2" />
            Sell
          </TabsTrigger>
        </TabsList>

        <TabsContent value="buy" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mon-buy">You Pay (MON)</Label>
            <Input
              id="mon-buy"
              type="number"
              placeholder="0.0"
              value={monAmount}
              onChange={(e) => handleBnbChange(e.target.value)}
              disabled={isTrading || isBuyDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatBalance(monBalance, loadingBalances)} MON
            </p>
          </div>

          <div className="flex justify-center">
            <div className="p-2 bg-muted rounded-full">
              <ArrowDownUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token-buy">You Receive ({token.symbol})</Label>
            <Input
              id="token-buy"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              disabled={isTrading || isBuyDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatBalance(tokenBalance, loadingBalances)}{" "}
              {token.symbol}
            </p>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Price {isPancakeSwapPrice && "(PancakeSwap)"}
              </span>
              <span className="font-medium">{formatPrice(effectivePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Trading Fee (
                {token.launchType === "project-raise" ? "2%" : "2%"})
              </span>
              <span className="font-medium">
                {monAmount
                  ? (
                    parseFloat(monAmount) *
                    (token.launchType === "project-raise" ? 0.01 : 0.02)
                  ).toFixed(4)
                  : "0.0000"}{" "}
                MON
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span className="font-medium">{slippage}%</span>
            </div>
          </div>

          <Button
            onClick={handleTrade}
            className="w-full controller-btn"
            size="lg"
            disabled={
              isTrading ||
              !monAmount ||
              parseFloat(monAmount) <= 0 ||
              isBuyDisabled
            }
          >
            {isBuyDisabled ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Buying Disabled
              </>
            ) : isTrading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Buying...
              </>
            ) : (
              `Buy ${token.symbol}`
            )}
          </Button>
        </TabsContent>

        <TabsContent value="sell" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token-sell">You Sell ({token.symbol})</Label>
            <Input
              id="token-sell"
              type="number"
              placeholder="0.0"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              disabled={isTrading || isSellDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatBalance(tokenBalance, loadingBalances)}{" "}
              {token.symbol}
            </p>
          </div>

          <div className="flex justify-center">
            <div className="p-2 bg-muted rounded-full">
              <ArrowDownUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mon-sell">You Receive (MON)</Label>
            <Input
              id="mon-sell"
              type="number"
              placeholder="0.0"
              value={monAmount}
              onChange={(e) => handleBnbChange(e.target.value)}
              disabled={isTrading || isSellDisabled}
            />
            <p className="text-xs text-muted-foreground">
              Balance: {formatBalance(monBalance, loadingBalances)} MON
            </p>
          </div>

          <div className="space-y-2 p-4 bg-muted/50 rounded-lg text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Price {isPancakeSwapPrice && "(PancakeSwap)"}
              </span>
              <span className="font-medium">{formatPrice(effectivePrice)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                Trading Fee (
                {token.launchType === "project-raise" ? "2%" : "2%"})
              </span>
              <span className="font-medium">
                {monAmount
                  ? (
                    parseFloat(monAmount) *
                    (token.launchType === "project-raise" ? 0.02 : 0.02)
                  ).toFixed(4)
                  : "0.0000"}{" "}
                MON
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slippage</span>
              <span className="font-medium">{slippage}%</span>
            </div>
          </div>

          <Button
            onClick={handleTrade}
            className="w-full controller-btn"
            size="lg"
            variant="destructive"
            disabled={
              isTrading || !amount || parseFloat(amount) <= 0 || isSellDisabled
            }
          >
            {isSellDisabled ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Selling Disabled
              </>
            ) : isTrading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Selling...
              </>
            ) : (
              `Sell ${token.symbol}`
            )}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Quick Buy Buttons */}
      <div className="mt-6 pt-6 border-t border-border">
        {tradeType === "buy" ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">Quick Buy</p>
            <div className="grid grid-cols-4 gap-2">
              {["0.1", "0.5", "1", "5"].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="controller-btn-outline"
                  onClick={async () => {
                    setBnbAmount(val);
                    const tokens = await calculateTokens(val);
                    setAmount(tokens);
                  }}
                  disabled={isTrading || isBuyDisabled}
                >
                  {val} MON
                </Button>
              ))}
            </div>
          </>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">Quick Sell</p>
            <div className="grid grid-cols-4 gap-2">
              {["25%", "50%", "75%", "100%"].map((val) => (
                <Button
                  key={val}
                  variant="outline"
                  size="sm"
                  className="controller-btn-outline"
                  onClick={async () => {
                    if (!tokenBalance) return;
                    const percentage = parseFloat(val) / 100;
                    const tokensToSell = (
                      parseFloat(tokenBalance) * percentage
                    ).toFixed(4);
                    setAmount(tokensToSell);
                    const mon = await calculateBnb(tokensToSell);
                    setBnbAmount(mon);
                  }}
                  disabled={
                    isTrading ||
                    isSellDisabled ||
                    !tokenBalance ||
                    parseFloat(tokenBalance) === 0
                  }
                >
                  {val}
                </Button>
              ))}
            </div>
          </>
        )}
      </div>
    </Card>
  );
}
