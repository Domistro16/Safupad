import { ethers } from 'ethers';

/**
 * Network names supported by the SDK
 */
type NetworkName = 'bsc' | 'bscTestnet' | 'localhost';
/**
 * Launch type enum
 */
declare enum LaunchType {
    PROJECT_RAISE = 0,
    INSTANT_LAUNCH = 1
}
/**
 * Network configuration
 */
interface NetworkConfig {
    name: string;
    chainId: number;
    rpcUrl: string;
    alchemyRpcUrlTemplate?: string;
    explorerUrl: string;
    subgraphUrl?: string;
    nativeCurrency: {
        name: string;
        symbol: string;
        decimals: number;
    };
    contracts: {
        launchpadManager: string;
        bondingCurveDEX: string;
        tokenFactory: string;
        priceOracle: string;
        lpFeeHarvester: string;
        pancakeRouter: string;
        pancakeFactory: string;
    };
}
/**
 * SDK configuration
 */
interface SDKConfig {
    network?: NetworkName | NetworkConfig;
    provider?: string | ethers.Provider | any;
    privateKey?: string;
    gasLimit?: bigint;
    gasPrice?: bigint;
    alchemyApiKey?: string;
    subgraphUrl?: string;
}
/**
 * Token metadata structure
 */
interface TokenMetadata {
    logoURI: string;
    description: string;
    website: string;
    twitter: string;
    telegram: string;
    discord: string;
}
/**
 * Launch creation parameters
 * ✅ UPDATED: Removed projectInfoFiWallet, changed to BNB amounts (BSC)
 * ✅ UPDATED: Added teamInfo for founder and team member details
 */
interface CreateLaunchParams {
    name: string;
    symbol: string;
    totalSupply: number;
    raiseTargetBNB: string;
    raiseMaxBNB: string;
    vestingDuration: number;
    metadata: TokenMetadata;
    burnLP: boolean;
    teamInfo: LaunchTeamInfo;
    vanitySalt?: string;
}
/**
 * Instant launch creation parameters
 */
interface CreateInstantLaunchParams {
    name: string;
    symbol: string;
    totalSupply: number;
    metadata: TokenMetadata;
    initialBuyBNB: string;
    burnLP: boolean;
    vanitySalt?: string;
}
/**
 * Launch information
 * ✅ UPDATED: Removed projectInfoFiWallet
 */
interface LaunchInfo {
    founder: string;
    raiseTarget: bigint;
    raiseMax: bigint;
    totalRaised: bigint;
    raiseDeadline: bigint;
    raiseCompleted: boolean;
    graduatedToPancakeSwap: boolean;
    raisedFundsVesting: bigint;
    raisedFundsClaimed: bigint;
    launchType: LaunchType;
    burnLP: boolean;
}
/**
 * Launch information with USD values
 * ✅ UPDATED: Removed projectInfoFiWallet, changed to BNB (BSC)
 */
interface LaunchInfoWithUSD {
    founder: string;
    raiseTargetBNB: bigint;
    raiseTargetUSD: bigint;
    raiseMaxBNB: bigint;
    raiseMaxUSD: bigint;
    totalRaisedBNB: bigint;
    totalRaisedUSD: bigint;
    raiseDeadline: bigint;
    raiseCompleted: boolean;
    launchType: LaunchType;
    burnLP: boolean;
}
/**
 * Pool information from bonding curve
 * ✅ UPDATED: Changed to BNB (BSC)
 */
interface PoolInfo {
    marketCapBNB: bigint;
    marketCapUSD: bigint;
    bnbReserve: bigint;
    tokenReserve: bigint;
    reservedTokens: bigint;
    currentPrice: bigint;
    priceMultiplier: bigint;
    graduationProgress: bigint;
    graduated: boolean;
}
/**
 * Fee information
 */
interface FeeInfo {
    currentFeeRate: bigint;
    finalFeeRate: bigint;
    blocksSinceLaunch: bigint;
    blocksUntilNextTier: bigint;
    feeStage: string;
}
/**
 * Buy/Sell quote
 */
interface Quote {
    tokensOut: bigint;
    pricePerToken: bigint;
}
/**
 * Post-graduation statistics
 */
interface PostGraduationStats {
    totalTokensSold: bigint;
    totalLiquidityAdded: bigint;
    lpTokensGenerated: bigint;
}
/**
 * Creator fee information
 * ✅ UPDATED: Changed to BNB (BSC)
 */
interface CreatorFeeInfo {
    accumulatedFees: bigint;
    lastClaimTime: bigint;
    graduationMarketCap: bigint;
    currentMarketCap: bigint;
    bnbInPool: bigint;
    canClaim: boolean;
}
/**
 * LP lock information
 * Note: projectInfoFi is still used in LPFeeHarvester contract
 */
interface LPLockInfo {
    lpToken: string;
    creator: string;
    projectInfoFi: string;
    lpAmount: bigint;
    initialLPAmount: bigint;
    lockTime: bigint;
    unlockTime: bigint;
    active: boolean;
    totalFeesHarvested: bigint;
    harvestCount: bigint;
    timeUntilUnlock: bigint;
    estimatedValue: bigint;
    lastHarvestTime: bigint;
}
/**
 * Harvest statistics
 * ✅ UPDATED: Changed to BNB (BSC)
 */
interface HarvestStats {
    bnbAmount: bigint;
    token0Amount: bigint;
    token1Amount: bigint;
    timestamp: bigint;
    lpBurned: bigint;
}
/**
 * Platform statistics
 */
interface PlatformStats {
    totalValueLocked: bigint;
    totalFeesDistributed: bigint;
    totalHarvests: bigint;
    activeLocksCount: bigint;
}
/**
 * Transaction options
 */
interface TxOptions {
    gasLimit?: bigint;
    gasPrice?: bigint;
    value?: bigint;
    nonce?: number;
}
/**
 * Event filter options
 */
interface EventFilterOptions {
    fromBlock?: number | string;
    toBlock?: number | string;
}
/**
 * Formatted launch information (for display)
 */
interface FormattedLaunchInfo {
    founder: string;
    raiseTarget: string;
    raiseMax: string;
    totalRaised: string;
    raiseDeadline: Date;
    raiseCompleted: boolean;
    graduatedToPancakeSwap: boolean;
    progressPercent: number;
    launchType: 'PROJECT_RAISE' | 'INSTANT_LAUNCH';
    burnLP: boolean;
}
/**
 * Formatted pool information (for display)
 * ✅ UPDATED: Changed to BNB (BSC)
 */
interface FormattedPoolInfo {
    marketCapUSD: string;
    marketCapBNB: string;
    bnbReserve: string;
    tokenReserve: string;
    currentPrice: string;
    priceMultiplier: string;
    graduationProgress: number;
    graduated: boolean;
    currentFee: string;
    feeStage: string;
}
/**
 * Token information
 */
interface TokenInfo {
    address: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: bigint;
    metadata: TokenMetadata;
}
/**
 * Contribution information
 */
interface ContributionInfo {
    amount: bigint;
    claimed: boolean;
}
/**
 * Founder information for a launch
 */
interface FounderInfo {
    name: string;
    walletAddress: string;
    bio: string;
}
/**
 * Team member information
 */
interface TeamMember {
    name: string;
    role: string;
    twitter: string;
    linkedin: string;
}
/**
 * Launch team information (founder + up to 2 team members)
 */
interface LaunchTeamInfo {
    founder: FounderInfo;
    teamMember1: TeamMember;
    teamMember2: TeamMember;
    teamMemberCount: number;
}
/**
 * Claimable amounts
 */
interface ClaimableAmounts {
    claimableTokens: bigint;
    claimableFunds: bigint;
}
/**
 * Transaction result
 */
interface TxResult {
    hash: string;
    wait: () => Promise<ethers.TransactionReceipt | null>;
}
/**
 * Error types
 */
