import { SafuPadSDK } from "@/safupad/sdk";
import { Token, Trade } from "@/types/token";
import type { CardData } from "@/data/cards";
import { ethers } from "ethers";

// ABI for Bonding Curve Contract (needed for pool data in Instant Launch)
export const bondingCurveAbi = [
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
                name: "monForPancakeSwap",
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

/**
 * Fetches comprehensive data for a single token using the SDK
 */
export async function fetchTokenData(sdk: SafuPadSDK, id: string): Promise<Token | null> {
    try {
        // 1. Fetch basic token info
        const tokenInfo = await sdk.tokenFactory.getTokenInfo(id);
        const tokenMeta = tokenInfo.metadata;
        const tokenName = tokenInfo.name || "Unknown Token";
        const tokenSymbol = tokenInfo.symbol || "???";
        const logoURI =
            tokenMeta.logoURI ||
            "https://images.unsplash.com/photo-1614064641938-3bbee52942c1?w=400&h=400&fit=crop";

        // 2. Fetch launch info (includes raise details and graduation status)
        const launchInfo = await sdk.launchpad.getLaunchInfoWithUSD(id);
        const launchInfoBasic = await sdk.launchpad.getLaunchInfo(id);

        const graduatedToPancake = Boolean(launchInfoBasic.graduatedToPancakeSwap);
        const raiseCompleted = Boolean(launchInfo.raiseCompleted);

        // 3. Determine launch type
        const launchTypeNum = Number(launchInfo.launchType);
        const isProjectRaise = launchTypeNum === 0;
        const isInstant = !isProjectRaise;

        // 4. Fetch pool info (BondingDex)
        const poolInfo = await sdk.bondingDex.getPoolInfo(id);

        // 5. Fetch specific data based on launch type
        let actualBnbInPool = 0;
        let virtualLiquidityUSD = 0;
        let pool: any = null;

        if (isInstant) {
            // Instant Launch specific: Fetch from contract directly if needed for fuller details
            const bond = sdk.bondingDex.getContract();
            const provider = new ethers.JsonRpcProvider("https://bsc-dataseed.binance.org/");
            const bonding = new ethers.Contract(await bond.getAddress(), bondingCurveAbi, provider);

            try {
                pool = await bonding.pools(id);
                const totalBnb =
                    Number(ethers.formatEther(pool.bnbReserve)) +
                    Number(ethers.formatEther(pool.virtualBnbReserve));
                actualBnbInPool = totalBnb;

                const totalBnbWei = BigInt(pool.bnbReserve) + BigInt(pool.virtualBnbReserve);
                const usdValue = await sdk.priceOracle.bnbToUSD(totalBnbWei);
                virtualLiquidityUSD = Number(ethers.formatEther(usdValue));
            } catch (e) {
                console.warn(`Could not fetch contract pool data for ${id}`, e);
            }
        }

        // Project Raise specific: Vesting and Claimable
        let vestingData = null;
        let claimableAmounts = { claimableTokens: 0, claimableFunds: 0 };
        if (isProjectRaise) {
            try {
                vestingData = await sdk.launchpad.getLaunchVesting(id);
            } catch (err) {
                console.warn(`Could not fetch vesting info for ${id}:`, err);
            }

            try {
                const claimable = await sdk.launchpad.getClaimableAmounts(id);
                claimableAmounts = {
                    claimableTokens: Number(ethers.formatEther(claimable.claimableTokens)),
                    claimableFunds: Number(ethers.formatEther(claimable.claimableFunds)),
                };
            } catch (err) {
                console.warn(`Could not fetch claimable amounts for ${id}:`, err);
            }
        }

        // Instant Launch specific: Creator Fees
        let creatorFeeInfo = null;
        if (isInstant) {
            try {
                const feeInfo = await sdk.bondingDex.getCreatorFeeInfo(id);
                creatorFeeInfo = {
                    accumulatedFees: Number(ethers.formatEther(await sdk.priceOracle.bnbToUSD(feeInfo.accumulatedFees))),
                    lastClaimTime: feeInfo.lastClaimTime && Number(feeInfo.lastClaimTime) > 0
                        ? new Date(Number(feeInfo.lastClaimTime) * 1000)
                        : null,
                    graduationMarketCap: Number(ethers.formatEther(feeInfo.graduationMarketCap)),
                    currentMarketCap: Number(ethers.formatEther(await sdk.priceOracle.bnbToUSD(feeInfo.currentMarketCap))),
                    bnbInPool: Number(ethers.formatEther(feeInfo.bnbInPool)),
                    canClaim: Boolean(feeInfo.canClaim),
                }
            } catch (err) {
                // console.warn(`Could not fetch creator fee info for ${id}:`, err);
            }
        }


        // 6. Parse common numeric values
        const totalRaisedUSD = Number(ethers.formatEther(launchInfo.totalRaisedUSD));
        const raiseMaxUSD = Number(ethers.formatEther(launchInfo.raiseTargetUSD));
        const marketCapUSD = Number(ethers.formatEther(poolInfo.marketCapUSD));
        const currentPrice = Number(ethers.formatEther(await sdk.priceOracle.bnbToUSD(poolInfo.currentPrice)));
        const graduationProgress = Number(poolInfo.graduationProgress);
        const graduated = Boolean(poolInfo.graduated);

        // Calculate liquidity pool value
        let liquidityPool: number = 0;
        if (isInstant && pool) {
            const virtual = pool.virtualBnbReserve;
            const liqVal = await sdk.priceOracle.bnbToUSD(BigInt(poolInfo.bnbReserve) + BigInt(virtual));
            liquidityPool = Number(ethers.formatEther(liqVal));
        } else {
            const liqVal = await sdk.priceOracle.bnbToUSD(BigInt(poolInfo.bnbReserve));
            liquidityPool = Number(ethers.formatEther(liqVal));
        }


        // 7. Get volume data (Instant Launch primarily)
        let volume24h = 0;
        let transactionCount = 0;
        let holderCount = 0;
        let priceChange24h = 0;

        if (isInstant) {
            try {
                const totalVolumeData = await sdk.bondingDex.getTotalVolume(id);
                transactionCount = totalVolumeData.buyCount + totalVolumeData.sellCount;
                const totalVolumeUSD = await sdk.priceOracle.bnbToUSD(totalVolumeData.totalVolumeBNB);
                volume24h = Number(ethers.formatEther(totalVolumeUSD));

                const priceChangeData = await sdk.bondingDex.get24hPriceChange(id);
                priceChange24h = priceChangeData.priceChangePercent;

                holderCount = await sdk.bondingDex.getEstimatedHolderCount(id);

            } catch (e) {
                console.warn(`Could not fetch volume/stats for ${id}`, e);
            }
        }


        // 8. Construct Token object
        const tokenData: Token = {
            id,
            name: tokenName,
            symbol: tokenSymbol,
            description: tokenMeta.description || "Launched token on SafuPad",
            image: logoURI,
            contractAddress: id,
            creatorAddress: launchInfo.founder,
            launchType: isProjectRaise ? "project-raise" : "instant-launch",
            status: graduated ? "completed" : (isProjectRaise && !raiseCompleted ? "active" : "active"), // customize status logic as needed
            createdAt: new Date(), // This might need to come from launch info if available

            // Financial
            totalSupply: Number(ethers.formatEther(tokenInfo.totalSupply)),
            currentPrice,
            marketCap: marketCapUSD,
            liquidityPool,
            volume24h,
            priceChange24h,

            // Project Raise Specific
            projectRaise: isProjectRaise
                ? {
                    config: {
                        type: "project-raise",
                        targetAmount: raiseMaxUSD || 0,
                        raiseWindow: 24 * 60 * 60 * 1000, // hardcoded defaults from reference
                        ownerAllocation: 20,
                        immediateUnlock: 10,
                        vestingMonths: 6,
                        liquidityAllocation: 10,
                        liquidityCap: 100000,
                        graduationThreshold: 15,
                        tradingFee: { platform: 0.1, academy: 0.3, infofiPlatform: 0.6 },
                    },
                    raisedAmount: totalRaisedUSD,
                    targetAmount: raiseMaxUSD || 0,
                    startTime: new Date(Date.now() - 60_000), // placeholder if not in launchInfo
                    endTime: launchInfo.raiseDeadline ? new Date(Number(launchInfo.raiseDeadline) * 1000) : new Date(Date.now() + 86400000),
                    vestingSchedule: {
                        totalAmount: vestingData ? Number(ethers.formatEther(vestingData.founderTokens)) : 0,
                        releasedAmount: vestingData ? Number(ethers.formatEther(vestingData.founderTokensClaimed)) : 0,
                        schedule: [],
                    },
                    approved: true,
                    // graduationProgress // Added to type if needed, but not in base Token type
                }
                : undefined,

            // Instant Launch Specific
            instantLaunch: isInstant
                ? {
                    config: {
                        type: "instant-launch",
                        tradingFee: { platform: 0.1, creator: 1.0, infofiPlatform: 0.9 },
                        graduationThreshold: 15,
                        claimCooldown: 86_400_000,
                        marketCapRequirement: true,
                        accrualPeriod: 604_800_000,
                    },
                    cumulativeBuys: Number(poolInfo.bnbReserve), // This is a proxy, strictly should be cumulative
                    creatorFees: creatorFeeInfo?.accumulatedFees || 0,
                    lastClaimTime: creatorFeeInfo?.lastClaimTime || null,
                    claimableAmount: 0, // Placeholder
                    canClaim: creatorFeeInfo?.canClaim || false,
                }
                : undefined,

            // Graduation
            graduated,
            graduatedToPancakeSwap: graduatedToPancake,
            graduationDate: graduated ? new Date() : undefined,
            startingMarketCap: 0,

            // Social
            twitter: tokenMeta.twitter,
            telegram: tokenMeta.telegram,
            website: tokenMeta.website,

            // Stats
            holders: holderCount,
            transactions: transactionCount,
        };

        return tokenData;

    } catch (error) {
        console.error(`Error fetching data for token ${id}:`, error);
        return null;
    }
}

/**
 * Fetches all token addresses and then their data
 */
export async function fetchAllTokens(sdk: SafuPadSDK): Promise<Token[]> {
    try {
        // Fetch from both Launchpad (Project Raises) and BondingDex (Instant Launches)
        const [launchpadTokens, instantTokens] = await Promise.all([
            sdk.launchpad.getAllLaunches().catch(e => { console.warn("Err launchpad", e); return []; }),
            sdk.bondingDex.getActiveTokens().catch(e => { console.warn("Err bonding", e); return []; })
        ]);

        // Merge and deduplicate addresses (normalize to lowercase for comparison)
        const allAddresses = Array.from(new Set([
            ...launchpadTokens.map(a => a.toLowerCase()),
            ...instantTokens.map(a => a.toLowerCase())
        ]));

        // Reverse to likely get newest first (approximate)
        const reversed = [...allAddresses].reverse();

        // Fetch data for all
        const tokenPromises = reversed.map(addr => fetchTokenData(sdk, addr));
        const results = await Promise.all(tokenPromises);

        return results.filter((t): t is Token => t !== null);
    } catch (error) {
        console.error("Error fetching all tokens:", error);
        return [];
    }
}

/**
 * Maps a Token object to CardData for display
 */
export function mapTokenToCardData(token: Token): CardData {
    const isProject = token.launchType === "project-raise";

    // Determine status string
    let status: "live" | "upcoming" | "ended" = "live";
    if (token.graduated) status = "ended";
    else if (token.status === "pending") status = "upcoming";

    // Format raised amount
    let raisedStr = "0 BNB";
    let progress = 0;
    let subStat1 = "";
    let subStat2 = "";

    if (isProject && token.projectRaise) {
        // Need BNB values for display usually, but token has USD numbers stored in some fields? 
        // let's assume safely formatted strings or re-convert if needed.
        // The fetchTokenData converts USD fields to number.
        // For the card we might want succinct display.

        // Note: In fetchTokenData we stored USD values for raised/target.
        // Let's format nicely.
        raisedStr = `$${(token.projectRaise.raisedAmount).toLocaleString()}`;

        const target = token.projectRaise.targetAmount || 1;
        progress = Math.min(100, (token.projectRaise.raisedAmount / target) * 100);

        subStat1 = `Target: $${target.toLocaleString()}`;

        // Time remaining
        const now = Date.now();
        const end = token.projectRaise.endTime.getTime();
        const diff = end - now;
        if (diff > 0) {
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const days = Math.floor(hours / 24);
            subStat2 = days > 0 ? `${days}d left` : `${hours}h left`;
        } else {
            subStat2 = "Ended";
        }

    } else if (token.instantLaunch) {
        // Instant launch progress is usually based on graduation threshold (15 BNB)
        // fetchTokenData puts bnbReserve into cumulativeBuys (proxy)
        // Actually strictly we want the pool reserve for graduation progress.
        // Let's assume cumulativeBuys in Token type holds the relevant metric or we recalculate.
        // poolInfo.bnbReserve was used.

        const bnbReserve = token.instantLaunch.cumulativeBuys; // mapped from poolInfo.bnbReserve in fetchTokenData
        raisedStr = `${bnbReserve.toFixed(2)} BNB`;
        progress = Math.min(100, (bnbReserve / 15) * 100);

        subStat1 = "Cap: 15 BNB";
        subStat2 = token.graduated ? "Graduated" : "Trading";
    }

    return {
        id: token.id,
        type: isProject ? "project" : "instant",
        status,
        icon: token.image || (isProject ? "🚀" : "⚡"), // Fallback icon
        title: token.name,
        sub: `$${token.symbol}`,
        pills: [
            [isProject ? "Project Raise" : "Instant", isProject ? "safu-pill-project" : "safu-pill-instant"],
            [status === "live" ? "Live" : status, `safu-pill-${status}`],
        ],
        desc: token.description,
        creator: `${token.creatorAddress.slice(0, 6)}...${token.creatorAddress.slice(-4)}`,
        raised: raisedStr,
        progress,
        substats: [subStat1, subStat2],
    };
}
