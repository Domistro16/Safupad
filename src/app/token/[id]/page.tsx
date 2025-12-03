"use client";

import { Header } from "@/components/Header";
import { TradingInterface } from "@/components/token/TradingInterface";
import { ContributeInterface } from "@/components/token/ContributeInterface";
import { TokenInfo } from "@/components/token/TokenInfo";
import { VestingTimeline } from "@/components/token/VestingTimeline";
import { TradeHistory } from "@/components/token/TradeHistory";
import { notFound } from "next/navigation";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils/format";
import { Wallet, Coins, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSafuPadSDK } from "@/lib/safupad-sdk";
import type { Token, Trade } from "@/types/token";
import { ethers } from "ethers";
import { useAccount } from "wagmi";
import { toast } from "sonner";
import { getTokenStats, type PancakeSwapStats } from "@/lib/utils/pancakeswap";

export const abi = [
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "pools",
    outputs: [
      {
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "bnbReserve",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "tokenReserve",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "reservedTokens",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "totalTokenSupply",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "marketCap",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "graduationMarketCap",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "graduated",
        type: "bool",
      },
      {
        internalType: "bool",
        name: "active",
        type: "bool",
      },
      {
        internalType: "address",
        name: "creator",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "virtualBnbReserve",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bnbForPancakeSwap",
        type: "uint256",
      },
      {
        internalType: "address",
        name: "lpToken",
        type: "address",
      },
      {
        internalType: "bool",
        name: "burnLP",
        type: "bool",
      },
      {
        internalType: "uint256",
        name: "launchBlock",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "graduationBnbThreshold",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "graduationMarketCapBNB",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

export default function TokenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { sdk } = useSafuPadSDK();
  const [token, setToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentTrades, setRecentTrades] = useState<Trade[]>([]);
  const [creatorFeeInfo, setCreatorFeeInfo] = useState<{
    accumulatedFees: number;
    lastClaimTime: Date | null;
    graduationMarketCap: number;
    currentMarketCap: number;
    bnbInPool: number;
    canClaim: boolean;
  } | null>(null);
  const { address } = useAccount();
  const [isInstantLaunch, setIsInstantLaunch] = useState(false);
  const [actualBnbInPool, setActualBnbInPool] = useState<number>(0);
  const [virtualLiquidityUSD, setVirtualLiquidityUSD] = useState<number>(0);
  const [graduationBnb, setGraduationBnb] = useState<number>(0);
  const [claimableAmounts, setClaimableAmounts] = useState<{
    claimableTokens: number;
    claimableFunds: number;
  } | null>(null);
  const [graduatedToPancakeSwap, setGraduatedToPancakeSwap] = useState(false);
  const [postGraduationFees, setPostGraduationFees] = useState<{
    totalFeesHarvested: number;
    canHarvest: boolean;
    timeRemaining: number;
  } | null>(null);
  const [isHarvesting, setIsHarvesting] = useState(false);
  const [pancakeSwapStats, setPancakeSwapStats] =
    useState<PancakeSwapStats | null>(null);
  const [raiseCompleted, setRaiseCompleted] = useState(false);

  // Fetch token data from SDK
  useEffect(() => {
    let cancelled = false;

    const loadToken = async () => {
      if (!sdk) {
        setLoading(true);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch token info
        const tokenInfo = await sdk.tokenFactory.getTokenInfo(id);
        const tokenMeta = tokenInfo.metadata;
        const tokenName = tokenInfo.name || "Unknown Token";
        const tokenSymbol = tokenInfo.symbol || "???";
        const logoURI =
          tokenMeta.logoURI ||
          "https://images.unsplash.com/photo-1614064641938-3bbee52942c1?w=400&h=400&fit=crop";

        // Fetch launch info with USD values
        const launchInfo = await sdk.launchpad.getLaunchInfoWithUSD(id);

        // Fetch graduation status separately using getLaunchInfo
        const launchInfoBasic = await sdk.launchpad.getLaunchInfo(id);
        const graduatedToPancake = Boolean(
          launchInfoBasic.graduatedToPancakeSwap
        );
        const raiseComplete = Boolean(launchInfo.raiseCompleted);

        if (!cancelled) {
          setGraduatedToPancakeSwap(graduatedToPancake);
          setRaiseCompleted(raiseComplete);
        }

        // Parse launch type FIRST before fetching pool data
        const launchTypeNum = Number(launchInfo.launchType);
        const isProjectRaise = launchTypeNum === 0;
        const isInstant = !isProjectRaise;

        if (!cancelled) {
          setIsInstantLaunch(isInstant);
        }

        // Fetch pool info
        const poolInfo = await sdk.bondingDex.getPoolInfo(id);

        // Only fetch bonding curve contract data for instant-launch tokens
        let pool: any = null;
        if (isInstant) {
          const bond = sdk.bondingDex.getContract();
          const provider = new ethers.JsonRpcProvider(
            "https://bnb-testnet.g.alchemy.com/v2/tTuJSEMHVlxyDXueE8Hjv"
          );
          const bonding = new ethers.Contract(
            await bond.getAddress(),
            abi,
            provider
          );
          pool = await bonding.pools(id);
          console.log(pool)
          // Store actual BNB in pool from contract for instant-launch
          const totalBnb =
            Number(ethers.formatEther(pool.bnbReserve)) +
            Number(ethers.formatEther(pool.virtualBnbReserve));
          if (!cancelled) {
            setActualBnbInPool(totalBnb);

            // Convert BNB to USD using price oracle
            const totalBnbWei =
              BigInt(pool.bnbReserve) + BigInt(pool.virtualBnbReserve);
            const usdValue = await sdk.priceOracle.bnbToUSD(totalBnbWei);
            setVirtualLiquidityUSD(Number(ethers.formatEther(usdValue)));

            // Convert graduation BNB threshold to USD
            const graduationBnbWei = BigInt(pool.graduationBnbThreshold);
            setGraduationBnb(Number(ethers.formatEther(graduationBnbWei)));
          }
        }

        // Fetch vesting data for project raises
        let vestingData = null;
        if (isProjectRaise) {
          try {
            vestingData = await sdk.launchpad.getLaunchVesting(id);
            console.log(`Vesting info for ${tokenName}:`, vestingData);
          } catch (err) {
            console.warn(`Could not fetch vesting info for ${id}:`, err);
          }

          // Fetch claimable amounts for project-raise tokens
          try {
            const claimable = await sdk.launchpad.getClaimableAmounts(id);
            const parsedClaimable = {
              claimableTokens: Number(
                ethers.formatEther(claimable.claimableTokens)
              ),
              claimableFunds: Number(
                ethers.formatEther(claimable.claimableFunds)
              ),
            };
            if (!cancelled) {
              setClaimableAmounts(parsedClaimable);
            }
            console.log("Claimable amounts:", parsedClaimable);
          } catch (err) {
            console.warn(`Could not fetch claimable amounts for ${id}:`, err);
            if (!cancelled) {
              setClaimableAmounts({ claimableTokens: 0, claimableFunds: 0 });
            }
          }
        }

        // Only fetch creator fee info for instant-launch tokens
        if (isInstant) {
          try {
            const feeInfo = await sdk.bondingDex.getCreatorFeeInfo(id);
            console.log("Creator fee info:", feeInfo);

            const parsedFeeInfo = {
              accumulatedFees: Number(
                ethers.formatEther(
                  await sdk.priceOracle.bnbToUSD(feeInfo.accumulatedFees)
                )
              ),
              lastClaimTime:
                feeInfo.lastClaimTime && Number(feeInfo.lastClaimTime) > 0
                  ? new Date(Number(feeInfo.lastClaimTime) * 1000)
                  : null,
              graduationMarketCap: Number(
                ethers.formatEther(feeInfo.graduationMarketCap)
              ),
              currentMarketCap: Number(
                ethers.formatEther(
                  await sdk.priceOracle.bnbToUSD(feeInfo.currentMarketCap)
                )
              ),
              bnbInPool: Number(ethers.formatEther(feeInfo.bnbInPool)),
              canClaim: Boolean(feeInfo.canClaim),
            };

            if (!cancelled) {
              setCreatorFeeInfo(parsedFeeInfo);
            }
          } catch (err) {
            console.error("Error fetching creator fee info:", err);
            // Set default values if fetch fails for instant-launch
            if (!cancelled) {
              setCreatorFeeInfo({
                accumulatedFees: 0,
                lastClaimTime: null,
                graduationMarketCap: 0,
                currentMarketCap: 0,
                bnbInPool: 0,
                canClaim: false,
              });
            }
          }
        }

        // Parse numeric values
        const totalRaisedUSD = Number(
          ethers.formatEther(launchInfo.totalRaisedUSD)
        );
        const raiseMaxUSD = Number(
          ethers.formatEther(launchInfo.raiseTargetUSD)
        );
        const marketCapUSD = Number(ethers.formatEther(poolInfo.marketCapUSD));
        const currentPrice = Number(
          ethers.formatEther(
            await sdk.priceOracle.bnbToUSD(poolInfo.currentPrice)
          )
        );
        const graduationProgress = Number(poolInfo.graduationProgress);
        const priceMultiplier = Number(poolInfo.priceMultiplier);
        const raiseCompleted = Boolean(launchInfo.raiseCompleted);
        const graduated = Boolean(poolInfo.graduated);

        // Calculate liquidity pool - different for project-raise vs instant-launch
        let liquidityPool: any;
        if (isInstant && pool) {
          const virtual = pool.virtualBnbReserve;
          liquidityPool = await sdk.priceOracle.bnbToUSD(
            BigInt(poolInfo.bnbReserve) + BigInt(virtual)
          );
        } else {
          liquidityPool = await sdk.priceOracle.bnbToUSD(
            BigInt(poolInfo.bnbReserve)
          );
        }

        // Parse vesting data if available
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

        // Parse deadline
        const raiseDeadline = launchInfo.raiseDeadline
          ? new Date(Number(launchInfo.raiseDeadline) * 1000)
          : new Date(Date.now() + 24 * 60 * 60 * 1000);

        // Fetch volume data using SDK methods - ONLY for instant-launch tokens
        let volume24h = 0;
        let totalVolumeBNB = 0;
        let recentTradesCount = 0;
        let holderCount = 0;
        let transactionCount = 0;
        let priceChange24h = 0;

        if (isInstant) {
          try {
            // Get total volume
            const totalVolumeData = await sdk.bondingDex.getTotalVolume(id);
            totalVolumeBNB = Number(
              ethers.formatEther(totalVolumeData.totalVolumeBNB)
            );
            transactionCount =
              totalVolumeData.buyCount + totalVolumeData.sellCount;

            // Convert total volume to USD
            const totalVolumeUSD = await sdk.priceOracle.bnbToUSD(
              totalVolumeData.totalVolumeBNB
            );
            volume24h = Number(ethers.formatEther(totalVolumeUSD));

            console.log(totalVolumeData);

            // Get 24h price change
            try {
              const priceChangeData =
                await sdk.bondingDex.get24hPriceChange(id);
              priceChange24h = priceChangeData.priceChangePercent;
              console.log(`Price change for ${tokenName}: ${priceChange24h}%`);
            } catch (error) {
              console.warn(
                `Could not fetch price change data for ${id}:`,
                error
              );
            }

            // Get recent trades and convert to Trade format
            const tradesData = await sdk.bondingDex.getRecentTrades(id);
            recentTradesCount = tradesData.length;

            // Convert SDK TradeData format to Trade format
            const convertedTrades: Trade[] = await Promise.all(
              tradesData.map(async (tradeData: any, index: number) => {
                const usdPrice = await sdk.priceOracle.bnbToUSD(
                  tradeData.price
                );
                const usdValue = await sdk.priceOracle.bnbToUSD(
                  tradeData.bnbAmount
                );
                const priceInBnbHexOrBN = tradeData.price;

                const amount = Number(
                  ethers.formatEther(tradeData.tokenAmount)
                );
                const price = Number(ethers.formatEther(priceInBnbHexOrBN));
                const total = Number(ethers.formatEther(usdValue));

                return {
                  id: `${tradeData.txHash}-${index}`,
                  tokenId:
                    tradeData.tokenId ??
                    tradeData.id ??
                    `${tradeData.txHash}-${index}`,
                  type: tradeData.type,
                  amount,
                  price,
                  total,
                  userAddress: tradeData.trader,
                  timestamp: new Date(Number(tradeData.timestamp) * 1000),
                  txHash: tradeData.txHash,
                } as Trade;
              })
            );

            if (!cancelled) {
              setRecentTrades(convertedTrades);
            }

            // Get holder count
            holderCount = await sdk.bondingDex.getEstimatedHolderCount(id);

            console.log(`Volume data for ${tokenName}:`, {
              volume24h,
              totalVolumeBNB,
              recentTradesCount,
              holderCount,
              priceChange24h,
              totalVolumeData,
              convertedTrades,
            });
          } catch (error) {
            console.warn(
              `Could not fetch volume/holder data for ${id}:`,
              error
            );
          }
        }

        if (cancelled) return;

        const tokenData: Token = {
          id,
          name: tokenName,
          symbol: tokenSymbol,
          description: tokenMeta.description || "Launched token on SafuPad",
          image: logoURI,
          contractAddress: id,
          creatorAddress: launchInfo.founder,

          launchType: isProjectRaise ? "project-raise" : "instant-launch",

          status: ((): Token["status"] => {
            if (graduated) return "completed";
            if (isProjectRaise && !raiseComplete) return "active";
            return "active";
          })(),

          createdAt: new Date(),

          // Financial
          totalSupply: Number(ethers.formatEther(tokenInfo.totalSupply)),
          currentPrice,
          marketCap: marketCapUSD,
          liquidityPool,
          volume24h,
          priceChange24h,

          // Project Raise
          projectRaise: isProjectRaise
            ? {
                config: {
                  type: "project-raise",
                  targetAmount: raiseMaxUSD || 0,
                  raiseWindow: 24 * 60 * 60 * 1000,
                  ownerAllocation: 20,
                  immediateUnlock: 10,
                  vestingMonths: 6,
                  liquidityAllocation: 10,
                  liquidityCap: 100000,
                  graduationThreshold: 15,
                  tradingFee: {
                    platform: 0.1,
                    liquidity: 0.3,
                    infofiPlatform: 0.6,
                    creator: 1.0,
                  },
                },
                raisedAmount: totalRaisedUSD,
                targetAmount: raiseMaxUSD || 0,
                startTime: new Date(Date.now() - 60_000),
                endTime: raiseDeadline,
                vestingSchedule: {
                  totalAmount: founderTokens,
                  releasedAmount: founderTokensClaimed,
                  schedule: [],
                },
                approved: true,
                graduationProgress,
                // Vesting data from SDK
                vestingData: vestingData
                  ? {
                      startMarketCap,
                      vestingDuration,
                      vestingStartTime,
                      founderTokens,
                      founderTokensClaimed,
                    }
                  : undefined,
              }
            : undefined,

          // Instant Launch
          instantLaunch: !isProjectRaise
            ? ({
                config: {
                  type: "instant-launch",
                  tradingFee: {
                    platform: 0.1,
                    creator: 1.0,
                    infofiPlatform: 0.9,
                  },
                  graduationThreshold: 15,
                  claimCooldown: 86_400_000,
                  marketCapRequirement: true,
                  accrualPeriod: 604_800_000,
                },
                cumulativeBuys: Number(poolInfo.bnbReserve),
                creatorFees: 0,
                lastClaimTime: null,
                claimableAmount: 0,
                graduationProgress,
                priceMultiplier,
              } as any)
            : undefined,

          // Graduation
          graduated,
          graduationDate: graduated ? new Date() : undefined,
          startingMarketCap: 0,

          // Social
          twitter: tokenMeta.twitter,
          telegram: tokenMeta.telegram,
          website: tokenMeta.website,

          // Stats - Updated with SDK data
          holders: holderCount,
          transactions: transactionCount,
        } as Token;

        setToken(tokenData);
      } catch (e: any) {
        console.error("Error loading token:", e);
        if (!cancelled) {
          setError(String(e?.message || e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void loadToken();

    return () => {
      cancelled = true;
    };
  }, [sdk, id]);

  // Fetch PancakeSwap stats when graduated to PancakeSwap
  useEffect(() => {
    let cancelled = false;

    const fetchPancakeSwapStats = async () => {
      // Only fetch if token is loaded AND graduated to PancakeSwap
      if (!token?.id || !graduatedToPancakeSwap) {
        setPancakeSwapStats(null);
        return;
      }

      try {
        const provider = new ethers.JsonRpcProvider(
          "https://bnb-testnet.g.alchemy.com/v2/tTuJSEMHVlxyDXueE8Hjv"
        );
        const stats = await getTokenStats(token.id, provider, sdk);

        if (!cancelled) {
          setPancakeSwapStats(stats);

          // Update token with PancakeSwap price
          setToken((prevToken) => {
            if (!prevToken) return null;
            return {
              ...prevToken,
              currentPrice: stats.priceInUSD,
              marketCap: stats.marketCapUSD,
              liquidityPool: stats.liquidityUSD,
            };
          });

          console.log("PancakeSwap stats loaded:", stats);
        }
      } catch (error) {
        console.error("Error fetching PancakeSwap stats:", error);
        if (!cancelled) {
          setPancakeSwapStats(null);
        }
      }
    };

    void fetchPancakeSwapStats();

    // Poll every 30 seconds for price updates
    const interval = setInterval(() => {
      void fetchPancakeSwapStats();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, graduatedToPancakeSwap]);

  // Fetch post-graduation fee data when token is graduated to PancakeSwap
  useEffect(() => {
    let cancelled = false;

    const loadPostGraduationFees = async () => {
      if (!sdk || !token || !graduatedToPancakeSwap) {
        return;
      }

      try {
        // Fetch lock info for total fees harvested
        const lockInfo = await sdk.lpHarvester.getLockInfo(id);

        // Fetch can harvest status
        const harvestStatus = await sdk.lpHarvester.canHarvest(id);

        const parsedData = {
          totalFeesHarvested: Number(
            ethers.formatEther(
              await sdk.priceOracle.bnbToUSD(lockInfo.totalFeesHarvested)
            )
          ),
          canHarvest: Boolean(harvestStatus.ready),
          timeRemaining: Number(harvestStatus.timeRemaining),
        };

        if (!cancelled) {
          setPostGraduationFees(parsedData);
        }

        console.log("Post-graduation fees:", parsedData);
      } catch (err) {
        console.error("Error fetching post-graduation fees:", err);
        if (!cancelled) {
          setPostGraduationFees({
            totalFeesHarvested: 0,
            canHarvest: false,
            timeRemaining: 0,
          });
        }
      }
    };

    void loadPostGraduationFees();

    // Poll every 30 seconds
    const interval = setInterval(() => {
      void loadPostGraduationFees();
    }, 30000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sdk, id, token, graduatedToPancakeSwap]);

  // Check graduation status to PancakeSwap
  useEffect(() => {
    let cancelled = false;

    const checkGraduationStatus = async () => {
      if (!sdk || !token) return;

      try {
        const launchInfo = await sdk.launchpad.getLaunchInfo(id);
        const graduated = Boolean(launchInfo.graduatedToPancakeSwap);

        if (!cancelled) {
          setGraduatedToPancakeSwap(graduated);
        }
      } catch (err) {
        console.error("Error checking graduation status:", err);
      }
    };

    void checkGraduationStatus();

    // Poll every 10 seconds
    const interval = setInterval(() => {
      void checkGraduationStatus();
    }, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sdk, id, token]);

  // Handle harvest fees
  const handleHarvestFees = async () => {
    if (!sdk) {
      toast.error("SDK not initialized");
      return;
    }

    setIsHarvesting(true);
    try {
      const harvester = sdk.lpHarvester.getContract();
      const tr = await harvester.harvestFees(id);
      await tr.wait();
      toast.success("Fees harvested successfully!");

      // Refresh post-graduation fees data
      const lockInfo = await sdk.lpHarvester.getLockInfo(id);
      const harvestStatus = await sdk.lpHarvester.canHarvest(id);

      setPostGraduationFees({
        totalFeesHarvested: Number(
          ethers.formatEther(lockInfo.totalFeesHarvested)
        ),
        canHarvest: Boolean(harvestStatus.ready),
        timeRemaining: Number(harvestStatus.timeRemaining),
      });
    } catch (err: any) {
      console.error("Error harvesting fees:", err);
      toast.error(err?.message || "Failed to harvest fees");
    } finally {
      setIsHarvesting(false);
    }
  };

  // Derive current user address from localStorage

  const isCreator = useMemo(() => {
    if (!address || !token) return false;
    return address.toLowerCase() === token.creatorAddress.toLowerCase();
  }, [address, token]);

  // Determine if we should show contribute interface
  const isProjectRaise = token?.launchType === "project-raise";
  // Show contribute interface for project-raise tokens until they graduate to PancakeSwap
  const shouldShowContribute = isProjectRaise && !graduatedToPancakeSwap;

  // Show trading interface when not showing contribute interface
  const shouldShowTrading = !shouldShowContribute;

  // Show banner ONLY for instant-launch OR project-raise tokens that graduated to PancakeSwap
  const showFeesBanner =
    isInstantLaunch || (isProjectRaise && graduatedToPancakeSwap);
  const canClaimFees = showFeesBanner && isCreator && creatorFeeInfo?.canClaim;

  // Show claimable funds banner for project-raise tokens
  const showClaimableFunds = !isInstantLaunch && claimableAmounts;
  const hasClaimableFunds =
    showClaimableFunds &&
    claimableAmounts &&
    claimableAmounts.claimableFunds > 0;
  const hasClaimableTokens =
    showClaimableFunds &&
    claimableAmounts &&
    claimableAmounts.claimableTokens > 0;

  // Check if harvest is available (either SDK says so OR timer has elapsed)
  const canHarvestFees =
    postGraduationFees &&
    (postGraduationFees.canHarvest || postGraduationFees.timeRemaining <= 0);

  console.log("Debug Info:", {
    isCreator,
    graduatedToPancakeSwap,
    hasCreatorFeeInfo: !!creatorFeeInfo,
    hasPostGraduationFees: !!postGraduationFees,
    showFeesBanner,
    canHarvestFees,
    postGraduationFees,
  });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Loading token data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state - Show error message instead of notFound()
  if (error || !token) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
                <Coins className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-2xl font-bold">Token Not Found</h2>
              <p className="text-muted-foreground">
                {error ||
                  "Unable to load token data. The token may not exist or there was an error fetching its information."}
              </p>
              <div className="pt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  Token Address:
                </p>
                <code className="text-xs bg-muted px-3 py-2 rounded break-all block">
                  {id}
                </code>
              </div>
              <Button
                className="controller-btn mt-4"
                onClick={() => (window.location.href = "/")}
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Creator Fees Banner - visible for instant-launch OR project-raise tokens that graduated */}
        {showFeesBanner && (
          <div className="mb-6 border-2 border-primary/40 bg-card/70 pixel-corners p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-accent" />
                <p className="text-sm text-muted-foreground">
                  Creator Fees Status
                </p>
              </div>

              {/* For Instant Launch: Show bonding curve fee info */}
              {isInstantLaunch && creatorFeeInfo ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Accumulated Fees
                      </p>
                      <p className="text-xl font-black tracking-wide">
                        {formatCurrency(creatorFeeInfo.accumulatedFees)}
                      </p>
                    </div>
                    {!graduatedToPancakeSwap && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Virtual Liquidity
                        </p>
                        <p className="text-xl font-black tracking-wide">
                          {formatCurrency(virtualLiquidityUSD)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-muted-foreground">
                        {graduatedToPancakeSwap
                          ? "PancakeSwap Market Cap"
                          : "Current Market Cap"}
                      </p>
                      <p className="text-xl font-black tracking-wide">
                        {formatCurrency(
                          graduatedToPancakeSwap
                            ? pancakeSwapStats?.marketCapUSD ||
                                creatorFeeInfo.currentMarketCap
                            : creatorFeeInfo.currentMarketCap
                        )}
                      </p>
                    </div>
                    {!graduatedToPancakeSwap && (
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Graduation MON
                        </p>
                        <p className="text-xl font-black tracking-wide">
                          {graduationBnb} MON
                        </p>
                      </div>
                    )}
                  </div>
                  {creatorFeeInfo.lastClaimTime && (
                    <p className="text-xs text-muted-foreground">
                      Last Claim:{" "}
                      <span className="font-semibold text-foreground">
                        {creatorFeeInfo.lastClaimTime.toLocaleString()}
                      </span>
                    </p>
                  )}
                  {!creatorFeeInfo.canClaim && (
                    <p className="text-xs text-yellow-500">
                      ⏱️ There is a week cooldown time between fee claims
                    </p>
                  )}
                </>
              ) : isInstantLaunch ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm">Loading fee information...</p>
                </div>
              ) : null}

              {/* For Project Raise (Graduated): Show post-graduation fees info only */}
              {isProjectRaise && graduatedToPancakeSwap && (
                <>
                  {postGraduationFees ? (
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Total Fees Harvested
                        </p>
                        <p className="text-xl font-black tracking-wide text-secondary">
                          {formatCurrency(
                            postGraduationFees.totalFeesHarvested
                          )}
                        </p>
                      </div>
                      {canHarvestFees && (
                        <Button
                          className="controller-btn w-full sm:w-auto"
                          onClick={handleHarvestFees}
                          disabled={isHarvesting}
                        >
                          {isHarvesting ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Harvesting...
                            </>
                          ) : (
                            <>
                              <Wallet className="w-5 h-5 mr-2" />
                              Harvest Fees
                            </>
                          )}
                        </Button>
                      )}
                      {isCreator &&
                        !canHarvestFees &&
                        postGraduationFees.timeRemaining > 0 && (
                          <p className="text-xs text-yellow-500">
                            ⏱️ Next harvest available in{" "}
                            {Math.ceil(postGraduationFees.timeRemaining / 60)}{" "}
                            minutes
                          </p>
                        )}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <p className="text-sm">
                        Loading post-graduation fee data...
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
            {canClaimFees && isInstantLaunch && (
              <Button
                className="controller-btn"
                onClick={() => {
                  /* wire claim action later */
                }}
              >
                <Wallet className="w-5 h-5 mr-2" />
                Claim Fees
              </Button>
            )}
          </div>
        )}

        {/* Claimable Funds Banner - visible for project-raise tokens */}
        {showClaimableFunds && isCreator && !raiseCompleted && (
          <div className="mb-6 border-2 border-primary/40 bg-card/70 pixel-corners p-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-accent" />
                <p className="text-sm text-muted-foreground">
                  Founder Claimable Amounts
                </p>
              </div>
              {claimableAmounts ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border border-primary/30 p-4 pixel-corners bg-background/50">
                      <p className="text-xs text-muted-foreground mb-2">
                        Claimable Funds (MON)
                      </p>
                      <p className="text-2xl font-black tracking-wide text-primary">
                        {claimableAmounts.claimableFunds.toFixed(4)} MON
                      </p>
                      {hasClaimableFunds && (
                        <Button
                          className="controller-btn mt-3 w-full"
                          onClick={() => {
                            /* wire claim funds action later */
                          }}
                        >
                          <Coins className="w-4 h-4 mr-2" />
                          Claim Funds
                        </Button>
                      )}
                    </div>
                    <div className="border border-primary/30 p-4 pixel-corners bg-background/50">
                      <p className="text-xs text-muted-foreground mb-2">
                        Claimable Tokens
                      </p>
                      <p className="text-2xl font-black tracking-wide text-primary">
                        {claimableAmounts.claimableTokens.toFixed(2)}{" "}
                        {token?.symbol}
                      </p>
                      {hasClaimableTokens && (
                        <Button
                          className="controller-btn mt-3 w-full"
                          onClick={() => {
                            /* wire claim tokens action later */
                          }}
                        >
                          <Coins className="w-4 h-4 mr-2" />
                          Claim Tokens
                        </Button>
                      )}
                    </div>
                  </div>
                  {!hasClaimableFunds && !hasClaimableTokens && (
                    <p className="text-xs text-muted-foreground text-center">
                      No claimable amounts available at this time
                    </p>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <p className="text-sm">Loading claimable amounts...</p>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Token Info & Chart */}
          <div className="lg:col-span-2 space-y-6">
            <TokenInfo
              token={token}
              graduatedToPancakeSwap={graduatedToPancakeSwap}
            />
            {token.projectRaise && raiseCompleted && (
              <VestingTimeline
                vestingSchedule={token.projectRaise.vestingSchedule}
                tokenAddress={token.contractAddress}
                vestingData={token.projectRaise.vestingData}
              />
            )}
            <TradeHistory trades={recentTrades} />
          </div>

          {/* Right Column - Contribute or Trading Interface */}
          <div className="lg:col-span-1">
            {shouldShowContribute ? (
              <ContributeInterface token={token} />
            ) : shouldShowTrading ? (
              <TradingInterface
                token={token}
                pancakeSwapPrice={pancakeSwapStats?.priceInUSD}
                pancakeSwapPriceInBNB={pancakeSwapStats?.priceInBNB}
                graduatedToPancakeSwap={graduatedToPancakeSwap}
              />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