declare class SafuPadError extends Error {
    code?: string | undefined;
    details?: any;
    constructor(message: string, code?: string | undefined, details?: any);
}
declare class NetworkError extends SafuPadError {
    constructor(message: string, details?: any);
}
declare class ContractError extends SafuPadError {
    constructor(message: string, details?: any);
}
declare class ValidationError extends SafuPadError {
    constructor(message: string, details?: any);
}

/**
 * The Graph API response types based on SafuPad subgraph schema
 */
interface GraphToken {
    id: string;
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
    creator: string;
    createdAt: string;
    createdAtBlock: string;
    logoURI?: string;
    description?: string;
    website?: string;
    twitter?: string;
    telegram?: string;
    discord?: string;
    launch?: GraphLaunch;
    pool?: GraphPool;
    totalVolume: string;
    totalTrades: string;
}
interface GraphLaunch {
    id: string;
    token: GraphToken;
    founder: string;
    launchType: 'PROJECT_RAISE' | 'INSTANT_LAUNCH';
    totalSupply: string;
    raiseTarget?: string;
    raiseMax?: string;
    raiseDeadline?: string;
    totalRaised: string;
    raiseCompleted: boolean;
    liquidityAdded: boolean;
    graduatedToPancakeSwap: boolean;
    burnLP: boolean;
    vestingDuration?: string;
    vestingStartTime?: string;
    founderTokens?: string;
    founderTokensClaimed?: string;
    vestedTokens: string;
    vestedTokensClaimed: string;
    startMarketCap: string;
    monthlyMarketCaps: string[];
    consecutiveMonthsBelowStart: string;
    communityControlTriggered: boolean;
    liquidityBNB?: string;
    liquidityTokens?: string;
    raisedFundsVesting?: string;
    raisedFundsClaimed?: string;
    createdAt: string;
    createdAtBlock: string;
    contributions?: GraphContribution[];
}
interface GraphPool {
    id: string;
    token: GraphToken;
    creator: string;
    bnbReserve: string;
    tokenReserve: string;
    reservedTokens: string;
    virtualBnbReserve: string;
    marketCap: string;
    graduationMarketCap: string;
    currentPrice: string;
    active: boolean;
    graduated: boolean;
    burnLP: boolean;
    lpToken?: string;
    bnbForPancakeSwap: string;
    launchBlock: string;
    graduationBnbThreshold: string;
    totalVolume: string;
    totalBuys: string;
    totalSells: string;
    createdAt: string;
    graduatedAt?: string;
    trades?: GraphTrade[];
}
interface GraphTrade {
    id: string;
    pool: GraphPool;
    token: GraphToken;
    trader: string;
    isBuy: boolean;
    bnbAmount: string;
    tokenAmount: string;
    price: string;
    feeRate: string;
    totalFee: string;
    timestamp: string;
    blockNumber: string;
    transactionHash: string;
}
interface GraphContribution {
    id: string;
    launch: GraphLaunch;
    contributor: string;
    amount: string;
    claimed: boolean;
    timestamp: string;
    transactionHash: string;
}
interface GraphTokenHolder {
    id: string;
    token: GraphToken;
    holder: string;
    balance: string;
    totalBought: string;
    totalSold: string;
    firstBuyTimestamp?: string;
    lastActivityTimestamp?: string;
}
interface GraphCreatorFees {
    id: string;
    token: GraphToken;
    creator: string;
    accumulatedFees: string;
    totalClaimed: string;
    lastClaimTime: string;
    claimCount: string;
}
interface GraphPlatformStats {
    id: string;
    totalLaunches: string;
    totalProjectRaises: string;
    totalInstantLaunches: string;
    totalGraduated: string;
    totalVolume: string;
    totalFees: string;
    totalRaised: string;
    lastUpdated: string;
}
interface GraphDailyStats {
    id: string;
    date: string;
    launches: string;
    volume: string;
    fees: string;
    trades: string;
    uniqueTraders: string;
}
/**
 * Graph query response wrapper
 */
interface GraphResponse<T> {
    data?: T;
    errors?: Array<{
        message: string;
        locations?: Array<{
            line: number;
            column: number;
        }>;
        path?: string[];
    }>;
}
/**
 * Pagination parameters
 */
interface PaginationParams {
    first?: number;
    skip?: number;
    orderBy?: string;
    orderDirection?: 'asc' | 'desc';
}
/**
 * Filter parameters for launches
 */
interface LaunchFilters {
    launchType?: 'PROJECT_RAISE' | 'INSTANT_LAUNCH';
    founder?: string;
    raiseCompleted?: boolean;
    graduatedToPancakeSwap?: boolean;
}
/**
 * Filter parameters for trades
 */
interface TradeFilters {
    token?: string;
    trader?: string;
    isBuy?: boolean;
}
/**
 * Filter parameters for pools
 */
interface PoolFilters {
    graduated?: boolean;
    active?: boolean;
}

/**
 * GraphQL client for The Graph API
 */
declare class GraphQLClient {
    private endpoint;
    constructor(endpoint: string);
    /**
     * Execute a GraphQL query
     */
    query<T = any>(query: string, variables?: Record<string, any>): Promise<GraphResponse<T>>;
    /**
     * Update the endpoint URL
     */
    setEndpoint(endpoint: string): void;
    /**
     * Get current endpoint
     */
    getEndpoint(): string;
}

/**
 * SafuPad subgraph client
 * Provides methods to query indexed data from The Graph
 */
declare class SafuPadGraph {
    private client;
    constructor(subgraphUrl: string);
    /**
     * Get token by address
     */
    getToken(tokenAddress: string): Promise<GraphToken | null>;
    /**
     * Get launch by token address
     */
    getLaunch(tokenAddress: string): Promise<GraphLaunch | null>;
    /**
     * Get all launches with optional filters and pagination
     */
    getLaunches(filters?: LaunchFilters, pagination?: PaginationParams): Promise<GraphLaunch[]>;
    /**
     * Get pool by token address
     */
    getPool(tokenAddress: string): Promise<GraphPool | null>;
    /**
     * Get all pools with optional filters and pagination
     */
    getPools(filters?: PoolFilters, pagination?: PaginationParams): Promise<GraphPool[]>;
    /**
     * Get trades with optional filters and pagination
     */
    getTrades(filters?: TradeFilters, pagination?: PaginationParams): Promise<GraphTrade[]>;
    /**
     * Get contributions for a launch
     */
    getContributions(launchId: string, pagination?: PaginationParams): Promise<GraphContribution[]>;
    /**
     * Get contribution for a specific contributor
     */
    getContribution(launchId: string, contributor: string): Promise<GraphContribution | null>;
    /**
     * Get token holders
     */
    getTokenHolders(tokenId: string, pagination?: PaginationParams): Promise<GraphTokenHolder[]>;
    /**
     * Get creator fees
     */
    getCreatorFees(tokenId: string, creator: string): Promise<GraphCreatorFees | null>;
    /**
     * Get platform statistics
     */
    getPlatformStats(): Promise<GraphPlatformStats | null>;
    /**
     * Get daily statistics
     */
    getDailyStats(days?: number): Promise<GraphDailyStats[]>;
    /**
     * Search tokens by name or symbol
     */
    searchTokens(searchText: string, limit?: number): Promise<GraphToken[]>;
    /**
     * Get user's trading history
     */
    getUserTrades(trader: string, pagination?: PaginationParams): Promise<GraphTrade[]>;
    /**
     * Get user's contributions
     */
    getUserContributions(contributor: string, pagination?: PaginationParams): Promise<GraphContribution[]>;
    /**
     * Get trending tokens
     */
    getTrendingTokens(limit?: number): Promise<GraphToken[]>;
    /**
     * Get active pools (not graduated)
     */
    getActivePools(pagination?: PaginationParams): Promise<GraphPool[]>;
    /**
     * Get graduated pools
     */
    getGraduatedPools(pagination?: PaginationParams): Promise<GraphPool[]>;
    /**
     * Get active launches (not graduated)
     */
    getActiveLaunches(pagination?: PaginationParams): Promise<GraphLaunch[]>;
    /**
     * Get graduated launches
     */
    getGraduatedLaunches(pagination?: PaginationParams): Promise<GraphLaunch[]>;
    /**
     * Get Project Raise launches
     */
    getProjectRaises(pagination?: PaginationParams): Promise<GraphLaunch[]>;
    /**
     * Get Instant Launch tokens
     */
    getInstantLaunches(pagination?: PaginationParams): Promise<GraphLaunch[]>;
    /**
     * Update subgraph endpoint
     */
    setSubgraphUrl(url: string): void;
    /**
     * Get current subgraph endpoint
     */
    getSubgraphUrl(): string;
}

