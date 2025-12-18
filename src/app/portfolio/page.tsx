"use client";

import { Header } from "@/components/Header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatPrice } from "@/lib/utils/format";
import { Coins, TrendingUp, DollarSign } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useBaldPadSDK } from "@/lib/baldpad-sdk";
import { useAccount } from "wagmi";
import type { Token } from "@/types/token";
import { ethers } from "ethers";
import { getTokenStats } from '@/lib/utils/pancakeswap'
import { TokensLoadingAnimation } from "@/components/TokensLoadingAnimation";

export default function PortfolioPage() {
  const { address } = useAccount();
  const { sdk } = useBaldPadSDK();
  const [loading, setLoading] = useState(false);
  const [userTokens, setUserTokens] = useState<Token[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!sdk || !address) {
        setLoading(false);
        setUserTokens([]);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        // Get all token addresses
        const addresses = await sdk.launchpad.getAllLaunches();
        if (cancelled) return;

        // Fetch details for each token and filter by founder
        const items: Token[] = [];

        for (const addr of addresses) {
          try {
            // Get token info
            const tokenInfo = await sdk.tokenFactory.getTokenInfo(addr);
            const tokenMeta = tokenInfo.metadata;

            // Get launch info to check founder
            const launchInfo = await sdk.launchpad.getLaunchInfoWithUSD(addr);

            // Only include tokens created by the connected user
            if (launchInfo.founder.toLowerCase() !== address.toLowerCase()) {
              continue;
            }

            const tokenName = tokenInfo.name || "Unknown Token";
            const tokenSymbol = tokenInfo.symbol || "???";
            const logoURI = tokenMeta.logoURI ||
              "https://www.rmg.co.uk/sites/default/files/styles/full_width_1440/public/Color-Full%20Moon%20%C2%A9%20Nicolas%20Lefaudeux.jpg.webp?itok=ghLyCuO0";

            // Get pool info
            const poolInfo = await sdk.bondingDex.getPoolInfo(addr);

            // Check if graduated
            const graduated = Boolean(poolInfo.graduated);
            const graduatedToPancakeSwap = Boolean(launchInfo.graduatedToPancakeSwap);

            // For graduated tokens, use getTokenStats() for accurate data
            let marketCapUSD;
            let currentPrice;

            if (graduated) {
              try {
                const provider = new ethers.JsonRpcProvider("https://mon-testnet.g.alchemy.com/v2/tTuJSEMHVlxyDXueE8Hjv");
                const tokenStats = await getTokenStats(addr, provider, sdk);
                marketCapUSD = tokenStats.marketCapUSD;
                currentPrice = tokenStats.priceInUSD;
                console.log(`Using getTokenStats for graduated token ${tokenName}:`, {
                  marketCapUSD,
                  currentPrice
                });
              } catch (err) {
                console.warn(`Could not fetch token stats for ${addr}, falling back to pool info:`, err);
                marketCapUSD = Number(ethers.formatEther(poolInfo.marketCapUSD));
                currentPrice = Number(ethers.formatEther(await sdk.priceOracle.bnbToUSD(poolInfo.currentPrice)));
              }
            } else {
              // Non-graduated tokens use pool info
              marketCapUSD = Number(ethers.formatEther(poolInfo.marketCapUSD));
              currentPrice = Number(ethers.formatEther(await sdk.priceOracle.bnbToUSD(poolInfo.currentPrice)));
            }

            // Get vesting info
            let vestingData = null;
            try {
              vestingData = await sdk.launchpad.getLaunchVesting(addr);
            } catch (err) {
              console.warn(`Could not fetch vesting info for ${addr}:`, err);
            }

            // Get creator fee info
            let creatorFeeInfo = null;
            try {
              creatorFeeInfo = await sdk.bondingDex.getCreatorFeeInfo(addr);
            } catch (err) {
              console.warn(`Could not fetch creator fee info for ${addr}:`, err);
            }

            // Parse launch type
            const launchTypeNum = Number(launchInfo.launchType);
            const isProjectRaise = launchTypeNum === 0;

            // Parse numeric values
            const totalRaisedMON = Number(ethers.formatEther(launchInfo.totalRaisedMON));
            const raiseMaxMON = Number(ethers.formatEther(launchInfo.raiseTargetMON));
            const graduationProgress = Number(poolInfo.graduationProgress);
            const priceMultiplier = Number(poolInfo.priceMultiplier);
            const raiseCompleted = Boolean(launchInfo.raiseCompleted);

            // Parse vesting data
            const startMarketCap = vestingData
              ? Number(ethers.formatEther(vestingData.startMarketCap))
              : 0;
            const vestingDuration = vestingData?.vestingDuration
              ? Number(vestingData.vestingDuration)
              : 0;
            const vestingStartTime = vestingData?.vestingStartTime
              ? new Date(Number(vestingData.vestingStartTime) * 1000)
              : null;
            const founderTokens = vestingData
              ? Number(ethers.formatEther(vestingData.founderTokens))
              : 0;
            const founderTokensClaimed = vestingData
              ? Number(ethers.formatEther(vestingData.founderTokensClaimed))
              : 0;

            // Parse creator fee info
            const accumulatedFees = creatorFeeInfo
              ? Number(ethers.formatEther(creatorFeeInfo.accumulatedFees))
              : 0;
            const lastClaimTime = creatorFeeInfo?.lastClaimTime
              ? new Date(Number(creatorFeeInfo.lastClaimTime) * 1000)
              : null;
            const graduationMarketCap = creatorFeeInfo
              ? Number(ethers.formatEther(creatorFeeInfo.graduationMarketCap))
              : 0;
            const monInPool = creatorFeeInfo
              ? Number(ethers.formatEther(creatorFeeInfo.monInPool))
              : Number(poolInfo.monReserve);
            const canClaim = creatorFeeInfo?.canClaim ?? false;

            // Parse deadline
            const raiseDeadline = launchInfo.raiseDeadline
              ? new Date(Number(launchInfo.raiseDeadline) * 1000)
              : new Date(Date.now() + 24 * 60 * 60 * 1000);

            // Fetch volume data
            let volume24h = 0;
            let totalVolumeBNB = 0;
            let holderCount = 0;
            let transactionCount = 0;
            let priceChange24h = 0;

            try {
              const volume24hData = await sdk.bondingDex.get24hVolume(addr);
              const volume24hBNB = volume24hData.volumeBNB;
              const vol = await sdk.priceOracle.bnbToUSD(Number(volume24hBNB));
              volume24h = Number(ethers.formatUnits(Number(vol).toString(), 18));

              const totalVolumeData = await sdk.bondingDex.getTotalVolume(addr);
              totalVolumeBNB = Number(ethers.formatEther(totalVolumeData.totalVolumeBNB));
              transactionCount = totalVolumeData.buyCount + totalVolumeData.sellCount;

              holderCount = await sdk.bondingDex.getEstimatedHolderCount(addr);

              try {
                const priceChangeData = await sdk.bondingDex.get24hPriceChange(addr);
                priceChange24h = priceChangeData.priceChangePercent;
              } catch (error) {
                console.warn(`Could not fetch price change data for ${addr}:`, error);
              }
            } catch (error) {
              console.warn(`Could not fetch volume/holder data for ${addr}:`, error);
            }

            const token: Token = {
              id: addr,
              name: tokenName,
              symbol: tokenSymbol,
              description: tokenMeta.description || "Launched token on BaldPad",
              image: logoURI,
              contractAddress: addr,
              creatorAddress: launchInfo.founder,

              launchType: isProjectRaise ? "project-raise" : "instant-launch",

              status: ((): Token["status"] => {
                if (graduated) return "completed";
                if (isProjectRaise && !raiseCompleted) return "active";
                return "active";
              })(),

              createdAt: new Date(),

              totalSupply: Number(tokenInfo.totalSupply),
              currentPrice,
              marketCap: marketCapUSD,
              liquidityPool: Number(poolInfo.monReserve),
              volume24h,
              priceChange24h,

              projectRaise: isProjectRaise ? {
                config: {
                  type: "project-raise",
                  targetAmount: raiseMaxMON || 0,
                  raiseWindow: 24 * 60 * 60 * 1000,
                  ownerAllocation: 20,
                  immediateUnlock: 10,
                  vestingMonths: 6,
                  liquidityAllocation: 10,
                  liquidityCap: 100000,
                  graduationThreshold: 500000,
                  tradingFee: { platform: 0.1, liquidity: 0.3, infofiPlatform: 0.6 },
                },
                raisedAmount: totalRaisedMON,
                targetAmount: raiseMaxMON || 0,
                startTime: new Date(Date.now() - 60_000),
                endTime: raiseDeadline,
                vestingSchedule: {
                  totalAmount: founderTokens,
                  releasedAmount: founderTokensClaimed,
                  schedule: []
                },
                approved: true,
                vestingData: vestingData ? {
                  startMarketCap,
                  vestingDuration,
                  vestingStartTime,
                  founderTokens,
                  founderTokensClaimed,
                } : undefined,
              } : undefined,

              instantLaunch: !isProjectRaise ? {
                config: {
                  type: "instant-launch",
                  tradingFee: { platform: 0.1, creator: 1.0, infofiPlatform: 0.9 },
                  graduationThreshold: 15,
                  claimCooldown: 86_400_000,
                  marketCapRequirement: true,
                  accrualPeriod: 604_800_000,
                },
                cumulativeBuys: monInPool,
                creatorFees: accumulatedFees,
                lastClaimTime: lastClaimTime,
                claimableAmount: canClaim ? accumulatedFees : 0,
                graduationProgress,
                priceMultiplier,
                graduationMarketCap,
                canClaim,
              } as any : undefined,

              graduated,
              graduatedToPancakeSwap,
              graduationDate: graduated ? new Date() : undefined,
              startingMarketCap: startMarketCap,

              twitter: tokenMeta.twitter,
              telegram: tokenMeta.telegram,
              website: tokenMeta.website,

              holders: holderCount,
              transactions: transactionCount,
            } as Token;

            items.push(token);

          } catch (err) {
            console.error(`Error fetching token ${addr}:`, err);
          }
        }

        if (cancelled) return;
        setUserTokens(items);

      } catch (e: any) {
        console.error("Error loading portfolio:", e);
        if (!cancelled) setLoadError(String(e?.message || e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [sdk, address]);

  // Calculate portfolio stats
  const totalPortfolioValue = userTokens.reduce((sum, token) => sum + token.marketCap, 0);
  const totalVolume24h = userTokens.reduce((sum, token) => sum + token.volume24h, 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Portfolio</h1>
          <p className="text-muted-foreground">
            Manage your tokens and track your performance
          </p>
        </div>

        {!address ? (
          <Card className="p-12 text-center pixel-corners border-2 border-primary/40">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coins className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3">Connect Wallet</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Connect your wallet to view your token portfolio
              </p>
            </div>
          </Card>
        ) : loading ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 pixel-corners border-2 border-primary/40 animate-pulse">
                  <div className="h-20 bg-muted/30 rounded" />
                </Card>
              ))}
            </div>
            <TokensLoadingAnimation />
          </>
        ) : (
          <>
            {/* Portfolio Summary */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 pixel-corners border-2 border-primary/40">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <DollarSign className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Total Value</span>
                </div>
                <p className="text-3xl font-black tracking-wide mb-1">{formatCurrency(totalPortfolioValue)}</p>
                <p className="text-sm text-muted-foreground">
                  Market cap of all tokens
                </p>
              </Card>

              <Card className="p-6 pixel-corners border-2 border-primary/40">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <Coins className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">Active Tokens</span>
                </div>
                <p className="text-3xl font-black tracking-wide mb-1">{userTokens.length}</p>
                <p className="text-sm text-muted-foreground">
                  {userTokens.filter((t) => t.graduated).length} graduated
                </p>
              </Card>

              <Card className="p-6 pixel-corners border-2 border-primary/40">
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-primary/20 rounded-full">
                    <TrendingUp className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">24h Volume</span>
                </div>
                <p className="text-3xl font-black tracking-wide mb-1">{formatCurrency(totalVolume24h)}</p>
                <p className="text-sm text-muted-foreground">
                  Across all tokens
                </p>
              </Card>
            </div>

            {/* My Tokens Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">My Tokens</h2>
                <Link href="/create">
                  <Button className="controller-btn">
                    <Coins className="w-5 h-5 mr-2" />
                    Create Token
                  </Button>
                </Link>
              </div>

              {userTokens.map((token) => {
                // Calculate founder holdings - use accurate price for graduated tokens
                const founderHoldings = token.launchType === "project-raise"
                  ? token.projectRaise?.vestingData?.founderTokens || 0
                  : 0;
                const holdingsValue = founderHoldings * token.currentPrice;

                return (
                  <Card key={token.id} className="p-6 pixel-corners border-2 border-primary/30 hover:border-primary/60 transition-all">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4">
                        <Image
                          src={token.image}
                          alt={token.name}
                          width={64}
                          height={64}
                          className="rounded-full border-2 border-primary/40"
                        />
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-2xl font-black tracking-wide">{token.symbol}</h3>
                            <Badge variant={token.graduated ? "default" : "outline"} className="font-bold">
                              {token.graduated ? "Graduated" : "Active"}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">{token.name}</p>
                        </div>
                      </div>

                      <Link href={`/token/${token.id}`}>
                        <Button variant="outline" className="controller-btn-outline">View Details</Button>
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 bg-card/50 pixel-corners border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-2">Founder Allocation</p>
                        <p className="text-lg font-black tracking-wide">
                          {founderHoldings > 0 ? founderHoldings.toLocaleString() : "N/A"} {founderHoldings > 0 ? token.symbol : ""}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {founderHoldings > 0 ? formatCurrency(holdingsValue) : "Instant Launch"}
                        </p>
                      </div>
                      <div className="p-4 bg-card/50 pixel-corners border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-2">Current Price</p>
                        <p className="text-lg font-black tracking-wide">{formatPrice(token.currentPrice)}</p>
                        <p className={`text-xs mt-1 font-bold ${token.priceChange24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {token.priceChange24h >= 0 ? "+" : ""}{token.priceChange24h.toFixed(2)}%
                        </p>
                      </div>
                      <div className="p-4 bg-card/50 pixel-corners border border-primary/20">
                        <p className="text-xs text-muted-foreground mb-2">Market Cap</p>
                        <p className="text-lg font-black tracking-wide">{formatCurrency(token.marketCap)}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {token.holders} holders
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}

              {userTokens.length === 0 && !loading && (
                <Card className="p-12 text-center pixel-corners border-2 border-primary/40">
                  <div className="max-w-md mx-auto">
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Coins className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-xl font-bold mb-3">No tokens yet</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Create your first token to start building your portfolio
                    </p>
                    <Link href="/create">
                      <Button className="controller-btn">
                        <Coins className="w-5 h-5 mr-2" />
                        Create Token
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}

              {loadError && (
                <Card className="p-6 pixel-corners border-2 border-destructive/40">
                  <p className="text-sm text-destructive">
                    Error loading portfolio: {loadError}
                  </p>
                </Card>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
