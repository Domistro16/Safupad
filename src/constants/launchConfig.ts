/**
 * Project Raise Configuration for BSC
 * Based on official tokenomics and platform specifications
 */

export const PROJECT_RAISE_CONFIG = {
    // Raise Parameters
    minRaiseBNB: 5_000_000, // 5M BNB minimum
    maxRaiseBNB: 20_000_000, // 20M BNB maximum
    maxContributionBNB: 50_000, // Max 50k BNB per contributor

    // Liquidity & Release
    liquidityPercent: 20, // 20% of amount raised
    liquidityTotalSupplyPercent: 10, // + 10% of total supply
    initialRelease: 60, // 60% released at raise end
    vestingMonths: 6, // Rest vested over 6 months

    // Token Distribution
    communityPercent: 20,

    // Timing
    raiseWindowHours: 72, // 72 hour raise window
    emergencyTimelockHours: 48,

    // Market Cap Condition
    marketCapMonths: 3, // 3 months below starting cap triggers community decision

    // Fee Structure (from LP)
    fees: {
        founder: 70, // 70% to founder
        infoFi: 20, // 20% to InfoFi
        platform: 10, // 10% to platform
    },
} as const;

export const BONDING_CURVE_CONFIG = {
    maxMarketCapBNB: 1_000_000, // 1M BNB cap for bonding curve

    // Trading Fees (2% total)
    tradingFees: {
        creator: 1.0, // 1% to creator
        infoFi: 0.6, // 0.6% to InfoFi
        platform: 0.1, // 0.1% to platform
        eduFi: 0.3, // 0.3% to EduFi incentives
    },

    // At Bonding (funds distribution)
    bondingDistribution: {
        creator: 70, // 70%
        infoFi: 20, // 20%
        platform: 10, // 10%
    },

    // At Graduation
    graduationFee: 1, // 1% of bonding curve pool withdrawn
    graduationSplit: {
        creator: 50, // 50%
        platform: 50, // 50%
    },
} as const;