/**
 * Base contract class with common functionality
 */
declare abstract class BaseContract {
    protected contract: ethers.Contract;
    protected provider: ethers.Provider;
    protected eventQueryProvider: ethers.Provider;
    protected signer?: ethers.Signer;
    protected address: string;
    protected graph?: SafuPadGraph;
    constructor(address: string, abi: any[], provider: ethers.Provider, signer?: ethers.Signer, eventQueryProvider?: ethers.Provider, graph?: SafuPadGraph);
    /**
     * Get contract address
     */
    getAddress(): string;
    /**
     * Get provider
     */
    getProvider(): ethers.Provider;
    /**
     * Get signer
     */
    getSigner(): ethers.Signer | undefined;
    /**
     * Update signer
     */
    updateSigner(signer: ethers.Signer): void;
    /**
     * Update graph client
     */
    updateGraph(graph: SafuPadGraph): void;
    /**
     * Check if The Graph client is available
     */
    protected hasGraphSupport(): boolean;
    /**
     * Require signer to be available
     */
    protected requireSigner(): void;
    /**
     * Validate Ethereum address
     */
    protected validateAddress(address: string): void;
    /**
     * Validate amount
     */
    protected validateAmount(amount: bigint): void;
    /**
     * Build transaction options
     */
    protected buildTxOptions(options?: TxOptions, defaultGasLimit?: bigint): TxOptions;
    /**
     * Handle contract errors
     */
    protected handleError(error: any): never;
    /**
     * Call contract function safely
     */
    protected callSafely<T>(fn: () => Promise<T>, errorMessage?: string): Promise<T>;
    /**
     * Add event listener
     */
    protected addEventListener(eventName: string, callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Remove all event listeners
     */
    removeAllListeners(eventName?: string): void;
    /**
     * Get past events
     * Uses eventQueryProvider (Alchemy if configured) for better performance
     */
    getPastEvents(eventName: string, filter?: EventFilterOptions): Promise<ethers.EventLog[]>;
    /**
     * Estimate gas for a contract call
     */
    protected estimateGas(functionName: string, args: any[], overrides?: TxOptions): Promise<bigint>;
    /**
     * Check if contract is deployed
     */
    isDeployed(): Promise<boolean>;
    /**
     * Get contract instance (for advanced usage)
     */
    getContract(): ethers.Contract;
}

/**
 * Launch vesting information
 */
interface LaunchVesting {
    startMarketCap: bigint;
    vestingDuration: bigint;
    vestingStartTime: bigint;
    founderTokens: bigint;
    founderTokensClaimed: bigint;
}
/**
 * LaunchpadManager contract wrapper (LaunchpadManagerV3 - BNBad)
 *
 * Supports two launch types:
 * 1. PROJECT_RAISE: Contribution-based fundraising (72-hour / 3-day raise period)
 *    - Users contribute BNB (BNBad native token) during raise period
 *    - Tokens distributed proportionally after raise completes
 *    - Does NOT use BondingCurveDEX
 *    - Graduates directly to PancakeSwap after successful raise
 *    - Token allocation: 60% founder (immediate), 20% contributors, 10% liquidity, 10% vested (community control)
 *
 * 2. INSTANT_LAUNCH: Bonding curve trading (via BondingCurveDEX)
 *    - Creates pool in BondingCurveDEX for immediate trading
 *    - Uses bonding curve AMM formula
 *    - Graduates to PancakeSwap at market cap threshold
 *
 * ✅ BNBad Migration: All amounts use BNB (BNBad) instead of BNB
 * ✅ Community Control: 10% tokens vest over time, with community control trigger if market cap stays low
 */
declare class LaunchpadManager extends BaseContract {
    constructor(address: string, provider: ethers.Provider, signer?: ethers.Signer, eventQueryProvider?: ethers.Provider, graph?: any);
    /**
     * Create a new PROJECT_RAISE launch
     *
     * PROJECT_RAISE launches:
     * - 72-hour (3-day) contribution period
     * - Tokens distributed after raise completes
     * - Does NOT use BondingCurveDEX
     * - Token allocation: 60% founder (immediate), 20% contributors, 10% PancakeSwap liquidity, 10% vested (community control)
     * - 20% of raised BNB goes to liquidity
     * - Vesting duration is fixed at 180 days (contract overrides parameter)
     *
     * ✅ Uses BNB (BNBad) for all amounts
     * ✅ Includes team information (founder + up to 2 team members)
     * ⚠️  NOTE: vanitySalt parameter is ignored - vanity addresses not supported in current contract version
     */
    createLaunch(params: CreateLaunchParams, options?: TxOptions): Promise<TxResult>;
    /**
     * Create a new INSTANT_LAUNCH
     *
     * INSTANT_LAUNCH:
     * - Creates pool in BondingCurveDEX immediately
     * - Bonding curve trading with dynamic fees
     * - Graduates to PancakeSwap at market cap threshold
     * - Must send BNB with transaction for initial buy
     *
     * ✅ Uses BNB (BNBad) for all amounts
     * ⚠️  NOTE: vanitySalt parameter is ignored - vanity addresses not supported in current contract version
     */
    createInstantLaunch(params: CreateInstantLaunchParams, options?: TxOptions): Promise<TxResult>;
    /**
     * Contribute BNB to a PROJECT_RAISE launch
     *
     * Note: Only works for PROJECT_RAISE tokens (not INSTANT_LAUNCH)
     * INSTANT_LAUNCH tokens trade on bonding curve instead via BondingCurveDEX
     *
     * ✅ Uses BNB (BNBad) for contribution
     */
    contribute(tokenAddress: string, BNBAmount: string, options?: TxOptions): Promise<TxResult>;
    /**
     * Claim founder tokens
     *
     * For PROJECT_RAISE: Founder gets 60% of tokens immediately (no vesting)
     * Works for both PROJECT_RAISE and INSTANT_LAUNCH
     */
    claimFounderTokens(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * Claim raised funds (BNB from raise, 80% available immediately)
     *
     * Note: Only for PROJECT_RAISE tokens
     * INSTANT_LAUNCH tokens don't have raised funds to claim
     */
    claimRaisedFunds(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * Graduate pool to PancakeSwap
     *
     * For PROJECT_RAISE:
     * - Adds liquidity to PancakeSwap with 20% of raised BNB
     * - Uses 10% of tokens reserved for PancakeSwap liquidity
     *
     * For INSTANT_LAUNCH:
     * - Withdraws graduated pool from BondingCurveDEX
     * - Adds liquidity with BNB + 20% of tokens
     */
    graduateToPancakeSwap(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * Handle post-graduation selling for PROJECT_RAISE tokens
     *
     * Allows users to sell their tokens after a PROJECT_RAISE has graduated to PancakeSwap.
     * The function:
     * - Takes 1% platform fee on tokens
     * - Swaps half the tokens for BNB
     * - Adds the other half + BNB back to liquidity pool
     * - Burns the LP tokens
     * - Pays seller 70% of the BNB from swap
     * - Remaining 30% goes back to liquidity
     *
     * Note: Only works for PROJECT_RAISE tokens that have graduated
     *
     * @param tokenAddress Address of the PROJECT_RAISE token
     * @param tokenAmount Amount of tokens to sell (in wei)
     * @param minBNBOut Minimum BNB to receive (slippage protection)
     */
    handlePostGraduationSell(tokenAddress: string, tokenAmount: string, minBNBOut: string, options?: TxOptions): Promise<TxResult>;
    /**
     * Handle post-graduation buying for PROJECT_RAISE tokens
     *
     * Allows users to buy tokens after a PROJECT_RAISE has graduated to PancakeSwap.
     * The function:
     * - Takes 1% platform fee on BNB
     * - Swaps remaining BNB for tokens via PancakeSwap
     * - Sends tokens directly to buyer
     *
     * Note: Only works for PROJECT_RAISE tokens that have graduated
     *
     * @param tokenAddress Address of the PROJECT_RAISE token
     * @param BNBAmount Amount of BNB to spend (in ether string)
     * @param minTokensOut Minimum tokens to receive (slippage protection, in ether string)
     * @param options Transaction options
     */
    handlePostGraduationBuy(tokenAddress: string, BNBAmount: string, minTokensOut: string, options?: TxOptions): Promise<TxResult>;
    /**
     * Get launch information
     * ✅ UPDATED: No longer returns projectInfoFiWallet
     */
    getLaunchInfo(tokenAddress: string): Promise<LaunchInfo>;
    /**
     * Get launch information with USD values
     * ✅ UPDATED: Returns BNB amounts (BNBad native token) + USD equivalents
     */
    getLaunchInfoWithUSD(tokenAddress: string): Promise<LaunchInfoWithUSD>;
    /**
     * Get claimable amounts for founder
     */
    getClaimableAmounts(tokenAddress: string): Promise<ClaimableAmounts>;
    /**
     * Get launch vesting information
     * Returns details about the vesting schedule for founder tokens
     */
    getLaunchVesting(tokenAddress: string): Promise<LaunchVesting>;
    /**
     * Get vesting progress percentage (0-100)
     */
    getVestingProgress(tokenAddress: string): Promise<number>;
    /**
     * Get time-based vesting progress (0-100)
     * Based on how much time has passed in the vesting period
     */
    getTimeBasedVestingProgress(tokenAddress: string): Promise<number>;
    /**
     * Get remaining vesting time in seconds
     */
    getRemainingVestingTime(tokenAddress: string): Promise<number>;
    /**
     * Get contribution info for an address
     *
     * Note: Only relevant for PROJECT_RAISE tokens
     */
    getContribution(tokenAddress: string, contributor: string): Promise<ContributionInfo>;
    /**
     * Get all launches (both PROJECT_RAISE and INSTANT_LAUNCH)
     */
    getAllLaunches(): Promise<string[]>;
    /**
     * Check if address is a valid launch
     */
    isValidLaunch(tokenAddress: string): Promise<boolean>;
    /**
     * Get launch progress percentage
     *
     * Note: Only meaningful for PROJECT_RAISE tokens
     * For INSTANT_LAUNCH, check BondingCurveDEX graduation progress instead
     */
    getLaunchProgress(tokenAddress: string): Promise<number>;
    /**
     * Check if launch deadline has passed
     *
     * Note: Only relevant for PROJECT_RAISE tokens (72-hour / 3-day deadline)
     * INSTANT_LAUNCH tokens have no deadline
     */
    hasLaunchDeadlinePassed(tokenAddress: string): Promise<boolean>;
    /**
     * Get time remaining until deadline
     *
     * Note: Only relevant for PROJECT_RAISE tokens
     * Returns 0 for INSTANT_LAUNCH tokens
     */
    getTimeUntilDeadline(tokenAddress: string): Promise<number>;
    /**
     * Listen to LaunchCreated events (PROJECT_RAISE)
     */
    onLaunchCreated(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to InstantLaunchCreated events (INSTANT_LAUNCH)
     */
    onInstantLaunchCreated(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to ContributionMade events (PROJECT_RAISE only)
     */
    onContributionMade(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to RaiseCompleted events (PROJECT_RAISE only)
     */
    onRaiseCompleted(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to GraduatedToPancakeSwap events (both launch types)
     */
    onGraduatedToPancakeSwap(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * ✅ NEW: Claim contributor tokens after successful PROJECT_RAISE
     *
     * After a successful PROJECT_RAISE, contributors can claim their proportional
     * share of tokens from the 70% contributor allocation.
     *
     * Note: Only works for PROJECT_RAISE tokens after successful raise
     *
     * @param tokenAddress - Address of the launched token
     * @param options - Transaction options
     */
    claimContributorTokens(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Claim refund after failed PROJECT_RAISE
     *
     * If a PROJECT_RAISE fails to meet its target after the 72-hour (3-day) deadline,
     * contributors can claim their BNB refunds.
     *
     * Note: Only works for PROJECT_RAISE tokens that failed to meet target
     *
     * @param tokenAddress - Address of the launched token
     * @param options - Transaction options
     */
    claimRefund(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Burn tokens from failed PROJECT_RAISE
     *
     * Burns all tokens if a PROJECT_RAISE fails to meet its target.
     * Can be called by anyone after the deadline passes.
     *
     * Note: This is a cleanup function that can be called by anyone
     *
     * @param tokenAddress - Address of the launched token
     * @param options - Transaction options
     */
    burnFailedRaiseTokens(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Update fallback BNB price (admin only, BNBad native token)
     *
     * Updates the fallback price used when the oracle fails.
     * Only callable by contract owner.
     *
     * @param price - New fallback price (in 8 decimals format, e.g., "120000000000" for $1200)
     * @param options - Transaction options
     */
    updateFallbackPrice(price: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Update LP fee harvester address (admin only)
     *
     * Updates the LP fee harvester contract address.
     * Only callable by contract owner.
     *
     * @param lpFeeHarvesterAddress - New LP fee harvester contract address
     * @param options - Transaction options
     */
    updateLPFeeHarvester(lpFeeHarvesterAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Emergency withdraw tokens (admin only)
     *
     * Emergency function to withdraw tokens from failed PROJECT_RAISE.
     * Only callable by contract owner after deadline if raise failed.
     *
     * @param tokenAddress - Address of the token to withdraw
     * @param options - Transaction options
     */
    emergencyWithdraw(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Check if contributor can claim tokens
     *
     * Helper method to check if a contributor is eligible to claim their tokens
     */
    canClaimContributorTokens(tokenAddress: string, contributorAddress: string): Promise<boolean>;
    /**
     * ✅ NEW: Check if contributor can claim refund
     *
     * Helper method to check if a contributor is eligible to claim a refund
     */
    canClaimRefund(tokenAddress: string, contributorAddress: string): Promise<boolean>;
    /**
     * ✅ NEW: Get contributor's token allocation
     *
     * Calculate how many tokens a contributor would receive after successful raise
     */
    getContributorTokenAllocation(tokenAddress: string, contributorAddress: string): Promise<bigint>;
    /**
     * ✅ NEW: Listen to ContributorTokensClaimed events
     */
    onContributorTokensClaimed(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * ✅ NEW: Listen to RefundClaimed events
     */
    onRefundClaimed(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * ✅ NEW: Listen to RaiseFailed events
     */
    onRaiseFailed(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * ✅ NEW: Listen to PlatformFeePaid events
     */
    onPlatformFeePaid(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * ✅ NEW: Listen to PostGraduationBuy events
     */
    onPostGraduationBuy(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * ✅ NEW: Listen to VestedTokensBurnedByCommunityControl events
     */
    onVestedTokensBurned(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * ✅ NEW: Listen to CommunityControlTriggered events
     */
    onCommunityControlTriggered(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * ✅ NEW: Claim vested tokens (10% allocation vested over 6 BNBths)
     *
     * Vesting is conditional on token maintaining starting market cap.
     * Tokens ONLY release if current market cap is above starting market cap.
     * If community control triggered, claims are blocked.
     *
     * Note: Only for PROJECT_RAISE tokens after graduation
     *
     * @param tokenAddress - Address of the launched token
     * @param options - Transaction options
     */
    claimVestedTokens(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Update market cap tracking (called BNBthly)
     *
     * Tracks consecutive BNBths below starting market cap.
     * Triggers community control after 3 consecutive BNBths below start.
     *
     * Note: Only for PROJECT_RAISE tokens after graduation
     *
     * @param tokenAddress - Address of the launched token
     * @param options - Transaction options
     */
    updateMarketCap(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Transfer raised funds to timelock when community control is triggered
     *
     * Only callable when 3 consecutive BNBths below starting market cap.
     * Funds locked for 48 hours for platform team to review community input.
     * Requires owner role.
     *
     * @param tokenAddress - Address of the launched token
     * @param options - Transaction options
     */
    transferFundsToTimelock(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Burn remaining vested tokens when community control is triggered
     *
     * Only owner (platform) can call - per governance model.
     * Called after community consultation and decision.
     *
     * @param tokenAddress - Address of the launched token
     * @param options - Transaction options
     */
    burnVestedTokensOnCommunityControl(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Update timelock beneficiary based on community decision
     *
     * Only owner can call (platform team).
     * Updates beneficiary address based on community input.
     *
     * @param tokenAddress - Token address
     * @param newBeneficiary - New beneficiary address based on community input
     * @param options - Transaction options
     */
    updateTimelockBeneficiary(tokenAddress: string, newBeneficiary: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Get information about community control status
     *
     * Useful for frontend to display community governance state.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Community control information
     */
    getCommunityControlInfo(tokenAddress: string): Promise<{
        communityControlActive: boolean;
        consecutiveBNBthsBelowStart: bigint;
        currentMarketCap: bigint;
        startMarketCap: bigint;
        remainingFunds: bigint;
        remainingVestedTokens: bigint;
    }>;
    /**
     * ✅ NEW: Get claimable vested tokens amount
     *
     * Returns 0 if community control is active.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Amount of vested tokens that can be claimed
     */
    getClaimableVestedTokens(tokenAddress: string): Promise<bigint>;
    /**
     * ✅ NEW: Get BNBthly market cap history
     *
     * Useful for frontend to display market cap trends.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Array of BNBthly market cap values
     */
    getMarketCapHistory(tokenAddress: string): Promise<bigint[]>;
    /**
     * ✅ NEW: Update InfoFi address (admin only)
     *
     * Updates the global InfoFi fee address.
     * Only callable by contract owner.
     *
     * @param infoFiAddress - New InfoFi address
     * @param options - Transaction options
     */
    updateInfoFiAddress(infoFiAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Get founder information for a launch
     *
     * Returns the founder's name, wallet address, and bio.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Founder information
     */
    getFounderInfo(tokenAddress: string): Promise<FounderInfo>;
    /**
     * ✅ NEW: Get team members for a launch
     *
     * Returns up to 2 team members with their details.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Team members and count
     */
    getTeamMembers(tokenAddress: string): Promise<{
        teamMember1: TeamMember;
        teamMember2: TeamMember;
        teamMemberCount: number;
    }>;
    /**
     * ✅ NEW: Get complete team info for a launch
     *
     * Returns founder info and all team members.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Complete team information
     */
    getLaunchTeamInfo(tokenAddress: string): Promise<LaunchTeamInfo>;
    /**
     * ✅ NEW: Update founder info (only founder can update, only before graduation)
     *
     * Allows the founder to update their name and bio before the token graduates.
     *
     * @param tokenAddress - Address of the launched token
     * @param name - New founder name
     * @param bio - New founder bio
     * @param options - Transaction options
     */
    updateFounderInfo(tokenAddress: string, name: string, bio: string, options?: TxOptions): Promise<TxResult>;
    /**
     * ✅ NEW: Update team members (only founder can update, only before graduation)
     *
     * Allows the founder to update team member information before the token graduates.
     *
     * @param tokenAddress - Address of the launched token
     * @param teamMember1 - First team member info
     * @param teamMember2 - Second team member info
     * @param teamMemberCount - Number of team members (0, 1, or 2)
     * @param options - Transaction options
     */
    updateTeamMembers(tokenAddress: string, teamMember1: TeamMember, teamMember2: TeamMember, teamMemberCount: number, options?: TxOptions): Promise<TxResult>;
    /**
     * Validate launch parameters
     * ✅ UPDATED: Validates BNB amounts (BNBad native token)
     * Note: Contract enforces actual validation, this is for client-side UX
     */
    private validateLaunchParams;
}

/**
 * Volume data structure
 * ✅ UPDATED: Changed to BNB (BNBad migration)
 */
interface VolumeData {
    totalBuyVolumeBNB: bigint;
    totalSellVolumeBNB: bigint;
    totalVolumeBNB: bigint;
    totalBuyVolumeTokens: bigint;
    totalSellVolumeTokens: bigint;
    buyCount: number;
    sellCount: number;
    uniqueBuyers: number;
    uniqueSellers: number;
    uniqueTraders: number;
}
/**
 * Trade data structure
 * ✅ UPDATED: Changed to BNB (BNBad migration)
 */
interface TradeData {
    type: 'buy' | 'sell';
    trader: string;
    tokenAddress: string;
    BNBAmount: bigint;
    tokenAmount: bigint;
    price: bigint;
    feeRate: bigint;
    blockNumber: number;
    timestamp: number;
    txHash: string;
}
/**
 * BondingCurveDEX contract wrapper
 */
declare class BondingCurveDEX extends BaseContract {
    constructor(address: string, provider: ethers.Provider, signer?: ethers.Signer, eventQueryProvider?: ethers.Provider, graph?: any);
    /**
     * Safely parse ether amount and handle edge cases
     */
    private safeParseEther;
    /**
     * Safely format ether amount and handle very small values
     * Prevents scientific notation in output
     */
    private safeFormatEther;
    /**
     * Buy tokens from bonding curve
     */
    buyTokens(tokenAddress: string, BNBAmount: string, slippageTolerance?: number, // 1% default
    options?: TxOptions): Promise<TxResult>;
    /**
     * Sell tokens to bonding curve
     */
    sellTokens(tokenAddress: string, tokenAmount: string, slippageTolerance?: number, // 1% default
    options?: TxOptions): Promise<TxResult>;
    /**
     * Get buy quote (how many tokens for X BNB)
     */
    getBuyQuote(tokenAddress: string, BNBAmount: string): Promise<Quote>;
    /**
     * Get sell quote (how much BNB for X tokens)
     */
    getSellQuote(tokenAddress: string, tokenAmount: string): Promise<Quote>;
    /**
     * Get pool information
     */
    getPoolInfo(tokenAddress: string): Promise<PoolInfo>;
    /**
     * Get current fee rate for a token
     */
    getCurrentFeeRate(tokenAddress: string): Promise<bigint>;
    /**
     * Get detailed fee information
     */
    getFeeInfo(tokenAddress: string): Promise<FeeInfo>;
    /**
     * Get creator fee information
     */
    getCreatorFeeInfo(tokenAddress: string): Promise<CreatorFeeInfo>;
    /**
     * Claim creator fees
     */
    claimCreatorFees(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * Get post-graduation statistics
     */
    getPostGraduationStats(tokenAddress: string): Promise<PostGraduationStats>;
    /**
     * Get all active tokens
     */
    getActiveTokens(): Promise<string[]>;
    /**
     * Check if pool is graduated
     */
    isGraduated(tokenAddress: string): Promise<boolean>;
    /**
     * Calculate price impact for buy
     */
    calculateBuyPriceImpact(tokenAddress: string, BNBAmount: string): Promise<number>;
    /**
     * Calculate price impact for sell
     */
    calculateSellPriceImpact(tokenAddress: string, tokenAmount: string): Promise<number>;
    /**
     * Estimate time until fee tier changes
     */
    estimateTimeUntilFeeTierChange(tokenAddress: string): Promise<number>;
    /**
     * Get formatted fee percentage
     */
    getCurrentFeePercentage(tokenAddress: string): Promise<string>;
    /**
     * Get total trading volume for a token (all time)
     * Uses The Graph if available, falls back to events
     */
    getTotalVolume(tokenAddress: string, fromBlock?: number): Promise<VolumeData>;
    /**
     * Get trading volume for a specific time period
     * Uses The Graph if available, falls back to events
     */
    getVolumeForPeriod(tokenAddress: string, fromBlock: number, toBlock: number, minTimestamp?: number): Promise<VolumeData>;
    /**
     * Get trading volume grouped by time intervals (hourly, daily, etc.)
     * Uses The Graph if available, falls back to events
     */
    getVolumeHistory(tokenAddress: string, intervalSeconds?: number, // 1 hour default
    periods?: number, fromBlock?: number): Promise<Array<VolumeData & {
        timestamp: number;
        intervalStart: number;
    }>>;
    /**
     * Get recent trades for a token
     * Uses The Graph if available, falls back to events
     */
    getRecentTrades(tokenAddress: string, limit?: number, fromBlock?: number): Promise<TradeData[]>;
    /**
     * Get TokensBought events with detailed trade data
     * ✅ FIXED: Use event.args instead of event.topics
     * Uses eventQueryProvider (Alchemy if configured) for better performance
     */
    private getTokensBoughtEvents;
    /**
     * Get TokensSold events with detailed trade data
     * ✅ FIXED: Use event.args instead of event.topics
     * Uses eventQueryProvider (Alchemy if configured) for better performance
     */
    private getTokensSoldEvents;
    /**
     * Get top traders by volume
     * Uses The Graph if available, falls back to events
     */
    getTopTraders(tokenAddress: string, limit?: number, fromBlock?: number): Promise<Array<{
        address: string;
        buyVolumeBNB: bigint;
        sellVolumeBNB: bigint;
        totalVolumeBNB: bigint;
        buyCount: number;
        sellCount: number;
        netTokens: bigint;
    }>>;
    /**
     * Get holder count estimate from trading activity
     * Uses The Graph if available, falls back to events
     */
    getEstimatedHolderCount(tokenAddress: string, fromBlock?: number): Promise<number>;
    /**
     * Get 24h trading volume in BNB
     * Returns both the bigint value and formatted string
     * Uses The Graph if available, falls back to events
     */
    get24hVolume(tokenAddress: string): Promise<{
        volumeBNB: bigint;
        volumeFormatted: string;
        buyVolumeBNB: bigint;
        sellVolumeBNB: bigint;
        tradeCount: number;
    }>;
    /**
     * Get 24h price change percentage
     * Returns the price change over the last 24 hours
     * Uses The Graph if available, falls back to events
     */
    get24hPriceChange(tokenAddress: string): Promise<{
        priceChange: number;
        priceChangePercent: number;
        currentPrice: bigint;
        price24hAgo: bigint;
    }>;
    /**
     * Format BNB amount (bigint) to readable string
     * Handles very small amounts without scientific notation
     */
    formatBNBAmount(amount: bigint): string;
    /**
     * Format token amount (bigint) to readable string
     * Handles very small amounts without scientific notation
     */
    formatTokenAmount(amount: bigint, decimals?: number): string;
    /**
     * Parse BNB amount string to bigint
     * Handles scientific notation and very small values
     */
    parseBNBAmount(amount: string): bigint;
    /**
     * Listen to TokensBought events
     */
    onTokensBought(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to TokensSold events
     */
    onTokensSold(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to PoolGraduated events
     */
    onPoolGraduated(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to PostGraduationSell events
     */
    onPostGraduationSell(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to CreatorFeesClaimed events
     */
    onCreatorFeesClaimed(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
}

declare class TokenFactory extends BaseContract {
    constructor(address: string, provider: ethers.Provider, signer?: ethers.Signer, eventQueryProvider?: ethers.Provider, graph?: any);
    /**
     * Get total number of tokens created
     */
    getTotalTokens(): Promise<number>;
    /**
     * Get token at index
     */
    getTokenAtIndex(index: number): Promise<string>;
    /**
     * Get all tokens created by an address
     */
    getCreatorTokens(creator: string): Promise<string[]>;
    /**
     * Compute vanity address for a token
     */
    computeAddress(name: string, symbol: string, totalSupply: number, decimals: number, owner: string, metadata: TokenMetadata, salt: string): Promise<string>;
    /**
     * Get token information (requires ERC20 interface)
     */
    getTokenInfo(tokenAddress: string): Promise<TokenInfo>;
}

declare class PriceOracle extends BaseContract {
    constructor(address: string, provider: ethers.Provider, signer?: ethers.Signer, eventQueryProvider?: ethers.Provider, graph?: any);
    /**
     * Get current BNB price in USD (8 decimals) - BSC native token
     */
    getBNBPrice(): Promise<bigint>;
    /**
     * Get BNB price formatted as string (BSC native token)
     */
    getBNBPriceFormatted(): Promise<string>;
    /**
     * Convert USD to BNB (BSC native token)
     */
    usdToBNB(usdAmount: bigint): Promise<bigint>;
    /**
     * Convert BNB to USD (BSC native token)
     */
    bnbToUSD(bnbAmount: bigint): Promise<bigint>;
    /**
     * Convert USD string to BNB (BSC native token)
     */
    convertUSDToBNB(usdAmountStr: string): Promise<string>;
    /**
     * Convert BNB string to USD (BSC native token)
     */
    convertBNBToUSD(bnbAmountStr: string): Promise<string>;
    /**
     * Get price feed address
     */
    getPriceFeedAddress(): Promise<string>;
}

declare class LPFeeHarvester extends BaseContract {
    constructor(address: string, provider: ethers.Provider, signer?: ethers.Signer, eventQueryProvider?: ethers.Provider, graph?: any);
    /**
     * Get LP lock information
     */
    getLockInfo(tokenAddress: string): Promise<LPLockInfo>;
    /**
     * Get harvest history for a token
     */
    getHarvestHistory(tokenAddress: string): Promise<HarvestStats[]>;
    /**
     * Get platform statistics
     */
    getPlatformStats(): Promise<PlatformStats>;
    /**
     * Check if harvesting is available
     */
    canHarvest(tokenAddress: string): Promise<{
        ready: boolean;
        timeRemaining: bigint;
    }>;
    /**
     * Harvest fees from LP position
     */
    harvestFees(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * Unlock LP tokens after lock period
     */
    unlockLP(tokenAddress: string, options?: TxOptions): Promise<TxResult>;
    /**
     * Extend lock duration
     */
    extendLock(tokenAddress: string, additionalDays: number, options?: TxOptions): Promise<TxResult>;
    /**
     * Get all locked projects
     */
    getAllLockedProjects(): Promise<string[]>;
    /**
     * Get active locks count
     */
    getActiveLocksCount(): Promise<number>;
    /**
     * Get LP value for a token
     */
    getLPValue(tokenAddress: string): Promise<{
        token0Amount: bigint;
        token1Amount: bigint;
        token0: string;
        token1: string;
    }>;
    /**
     * Check if lock is expired
     */
    isLockExpired(tokenAddress: string): Promise<boolean>;
    /**
     * Get time until unlock
     */
    getTimeUntilUnlock(tokenAddress: string): Promise<number>;
    /**
     * Get time until next harvest
     */
    getTimeUntilNextHarvest(tokenAddress: string): Promise<number>;
    /**
     * Listen to FeesHarvested events
     */
    onFeesHarvested(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to LPUnlocked events
     */
    onLPUnlocked(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
    /**
     * Listen to LockExtended events
     */
    onLockExtended(callback: (event: any) => void, filter?: EventFilterOptions): () => void;
}

/**
 * SafuPad SDK - Main entry point for interacting with SafuPad contracts
 *
 * @example
 * ```typescript
 * import { SafuPadSDK } from '@safupad/sdk';
 *
 * const sdk = new SafuPadSDK({
 *   network: 'bsc',
 *   provider: window.ethereum,
 * });
 *
 * await sdk.initialize();
 *
 * // Create a launch
 * const tx = await sdk.launchpad.createLaunch({
 *   name: 'MyToken',
 *   symbol: 'MTK',
 *   totalSupply: 1000000000,
 *   raiseTargetBNB: '50',
 *   raiseMaxBNB: '100',
 *   vestingDuration: 90,
 *   metadata: {...},
 *   burnLP: false
 * });
 * ```
 */
declare class SafuPadSDK {
    private provider;
    private eventQueryProvider;
    private signer?;
    private config;
    private networkConfig;
    launchpad: LaunchpadManager;
    bondingDex: BondingCurveDEX;
    tokenFactory: TokenFactory;
    priceOracle: PriceOracle;
    lpHarvester: LPFeeHarvester;
    graph?: SafuPadGraph;
    private initialized;
    /**
     * Create a new SafuPad SDK instance
     *
     * @param config - SDK configuration
     */
    constructor(config: Partial<SDKConfig>);
    /**
     * Initialize the SDK and verify connections
     */
    initialize(): Promise<void>;
    /**
     * Connect a wallet (useful for browser environments)
     */
    connect(): Promise<string>;
    /**
     * Get the current connected address
     */
    getAddress(): Promise<string>;
    /**
     * Get the current BNB balance (BSC native token)
     */
    getBalance(address?: string): Promise<string>;
    /**
     * Get network information
     */
    getNetworkInfo(): NetworkConfig;
    /**
     * Check if SDK is initialized
     */
    isInitialized(): boolean;
    /**
     * Get provider
     */
    getProvider(): ethers.Provider;
    /**
     * Get event query provider (uses Alchemy if configured)
     */
    getEventQueryProvider(): ethers.Provider;
    /**
     * Get signer
     */
    getSigner(): ethers.Signer | undefined;
    /**
     * Update signer (useful when switching accounts)
     */
    updateSigner(signer: ethers.Signer): void;
    /**
     * Disconnect wallet
     */
    disconnect(): void;
    /**
     * Get current gas price
     */
    getGasPrice(): Promise<string>;
    /**
     * Estimate gas for a transaction
     */
    estimateGas(tx: ethers.TransactionRequest): Promise<string>;
    /**
     * Wait for transaction confirmation
     */
    waitForTransaction(txHash: string, confirmations?: number): Promise<ethers.TransactionReceipt | null>;
    /**
     * Get transaction receipt
     */
    getTransactionReceipt(txHash: string): Promise<ethers.TransactionReceipt | null>;
    /**
     * Format BNB amount (BSC native token)
     */
    formatBNB(amount: bigint | string): string;
    /**
     * Parse BNB amount (BSC native token)
     */
    parseBNB(amount: string): bigint;
    /**
     * Format token amount with decimals
     */
    formatToken(amount: bigint | string, decimals?: number): string;
    /**
     * Parse token amount with decimals
     */
    parseToken(amount: string, decimals?: number): bigint;
    /**
     * Get block explorer URL for address
     */
    getExplorerUrl(type: 'address' | 'tx', value: string): string;
    /**
     * Create a new SDK instance with a different signer
     */
    withSigner(signer: ethers.Signer): SafuPadSDK;
    /**
     * Check if The Graph client is available
     */
    hasGraphSupport(): boolean;
    /**
     * Get The Graph client
     * Throws if not configured
     */
    getGraph(): SafuPadGraph;
    /**
     * Set custom subgraph URL
     */
    setSubgraphUrl(url: string): void;
    /**
     * Get SDK version
     */
    static getVersion(): string;
}

/**
 * Network configurations
 */
declare const NETWORKS: Record<string, NetworkConfig>;
/**
 * Default SDK configuration
 */
declare const DEFAULT_CONFIG: Partial<SDKConfig>;
/**
 * Contract constants (LaunchpadManagerV3 - BSC)
 */
declare const CONSTANTS: {
    MIN_RAISE_BNB: string;
    MAX_RAISE_BNB: string;
    MAX_CONTRIBUTION_PER_WALLET: string;
    RAISE_DURATION: number;
    FOUNDER_ALLOCATION: number;
    CONTRIBUTOR_ALLOCATION: number;
    PANCAKESWAP_ALLOCATION: number;
    VESTED_ALLOCATION: number;
    IMMEDIATE_FOUNDER_RELEASE: number;
    LIQUIDITY_TOKEN_PERCENT: number;
    LIQUIDITY_BNB_PERCENT: number;
    MIN_VESTING_DURATION: number;
    MAX_VESTING_DURATION: number;
    VESTING_RELEASE_INTERVAL: number;
    MARKET_CAP_CHECK_MONTHS: number;
    PLATFORM_FEE_BPS: number;
    BASIS_POINTS: number;
    CLAIM_COOLDOWN: number;
    HARVEST_COOLDOWN: number;
    MIN_HARVEST_AMOUNT: string;
    DEFAULT_LOCK_DURATION: number;
    MIN_LOCK_DURATION: number;
    MAX_LOCK_DURATION: number;
    TOTAL_TOKEN_SUPPLY: string;
    LP_BURN_ADDRESS: string;
};
/**
 * Error messages
 */
declare const ERROR_MESSAGES: {
    NOT_INITIALIZED: string;
    NO_SIGNER: string;
    INVALID_NETWORK: string;
    INVALID_ADDRESS: string;
    INVALID_AMOUNT: string;
    TRANSACTION_FAILED: string;
    INSUFFICIENT_BALANCE: string;
    CONTRACT_ERROR: string;
    ALREADY_GRADUATED: string;
    NOT_GRADUATED: string;
    RAISE_NOT_COMPLETED: string;
    NOT_FOUNDER: string;
    POOL_NOT_ACTIVE: string;
};
/**
 * Event names
 */
declare const EVENTS: {
    LAUNCH_CREATED: string;
    INSTANT_LAUNCH_CREATED: string;
    CONTRIBUTION_MADE: string;
    RAISE_COMPLETED: string;
    FOUNDER_TOKENS_CLAIMED: string;
    RAISED_FUNDS_CLAIMED: string;
    GRADUATED_TO_PANCAKESWAP: string;
    LP_BURNED: string;
    LP_LOCKED: string;
    TRANSFERS_ENABLED: string;
    POOL_CREATED: string;
    TOKENS_BOUGHT: string;
    TOKENS_SOLD: string;
    POOL_GRADUATED: string;
    FEES_COLLECTED: string;
    CREATOR_FEES_CLAIMED: string;
    POST_GRADUATION_SELL: string;
    LP_TOKENS_HANDLED: string;
    FEES_HARVESTED: string;
    FEES_DISTRIBUTED: string;
    LP_UNLOCKED: string;
    EMERGENCY_UNLOCK: string;
    LOCK_EXTENDED: string;
};
/**
 * Utility constants
 */
declare const UTILS: {
    ZERO_ADDRESS: string;
    DEAD_ADDRESS: string;
    MAX_UINT256: string;
};
/**
 * Time constants (in seconds)
 */
declare const TIME: {
    SECOND: number;
    MINUTE: number;
    HOUR: number;
    DAY: number;
    WEEK: number;
    MONTH: number;
    YEAR: number;
};
/**
 * Block time estimates (in seconds)
 */
declare const BLOCK_TIME: {
    bsc: number;
    bscTestnet: number;
    ethereum: number;
};
/**
 * Gas limit estimates for common operations
 */
declare const GAS_LIMITS: {
    CREATE_LAUNCH: bigint;
    CREATE_INSTANT_LAUNCH: bigint;
    CONTRIBUTE: bigint;
    BUY_TOKENS: bigint;
    SELL_TOKENS: bigint;
    CLAIM_FOUNDER_TOKENS: bigint;
    CLAIM_RAISED_FUNDS: bigint;
    GRADUATE_TO_PANCAKESWAP: bigint;
    HARVEST_FEES: bigint;
    UNLOCK_LP: bigint;
    CLAIM_CONTRIBUTOR_TOKENS: bigint;
    CLAIM_REFUND: bigint;
    BURN_FAILED_RAISE_TOKENS: bigint;
    UPDATE_FALLBACK_PRICE: bigint;
    UPDATE_LP_FEE_HARVESTER: bigint;
    EMERGENCY_WITHDRAW: bigint;
};

/**
 * Format utilities
 */
declare class Formatter {
    /**
     * Format BNB amount to string (BSC native token)
     */
    static formatBNB(amount: bigint | string): string;
    /**
     * Format token amount to string
     */
    static formatToken(amount: bigint | string, decimals?: number): string;
    /**
     * Format USD amount to string
     */
    static formatUSD(amount: bigint | string, decimals?: number): string;
    /**
     * Format percentage
     */
    static formatPercent(value: number | bigint, decimals?: number): string;
    /**
     * Format timestamp to date
     */
    static formatDate(timestamp: bigint | number): Date;
    /**
     * Format duration in seconds to human readable
     */
    static formatDuration(seconds: number): string;
    /**
     * Format address (shorten)
     */
    static formatAddress(address: string, startChars?: number, endChars?: number): string;
    /**
     * Format launch info for display
     */
    static formatLaunchInfo(info: LaunchInfo): FormattedLaunchInfo;
    /**
     * Format pool info for display
     */
    static formatPoolInfo(info: PoolInfo): FormattedPoolInfo;
}
/**
 * Validation utilities
 */
declare class Validator {
    /**
     * Validate Ethereum address
     */
    static isValidAddress(address: string): boolean;
    /**
     * Validate amount
     */
    static isValidAmount(amount: string): boolean;
    /**
     * Validate token symbol
     */
    static isValidSymbol(symbol: string): boolean;
    /**
     * Validate token name
     */
    static isValidName(name: string): boolean;
    /**
     * Validate URL
     */
    static isValidURL(url: string): boolean;
    /**
     * Validate private key
     */
    static isValidPrivateKey(key: string): boolean;
}
/**
 * Calculation utilities
 */
declare class Calculator {
    /**
     * Calculate price impact
     */
    static calculatePriceImpact(inputAmount: bigint, outputAmount: bigint, currentPrice: bigint): number;
    /**
     * Calculate slippage amount
     */
    static calculateSlippage(amount: bigint, slippagePercent: number): bigint;
    /**
     * Calculate percentage
     */
    static calculatePercent(part: bigint, total: bigint): number;
    /**
     * Calculate vested amount
     */
    static calculateVestedAmount(totalAmount: bigint, startTime: bigint, duration: bigint, currentTime?: bigint): bigint;
    /**
     * Calculate APY from fees
     */
    static calculateAPY(totalFees: bigint, lockedValue: bigint, lockDuration: number): number;
}
/**
 * Time utilities
 */
declare class TimeHelper {
    /**
     * Get current timestamp
     */
    static now(): number;
    /**
     * Convert days to seconds
     */
    static daysToSeconds(days: number): number;
    /**
     * Convert seconds to days
     */
    static secondsToDays(seconds: number): number;
    /**
     * Check if deadline has passed
     */
    static hasDeadlinePassed(deadline: bigint | number): boolean;
    /**
     * Get time remaining
     */
    static getTimeRemaining(deadline: bigint | number): number;
    /**
     * Sleep (for testing/delays)
     */
    static sleep(ms: number): Promise<void>;
}
/**
 * Gas utilities
 */
declare class GasHelper {
    /**
     * Estimate gas cost in BNB (BSC native token)
     */
    static estimateCostBNB(gasLimit: bigint, gasPrice: bigint): string;
    /**
     * Convert gwei to wei
     */
    static gweiToWei(gwei: string): bigint;
    /**
     * Convert wei to gwei
     */
    static weiToGwei(wei: bigint): string;
    /**
     * Add gas buffer (increase by percentage)
     */
    static addBuffer(gasLimit: bigint, bufferPercent?: number): bigint;
}
/**
 * Event utilities
 */
declare class EventHelper {
    /**
     * Parse event logs
     */
    static parseEventLog(log: ethers.Log, contract: ethers.Contract): any;
    /**
     * Filter events by name
     */
    static filterEventsByName(events: any[], eventName: string): any[];
    /**
     * Get event argument
     */
    static getEventArg(event: any, argName: string): any;
}
/**
 * Token utilities
 */
declare class TokenHelper {
    /**
     * Get token contract instance
     */
    static getTokenContract(address: string, provider: ethers.Provider): ethers.Contract;
    /**
     * Get token balance
     */
    static getBalance(tokenAddress: string, userAddress: string, provider: ethers.Provider): Promise<bigint>;
    /**
     * Get token allowance
     */
    static getAllowance(tokenAddress: string, owner: string, spender: string, provider: ethers.Provider): Promise<bigint>;
    /**
     * Check if approval needed
     */
    static needsApproval(tokenAddress: string, owner: string, spender: string, amount: bigint, provider: ethers.Provider): Promise<boolean>;
}
/**
 * URL utilities
 */
declare class URLHelper {
    /**
     * Build explorer URL
     */
    static getExplorerURL(baseURL: string, type: 'address' | 'tx' | 'token' | 'block', value: string): string;
    /**
     * Parse transaction hash from URL
     */
    static parseTxHash(url: string): string | null;
    /**
     * Parse address from URL
     */
    static parseAddress(url: string): string | null;
}
declare const utils: {
    Formatter: typeof Formatter;
    Validator: typeof Validator;
    Calculator: typeof Calculator;
    TimeHelper: typeof TimeHelper;
    GasHelper: typeof GasHelper;
    EventHelper: typeof EventHelper;
    TokenHelper: typeof TokenHelper;
    URLHelper: typeof URLHelper;
};

/**
 * Contract ABIs
 *
 * These are minimal ABIs containing only the functions used by the SDK.
 * For full ABIs, import from your compiled contracts.
 *
 * ✅ UPDATED: Removed projectInfoFiWallet parameters and updated signatures
 * ✅ UPDATED: BondingCurveDEX no longer has LaunchType (INSTANT_LAUNCH only)
 * ✅ UPDATED: Added missing functions from LaunchpadManagerV3 contract
 */
declare const LaunchpadManagerABI: string[];
/**
 * BondingCurveDEX ABI - INSTANT_LAUNCH Only
 * ✅ UPDATED: Removed LaunchType parameters - all pools are INSTANT_LAUNCH
 */
declare const BondingCurveDEXABI: string[];
declare const TokenFactoryABI: string[];
declare const PriceOracleABI: string[];
declare const LPFeeHarvesterABI: string[];

/**
 * SafuPad SDK
 *
 * A comprehensive TypeScript SDK for interacting with SafuPad smart contracts
 *
 * @packageDocumentation
 */

declare const VERSION = "2.0.0";

export { BLOCK_TIME, BaseContract, BondingCurveDEX, BondingCurveDEXABI, CONSTANTS, Calculator, ContractError, DEFAULT_CONFIG, ERROR_MESSAGES, EVENTS, EventHelper, Formatter, GAS_LIMITS, GasHelper, GraphQLClient, LPFeeHarvester, LPFeeHarvesterABI, LaunchType, LaunchpadManager, LaunchpadManagerABI, NETWORKS, NetworkError, PriceOracle, PriceOracleABI, SafuPadError, SafuPadGraph, SafuPadSDK, TIME, TimeHelper, TokenFactory, TokenFactoryABI, TokenHelper, URLHelper, UTILS, VERSION, ValidationError, Validator, SafuPadSDK as default, utils };
export type { ClaimableAmounts, ContributionInfo, CreateInstantLaunchParams, CreateLaunchParams, CreatorFeeInfo, EventFilterOptions, FeeInfo, FormattedLaunchInfo, FormattedPoolInfo, GraphContribution, GraphCreatorFees, GraphDailyStats, GraphLaunch, GraphPlatformStats, GraphPool, GraphToken, GraphTokenHolder, GraphTrade, HarvestStats, LPLockInfo, LaunchFilters, LaunchInfo, LaunchInfoWithUSD, NetworkConfig, NetworkName, PaginationParams, PlatformStats, PoolFilters, PoolInfo, PostGraduationStats, Quote, SDKConfig, TokenInfo, TokenMetadata, TradeFilters, TxOptions, TxResult };
