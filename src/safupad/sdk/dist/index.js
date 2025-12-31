'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var ethers = require('ethers');

/**
 * Launch type enum
 */
exports.LaunchType = void 0;
(function (LaunchType) {
    LaunchType[LaunchType["PROJECT_RAISE"] = 0] = "PROJECT_RAISE";
    LaunchType[LaunchType["INSTANT_LAUNCH"] = 1] = "INSTANT_LAUNCH";
})(exports.LaunchType || (exports.LaunchType = {}));
/**
 * Error types
 */
class SafuPadError extends Error {
    constructor(message, code, details) {
        super(message);
        this.code = code;
        this.details = details;
        this.name = 'SafuPadError';
    }
}
class NetworkError extends SafuPadError {
    constructor(message, details) {
        super(message, 'NETWORK_ERROR', details);
        this.name = 'NetworkError';
    }
}
class ContractError extends SafuPadError {
    constructor(message, details) {
        super(message, 'CONTRACT_ERROR', details);
        this.name = 'ContractError';
    }
}
class ValidationError extends SafuPadError {
    constructor(message, details) {
        super(message, 'VALIDATION_ERROR', details);
        this.name = 'ValidationError';
    }
}

/**
 * Network configurations
 */
const NETWORKS = {
    bsc: {
        name: 'BNB Smart Chain',
        chainId: 56, // BSC mainnet chain ID
        rpcUrl: 'https://bsc-dataseed.binance.org/', // BSC RPC URL
        alchemyRpcUrlTemplate: 'https://bnb-mainnet.g.alchemy.com/v2/{apiKey}',
        explorerUrl: 'https://bscscan.com', // BSC explorer
        subgraphUrl: 'https://api.studio.thegraph.com/query/<SUBGRAPH_ID>/safupad-subgraph/version/latest', // TODO: UPDATE AFTER DEPLOYMENT
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
        contracts: {
            launchpadManager: '0xcCfcfeB17609f0C5aE604bC71c4907B90B94a3e9', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
            bondingCurveDEX: '0xE96baB0D0661Fbfc710d79d58Cdb32bcD7bB8815', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
            tokenFactory: '0x15E2ccAeb4D1eeA1A7b8d839FFA30D63519D1c50', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
            priceOracle: '0x3De1d0D44c9609b99D05BA14Ff48c691fF6059Ff', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
            lpFeeHarvester: '0x8b4499143ac1CDb7bDB25a2FEc1786F8BD9772F9', // TODO: UPDATE AFTER MAINNET DEPLOYMENT
            pancakeRouter: '0x10ED43C718714eb63d5aA57B78B54704E256024E', // PancakeSwap router
            pancakeFactory: '0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73', // PancakeSwap factory
        },
    },
    bscTestnet: {
        name: 'BNB Smart Chain Testnet',
        chainId: 97, // BSC testnet chain ID
        rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/', // BSC testnet RPC
        alchemyRpcUrlTemplate: 'https://bnb-testnet.g.alchemy.com/v2/{apiKey}',
        explorerUrl: 'https://testnet.bscscan.com', // BSC testnet explorer
        subgraphUrl: 'https://api.studio.thegraph.com/query/<SUBGRAPH_ID>/safupad-testnet/version/latest', // TODO: UPDATE AFTER DEPLOYMENT
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
        contracts: {
            launchpadManager: '0x4c797EbaA64Cc7f1bD2a82A36bEE5Cf335D1830c',
            bondingCurveDEX: '0x14eB3B6C297ff6fefc25c0E0d289Bf8348e864f6',
            tokenFactory: '0xcb7526b9598240A737237C52f852705e6A449cD0',
            priceOracle: '0x56f0b1f80F8cc37f875Be42e2f4D09810514F346',
            lpFeeHarvester: '0xa886B8897814193f99A88701d70b31b4a8E27a1E',
            pancakeRouter: '0xD99D1c33F9fC3444f8101754aBC46c52416550D1', // BSC testnet DEX router
            pancakeFactory: '0x6725F303b657a9451d8BA641348b6761A6CC7a17', // BSC testnet DEX factory
        },
    },
    localhost: {
        name: 'Localhost',
        chainId: 31337,
        rpcUrl: 'http://localhost:8545',
        explorerUrl: 'http://localhost:8545',
        subgraphUrl: 'http://localhost:8000/subgraphs/name/safupad-subgraph', // Local Graph Node
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18,
        },
        contracts: {
            launchpadManager: '0x0000000000000000000000000000000000000000',
            bondingCurveDEX: '0x0000000000000000000000000000000000000000',
            tokenFactory: '0x0000000000000000000000000000000000000000',
            priceOracle: '0x0000000000000000000000000000000000000000',
            lpFeeHarvester: '0x0000000000000000000000000000000000000000',
            pancakeRouter: '0x0000000000000000000000000000000000000000',
            pancakeFactory: '0x0000000000000000000000000000000000000000',
        },
    },
};
/**
 * Default SDK configuration
 */
const DEFAULT_CONFIG = {
    gasLimit: 5000000n,
    gasPrice: 3000000000n, // 3 gwei
};
/**
 * Contract constants (LaunchpadManagerV3 - BSC)
 */
const CONSTANTS = {
    // Launch parameters - BNB amounts (BSC native currency)
    MIN_RAISE_BNB: '5000000', // 5M BNB
    MAX_RAISE_BNB: '20000000', // 20M BNB
    MAX_CONTRIBUTION_PER_WALLET: '50000', // 50K BNB per wallet
    RAISE_DURATION: 72 * 60 * 60, // 72 hours (3 days) in seconds
    // Token allocation percentages
    FOUNDER_ALLOCATION: 60, // 60% to founder
    CONTRIBUTOR_ALLOCATION: 20, // 20% for contributors
    PANCAKESWAP_ALLOCATION: 10, // 10% for PancakeSwap liquidity
    VESTED_ALLOCATION: 10, // 10% vested (conditional - community control)
    // Founder token release
    IMMEDIATE_FOUNDER_RELEASE: 100, // 100% of founder allocation released immediately (no vesting on founder tokens)
    // Liquidity percentages
    LIQUIDITY_TOKEN_PERCENT: 10, // 10% of token supply for liquidity
    LIQUIDITY_BNB_PERCENT: 20, // 20% of raised BNB for liquidity
    // Vesting (for conditional 10% allocation)
    MIN_VESTING_DURATION: 90 * 24 * 60 * 60, // 90 days
    MAX_VESTING_DURATION: 180 * 24 * 60 * 60, // 180 days
    VESTING_RELEASE_INTERVAL: 30 * 24 * 60 * 60, // 30 days
    MARKET_CAP_CHECK_MONTHS: 3, // 3 consecutive months below starting market cap triggers community control
    // Platform fees
    PLATFORM_FEE_BPS: 100, // 1% platform fee (100 basis points)
    BASIS_POINTS: 10000,
    // LP Harvester
    CLAIM_COOLDOWN: 24 * 60 * 60, // 24 hours
    HARVEST_COOLDOWN: 24 * 60 * 60, // 24 hours
    MIN_HARVEST_AMOUNT: '0.001', // 0.001 BNB
    DEFAULT_LOCK_DURATION: 365 * 24 * 60 * 60, // 365 days
    MIN_LOCK_DURATION: 90 * 24 * 60 * 60, // 90 days
    MAX_LOCK_DURATION: 1460 * 24 * 60 * 60, // 4 years
    // Token supply
    TOTAL_TOKEN_SUPPLY: '1000000000', // 1 billion
    // Burn address
    LP_BURN_ADDRESS: '0x000000000000000000000000000000000000dEaD',
};
/**
 * Error messages
 */
const ERROR_MESSAGES = {
    NOT_INITIALIZED: 'SDK not initialized. Call initialize() first.',
    NO_SIGNER: 'No signer available. Connect wallet first.',
    INVALID_NETWORK: 'Invalid network configuration.',
    INVALID_ADDRESS: 'Invalid address provided.',
    INVALID_AMOUNT: 'Invalid amount provided.',
    TRANSACTION_FAILED: 'Transaction failed.',
    INSUFFICIENT_BALANCE: 'Insufficient balance.',
    CONTRACT_ERROR: 'Contract call failed.',
    ALREADY_GRADUATED: 'Pool has already graduated.',
    NOT_GRADUATED: 'Pool has not graduated yet.',
    RAISE_NOT_COMPLETED: 'Raise not completed.',
    NOT_FOUNDER: 'Only founder can perform this action.',
    POOL_NOT_ACTIVE: 'Pool is not active.',
};
/**
 * Event names
 */
const EVENTS = {
    // LaunchpadManager events
    LAUNCH_CREATED: 'LaunchCreated',
    INSTANT_LAUNCH_CREATED: 'InstantLaunchCreated',
    CONTRIBUTION_MADE: 'ContributionMade',
    RAISE_COMPLETED: 'RaiseCompleted',
    FOUNDER_TOKENS_CLAIMED: 'FounderTokensClaimed',
    RAISED_FUNDS_CLAIMED: 'RaisedFundsClaimed',
    GRADUATED_TO_PANCAKESWAP: 'GraduatedToPancakeSwap',
    LP_BURNED: 'LPBurned',
    LP_LOCKED: 'LPLocked',
    TRANSFERS_ENABLED: 'TransfersEnabled',
    // BondingCurveDEX events
    POOL_CREATED: 'PoolCreated',
    TOKENS_BOUGHT: 'TokensBought',
    TOKENS_SOLD: 'TokensSold',
    POOL_GRADUATED: 'PoolGraduated',
    FEES_COLLECTED: 'FeesCollected',
    CREATOR_FEES_CLAIMED: 'CreatorFeesClaimed',
    POST_GRADUATION_SELL: 'PostGraduationSell',
    LP_TOKENS_HANDLED: 'LPTokensHandled',
    // LPFeeHarvester events
    FEES_HARVESTED: 'FeesHarvested',
    FEES_DISTRIBUTED: 'FeesDistributed',
    LP_UNLOCKED: 'LPUnlocked',
    EMERGENCY_UNLOCK: 'EmergencyUnlock',
    LOCK_EXTENDED: 'LockExtended',
};
/**
 * Utility constants
 */
const UTILS = {
    ZERO_ADDRESS: '0x0000000000000000000000000000000000000000',
    DEAD_ADDRESS: '0x000000000000000000000000000000000000dEaD',
    MAX_UINT256: '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff',
};
/**
 * Time constants (in seconds)
 */
const TIME = {
    SECOND: 1,
    MINUTE: 60,
    HOUR: 60 * 60,
    DAY: 24 * 60 * 60,
    WEEK: 7 * 24 * 60 * 60,
    MONTH: 30 * 24 * 60 * 60,
    YEAR: 365 * 24 * 60 * 60,
};
/**
 * Block time estimates (in seconds)
 */
const BLOCK_TIME = {
    bsc: 3, // BSC has ~3s block time
    bscTestnet: 3,
    ethereum: 12,
};
/**
 * Gas limit estimates for common operations
 */
const GAS_LIMITS = {
    CREATE_LAUNCH: 5000000n,
    CREATE_INSTANT_LAUNCH: 5000000n,
    CONTRIBUTE: 500000n,
    BUY_TOKENS: 500000n,
    SELL_TOKENS: 500000n,
    CLAIM_FOUNDER_TOKENS: 150000n,
    CLAIM_RAISED_FUNDS: 150000n,
    GRADUATE_TO_PANCAKESWAP: 5000000n,
    HARVEST_FEES: 500000n,
    UNLOCK_LP: 200000n,
    CLAIM_CONTRIBUTOR_TOKENS: 150000n, // Claim tokens after successful raise
    CLAIM_REFUND: 100000n, // Claim refund after failed raise
    BURN_FAILED_RAISE_TOKENS: 100000n, // Burn tokens from failed raise
    // New admin functions
    UPDATE_FALLBACK_PRICE: 50000n, // Update oracle fallback price
    UPDATE_LP_FEE_HARVESTER: 50000n, // Update LP harvester address
    EMERGENCY_WITHDRAW: 100000n,
};

// src/contracts/BaseContract.ts
/**
 * Base contract class with common functionality
 */
class BaseContract {
    constructor(address, abi, provider, signer, eventQueryProvider, graph) {
        this.address = address;
        this.provider = provider;
        this.signer = signer;
        // Use eventQueryProvider if provided, otherwise use the regular provider
        this.eventQueryProvider = eventQueryProvider || provider;
        this.graph = graph;
        if (signer) {
            this.contract = new ethers.ethers.Contract(address, abi, signer);
        }
        else {
            this.contract = new ethers.ethers.Contract(address, abi, provider);
        }
    }
    /**
     * Get contract address
     */
    getAddress() {
        return this.address;
    }
    /**
     * Get provider
     */
    getProvider() {
        return this.provider;
    }
    /**
     * Get signer
     */
    getSigner() {
        return this.signer;
    }
    /**
     * Update signer
     */
    updateSigner(signer) {
        this.signer = signer;
        this.contract = new ethers.ethers.Contract(this.address, this.contract.interface, signer);
    }
    /**
     * Update graph client
     */
    updateGraph(graph) {
        this.graph = graph;
    }
    /**
     * Check if The Graph client is available
     */
    hasGraphSupport() {
        return this.graph !== undefined;
    }
    /**
     * Require signer to be available
     */
    requireSigner() {
        if (!this.signer) {
            throw new Error(ERROR_MESSAGES.NO_SIGNER);
        }
    }
    /**
     * Validate Ethereum address
     */
    validateAddress(address) {
        if (!ethers.ethers.isAddress(address)) {
            throw new Error(`${ERROR_MESSAGES.INVALID_ADDRESS}: ${address}`);
        }
    }
    /**
     * Validate amount
     */
    validateAmount(amount) {
        if (amount <= 0n) {
            throw new Error(ERROR_MESSAGES.INVALID_AMOUNT);
        }
    }
    /**
     * Build transaction options
     */
    buildTxOptions(options, defaultGasLimit) {
        const txOptions = {};
        if (options?.gasLimit) {
            txOptions.gasLimit = options.gasLimit;
        }
        else if (defaultGasLimit) {
            txOptions.gasLimit = defaultGasLimit;
        }
        if (options?.gasPrice) {
            txOptions.gasPrice = options.gasPrice;
        }
        if (options?.value) {
            txOptions.value = options.value;
        }
        if (options?.nonce !== undefined) {
            txOptions.nonce = options.nonce;
        }
        return txOptions;
    }
    /**
     * Handle contract errors
     */
    handleError(error) {
        let message = ERROR_MESSAGES.CONTRACT_ERROR;
        let code;
        let details;
        if (error.reason) {
            message = error.reason;
        }
        else if (error.message) {
            message = error.message;
        }
        if (error.code) {
            code = error.code;
        }
        if (error.data) {
            details = error.data;
        }
        throw new ContractError(message, { code, details, original: error });
    }
    /**
     * Call contract function safely
     */
    async callSafely(fn, errorMessage) {
        try {
            return await fn();
        }
        catch (error) {
            if (errorMessage) {
                throw new ContractError(errorMessage, { original: error });
            }
            this.handleError(error);
        }
    }
    /**
     * Add event listener
     */
    addEventListener(eventName, callback, filter) {
        const eventFilter = this.contract.filters[eventName]?.();
        if (!eventFilter) {
            throw new Error(`Event ${eventName} not found`);
        }
        const listener = (...args) => {
            const event = args[args.length - 1];
            callback(event);
        };
        if (filter?.fromBlock || filter?.toBlock) {
            // Query past events using eventQueryProvider
            const eventContract = new ethers.ethers.Contract(this.address, this.contract.interface, this.eventQueryProvider);
            eventContract.queryFilter(eventFilter, filter.fromBlock, filter.toBlock).then((events) => {
                events.forEach((event) => callback(event));
            });
        }
        // Listen for new events
        this.contract.on(eventFilter, listener);
        // Return cleanup function
        return () => {
            this.contract.off(eventFilter, listener);
        };
    }
    /**
     * Remove all event listeners
     */
    removeAllListeners(eventName) {
        if (eventName) {
            this.contract.removeAllListeners(eventName);
        }
        else {
            this.contract.removeAllListeners();
        }
    }
    /**
     * Get past events
     * Uses eventQueryProvider (Alchemy if configured) for better performance
     */
    async getPastEvents(eventName, filter) {
        const eventFilter = this.contract.filters[eventName]?.();
        if (!eventFilter) {
            throw new Error(`Event ${eventName} not found`);
        }
        // Create a contract instance using eventQueryProvider for querying events
        const eventContract = new ethers.ethers.Contract(this.address, this.contract.interface, this.eventQueryProvider);
        const events = await eventContract.queryFilter(eventFilter, filter?.fromBlock, filter?.toBlock);
        return events;
    }
    /**
     * Estimate gas for a contract call
     */
    async estimateGas(functionName, args, overrides) {
        try {
            return await this.contract[functionName].estimateGas(...args, overrides);
        }
        catch (error) {
            this.handleError(error);
        }
    }
    /**
     * Check if contract is deployed
     */
    async isDeployed() {
        const code = await this.provider.getCode(this.address);
        return code !== '0x';
    }
    /**
     * Get contract instance (for advanced usage)
     */
    getContract() {
        return this.contract;
    }
}

// src/abis/index.ts
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
const LaunchpadManagerABI = [
    // Create functions - ✅ UPDATED: Removed address parameter for projectInfoFiWallet
    'function createLaunch(string,string,uint256,uint256,uint256,uint256,tuple(string,string,string,string,string,string),bool) returns (address)',
    'function createLaunchWithVanity(string,string,uint256,uint256,uint256,uint256,tuple(string,string,string,string,string,string),bytes32,bool) returns (address)',
    'function createInstantLaunch(string,string,uint256,tuple(string,string,string,string,string,string),uint256,bool) payable returns (address)',
    'function createInstantLaunchWithVanity(string,string,uint256,tuple(string,string,string,string,string,string),uint256,bytes32,bool) payable returns (address)',
    // Core functions
    'function contribute(address) payable',
    'function claimFounderTokens(address)',
    'function claimRaisedFunds(address)',
    'function graduateToPancakeSwap(address)',
    'function launchVesting(address) view returns (uint256 startMarketCap, uint256 vestingDuration, uint256 vestingStartTime, uint256 founderTokens, uint256 founderTokensClaimed)',
    // ✅ NEW: Critical functions for Project Raise flow (FIX #2, #3, #6)
    'function claimContributorTokens(address)',
    'function claimRefund(address)',
    'function burnFailedRaiseTokens(address)',
    // View functions - ✅ UPDATED: Removed projectInfoFiWallet from return values
    'function getLaunchInfo(address) view returns (address,uint256,uint256,uint256,uint256,bool,bool,uint256,uint256,uint8,bool)',
    'function getLaunchInfoWithUSD(address) view returns (address,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool,uint8,bool)',
    'function getClaimableAmounts(address) view returns (uint256,uint256)',
    'function getContribution(address,address) view returns (uint256,bool)',
    'function getAllLaunches() view returns (address[])',
    // Admin functions
    'function updateInfoFiAddress(address)',
    'function handlePostGraduationSell(address token, uint256 tokenAmount,uint256 minBNBOut)',
    'function handlePostGraduationBuy(address token, uint256 minTokensOut) payable',
    // ✅ NEW: Additional admin functions
    'function updateFallbackPrice(uint256)',
    'function updateLPFeeHarvester(address)',
    'function emergencyWithdraw(address)',
    // ✅ NEW: Vesting and Community Control Functions
    'function claimVestedTokens(address)',
    'function updateMarketCap(address)',
    'function transferFundsToTimelock(address)',
    'function burnVestedTokensOnCommunityControl(address)',
    'function updateTimelockBeneficiary(address, address)',
    'function getCommunityControlInfo(address) view returns (bool, uint256, uint256, uint256, uint256, uint256)',
    'function getClaimableVestedTokens(address) view returns (uint256)',
    'function getMarketCapHistory(address) view returns (uint256[])',
    // Events - ✅ UPDATED: Removed projectInfoFiWallet parameter
    'event LaunchCreated(address indexed,address indexed,uint256,uint8,uint256,uint256,uint256,bool,bool)',
    'event InstantLaunchCreated(address indexed,address indexed,uint256,uint256,uint256,bool)',
    'event ContributionMade(address indexed,address indexed,uint256)',
    'event RaiseCompleted(address indexed,uint256)',
    'event GraduatedToPancakeSwap(address indexed,uint256,uint256)',
    'event FounderTokensClaimed(address indexed,address indexed,uint256)',
    'event RaisedFundsClaimed(address indexed,address indexed,uint256)',
    'event RaisedFundsSentToInfoFi(address indexed,uint256)',
    'event TokensBurned(address indexed,uint256)',
    'event LPBurned(address indexed,address indexed,uint256)',
    'event LPLocked(address indexed,address indexed,uint256)',
    'event TransfersEnabled(address indexed,uint256)',
    'event InfoFiAddressUpdated(address indexed)',
    // ✅ NEW: Critical events for Project Raise flow
    'event ContributorTokensClaimed(address indexed,address indexed,uint256)',
    'event RefundClaimed(address indexed,address indexed,uint256)',
    'event RaiseFailed(address indexed,uint256)',
    'event PlatformFeePaid(address indexed,uint256,string)',
    // ✅ NEW: Additional events
    'event PostGraduationSell(address indexed,address indexed,uint256,uint256,uint256,uint256)',
    'event PostGraduationBuy(address indexed,address indexed,uint256,uint256,uint256)',
    'event LPTokensHandled(address indexed,address indexed,uint256,bool)',
    'event PriceFeedUpdated(address indexed)',
    'event FallbackPriceUpdated(uint256)',
    'event OracleModeChanged(bool)',
    // ✅ NEW: Community Control Events
    'event VestedTokensBurnedByCommunityControl(address indexed, uint256)',
    'event CommunityControlTriggered(address indexed, uint256, uint256, uint256)',
];
/**
 * BondingCurveDEX ABI - INSTANT_LAUNCH Only
 * ✅ UPDATED: Removed LaunchType parameters - all pools are INSTANT_LAUNCH
 */
const BondingCurveDEXABI = [
    // Pool creation (only INSTANT_LAUNCH)
    'function createInstantLaunchPool(address,uint256,address,bool) payable',
    // Trading functions
    'function buyTokens(address,uint256) payable',
    'function sellTokens(address,uint256,uint256)',
    // Pool management
    'function withdrawGraduatedPool(address) returns (uint256,uint256,uint256,address)',
    'function setLPToken(address)',
    'function graduatePool(address)',
    // View functions
    'function getBuyQuote(address,uint256) view returns (uint256,uint256)',
    'function getSellQuote(address,uint256) view returns (uint256,uint256)',
    'function getPoolInfo(address) view returns (uint256,uint256,uint256,uint256,uint256,uint256,uint256,uint256,bool)',
    'function getCurrentFeeRate(address) view returns (uint256)',
    'function getFeeInfo(address) view returns (uint256,uint256,uint256,uint256,string)',
    'function getCreatorFeeInfo(address) view returns (uint256,uint256,uint256,uint256,uint256,bool)',
    'function getPostGraduationStats(address) view returns (uint256,uint256,uint256)',
    'function getActiveTokens() view returns (address[])',
    'function getPoolDebugInfo(address) view returns (uint256,uint256,uint256,uint256)',
    // Claim functions
    'function claimCreatorFees(address)',
    // Events - ✅ UPDATED: Removed LaunchType parameter from PoolCreated
    'event PoolCreated(address indexed,uint256,uint256,uint256,address indexed,uint256,uint256,uint256)',
    'event TokensBought(address indexed,address indexed,uint256,uint256,uint256,uint256)',
    'event TokensSold(address indexed,address indexed,uint256,uint256,uint256,uint256)',
    'event PoolGraduated(address indexed,uint256,uint256,uint256,uint256)',
    'event CreatorFeesClaimed(address indexed,address indexed,uint256)',
    'event CreatorFeesRedirectedToInfoFi(address indexed,uint256)',
    'event PostGraduationSell(address indexed,address indexed,uint256,uint256,uint256,uint256)',
    'event LPTokensHandled(address indexed,address indexed,uint256,bool)',
    'event FeesCollected(address indexed,uint256,uint256,uint256)',
    'event LiquidityIncreased(address indexed,uint256)',
    'event Paused(address indexed)',
    'event Unpaused(address indexed)',
];
const TokenFactoryABI = [
    'function getTotalTokens() view returns (uint256)',
    'function getTokenAtIndex(uint256) view returns (address)',
    'function getCreatorTokens(address) view returns (address[])',
    'function computeAddress(string,string,uint256,uint8,address,tuple(string,string,string,string,string,string),bytes32) view returns (address)',
];
const PriceOracleABI = [
    'function getBNBPrice() view returns (uint256)', // Returns BNB price in USD
    'function usdToBNB(uint256) view returns (uint256)', // Converts USD to BNB
    'function bnbToUSD(uint256) view returns (uint256)', // Converts BNB to USD
    'function priceFeed() view returns (address)',
];
const LPFeeHarvesterABI = [
    'function getLockInfo(address) view returns (address,address,address,uint256,uint256,uint256,uint256,bool,uint256,uint256,uint256,uint256,uint256)',
    'function getHarvestHistory(address) view returns (tuple(uint256,uint256,uint256,uint256,uint256)[])',
    'function getPlatformStats() view returns (uint256,uint256,uint256,uint256)',
    'function canHarvest(address) view returns (bool,uint256)',
    'function harvestFees(address)',
    'function unlockLP(address)',
    'function extendLock(address,uint256)',
    'function getAllLockedProjects() view returns (address[])',
    'function getActiveLocksCount() view returns (uint256)',
    'function getLPValue(address) view returns (uint256,uint256,address,address)',
    'event FeesHarvested(address indexed,uint256,uint256,uint256,uint256,uint256)',
    'event FeesDistributed(address indexed,address indexed,uint256,uint256,uint256)',
    'event LPUnlocked(address indexed,address indexed,uint256,uint256)',
    'event LockExtended(address indexed,uint256,uint256)',
    'event LPLocked(address indexed,address indexed,address indexed,address,uint256,uint256)',
];

// src/contracts/LaunchpadManager.ts
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
class LaunchpadManager extends BaseContract {
    constructor(address, provider, signer, eventQueryProvider, graph // SafuPadGraph type imported in BaseContract
    ) {
        super(address, LaunchpadManagerABI, provider, signer, eventQueryProvider, graph);
    }
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
    async createLaunch(params, options) {
        this.requireSigner();
        // Validate params
        this.validateLaunchParams(params);
        // ✅ Parse BNB amounts (BNBad native token)
        const raiseTargetBNB = ethers.ethers.parseEther(params.raiseTargetBNB);
        const raiseMaxBNB = ethers.ethers.parseEther(params.raiseMaxBNB);
        const vestingDuration = params.vestingDuration * 24 * 60 * 60; // days to seconds
        // Prepare metadata
        const metadata = [
            params.metadata.logoURI,
            params.metadata.description,
            params.metadata.website,
            params.metadata.twitter,
            params.metadata.telegram,
            params.metadata.discord,
        ];
        // Prepare team info struct for contract
        const teamInfo = [
            // FounderInfo
            [
                params.teamInfo.founder.name,
                params.teamInfo.founder.walletAddress,
                params.teamInfo.founder.bio,
            ],
            // TeamMember1
            [
                params.teamInfo.teamMember1.name,
                params.teamInfo.teamMember1.role,
                params.teamInfo.teamMember1.twitter,
                params.teamInfo.teamMember1.linkedin,
            ],
            // TeamMember2
            [
                params.teamInfo.teamMember2.name,
                params.teamInfo.teamMember2.role,
                params.teamInfo.teamMember2.twitter,
                params.teamInfo.teamMember2.linkedin,
            ],
            // teamMemberCount
            params.teamInfo.teamMemberCount,
        ];
        // ⚠️  Vanity salt is ignored - contract doesn't support createLaunchWithVanity
        // Only createLaunch() function exists in current contract version
        const tx = await this.contract.createLaunch(params.name, params.symbol, params.totalSupply, raiseTargetBNB, raiseMaxBNB, vestingDuration, metadata, params.burnLP, teamInfo, this.buildTxOptions(options, GAS_LIMITS.CREATE_LAUNCH));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async createInstantLaunch(params, options) {
        this.requireSigner();
        // Validate params
        if (params.totalSupply !== 1000000000) {
            throw new Error('Total supply must be 1 billion for instant launch');
        }
        // Convert initial buy amount (BNB)
        const initialBuyBNB = ethers.ethers.parseEther(params.initialBuyBNB);
        // Prepare metadata
        const metadata = [
            params.metadata.logoURI,
            params.metadata.description,
            params.metadata.website,
            params.metadata.twitter,
            params.metadata.telegram,
            params.metadata.discord,
        ];
        // Must send BNB with transaction
        const txOptions = this.buildTxOptions(options, GAS_LIMITS.CREATE_INSTANT_LAUNCH);
        txOptions.value = initialBuyBNB;
        // ⚠️  Vanity salt is ignored - contract doesn't support createInstantLaunchWithVanity
        // Only createInstantLaunch() function exists in current contract version
        const tx = await this.contract.createInstantLaunch(params.name, params.symbol, params.totalSupply, metadata, initialBuyBNB, params.burnLP, txOptions);
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Contribute BNB to a PROJECT_RAISE launch
     *
     * Note: Only works for PROJECT_RAISE tokens (not INSTANT_LAUNCH)
     * INSTANT_LAUNCH tokens trade on bonding curve instead via BondingCurveDEX
     *
     * ✅ Uses BNB (BNBad) for contribution
     */
    async contribute(tokenAddress, BNBAmount, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const amount = ethers.ethers.parseEther(BNBAmount);
        const txOptions = this.buildTxOptions(options, GAS_LIMITS.CONTRIBUTE);
        txOptions.value = amount;
        const tx = await this.contract.contribute(tokenAddress, txOptions);
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Claim founder tokens
     *
     * For PROJECT_RAISE: Founder gets 60% of tokens immediately (no vesting)
     * Works for both PROJECT_RAISE and INSTANT_LAUNCH
     */
    async claimFounderTokens(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.claimFounderTokens(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.CLAIM_FOUNDER_TOKENS));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Claim raised funds (BNB from raise, 80% available immediately)
     *
     * Note: Only for PROJECT_RAISE tokens
     * INSTANT_LAUNCH tokens don't have raised funds to claim
     */
    async claimRaisedFunds(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.claimRaisedFunds(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.CLAIM_RAISED_FUNDS));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async graduateToPancakeSwap(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.graduateToPancakeSwap(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.GRADUATE_TO_PANCAKESWAP));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async handlePostGraduationSell(tokenAddress, tokenAmount, minBNBOut, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const amount = ethers.ethers.parseEther(tokenAmount);
        const minOut = ethers.ethers.parseEther(minBNBOut);
        const tx = await this.contract.handlePostGraduationSell(tokenAddress, amount, minOut, this.buildTxOptions(options, GAS_LIMITS.CONTRIBUTE) // Similar gas to contribute
        );
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async handlePostGraduationBuy(tokenAddress, BNBAmount, minTokensOut, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const amount = ethers.ethers.parseEther(BNBAmount);
        const minOut = ethers.ethers.parseEther(minTokensOut);
        const txOptions = this.buildTxOptions(options, GAS_LIMITS.CONTRIBUTE); // Similar gas to contribute
        txOptions.value = amount; // Must send BNB with transaction
        const tx = await this.contract.handlePostGraduationBuy(tokenAddress, minOut, txOptions);
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Get launch information
     * ✅ UPDATED: No longer returns projectInfoFiWallet
     */
    async getLaunchInfo(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getLaunchInfo(tokenAddress);
        return {
            founder: info[0],
            raiseTarget: info[1],
            raiseMax: info[2],
            totalRaised: info[3],
            raiseDeadline: info[4],
            raiseCompleted: info[5],
            graduatedToPancakeSwap: info[6],
            raisedFundsVesting: info[7],
            raisedFundsClaimed: info[8],
            launchType: info[9], // 0 = PROJECT_RAISE, 1 = INSTANT_LAUNCH
            burnLP: info[10],
        };
    }
    /**
     * Get launch information with USD values
     * ✅ UPDATED: Returns BNB amounts (BNBad native token) + USD equivalents
     */
    async getLaunchInfoWithUSD(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getLaunchInfoWithUSD(tokenAddress);
        return {
            founder: info[0],
            raiseTargetBNB: info[1],
            raiseTargetUSD: info[2],
            raiseMaxBNB: info[3],
            raiseMaxUSD: info[4],
            totalRaisedBNB: info[5],
            totalRaisedUSD: info[6],
            raiseDeadline: info[7],
            raiseCompleted: info[8],
            launchType: info[9], // 0 = PROJECT_RAISE, 1 = INSTANT_LAUNCH
            burnLP: info[10],
        };
    }
    /**
     * Get claimable amounts for founder
     */
    async getClaimableAmounts(tokenAddress) {
        this.validateAddress(tokenAddress);
        const amounts = await this.contract.getClaimableAmounts(tokenAddress);
        return {
            claimableTokens: amounts[0],
            claimableFunds: amounts[1],
        };
    }
    /**
     * Get launch vesting information
     * Returns details about the vesting schedule for founder tokens
     */
    async getLaunchVesting(tokenAddress) {
        this.validateAddress(tokenAddress);
        const vesting = await this.contract.launchVesting(tokenAddress);
        return {
            startMarketCap: vesting.startMarketCap,
            vestingDuration: vesting.vestingDuration,
            vestingStartTime: vesting.vestingStartTime,
            founderTokens: vesting.founderTokens,
            founderTokensClaimed: vesting.founderTokensClaimed,
        };
    }
    /**
     * Get vesting progress percentage (0-100)
     */
    async getVestingProgress(tokenAddress) {
        const vesting = await this.getLaunchVesting(tokenAddress);
        if (vesting.founderTokens === 0n) {
            return 0;
        }
        const progress = Number((vesting.founderTokensClaimed * 10000n) / vesting.founderTokens) / 100;
        return Math.min(progress, 100);
    }
    /**
     * Get time-based vesting progress (0-100)
     * Based on how much time has passed in the vesting period
     */
    async getTimeBasedVestingProgress(tokenAddress) {
        const vesting = await this.getLaunchVesting(tokenAddress);
        if (vesting.vestingDuration === 0n) {
            return 100;
        }
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const vestingStartTime = vesting.vestingStartTime;
        const vestingEndTime = vestingStartTime + vesting.vestingDuration;
        if (currentTime >= vestingEndTime) {
            return 100;
        }
        if (currentTime <= vestingStartTime) {
            return 0;
        }
        const elapsed = currentTime - vestingStartTime;
        const progress = Number((elapsed * 10000n) / vesting.vestingDuration) / 100;
        return Math.min(progress, 100);
    }
    /**
     * Get remaining vesting time in seconds
     */
    async getRemainingVestingTime(tokenAddress) {
        const vesting = await this.getLaunchVesting(tokenAddress);
        const currentTime = BigInt(Math.floor(Date.now() / 1000));
        const vestingEndTime = vesting.vestingStartTime + vesting.vestingDuration;
        if (currentTime >= vestingEndTime) {
            return 0;
        }
        return Number(vestingEndTime - currentTime);
    }
    /**
     * Get contribution info for an address
     *
     * Note: Only relevant for PROJECT_RAISE tokens
     */
    async getContribution(tokenAddress, contributor) {
        this.validateAddress(tokenAddress);
        this.validateAddress(contributor);
        const info = await this.contract.getContribution(tokenAddress, contributor);
        return {
            amount: info[0],
            claimed: info[1],
        };
    }
    /**
     * Get all launches (both PROJECT_RAISE and INSTANT_LAUNCH)
     */
    async getAllLaunches() {
        return await this.contract.getAllLaunches();
    }
    /**
     * Check if address is a valid launch
     */
    async isValidLaunch(tokenAddress) {
        try {
            const info = await this.getLaunchInfo(tokenAddress);
            return info.founder !== ethers.ethers.ZeroAddress;
        }
        catch {
            return false;
        }
    }
    /**
     * Get launch progress percentage
     *
     * Note: Only meaningful for PROJECT_RAISE tokens
     * For INSTANT_LAUNCH, check BondingCurveDEX graduation progress instead
     */
    async getLaunchProgress(tokenAddress) {
        const info = await this.getLaunchInfo(tokenAddress);
        if (info.raiseTarget === 0n) {
            return 100;
        }
        const progress = Number((info.totalRaised * 10000n) / info.raiseTarget) / 100;
        return Math.min(progress, 100);
    }
    /**
     * Check if launch deadline has passed
     *
     * Note: Only relevant for PROJECT_RAISE tokens (72-hour / 3-day deadline)
     * INSTANT_LAUNCH tokens have no deadline
     */
    async hasLaunchDeadlinePassed(tokenAddress) {
        const info = await this.getLaunchInfo(tokenAddress);
        const currentTime = Math.floor(Date.now() / 1000);
        return Number(info.raiseDeadline) < currentTime;
    }
    /**
     * Get time remaining until deadline
     *
     * Note: Only relevant for PROJECT_RAISE tokens
     * Returns 0 for INSTANT_LAUNCH tokens
     */
    async getTimeUntilDeadline(tokenAddress) {
        const info = await this.getLaunchInfo(tokenAddress);
        const currentTime = Math.floor(Date.now() / 1000);
        const timeRemaining = Number(info.raiseDeadline) - currentTime;
        return Math.max(timeRemaining, 0);
    }
    /**
     * Listen to LaunchCreated events (PROJECT_RAISE)
     */
    onLaunchCreated(callback, filter) {
        return this.addEventListener('LaunchCreated', callback, filter);
    }
    /**
     * Listen to InstantLaunchCreated events (INSTANT_LAUNCH)
     */
    onInstantLaunchCreated(callback, filter) {
        return this.addEventListener('InstantLaunchCreated', callback, filter);
    }
    /**
     * Listen to ContributionMade events (PROJECT_RAISE only)
     */
    onContributionMade(callback, filter) {
        return this.addEventListener('ContributionMade', callback, filter);
    }
    /**
     * Listen to RaiseCompleted events (PROJECT_RAISE only)
     */
    onRaiseCompleted(callback, filter) {
        return this.addEventListener('RaiseCompleted', callback, filter);
    }
    /**
     * Listen to GraduatedToPancakeSwap events (both launch types)
     */
    onGraduatedToPancakeSwap(callback, filter) {
        return this.addEventListener('GraduatedToPancakeSwap', callback, filter);
    }
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
    async claimContributorTokens(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.claimContributorTokens(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.CLAIM_CONTRIBUTOR_TOKENS));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async claimRefund(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.claimRefund(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.CLAIM_REFUND));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async burnFailedRaiseTokens(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.burnFailedRaiseTokens(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.BURN_FAILED_RAISE_TOKENS));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * ✅ NEW: Update fallback BNB price (admin only, BNBad native token)
     *
     * Updates the fallback price used when the oracle fails.
     * Only callable by contract owner.
     *
     * @param price - New fallback price (in 8 decimals format, e.g., "120000000000" for $1200)
     * @param options - Transaction options
     */
    async updateFallbackPrice(price, options) {
        this.requireSigner();
        const tx = await this.contract.updateFallbackPrice(price, this.buildTxOptions(options, GAS_LIMITS.UPDATE_FALLBACK_PRICE));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * ✅ NEW: Update LP fee harvester address (admin only)
     *
     * Updates the LP fee harvester contract address.
     * Only callable by contract owner.
     *
     * @param lpFeeHarvesterAddress - New LP fee harvester contract address
     * @param options - Transaction options
     */
    async updateLPFeeHarvester(lpFeeHarvesterAddress, options) {
        this.requireSigner();
        this.validateAddress(lpFeeHarvesterAddress);
        const tx = await this.contract.updateLPFeeHarvester(lpFeeHarvesterAddress, this.buildTxOptions(options, GAS_LIMITS.UPDATE_LP_FEE_HARVESTER));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * ✅ NEW: Emergency withdraw tokens (admin only)
     *
     * Emergency function to withdraw tokens from failed PROJECT_RAISE.
     * Only callable by contract owner after deadline if raise failed.
     *
     * @param tokenAddress - Address of the token to withdraw
     * @param options - Transaction options
     */
    async emergencyWithdraw(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.emergencyWithdraw(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.EMERGENCY_WITHDRAW));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * ✅ NEW: Check if contributor can claim tokens
     *
     * Helper method to check if a contributor is eligible to claim their tokens
     */
    async canClaimContributorTokens(tokenAddress, contributorAddress) {
        try {
            const info = await this.getLaunchInfo(tokenAddress);
            const contribution = await this.getContribution(tokenAddress, contributorAddress);
            return (info.launchType === 1 && // PROJECT_RAISE
                info.raiseCompleted &&
                info.totalRaised >= info.raiseTarget &&
                contribution.amount > 0n &&
                !contribution.claimed);
        }
        catch {
            return false;
        }
    }
    /**
     * ✅ NEW: Check if contributor can claim refund
     *
     * Helper method to check if a contributor is eligible to claim a refund
     */
    async canClaimRefund(tokenAddress, contributorAddress) {
        try {
            const info = await this.getLaunchInfo(tokenAddress);
            const contribution = await this.getContribution(tokenAddress, contributorAddress);
            const currentTime = Math.floor(Date.now() / 1000);
            return (info.launchType === 1 && // PROJECT_RAISE
                currentTime > Number(info.raiseDeadline) &&
                info.totalRaised < info.raiseTarget &&
                !info.raiseCompleted &&
                contribution.amount > 0n &&
                !contribution.claimed);
        }
        catch {
            return false;
        }
    }
    /**
     * ✅ NEW: Get contributor's token allocation
     *
     * Calculate how many tokens a contributor would receive after successful raise
     */
    async getContributorTokenAllocation(tokenAddress, contributorAddress) {
        const info = await this.getLaunchInfo(tokenAddress);
        const contribution = await this.getContribution(tokenAddress, contributorAddress);
        if (contribution.amount === 0n || info.totalRaised === 0n) {
            return 0n;
        }
        // Get total supply from token contract or use 1 billion default
        const totalSupply = 1000000000n * 10n ** 18n;
        const contributorPool = (totalSupply * 70n) / 100n; // 70% for contributors
        return (contribution.amount * contributorPool) / info.totalRaised;
    }
    /**
     * ✅ NEW: Listen to ContributorTokensClaimed events
     */
    onContributorTokensClaimed(callback, filter) {
        return this.addEventListener('ContributorTokensClaimed', callback, filter);
    }
    /**
     * ✅ NEW: Listen to RefundClaimed events
     */
    onRefundClaimed(callback, filter) {
        return this.addEventListener('RefundClaimed', callback, filter);
    }
    /**
     * ✅ NEW: Listen to RaiseFailed events
     */
    onRaiseFailed(callback, filter) {
        return this.addEventListener('RaiseFailed', callback, filter);
    }
    /**
     * ✅ NEW: Listen to PlatformFeePaid events
     */
    onPlatformFeePaid(callback, filter) {
        return this.addEventListener('PlatformFeePaid', callback, filter);
    }
    /**
     * ✅ NEW: Listen to PostGraduationBuy events
     */
    onPostGraduationBuy(callback, filter) {
        return this.addEventListener('PostGraduationBuy', callback, filter);
    }
    /**
     * ✅ NEW: Listen to VestedTokensBurnedByCommunityControl events
     */
    onVestedTokensBurned(callback, filter) {
        return this.addEventListener('VestedTokensBurnedByCommunityControl', callback, filter);
    }
    /**
     * ✅ NEW: Listen to CommunityControlTriggered events
     */
    onCommunityControlTriggered(callback, filter) {
        return this.addEventListener('CommunityControlTriggered', callback, filter);
    }
    // ==================== VESTING & COMMUNITY CONTROL METHODS ====================
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
    async claimVestedTokens(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.claimVestedTokens(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.CLAIM_FOUNDER_TOKENS));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async updateMarketCap(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.updateMarketCap(tokenAddress, this.buildTxOptions(options));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async transferFundsToTimelock(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.transferFundsToTimelock(tokenAddress, this.buildTxOptions(options));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * ✅ NEW: Burn remaining vested tokens when community control is triggered
     *
     * Only owner (platform) can call - per governance model.
     * Called after community consultation and decision.
     *
     * @param tokenAddress - Address of the launched token
     * @param options - Transaction options
     */
    async burnVestedTokensOnCommunityControl(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.burnVestedTokensOnCommunityControl(tokenAddress, this.buildTxOptions(options));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async updateTimelockBeneficiary(tokenAddress, newBeneficiary, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        this.validateAddress(newBeneficiary);
        const tx = await this.contract.updateTimelockBeneficiary(tokenAddress, newBeneficiary, this.buildTxOptions(options));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * ✅ NEW: Get information about community control status
     *
     * Useful for frontend to display community governance state.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Community control information
     */
    async getCommunityControlInfo(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getCommunityControlInfo(tokenAddress);
        return {
            communityControlActive: info[0],
            consecutiveBNBthsBelowStart: info[1],
            currentMarketCap: info[2],
            startMarketCap: info[3],
            remainingFunds: info[4],
            remainingVestedTokens: info[5],
        };
    }
    /**
     * ✅ NEW: Get claimable vested tokens amount
     *
     * Returns 0 if community control is active.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Amount of vested tokens that can be claimed
     */
    async getClaimableVestedTokens(tokenAddress) {
        this.validateAddress(tokenAddress);
        return await this.contract.getClaimableVestedTokens(tokenAddress);
    }
    /**
     * ✅ NEW: Get BNBthly market cap history
     *
     * Useful for frontend to display market cap trends.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Array of BNBthly market cap values
     */
    async getMarketCapHistory(tokenAddress) {
        this.validateAddress(tokenAddress);
        const history = await this.contract.getMarketCapHistory(tokenAddress);
        return history.map((cap) => BigInt(cap.toString()));
    }
    /**
     * ✅ NEW: Update InfoFi address (admin only)
     *
     * Updates the global InfoFi fee address.
     * Only callable by contract owner.
     *
     * @param infoFiAddress - New InfoFi address
     * @param options - Transaction options
     */
    async updateInfoFiAddress(infoFiAddress, options) {
        this.requireSigner();
        this.validateAddress(infoFiAddress);
        const tx = await this.contract.updateInfoFiAddress(infoFiAddress, this.buildTxOptions(options));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    // ==================== TEAM INFO METHODS ====================
    /**
     * ✅ NEW: Get founder information for a launch
     *
     * Returns the founder's name, wallet address, and bio.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Founder information
     */
    async getFounderInfo(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getFounderInfo(tokenAddress);
        return {
            name: info[0],
            walletAddress: info[1],
            bio: info[2],
        };
    }
    /**
     * ✅ NEW: Get team members for a launch
     *
     * Returns up to 2 team members with their details.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Team members and count
     */
    async getTeamMembers(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getTeamMembers(tokenAddress);
        return {
            teamMember1: {
                name: info[0].name,
                role: info[0].role,
                twitter: info[0].twitter,
                linkedin: info[0].linkedin,
            },
            teamMember2: {
                name: info[1].name,
                role: info[1].role,
                twitter: info[1].twitter,
                linkedin: info[1].linkedin,
            },
            teamMemberCount: Number(info[2]),
        };
    }
    /**
     * ✅ NEW: Get complete team info for a launch
     *
     * Returns founder info and all team members.
     *
     * @param tokenAddress - Address of the launched token
     * @returns Complete team information
     */
    async getLaunchTeamInfo(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getLaunchTeamInfo(tokenAddress);
        return {
            founder: {
                name: info.founder.name,
                walletAddress: info.founder.walletAddress,
                bio: info.founder.bio,
            },
            teamMember1: {
                name: info.teamMember1.name,
                role: info.teamMember1.role,
                twitter: info.teamMember1.twitter,
                linkedin: info.teamMember1.linkedin,
            },
            teamMember2: {
                name: info.teamMember2.name,
                role: info.teamMember2.role,
                twitter: info.teamMember2.twitter,
                linkedin: info.teamMember2.linkedin,
            },
            teamMemberCount: Number(info.teamMemberCount),
        };
    }
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
    async updateFounderInfo(tokenAddress, name, bio, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.updateFounderInfo(tokenAddress, name, bio, this.buildTxOptions(options));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
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
    async updateTeamMembers(tokenAddress, teamMember1, teamMember2, teamMemberCount, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        if (teamMemberCount > 2) {
            throw new Error('Maximum 2 team members allowed');
        }
        // Prepare team member structs for contract
        const member1 = [
            teamMember1.name,
            teamMember1.role,
            teamMember1.twitter,
            teamMember1.linkedin,
        ];
        const member2 = [
            teamMember2.name,
            teamMember2.role,
            teamMember2.twitter,
            teamMember2.linkedin,
        ];
        const tx = await this.contract.updateTeamMembers(tokenAddress, member1, member2, teamMemberCount, this.buildTxOptions(options));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Validate launch parameters
     * ✅ UPDATED: Validates BNB amounts (BNBad native token)
     * Note: Contract enforces actual validation, this is for client-side UX
     */
    validateLaunchParams(params) {
        const minRaiseBNB = parseFloat(CONSTANTS.MIN_RAISE_BNB); // 5M BNB
        const maxRaiseBNB = parseFloat(CONSTANTS.MAX_RAISE_BNB); // 20M BNB
        const minVesting = CONSTANTS.MIN_VESTING_DURATION / (24 * 60 * 60); // 90 days
        const maxVesting = CONSTANTS.MAX_VESTING_DURATION / (24 * 60 * 60); // 180 days
        const raiseTarget = parseFloat(params.raiseTargetBNB);
        const raiseMax = parseFloat(params.raiseMaxBNB);
        if (raiseTarget < minRaiseBNB || raiseTarget > maxRaiseBNB) {
            throw new Error(`Raise target must be between ${minRaiseBNB.toLocaleString()} and ${maxRaiseBNB.toLocaleString()} BNB`);
        }
        if (raiseMax < raiseTarget || raiseMax > maxRaiseBNB) {
            throw new Error(`Raise max must be between raise target and ${maxRaiseBNB.toLocaleString()} BNB`);
        }
        if (params.vestingDuration < minVesting || params.vestingDuration > maxVesting) {
            throw new Error(`Vesting duration must be between ${minVesting} and ${maxVesting} days (Note: Contract overrides to 180 days)`);
        }
    }
}

// src/contracts/BondingCurveDEX.ts
/**
 * BondingCurveDEX contract wrapper
 */
class BondingCurveDEX extends BaseContract {
    constructor(address, provider, signer, eventQueryProvider, graph // SafuPadGraph type imported in BaseContract
    ) {
        super(address, BondingCurveDEXABI, provider, signer, eventQueryProvider, graph);
    }
    /**
     * Safely parse ether amount and handle edge cases
     */
    safeParseEther(amount) {
        // Convert scientific notation to decimal string
        const numValue = Number(amount);
        // Check if value is too small (less than 1 wei)
        if (numValue < 1e-18) {
            throw new Error(`Amount too small: ${amount} (minimum is 1 wei = 1e-18 ETH)`);
        }
        // Convert to fixed decimal string to avoid scientific notation
        const decimalString = numValue.toFixed(18);
        return ethers.ethers.parseEther(decimalString);
    }
    /**
     * Safely format ether amount and handle very small values
     * Prevents scientific notation in output
     */
    safeFormatEther(amount) {
        const formatted = ethers.ethers.formatEther(amount);
        const numValue = Number(formatted);
        // If the number is very small and would be in scientific notation
        if (numValue > 0 && numValue < 0.000001) {
            // Convert to fixed decimal string without scientific notation
            return numValue.toFixed(18).replace(/\.?0+$/, '');
        }
        return formatted;
    }
    /**
     * Buy tokens from bonding curve
     */
    async buyTokens(tokenAddress, BNBAmount, slippageTolerance = 1, // 1% default
    options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const amount = this.safeParseEther(BNBAmount);
        // Get quote
        const quote = await this.getBuyQuote(tokenAddress, BNBAmount);
        // Calculate min tokens with slippage
        const minTokensOut = (quote.tokensOut * BigInt(100 - slippageTolerance)) / 100n;
        // Build transaction
        const txOptions = this.buildTxOptions(options, GAS_LIMITS.BUY_TOKENS);
        txOptions.value = amount;
        const tx = await this.contract.buyTokens(tokenAddress, minTokensOut, txOptions);
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Sell tokens to bonding curve
     */
    async sellTokens(tokenAddress, tokenAmount, slippageTolerance = 1, // 1% default
    options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const amount = ethers.ethers.parseEther(tokenAmount);
        // Get quote
        const quote = await this.getSellQuote(tokenAddress, tokenAmount);
        // Calculate min BNB with slippage
        const minBNBOut = (quote.tokensOut * BigInt(100 - slippageTolerance)) / 100n;
        const tx = await this.contract.sellTokens(tokenAddress, amount, minBNBOut, this.buildTxOptions(options, GAS_LIMITS.SELL_TOKENS));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Get buy quote (how many tokens for X BNB)
     */
    async getBuyQuote(tokenAddress, BNBAmount) {
        this.validateAddress(tokenAddress);
        const amount = this.safeParseEther(BNBAmount);
        const quote = await this.contract.getBuyQuote(tokenAddress, amount);
        return {
            tokensOut: quote[0], // tokensOut
            pricePerToken: quote[1], // pricePerToken
        };
    }
    /**
     * Get sell quote (how much BNB for X tokens)
     */
    async getSellQuote(tokenAddress, tokenAmount) {
        this.validateAddress(tokenAddress);
        const amount = ethers.ethers.parseEther(tokenAmount);
        const quote = await this.contract.getSellQuote(tokenAddress, amount);
        return {
            tokensOut: quote[0], // BNBOut
            pricePerToken: quote[1], // pricePerToken
        };
    }
    /**
     * Get pool information
     */
    async getPoolInfo(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getPoolInfo(tokenAddress);
        return {
            marketCapBNB: info[0],
            marketCapUSD: info[1],
            BNBReserve: info[2],
            tokenReserve: info[3],
            reservedTokens: info[4],
            currentPrice: info[5],
            priceMultiplier: info[6],
            graduationProgress: info[7],
            graduated: info[8],
        };
    }
    /**
     * Get current fee rate for a token
     */
    async getCurrentFeeRate(tokenAddress) {
        this.validateAddress(tokenAddress);
        return await this.contract.getCurrentFeeRate(tokenAddress);
    }
    /**
     * Get detailed fee information
     */
    async getFeeInfo(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getFeeInfo(tokenAddress);
        return {
            currentFeeRate: info[0],
            finalFeeRate: info[1],
            blocksSinceLaunch: info[2],
            blocksUntilNextTier: info[3],
            feeStage: info[4],
        };
    }
    /**
     * Get creator fee information
     */
    async getCreatorFeeInfo(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getCreatorFeeInfo(tokenAddress);
        return {
            accumulatedFees: info[0],
            lastClaimTime: info[1],
            graduationMarketCap: info[2],
            currentMarketCap: info[3],
            BNBInPool: info[4],
            canClaim: info[5],
        };
    }
    /**
     * Claim creator fees
     */
    async claimCreatorFees(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.claimCreatorFees(tokenAddress, this.buildTxOptions(options));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Get post-graduation statistics
     */
    async getPostGraduationStats(tokenAddress) {
        this.validateAddress(tokenAddress);
        const stats = await this.contract.getPostGraduationStats(tokenAddress);
        return {
            totalTokensSold: stats[0],
            totalLiquidityAdded: stats[1],
            lpTokensGenerated: stats[2],
        };
    }
    /**
     * Get all active tokens
     */
    async getActiveTokens() {
        return await this.contract.getActiveTokens();
    }
    /**
     * Check if pool is graduated
     */
    async isGraduated(tokenAddress) {
        const info = await this.getPoolInfo(tokenAddress);
        return info.graduated;
    }
    /**
     * Calculate price impact for buy
     */
    async calculateBuyPriceImpact(tokenAddress, BNBAmount) {
        const poolInfo = await this.getPoolInfo(tokenAddress);
        const quote = await this.getBuyQuote(tokenAddress, BNBAmount);
        if (poolInfo.currentPrice === 0n || quote.tokensOut === 0n) {
            return 0;
        }
        const avgPrice = (this.safeParseEther(BNBAmount) * 10n ** 18n) / quote.tokensOut;
        const priceImpact = Number(((avgPrice - poolInfo.currentPrice) * 10000n) / poolInfo.currentPrice) / 100;
        return priceImpact;
    }
    /**
     * Calculate price impact for sell
     */
    async calculateSellPriceImpact(tokenAddress, tokenAmount) {
        const poolInfo = await this.getPoolInfo(tokenAddress);
        const quote = await this.getSellQuote(tokenAddress, tokenAmount);
        if (poolInfo.currentPrice === 0n || quote.tokensOut === 0n) {
            return 0;
        }
        const avgPrice = (quote.tokensOut * 10n ** 18n) / ethers.ethers.parseEther(tokenAmount);
        const priceImpact = Number(((poolInfo.currentPrice - avgPrice) * 10000n) / poolInfo.currentPrice) / 100;
        return priceImpact;
    }
    /**
     * Estimate time until fee tier changes
     */
    async estimateTimeUntilFeeTierChange(tokenAddress) {
        const feeInfo = await this.getFeeInfo(tokenAddress);
        if (feeInfo.blocksUntilNextTier === 0n) {
            return 0;
        }
        // Assume 1 second block time for BNBad
        const secondsRemaining = Number(feeInfo.blocksUntilNextTier) * 1;
        return secondsRemaining;
    }
    /**
     * Get formatted fee percentage
     */
    async getCurrentFeePercentage(tokenAddress) {
        const feeRate = await this.getCurrentFeeRate(tokenAddress);
        return `${Number(feeRate) / 100}%`;
    }
    // ==================== VOLUME TRACKING METHODS ====================
    /**
     * Get total trading volume for a token (all time)
     * Uses The Graph if available, falls back to events
     */
    async getTotalVolume(tokenAddress, fromBlock = 0) {
        this.validateAddress(tokenAddress);
        // ✅ Use The Graph if available (much faster!)
        if (this.hasGraphSupport() && this.graph) {
            const pool = await this.graph.getPool(tokenAddress.toLowerCase());
            if (pool) {
                return {
                    totalBuyVolumeBNB: BigInt(pool.totalVolume) / 2n, // Rough estimate
                    totalSellVolumeBNB: BigInt(pool.totalVolume) / 2n, // Rough estimate
                    totalVolumeBNB: BigInt(pool.totalVolume),
                    totalBuyVolumeTokens: 0n, // Not available in pool stats
                    totalSellVolumeTokens: 0n, // Not available in pool stats
                    buyCount: Number(pool.totalBuys),
                    sellCount: Number(pool.totalSells),
                    uniqueBuyers: 0, // Would need separate query
                    uniqueSellers: 0, // Would need separate query
                    uniqueTraders: 0, // Would need separate query
                };
            }
        }
        // ⚠️ Fallback to events
        const latestBlock = await this.provider.getBlockNumber();
        return this.getVolumeForPeriod(tokenAddress, fromBlock, latestBlock);
    }
    /**
     * Get trading volume for a specific time period
     * Uses The Graph if available, falls back to events
     */
    async getVolumeForPeriod(tokenAddress, fromBlock, toBlock, minTimestamp) {
        this.validateAddress(tokenAddress);
        // ✅ Use The Graph if available (much faster!)
        if (this.hasGraphSupport() && this.graph && minTimestamp) {
            const trades = await this.graph.getTrades({ token: tokenAddress.toLowerCase() }, { first: 1000, orderBy: 'timestamp', orderDirection: 'desc' });
            // Filter by timestamp
            const filteredTrades = trades.filter((t) => Number(t.timestamp) >= minTimestamp);
            const buyTrades = filteredTrades.filter((t) => t.isBuy);
            const sellTrades = filteredTrades.filter((t) => !t.isBuy);
            const buyVolumeBNB = buyTrades.reduce((sum, t) => sum + BigInt(t.BNBAmount), 0n);
            const sellVolumeBNB = sellTrades.reduce((sum, t) => sum + BigInt(t.BNBAmount), 0n);
            const buyVolumeTokens = buyTrades.reduce((sum, t) => sum + BigInt(t.tokenAmount), 0n);
            const sellVolumeTokens = sellTrades.reduce((sum, t) => sum + BigInt(t.tokenAmount), 0n);
            const buyers = new Set(buyTrades.map((t) => t.trader.toLowerCase()));
            const sellers = new Set(sellTrades.map((t) => t.trader.toLowerCase()));
            const allTraders = new Set([...buyers, ...sellers]);
            return {
                totalBuyVolumeBNB: buyVolumeBNB,
                totalSellVolumeBNB: sellVolumeBNB,
                totalVolumeBNB: buyVolumeBNB + sellVolumeBNB,
                totalBuyVolumeTokens: buyVolumeTokens,
                totalSellVolumeTokens: sellVolumeTokens,
                buyCount: buyTrades.length,
                sellCount: sellTrades.length,
                uniqueBuyers: buyers.size,
                uniqueSellers: sellers.size,
                uniqueTraders: allTraders.size,
            };
        }
        // ⚠️ Fallback to events
        const [buyEvents, sellEvents] = await Promise.all([
            this.getTokensBoughtEvents(tokenAddress, fromBlock, toBlock),
            this.getTokensSoldEvents(tokenAddress, fromBlock, toBlock),
        ]);
        // Filter by timestamp if provided
        let filteredBuyEvents = buyEvents;
        let filteredSellEvents = sellEvents;
        if (minTimestamp) {
            filteredBuyEvents = buyEvents.filter((e) => e.timestamp >= minTimestamp);
            filteredSellEvents = sellEvents.filter((e) => e.timestamp >= minTimestamp);
        }
        // Calculate volumes
        const buyVolumeBNB = filteredBuyEvents.reduce((sum, e) => sum + e.BNBAmount, 0n);
        const sellVolumeBNB = filteredSellEvents.reduce((sum, e) => sum + e.BNBAmount, 0n);
        const buyVolumeTokens = filteredBuyEvents.reduce((sum, e) => sum + e.tokenAmount, 0n);
        const sellVolumeTokens = filteredSellEvents.reduce((sum, e) => sum + e.tokenAmount, 0n);
        // Calculate unique traders
        const buyers = new Set(filteredBuyEvents.map((e) => e.trader.toLowerCase()));
        const sellers = new Set(filteredSellEvents.map((e) => e.trader.toLowerCase()));
        const allTraders = new Set([...buyers, ...sellers]);
        return {
            totalBuyVolumeBNB: buyVolumeBNB,
            totalSellVolumeBNB: sellVolumeBNB,
            totalVolumeBNB: buyVolumeBNB + sellVolumeBNB,
            totalBuyVolumeTokens: buyVolumeTokens,
            totalSellVolumeTokens: sellVolumeTokens,
            buyCount: filteredBuyEvents.length,
            sellCount: filteredSellEvents.length,
            uniqueBuyers: buyers.size,
            uniqueSellers: sellers.size,
            uniqueTraders: allTraders.size,
        };
    }
    /**
     * Get trading volume grouped by time intervals (hourly, daily, etc.)
     * Uses The Graph if available, falls back to events
     */
    async getVolumeHistory(tokenAddress, intervalSeconds = 3600, // 1 hour default
    periods = 24, fromBlock) {
        this.validateAddress(tokenAddress);
        const currentTime = Math.floor(Date.now() / 1000);
        // ✅ Use The Graph if available (much faster!)
        if (this.hasGraphSupport() && this.graph) {
            // Calculate time range
            const startTime = currentTime - (periods * intervalSeconds);
            // Fetch all trades in the time range
            const allTrades = await this.graph.getTrades({ token: tokenAddress.toLowerCase() }, { first: 1000, orderBy: 'timestamp', orderDirection: 'desc' });
            // Filter trades within our time range
            const relevantTrades = allTrades.filter((t) => {
                const tradeTime = Number(t.timestamp);
                return tradeTime >= startTime && tradeTime <= currentTime;
            });
            // Group trades by interval
            const intervals = new Map();
            for (const trade of relevantTrades) {
                const tradeTime = Number(trade.timestamp);
                const intervalStart = Math.floor(tradeTime / intervalSeconds) * intervalSeconds;
                if (!intervals.has(intervalStart)) {
                    intervals.set(intervalStart, { buys: [], sells: [] });
                }
                if (trade.isBuy) {
                    intervals.get(intervalStart).buys.push(trade);
                }
                else {
                    intervals.get(intervalStart).sells.push(trade);
                }
            }
            // Generate results for all periods
            const results = [];
            for (let i = 0; i < periods; i++) {
                const intervalStart = currentTime - (periods - i) * intervalSeconds;
                const data = intervals.get(intervalStart) || { buys: [], sells: [] };
                const buyVolumeBNB = data.buys.reduce((sum, t) => sum + BigInt(t.BNBAmount), 0n);
                const sellVolumeBNB = data.sells.reduce((sum, t) => sum + BigInt(t.BNBAmount), 0n);
                const buyVolumeTokens = data.buys.reduce((sum, t) => sum + BigInt(t.tokenAmount), 0n);
                const sellVolumeTokens = data.sells.reduce((sum, t) => sum + BigInt(t.tokenAmount), 0n);
                const buyers = new Set(data.buys.map((t) => t.trader.toLowerCase()));
                const sellers = new Set(data.sells.map((t) => t.trader.toLowerCase()));
                const allTraders = new Set([...buyers, ...sellers]);
                results.push({
                    timestamp: intervalStart + intervalSeconds,
                    intervalStart,
                    totalBuyVolumeBNB: buyVolumeBNB,
                    totalSellVolumeBNB: sellVolumeBNB,
                    totalVolumeBNB: buyVolumeBNB + sellVolumeBNB,
                    totalBuyVolumeTokens: buyVolumeTokens,
                    totalSellVolumeTokens: sellVolumeTokens,
                    buyCount: data.buys.length,
                    sellCount: data.sells.length,
                    uniqueBuyers: buyers.size,
                    uniqueSellers: sellers.size,
                    uniqueTraders: allTraders.size,
                });
            }
            return results;
        }
        // ⚠️ Fallback to events (slower, use only when Graph not available)
        const latestBlock = await this.provider.getBlockNumber();
        // Calculate blocks to fetch (estimate)
        const totalSeconds = intervalSeconds * periods;
        const estimatedBlocks = Math.floor(totalSeconds / 3);
        const startBlock = fromBlock || Math.max(0, latestBlock - estimatedBlocks);
        const [buyEvents, sellEvents] = await Promise.all([
            this.getTokensBoughtEvents(tokenAddress, startBlock, latestBlock),
            this.getTokensSoldEvents(tokenAddress, startBlock, latestBlock),
        ]);
        // Group events by interval
        const intervals = new Map();
        for (const event of buyEvents) {
            const intervalStart = Math.floor(event.timestamp / intervalSeconds) * intervalSeconds;
            if (!intervals.has(intervalStart)) {
                intervals.set(intervalStart, { buys: [], sells: [] });
            }
            intervals.get(intervalStart).buys.push(event);
        }
        for (const event of sellEvents) {
            const intervalStart = Math.floor(event.timestamp / intervalSeconds) * intervalSeconds;
            if (!intervals.has(intervalStart)) {
                intervals.set(intervalStart, { buys: [], sells: [] });
            }
            intervals.get(intervalStart).sells.push(event);
        }
        // Convert to array and calculate volumes for each interval
        const results = [];
        for (let i = 0; i < periods; i++) {
            const intervalStart = currentTime - (periods - i) * intervalSeconds;
            const data = intervals.get(intervalStart) || { buys: [], sells: [] };
            const buyVolumeBNB = data.buys.reduce((sum, e) => sum + e.BNBAmount, 0n);
            const sellVolumeBNB = data.sells.reduce((sum, e) => sum + e.BNBAmount, 0n);
            const buyVolumeTokens = data.buys.reduce((sum, e) => sum + e.tokenAmount, 0n);
            const sellVolumeTokens = data.sells.reduce((sum, e) => sum + e.tokenAmount, 0n);
            const buyers = new Set(data.buys.map((e) => e.trader.toLowerCase()));
            const sellers = new Set(data.sells.map((e) => e.trader.toLowerCase()));
            const allTraders = new Set([...buyers, ...sellers]);
            results.push({
                timestamp: intervalStart + intervalSeconds,
                intervalStart,
                totalBuyVolumeBNB: buyVolumeBNB,
                totalSellVolumeBNB: sellVolumeBNB,
                totalVolumeBNB: buyVolumeBNB + sellVolumeBNB,
                totalBuyVolumeTokens: buyVolumeTokens,
                totalSellVolumeTokens: sellVolumeTokens,
                buyCount: data.buys.length,
                sellCount: data.sells.length,
                uniqueBuyers: buyers.size,
                uniqueSellers: sellers.size,
                uniqueTraders: allTraders.size,
            });
        }
        return results;
    }
    /**
     * Get recent trades for a token
     * Uses The Graph if available, falls back to events
     */
    async getRecentTrades(tokenAddress, limit = 50, fromBlock) {
        this.validateAddress(tokenAddress);
        // ✅ Use The Graph if available (much faster!)
        if (this.hasGraphSupport() && this.graph) {
            const trades = await this.graph.getTrades({ token: tokenAddress.toLowerCase() }, { first: limit, orderBy: 'timestamp', orderDirection: 'desc' });
            return trades.map((t) => ({
                type: t.isBuy ? 'buy' : 'sell',
                trader: t.trader,
                tokenAddress: t.token.id,
                BNBAmount: BigInt(t.BNBAmount),
                tokenAmount: BigInt(t.tokenAmount),
                price: BigInt(t.price),
                feeRate: BigInt(t.feeRate),
                blockNumber: Number(t.blockNumber),
                timestamp: Number(t.timestamp),
                txHash: t.transactionHash,
            }));
        }
        // ⚠️ Fallback to events (slower, use only when Graph not available)
        const latestBlock = await this.provider.getBlockNumber();
        const startBlock = fromBlock || Math.max(0, latestBlock - 10000); // Last ~8 hours
        const [buyEvents, sellEvents] = await Promise.all([
            this.getTokensBoughtEvents(tokenAddress, startBlock, latestBlock),
            this.getTokensSoldEvents(tokenAddress, startBlock, latestBlock),
        ]);
        // Combine and sort by timestamp (descending)
        const allTrades = [...buyEvents, ...sellEvents].sort((a, b) => b.timestamp - a.timestamp);
        return allTrades.slice(0, limit);
    }
    /**
     * Get TokensBought events with detailed trade data
     * ✅ FIXED: Use event.args instead of event.topics
     * Uses eventQueryProvider (Alchemy if configured) for better performance
     */
    async getTokensBoughtEvents(tokenAddress, fromBlock, toBlock) {
        // Create contract instance using eventQueryProvider for event queries
        const eventContract = new ethers.ethers.Contract(this.address, this.contract.interface, this.eventQueryProvider);
        const filter = eventContract.filters.TokensBought(null, tokenAddress);
        const events = await eventContract.queryFilter(filter, fromBlock, toBlock);
        const trades = [];
        const abiCoder = new ethers.ethers.AbiCoder();
        for (const event of events) {
            const block = await event.getBlock();
            const args = event.topics;
            const data = event.data;
            const topics = abiCoder.decode(['uint256', 'uint256', 'uint256', 'uint256'], data);
            trades.push({
                type: 'buy',
                trader: args[1], // buyer
                tokenAddress: args[2], // token
                BNBAmount: topics[0], // BNBReceived
                tokenAmount: topics[1], // tokensAmount
                price: topics[2], // currentPrice
                feeRate: topics[3], // feeRate
                blockNumber: event.blockNumber,
                timestamp: block.timestamp,
                txHash: event.transactionHash,
            });
        }
        return trades;
    }
    /**
     * Get TokensSold events with detailed trade data
     * ✅ FIXED: Use event.args instead of event.topics
     * Uses eventQueryProvider (Alchemy if configured) for better performance
     */
    async getTokensSoldEvents(tokenAddress, fromBlock, toBlock) {
        // Create contract instance using eventQueryProvider for event queries
        const eventContract = new ethers.ethers.Contract(this.address, this.contract.interface, this.eventQueryProvider);
        const filter = eventContract.filters.TokensSold(null, tokenAddress);
        const events = await eventContract.queryFilter(filter, fromBlock, toBlock);
        const trades = [];
        const abiCoder = new ethers.ethers.AbiCoder();
        for (const event of events) {
            const block = await event.getBlock();
            const args = event.topics;
            const data = event.data;
            const topics = abiCoder.decode(['uint256', 'uint256', 'uint256', 'uint256'], data);
            trades.push({
                type: 'sell',
                trader: args[0], // seller
                tokenAddress: args[1], // token
                BNBAmount: topics[0], // BNBReceived
                tokenAmount: topics[1], // tokensAmount
                price: topics[2], // currentPrice
                feeRate: topics[3], // feeRate
                blockNumber: event.blockNumber,
                timestamp: block.timestamp,
                txHash: event.transactionHash,
            });
        }
        return trades;
    }
    /**
     * Get top traders by volume
     * Uses The Graph if available, falls back to events
     */
    async getTopTraders(tokenAddress, limit = 10, fromBlock = 0) {
        this.validateAddress(tokenAddress);
        // ✅ Use The Graph if available (much faster!)
        if (this.hasGraphSupport() && this.graph) {
            const allTrades = await this.graph.getTrades({ token: tokenAddress.toLowerCase() }, { first: 1000, orderBy: 'timestamp', orderDirection: 'desc' });
            // Aggregate by trader
            const traderMap = new Map();
            for (const trade of allTrades) {
                const addr = trade.trader.toLowerCase();
                const existing = traderMap.get(addr) || {
                    buyVolumeBNB: 0n,
                    sellVolumeBNB: 0n,
                    buyCount: 0,
                    sellCount: 0,
                    netTokens: 0n,
                };
                if (trade.isBuy) {
                    existing.buyVolumeBNB += BigInt(trade.BNBAmount);
                    existing.buyCount++;
                    existing.netTokens += BigInt(trade.tokenAmount);
                }
                else {
                    existing.sellVolumeBNB += BigInt(trade.BNBAmount);
                    existing.sellCount++;
                    existing.netTokens -= BigInt(trade.tokenAmount);
                }
                traderMap.set(addr, existing);
            }
            // Convert to array and sort by total volume
            const traders = Array.from(traderMap.entries())
                .map(([address, data]) => ({
                address,
                buyVolumeBNB: data.buyVolumeBNB,
                sellVolumeBNB: data.sellVolumeBNB,
                totalVolumeBNB: data.buyVolumeBNB + data.sellVolumeBNB,
                buyCount: data.buyCount,
                sellCount: data.sellCount,
                netTokens: data.netTokens,
            }))
                .sort((a, b) => (a.totalVolumeBNB > b.totalVolumeBNB ? -1 : 1));
            return traders.slice(0, limit);
        }
        // ⚠️ Fallback to events (slower, use only when Graph not available)
        const latestBlock = await this.provider.getBlockNumber();
        const [buyEvents, sellEvents] = await Promise.all([
            this.getTokensBoughtEvents(tokenAddress, fromBlock, latestBlock),
            this.getTokensSoldEvents(tokenAddress, fromBlock, latestBlock),
        ]);
        // Aggregate by trader
        const traderMap = new Map();
        for (const trade of buyEvents) {
            const addr = trade.trader.toLowerCase();
            const existing = traderMap.get(addr) || {
                buyVolumeBNB: 0n,
                sellVolumeBNB: 0n,
                buyCount: 0,
                sellCount: 0,
                netTokens: 0n,
            };
            existing.buyVolumeBNB += trade.BNBAmount;
            existing.buyCount++;
            existing.netTokens += trade.tokenAmount;
            traderMap.set(addr, existing);
        }
        for (const trade of sellEvents) {
            const addr = trade.trader.toLowerCase();
            const existing = traderMap.get(addr) || {
                buyVolumeBNB: 0n,
                sellVolumeBNB: 0n,
                buyCount: 0,
                sellCount: 0,
                netTokens: 0n,
            };
            existing.sellVolumeBNB += trade.BNBAmount;
            existing.sellCount++;
            existing.netTokens -= trade.tokenAmount;
            traderMap.set(addr, existing);
        }
        // Convert to array and sort by total volume
        const traders = Array.from(traderMap.entries())
            .map(([address, data]) => ({
            address,
            buyVolumeBNB: data.buyVolumeBNB,
            sellVolumeBNB: data.sellVolumeBNB,
            totalVolumeBNB: data.buyVolumeBNB + data.sellVolumeBNB,
            buyCount: data.buyCount,
            sellCount: data.sellCount,
            netTokens: data.netTokens,
        }))
            .sort((a, b) => (a.totalVolumeBNB > b.totalVolumeBNB ? -1 : 1));
        return traders.slice(0, limit);
    }
    /**
     * Get holder count estimate from trading activity
     * Uses The Graph if available, falls back to events
     */
    async getEstimatedHolderCount(tokenAddress, fromBlock = 0) {
        this.validateAddress(tokenAddress);
        // ✅ Use The Graph if available (much faster and more accurate!)
        if (this.hasGraphSupport() && this.graph) {
            const holders = await this.graph.getTokenHolders(tokenAddress.toLowerCase(), {
                first: 1000,
                orderBy: 'balance',
                orderDirection: 'desc'
            });
            // Count holders with positive balance
            return holders.filter((h) => BigInt(h.balance) > 0n).length;
        }
        // ⚠️ Fallback to events (slower and less accurate)
        const latestBlock = await this.provider.getBlockNumber();
        const [buyEvents, sellEvents] = await Promise.all([
            this.getTokensBoughtEvents(tokenAddress, fromBlock, latestBlock),
            this.getTokensSoldEvents(tokenAddress, fromBlock, latestBlock),
        ]);
        // Track net token balances
        const balances = new Map();
        for (const trade of buyEvents) {
            const addr = trade.trader.toLowerCase();
            balances.set(addr, (balances.get(addr) || 0n) + trade.tokenAmount);
        }
        for (const trade of sellEvents) {
            const addr = trade.trader.toLowerCase();
            balances.set(addr, (balances.get(addr) || 0n) - trade.tokenAmount);
        }
        // Count holders with positive balance
        let holderCount = 0;
        for (const balance of balances.values()) {
            if (balance > 0n) {
                holderCount++;
            }
        }
        return holderCount;
    }
    /**
     * Get 24h trading volume in BNB
     * Returns both the bigint value and formatted string
     * Uses The Graph if available, falls back to events
     */
    async get24hVolume(tokenAddress) {
        this.validateAddress(tokenAddress);
        // ✅ Use The Graph if available (much faster!)
        if (this.hasGraphSupport() && this.graph) {
            const currentTime = Math.floor(Date.now() / 1000);
            const time24hAgo = currentTime - (24 * 60 * 60);
            const allTrades = await this.graph.getTrades({ token: tokenAddress.toLowerCase() }, { first: 1000, orderBy: 'timestamp', orderDirection: 'desc' });
            // Filter trades from last 24 hours
            const recent24hTrades = allTrades.filter((t) => Number(t.timestamp) >= time24hAgo);
            const buyTrades = recent24hTrades.filter((t) => t.isBuy);
            const sellTrades = recent24hTrades.filter((t) => !t.isBuy);
            const buyVolume = buyTrades.reduce((sum, t) => sum + BigInt(t.BNBAmount), 0n);
            const sellVolume = sellTrades.reduce((sum, t) => sum + BigInt(t.BNBAmount), 0n);
            const totalVolume = buyVolume + sellVolume;
            return {
                volumeBNB: totalVolume,
                volumeFormatted: this.safeFormatEther(totalVolume),
                buyVolumeBNB: buyVolume,
                sellVolumeBNB: sellVolume,
                tradeCount: recent24hTrades.length,
            };
        }
        // ⚠️ Fallback to events (slower, use only when Graph not available)
        // Calculate blocks in last 24 hours (BNBad: ~1 second per block = ~86,400 blocks/day)
        const latestBlock = await this.provider.getBlockNumber();
        const blocksPerDay = 86400;
        const fromBlock = Math.max(0, latestBlock - blocksPerDay);
        const [buyEvents, sellEvents] = await Promise.all([
            this.getTokensBoughtEvents(tokenAddress, fromBlock, latestBlock),
            this.getTokensSoldEvents(tokenAddress, fromBlock, latestBlock),
        ]);
        const buyVolume = buyEvents.reduce((sum, trade) => sum + trade.BNBAmount, 0n);
        const sellVolume = sellEvents.reduce((sum, trade) => sum + trade.BNBAmount, 0n);
        const totalVolume = buyVolume + sellVolume;
        return {
            volumeBNB: totalVolume,
            volumeFormatted: this.safeFormatEther(totalVolume),
            buyVolumeBNB: buyVolume,
            sellVolumeBNB: sellVolume,
            tradeCount: buyEvents.length + sellEvents.length,
        };
    }
    /**
     * Get 24h price change percentage
     * Returns the price change over the last 24 hours
     * Uses The Graph if available, falls back to events
     */
    async get24hPriceChange(tokenAddress) {
        this.validateAddress(tokenAddress);
        // Get current price
        const poolInfo = await this.getPoolInfo(tokenAddress);
        const currentPrice = poolInfo.currentPrice;
        // ✅ Use The Graph if available (much faster!)
        if (this.hasGraphSupport() && this.graph) {
            const currentTime = Math.floor(Date.now() / 1000);
            const time24hAgo = currentTime - (24 * 60 * 60);
            const allTrades = await this.graph.getTrades({ token: tokenAddress.toLowerCase() }, { first: 1000, orderBy: 'timestamp', orderDirection: 'asc' });
            // Find the first trade around 24h ago
            const trade24hAgo = allTrades.find((t) => Number(t.timestamp) >= time24hAgo);
            // If no trades found 24h ago, return 0 change
            if (!trade24hAgo) {
                return {
                    priceChange: 0,
                    priceChangePercent: 0,
                    currentPrice,
                    price24hAgo: currentPrice,
                };
            }
            const price24hAgo = BigInt(trade24hAgo.price);
            // Calculate change
            const priceDiff = currentPrice - price24hAgo;
            const priceChange = Number(priceDiff) / Number(price24hAgo);
            const priceChangePercent = priceChange * 100;
            return {
                priceChange,
                priceChangePercent,
                currentPrice,
                price24hAgo,
            };
        }
        // ⚠️ Fallback to events (slower, use only when Graph not available)
        // Calculate blocks in last 24 hours
        const latestBlock = await this.provider.getBlockNumber();
        const blocksPerDay = 28800;
        const targetBlock = Math.max(0, latestBlock - blocksPerDay);
        // Get trades around 24h ago to find the price
        const [buyEvents, sellEvents] = await Promise.all([
            this.getTokensBoughtEvents(tokenAddress, Math.max(0, targetBlock - 100), targetBlock),
            this.getTokensSoldEvents(tokenAddress, Math.max(0, targetBlock - 100), targetBlock),
        ]);
        // Combine and sort by block number to get the last trade around 24h ago
        const allTrades = [...buyEvents, ...sellEvents].sort((a, b) => b.blockNumber - a.blockNumber);
        // If no trades found 24h ago, return 0 change
        if (allTrades.length === 0) {
            return {
                priceChange: 0,
                priceChangePercent: 0,
                currentPrice,
                price24hAgo: currentPrice,
            };
        }
        const price24hAgo = allTrades[0].price;
        // Calculate change
        const priceDiff = currentPrice - price24hAgo;
        const priceChangePercent = price24hAgo > 0n ? Number((priceDiff * 10000n) / price24hAgo) / 100 : 0;
        return {
            priceChange: Number(ethers.ethers.formatEther(priceDiff)),
            priceChangePercent,
            currentPrice,
            price24hAgo,
        };
    }
    // ==================== UTILITY METHODS ====================
    /**
     * Format BNB amount (bigint) to readable string
     * Handles very small amounts without scientific notation
     */
    formatBNBAmount(amount) {
        return this.safeFormatEther(amount);
    }
    /**
     * Format token amount (bigint) to readable string
     * Handles very small amounts without scientific notation
     */
    formatTokenAmount(amount, decimals = 18) {
        const formatted = ethers.ethers.formatUnits(amount, decimals);
        const numValue = Number(formatted);
        // If the number is very small and would be in scientific notation
        if (numValue > 0 && numValue < 0.000001) {
            return numValue.toFixed(decimals).replace(/\.?0+$/, '');
        }
        return formatted;
    }
    /**
     * Parse BNB amount string to bigint
     * Handles scientific notation and very small values
     */
    parseBNBAmount(amount) {
        return this.safeParseEther(amount);
    }
    // ==================== EVENT LISTENERS ====================
    /**
     * Listen to TokensBought events
     */
    onTokensBought(callback, filter) {
        return this.addEventListener('TokensBought', callback, filter);
    }
    /**
     * Listen to TokensSold events
     */
    onTokensSold(callback, filter) {
        return this.addEventListener('TokensSold', callback, filter);
    }
    /**
     * Listen to PoolGraduated events
     */
    onPoolGraduated(callback, filter) {
        return this.addEventListener('PoolGraduated', callback, filter);
    }
    /**
     * Listen to PostGraduationSell events
     */
    onPostGraduationSell(callback, filter) {
        return this.addEventListener('PostGraduationSell', callback, filter);
    }
    /**
     * Listen to CreatorFeesClaimed events
     */
    onCreatorFeesClaimed(callback, filter) {
        return this.addEventListener('CreatorFeesClaimed', callback, filter);
    }
}

// src/contracts/TokenFactory.ts
class TokenFactory extends BaseContract {
    constructor(address, provider, signer, eventQueryProvider, graph // SafuPadGraph type imported in BaseContract
    ) {
        super(address, TokenFactoryABI, provider, signer, eventQueryProvider, graph);
    }
    /**
     * Get total number of tokens created
     */
    async getTotalTokens() {
        const total = await this.contract.getTotalTokens();
        return Number(total);
    }
    /**
     * Get token at index
     */
    async getTokenAtIndex(index) {
        return await this.contract.getTokenAtIndex(index);
    }
    /**
     * Get all tokens created by an address
     */
    async getCreatorTokens(creator) {
        this.validateAddress(creator);
        return await this.contract.getCreatorTokens(creator);
    }
    /**
     * Compute vanity address for a token
     */
    async computeAddress(name, symbol, totalSupply, decimals, owner, metadata, salt) {
        this.validateAddress(owner);
        const metadataArray = [
            metadata.logoURI,
            metadata.description,
            metadata.website,
            metadata.twitter,
            metadata.telegram,
            metadata.discord,
        ];
        return await this.contract.computeAddress(name, symbol, totalSupply, decimals, owner, metadataArray, salt);
    }
    /**
     * Get token information (requires ERC20 interface)
     */
    async getTokenInfo(tokenAddress) {
        this.validateAddress(tokenAddress);
        const tokenContract = new ethers.ethers.Contract(tokenAddress, [
            'function name() view returns (string)',
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)',
            'function totalSupply() view returns (uint256)',
            'function getMetadata() view returns (tuple(string,string,string,string,string,string))',
        ], this.provider);
        const [name, symbol, decimals, totalSupply, metadata] = await Promise.all([
            tokenContract.name(),
            tokenContract.symbol(),
            tokenContract.decimals(),
            tokenContract.totalSupply(),
            tokenContract.getMetadata(),
        ]);
        return {
            address: tokenAddress,
            name,
            symbol,
            decimals,
            totalSupply,
            metadata: {
                logoURI: metadata[0],
                description: metadata[1],
                website: metadata[2],
                twitter: metadata[3],
                telegram: metadata[4],
                discord: metadata[5],
            },
        };
    }
}

// src/contracts/PriceOracle.ts
class PriceOracle extends BaseContract {
    constructor(address, provider, signer, eventQueryProvider, graph // SafuPadGraph type imported in BaseContract
    ) {
        super(address, PriceOracleABI, provider, signer, eventQueryProvider, graph);
    }
    /**
     * Get current BNB price in USD (8 decimals) - BSC native token
     */
    async getBNBPrice() {
        return await this.contract.getBNBPrice();
    }
    /**
     * Get BNB price formatted as string (BSC native token)
     */
    async getBNBPriceFormatted() {
        const price = await this.getBNBPrice();
        return ethers.ethers.formatUnits(price, 8);
    }
    /**
     * Convert USD to BNB (BSC native token)
     */
    async usdToBNB(usdAmount) {
        return await this.contract.usdToBNB(usdAmount);
    }
    /**
     * Convert BNB to USD (BSC native token)
     */
    async bnbToUSD(bnbAmount) {
        return await this.contract.bnbToUSD(bnbAmount);
    }
    /**
     * Convert USD string to BNB (BSC native token)
     */
    async convertUSDToBNB(usdAmountStr) {
        const usdAmount = ethers.ethers.parseUnits(usdAmountStr, 18);
        const bnbAmount = await this.usdToBNB(usdAmount);
        return ethers.ethers.formatEther(bnbAmount);
    }
    /**
     * Convert BNB string to USD (BSC native token)
     */
    async convertBNBToUSD(bnbAmountStr) {
        const bnbAmount = ethers.ethers.parseEther(bnbAmountStr);
        const usdAmount = await this.bnbToUSD(bnbAmount);
        return ethers.ethers.formatUnits(usdAmount, 18);
    }
    /**
     * Get price feed address
     */
    async getPriceFeedAddress() {
        return await this.contract.priceFeed();
    }
}

class LPFeeHarvester extends BaseContract {
    constructor(address, provider, signer, eventQueryProvider, graph // SafuPadGraph type imported in BaseContract
    ) {
        super(address, LPFeeHarvesterABI, provider, signer, eventQueryProvider, graph);
    }
    /**
     * Get LP lock information
     */
    async getLockInfo(tokenAddress) {
        this.validateAddress(tokenAddress);
        const info = await this.contract.getLockInfo(tokenAddress);
        // ✅ FIX: Access tuple by index
        return {
            lpToken: info[0],
            creator: info[1],
            projectInfoFi: info[2],
            lpAmount: info[3],
            initialLPAmount: info[4],
            lockTime: info[5],
            unlockTime: info[6],
            active: info[7],
            totalFeesHarvested: info[8],
            harvestCount: info[9],
            timeUntilUnlock: info[10],
            estimatedValue: info[11],
            lastHarvestTime: info[12],
        };
    }
    /**
     * Get harvest history for a token
     */
    async getHarvestHistory(tokenAddress) {
        this.validateAddress(tokenAddress);
        const history = await this.contract.getHarvestHistory(tokenAddress);
        // ✅ FIX: Map array of tuples correctly
        return history.map((h) => ({
            bnbAmount: h[0],
            token0Amount: h[1],
            token1Amount: h[2],
            timestamp: h[3],
            lpBurned: h[4],
        }));
    }
    /**
     * Get platform statistics
     */
    async getPlatformStats() {
        const stats = await this.contract.getPlatformStats();
        // ✅ FIX: Access tuple by index
        return {
            totalValueLocked: stats[0],
            totalFeesDistributed: stats[1],
            totalHarvests: stats[2],
            activeLocksCount: stats[3],
        };
    }
    /**
     * Check if harvesting is available
     */
    async canHarvest(tokenAddress) {
        this.validateAddress(tokenAddress);
        const result = await this.contract.canHarvest(tokenAddress);
        // ✅ FIX: Access tuple by index
        return {
            ready: result[0],
            timeRemaining: result[1],
        };
    }
    /**
     * Harvest fees from LP position
     */
    async harvestFees(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.harvestFees(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.HARVEST_FEES));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Unlock LP tokens after lock period
     */
    async unlockLP(tokenAddress, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const tx = await this.contract.unlockLP(tokenAddress, this.buildTxOptions(options, GAS_LIMITS.UNLOCK_LP));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Extend lock duration
     */
    async extendLock(tokenAddress, additionalDays, options) {
        this.requireSigner();
        this.validateAddress(tokenAddress);
        const additionalDuration = BigInt(additionalDays * 24 * 60 * 60);
        const tx = await this.contract.extendLock(tokenAddress, additionalDuration, this.buildTxOptions(options));
        return {
            hash: tx.hash,
            wait: () => tx.wait(),
        };
    }
    /**
     * Get all locked projects
     */
    async getAllLockedProjects() {
        return await this.contract.getAllLockedProjects();
    }
    /**
     * Get active locks count
     */
    async getActiveLocksCount() {
        const count = await this.contract.getActiveLocksCount();
        return Number(count);
    }
    /**
     * Get LP value for a token
     */
    async getLPValue(tokenAddress) {
        this.validateAddress(tokenAddress);
        const value = await this.contract.getLPValue(tokenAddress);
        // ✅ FIX: Access tuple by index
        return {
            token0Amount: value[0],
            token1Amount: value[1],
            token0: value[2],
            token1: value[3],
        };
    }
    /**
     * Check if lock is expired
     */
    async isLockExpired(tokenAddress) {
        const info = await this.getLockInfo(tokenAddress);
        const currentTime = Math.floor(Date.now() / 1000);
        return Number(info.unlockTime) <= currentTime;
    }
    /**
     * Get time until unlock
     */
    async getTimeUntilUnlock(tokenAddress) {
        const info = await this.getLockInfo(tokenAddress);
        return Number(info.timeUntilUnlock);
    }
    /**
     * Get time until next harvest
     */
    async getTimeUntilNextHarvest(tokenAddress) {
        const canHarvestInfo = await this.canHarvest(tokenAddress);
        if (canHarvestInfo.ready) {
            return 0;
        }
        return Number(canHarvestInfo.timeRemaining);
    }
    /**
     * Listen to FeesHarvested events
     */
    onFeesHarvested(callback, filter) {
        return this.addEventListener('FeesHarvested', callback, filter);
    }
    /**
     * Listen to LPUnlocked events
     */
    onLPUnlocked(callback, filter) {
        return this.addEventListener('LPUnlocked', callback, filter);
    }
    /**
     * Listen to LockExtended events
     */
    onLockExtended(callback, filter) {
        return this.addEventListener('LockExtended', callback, filter);
    }
}

// src/graph/queries.ts
/**
 * GraphQL queries for SafuPad subgraph
 */
/**
 * Get token by address with all related data
 */
const GET_TOKEN = `
  query GetToken($id: ID!) {
    token(id: $id) {
      id
      name
      symbol
      decimals
      totalSupply
      creator
      createdAt
      createdAtBlock
      logoURI
      description
      website
      twitter
      telegram
      discord
      totalVolume
      totalTrades
      launch {
        id
        founder
        launchType
        totalSupply
        raiseTarget
        raiseMax
        raiseDeadline
        totalRaised
        raiseCompleted
        liquidityAdded
        graduatedToPancakeSwap
        burnLP
        vestingDuration
        vestingStartTime
        founderTokens
        founderTokensClaimed
        vestedTokens
        vestedTokensClaimed
        startMarketCap
        monthlyMarketCaps
        consecutiveMonthsBelowStart
        communityControlTriggered
        liquidityBNB
        liquidityTokens
        raisedFundsVesting
        raisedFundsClaimed
        createdAt
        createdAtBlock
      }
      pool {
        id
        creator
        bnbReserve
        tokenReserve
        reservedTokens
        virtualBnbReserve
        marketCap
        graduationMarketCap
        currentPrice
        active
        graduated
        burnLP
        lpToken
        bnbForPancakeSwap
        launchBlock
        graduationBnbThreshold
        totalVolume
        totalBuys
        totalSells
        createdAt
        graduatedAt
      }
    }
  }
`;
/**
 * Get all launches with optional filters
 */
const GET_LAUNCHES = `
  query GetLaunches(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "createdAt"
    $orderDirection: String = "desc"
    $where: Launch_filter
  ) {
    launches(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      founder
      launchType
      totalSupply
      raiseTarget
      raiseMax
      raiseDeadline
      totalRaised
      raiseCompleted
      liquidityAdded
      graduatedToPancakeSwap
      burnLP
      createdAt
      createdAtBlock
      token {
        id
        name
        symbol
        logoURI
        totalVolume
        totalTrades
      }
    }
  }
`;
/**
 * Get launch by token address
 */
const GET_LAUNCH = `
  query GetLaunch($id: ID!) {
    launch(id: $id) {
      id
      founder
      launchType
      totalSupply
      raiseTarget
      raiseMax
      raiseDeadline
      totalRaised
      raiseCompleted
      liquidityAdded
      graduatedToPancakeSwap
      burnLP
      vestingDuration
      vestingStartTime
      founderTokens
      founderTokensClaimed
      vestedTokens
      vestedTokensClaimed
      startMarketCap
      monthlyMarketCaps
      consecutiveMonthsBelowStart
      communityControlTriggered
      liquidityBNB
      liquidityTokens
      raisedFundsVesting
      raisedFundsClaimed
      createdAt
      createdAtBlock
      token {
        id
        name
        symbol
        decimals
        totalSupply
        logoURI
        description
        website
        twitter
        telegram
        discord
      }
      contributions {
        id
        contributor
        amount
        claimed
        timestamp
        transactionHash
      }
    }
  }
`;
/**
 * Get pool by token address
 */
const GET_POOL = `
  query GetPool($id: ID!) {
    pool(id: $id) {
      id
      creator
      bnbReserve
      tokenReserve
      reservedTokens
      virtualBnbReserve
      marketCap
      graduationMarketCap
      currentPrice
      active
      graduated
      burnLP
      lpToken
      bnbForPancakeSwap
      launchBlock
      graduationBnbThreshold
      totalVolume
      totalBuys
      totalSells
      createdAt
      graduatedAt
      token {
        id
        name
        symbol
        decimals
        logoURI
      }
    }
  }
`;
/**
 * Get pools with filters
 */
const GET_POOLS = `
  query GetPools(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "createdAt"
    $orderDirection: String = "desc"
    $where: Pool_filter
  ) {
    pools(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      creator
      bnbReserve
      tokenReserve
      currentPrice
      marketCap
      graduated
      active
      totalVolume
      totalBuys
      totalSells
      createdAt
      token {
        id
        name
        symbol
        logoURI
      }
    }
  }
`;
/**
 * Get trades for a token
 */
const GET_TRADES = `
  query GetTrades(
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "timestamp"
    $orderDirection: String = "desc"
    $where: Trade_filter
  ) {
    trades(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: $where
    ) {
      id
      trader
      isBuy
      bnbAmount
      tokenAmount
      price
      feeRate
      totalFee
      timestamp
      blockNumber
      transactionHash
      token {
        id
        name
        symbol
      }
    }
  }
`;
/**
 * Get contributions for a launch
 */
const GET_CONTRIBUTIONS = `
  query GetContributions($launchId: ID!, $first: Int = 100, $skip: Int = 0) {
    contributions(
      first: $first
      skip: $skip
      orderBy: "timestamp"
      orderDirection: "desc"
      where: { launch: $launchId }
    ) {
      id
      contributor
      amount
      claimed
      timestamp
      transactionHash
    }
  }
`;
/**
 * Get contribution for specific contributor
 */
const GET_CONTRIBUTION = `
  query GetContribution($launchId: ID!, $contributor: Bytes!) {
    contributions(
      where: { launch: $launchId, contributor: $contributor }
    ) {
      id
      contributor
      amount
      claimed
      timestamp
      transactionHash
    }
  }
`;
/**
 * Get token holders
 */
const GET_TOKEN_HOLDERS = `
  query GetTokenHolders(
    $tokenId: ID!
    $first: Int = 100
    $skip: Int = 0
    $orderBy: String = "balance"
    $orderDirection: String = "desc"
  ) {
    tokenHolders(
      first: $first
      skip: $skip
      orderBy: $orderBy
      orderDirection: $orderDirection
      where: { token: $tokenId }
    ) {
      id
      holder
      balance
      totalBought
      totalSold
      firstBuyTimestamp
      lastActivityTimestamp
    }
  }
`;
/**
 * Get creator fees
 */
const GET_CREATOR_FEES = `
  query GetCreatorFees($tokenId: ID!, $creator: Bytes!) {
    creatorFees(where: { token: $tokenId, creator: $creator }) {
      id
      accumulatedFees
      totalClaimed
      lastClaimTime
      claimCount
    }
  }
`;
/**
 * Get platform statistics
 */
const GET_PLATFORM_STATS = `
  query GetPlatformStats {
    platformStats(id: "platform") {
      id
      totalLaunches
      totalProjectRaises
      totalInstantLaunches
      totalGraduated
      totalVolume
      totalFees
      totalRaised
      lastUpdated
    }
  }
`;
/**
 * Get daily statistics
 */
const GET_DAILY_STATS = `
  query GetDailyStats(
    $first: Int = 30
    $orderBy: String = "date"
    $orderDirection: String = "desc"
  ) {
    dailyStats(
      first: $first
      orderBy: $orderBy
      orderDirection: $orderDirection
    ) {
      id
      date
      launches
      volume
      fees
      trades
      uniqueTraders
    }
  }
`;
/**
 * Search tokens by name or symbol
 */
const SEARCH_TOKENS = `
  query SearchTokens($searchText: String!, $first: Int = 10) {
    tokens(
      first: $first
      where: {
        or: [
          { name_contains_nocase: $searchText }
          { symbol_contains_nocase: $searchText }
        ]
      }
      orderBy: "totalVolume"
      orderDirection: "desc"
    ) {
      id
      name
      symbol
      decimals
      logoURI
      totalVolume
      totalTrades
      createdAt
      launch {
        launchType
        graduatedToPancakeSwap
      }
      pool {
        currentPrice
        marketCap
        graduated
      }
    }
  }
`;
/**
 * Get user's trading history
 */
const GET_USER_TRADES = `
  query GetUserTrades(
    $trader: Bytes!
    $first: Int = 100
    $skip: Int = 0
  ) {
    trades(
      first: $first
      skip: $skip
      orderBy: "timestamp"
      orderDirection: "desc"
      where: { trader: $trader }
    ) {
      id
      isBuy
      bnbAmount
      tokenAmount
      price
      timestamp
      transactionHash
      token {
        id
        name
        symbol
        logoURI
      }
    }
  }
`;
/**
 * Get user's contributions
 */
const GET_USER_CONTRIBUTIONS = `
  query GetUserContributions(
    $contributor: Bytes!
    $first: Int = 100
    $skip: Int = 0
  ) {
    contributions(
      first: $first
      skip: $skip
      orderBy: "timestamp"
      orderDirection: "desc"
      where: { contributor: $contributor }
    ) {
      id
      amount
      claimed
      timestamp
      transactionHash
      launch {
        id
        launchType
        raiseCompleted
        token {
          id
          name
          symbol
          logoURI
        }
      }
    }
  }
`;
/**
 * Get trending tokens (by volume in last 24h)
 */
const GET_TRENDING_TOKENS = `
  query GetTrendingTokens($first: Int = 10) {
    tokens(
      first: $first
      orderBy: "totalVolume"
      orderDirection: "desc"
    ) {
      id
      name
      symbol
      logoURI
      totalVolume
      totalTrades
      pool {
        currentPrice
        marketCap
        graduated
        totalBuys
        totalSells
      }
    }
  }
`;

// src/graph/client.ts
/**
 * GraphQL client for The Graph API
 */
class GraphQLClient {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }
    /**
     * Execute a GraphQL query
     */
    async query(query, variables) {
        try {
            const response = await fetch(this.endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query,
                    variables: variables || {},
                }),
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            if (result.errors && result.errors.length > 0) {
                const error = result.errors[0];
                throw new Error(`GraphQL error: ${error.message}`);
            }
            return result;
        }
        catch (error) {
            if (error instanceof Error) {
                throw new Error(`Failed to query subgraph: ${error.message}`);
            }
            throw new Error('Failed to query subgraph: Unknown error');
        }
    }
    /**
     * Update the endpoint URL
     */
    setEndpoint(endpoint) {
        this.endpoint = endpoint;
    }
    /**
     * Get current endpoint
     */
    getEndpoint() {
        return this.endpoint;
    }
}

// src/graph/SafuPadGraph.ts
/**
 * SafuPad subgraph client
 * Provides methods to query indexed data from The Graph
 */
class SafuPadGraph {
    constructor(subgraphUrl) {
        this.client = new GraphQLClient(subgraphUrl);
    }
    /**
     * Get token by address
     */
    async getToken(tokenAddress) {
        const response = await this.client.query(GET_TOKEN, {
            id: tokenAddress.toLowerCase(),
        });
        return response.data?.token || null;
    }
    /**
     * Get launch by token address
     */
    async getLaunch(tokenAddress) {
        const response = await this.client.query(GET_LAUNCH, {
            id: tokenAddress.toLowerCase(),
        });
        return response.data?.launch || null;
    }
    /**
     * Get all launches with optional filters and pagination
     */
    async getLaunches(filters, pagination) {
        const where = {};
        if (filters?.launchType) {
            where.launchType = filters.launchType;
        }
        if (filters?.founder) {
            where.founder = filters.founder.toLowerCase();
        }
        if (filters?.raiseCompleted !== undefined) {
            where.raiseCompleted = filters.raiseCompleted;
        }
        if (filters?.graduatedToPancakeSwap !== undefined) {
            where.graduatedToPancakeSwap = filters.graduatedToPancakeSwap;
        }
        const response = await this.client.query(GET_LAUNCHES, {
            where,
            first: pagination?.first || 100,
            skip: pagination?.skip || 0,
            orderBy: pagination?.orderBy || 'createdAt',
            orderDirection: pagination?.orderDirection || 'desc',
        });
        return response.data?.launches || [];
    }
    /**
     * Get pool by token address
     */
    async getPool(tokenAddress) {
        const response = await this.client.query(GET_POOL, {
            id: tokenAddress.toLowerCase(),
        });
        return response.data?.pool || null;
    }
    /**
     * Get all pools with optional filters and pagination
     */
    async getPools(filters, pagination) {
        const where = {};
        if (filters?.graduated !== undefined) {
            where.graduated = filters.graduated;
        }
        if (filters?.active !== undefined) {
            where.active = filters.active;
        }
        const response = await this.client.query(GET_POOLS, {
            where,
            first: pagination?.first || 100,
            skip: pagination?.skip || 0,
            orderBy: pagination?.orderBy || 'createdAt',
            orderDirection: pagination?.orderDirection || 'desc',
        });
        return response.data?.pools || [];
    }
    /**
     * Get trades with optional filters and pagination
     */
    async getTrades(filters, pagination) {
        const where = {};
        if (filters?.token) {
            where.token = filters.token.toLowerCase();
        }
        if (filters?.trader) {
            where.trader = filters.trader.toLowerCase();
        }
        if (filters?.isBuy !== undefined) {
            where.isBuy = filters.isBuy;
        }
        const response = await this.client.query(GET_TRADES, {
            where,
            first: pagination?.first || 100,
            skip: pagination?.skip || 0,
            orderBy: pagination?.orderBy || 'timestamp',
            orderDirection: pagination?.orderDirection || 'desc',
        });
        return response.data?.trades || [];
    }
    /**
     * Get contributions for a launch
     */
    async getContributions(launchId, pagination) {
        const response = await this.client.query(GET_CONTRIBUTIONS, {
            launchId: launchId.toLowerCase(),
            first: pagination?.first || 100,
            skip: pagination?.skip || 0,
        });
        return response.data?.contributions || [];
    }
    /**
     * Get contribution for a specific contributor
     */
    async getContribution(launchId, contributor) {
        const response = await this.client.query(GET_CONTRIBUTION, {
            launchId: launchId.toLowerCase(),
            contributor: contributor.toLowerCase(),
        });
        const contributions = response.data?.contributions || [];
        return contributions.length > 0 ? contributions[0] : null;
    }
    /**
     * Get token holders
     */
    async getTokenHolders(tokenId, pagination) {
        const response = await this.client.query(GET_TOKEN_HOLDERS, {
            tokenId: tokenId.toLowerCase(),
            first: pagination?.first || 100,
            skip: pagination?.skip || 0,
            orderBy: pagination?.orderBy || 'balance',
            orderDirection: pagination?.orderDirection || 'desc',
        });
        return response.data?.tokenHolders || [];
    }
    /**
     * Get creator fees
     */
    async getCreatorFees(tokenId, creator) {
        const response = await this.client.query(GET_CREATOR_FEES, {
            tokenId: tokenId.toLowerCase(),
            creator: creator.toLowerCase(),
        });
        const fees = response.data?.creatorFees || [];
        return fees.length > 0 ? fees[0] : null;
    }
    /**
     * Get platform statistics
     */
    async getPlatformStats() {
        const response = await this.client.query(GET_PLATFORM_STATS);
        return response.data?.platformStats || null;
    }
    /**
     * Get daily statistics
     */
    async getDailyStats(days = 30) {
        const response = await this.client.query(GET_DAILY_STATS, {
            first: days,
        });
        return response.data?.dailyStats || [];
    }
    /**
     * Search tokens by name or symbol
     */
    async searchTokens(searchText, limit = 10) {
        const response = await this.client.query(SEARCH_TOKENS, {
            searchText,
            first: limit,
        });
        return response.data?.tokens || [];
    }
    /**
     * Get user's trading history
     */
    async getUserTrades(trader, pagination) {
        const response = await this.client.query(GET_USER_TRADES, {
            trader: trader.toLowerCase(),
            first: pagination?.first || 100,
            skip: pagination?.skip || 0,
        });
        return response.data?.trades || [];
    }
    /**
     * Get user's contributions
     */
    async getUserContributions(contributor, pagination) {
        const response = await this.client.query(GET_USER_CONTRIBUTIONS, {
            contributor: contributor.toLowerCase(),
            first: pagination?.first || 100,
            skip: pagination?.skip || 0,
        });
        return response.data?.contributions || [];
    }
    /**
     * Get trending tokens
     */
    async getTrendingTokens(limit = 10) {
        const response = await this.client.query(GET_TRENDING_TOKENS, {
            first: limit,
        });
        return response.data?.tokens || [];
    }
    /**
     * Get active pools (not graduated)
     */
    async getActivePools(pagination) {
        return this.getPools({ graduated: false, active: true }, pagination);
    }
    /**
     * Get graduated pools
     */
    async getGraduatedPools(pagination) {
        return this.getPools({ graduated: true }, pagination);
    }
    /**
     * Get active launches (not graduated)
     */
    async getActiveLaunches(pagination) {
        return this.getLaunches({ graduatedToPancakeSwap: false }, pagination);
    }
    /**
     * Get graduated launches
     */
    async getGraduatedLaunches(pagination) {
        return this.getLaunches({ graduatedToPancakeSwap: true }, pagination);
    }
    /**
     * Get Project Raise launches
     */
    async getProjectRaises(pagination) {
        return this.getLaunches({ launchType: 'PROJECT_RAISE' }, pagination);
    }
    /**
     * Get Instant Launch tokens
     */
    async getInstantLaunches(pagination) {
        return this.getLaunches({ launchType: 'INSTANT_LAUNCH' }, pagination);
    }
    /**
     * Update subgraph endpoint
     */
    setSubgraphUrl(url) {
        this.client.setEndpoint(url);
    }
    /**
     * Get current subgraph endpoint
     */
    getSubgraphUrl() {
        return this.client.getEndpoint();
    }
}

// src/SafuPadSDK.ts
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
class SafuPadSDK {
    /**
     * Create a new SafuPad SDK instance
     *
     * @param config - SDK configuration
     */
    constructor(config) {
        this.initialized = false;
        this.config = { ...DEFAULT_CONFIG, ...config };
        // Get network configuration
        if (typeof this.config.network === 'string') {
            this.networkConfig = NETWORKS[this.config.network];
            if (!this.networkConfig) {
                throw new Error(`Unsupported network: ${this.config.network}`);
            }
        }
        else {
            this.networkConfig = this.config.network;
        }
        // Setup provider
        if (this.config.provider) {
            if (typeof this.config.provider === 'string') {
                this.provider = new ethers.ethers.JsonRpcProvider(this.config.provider);
            }
            else if ('request' in this.config.provider) {
                // Browser wallet provider (e.g., MetaMask)
                this.provider = new ethers.ethers.BrowserProvider(this.config.provider);
            }
            else {
                this.provider = this.config.provider;
            }
        }
        else {
            this.provider = new ethers.ethers.JsonRpcProvider(this.networkConfig.rpcUrl);
        }
        // Setup signer if private key provided
        if (this.config.privateKey) {
            this.signer = new ethers.ethers.Wallet(this.config.privateKey, this.provider);
        }
        // Setup event query provider (uses Alchemy if API key provided, otherwise uses regular provider)
        if (this.config.alchemyApiKey && this.networkConfig.alchemyRpcUrlTemplate) {
            const alchemyUrl = this.networkConfig.alchemyRpcUrlTemplate.replace('{apiKey}', this.config.alchemyApiKey);
            this.eventQueryProvider = new ethers.ethers.JsonRpcProvider(alchemyUrl);
        }
        else {
            // Use the same provider for event queries if no Alchemy key provided
            this.eventQueryProvider = this.provider;
        }
        // Initialize The Graph client first (if subgraph URL is available)
        const subgraphUrl = this.config.subgraphUrl || this.networkConfig.subgraphUrl;
        if (subgraphUrl) {
            this.graph = new SafuPadGraph(subgraphUrl);
        }
        // Initialize contract instances with The Graph client
        this.launchpad = new LaunchpadManager(this.networkConfig.contracts.launchpadManager, this.provider, this.signer, this.eventQueryProvider, this.graph);
        this.bondingDex = new BondingCurveDEX(this.networkConfig.contracts.bondingCurveDEX, this.provider, this.signer, this.eventQueryProvider, this.graph);
        this.tokenFactory = new TokenFactory(this.networkConfig.contracts.tokenFactory, this.provider, this.signer, this.eventQueryProvider, this.graph);
        this.priceOracle = new PriceOracle(this.networkConfig.contracts.priceOracle, this.provider, this.signer, this.eventQueryProvider, this.graph);
        this.lpHarvester = new LPFeeHarvester(this.networkConfig.contracts.lpFeeHarvester, this.provider, this.signer, this.eventQueryProvider, this.graph);
    }
    /**
     * Initialize the SDK and verify connections
     */
    async initialize() {
        if (this.initialized) {
            return;
        }
        // Verify network
        const network = await this.provider.getNetwork();
        if (Number(network.chainId) !== this.networkConfig.chainId) {
            throw new Error(`Network mismatch: expected ${this.networkConfig.chainId}, got ${network.chainId}`);
        }
        // Get signer if using browser wallet
        if (!this.signer && 'request' in this.config.provider) {
            const browserProvider = this.provider;
            this.signer = await browserProvider.getSigner();
            // Update contract signers
            this.launchpad.updateSigner(this.signer);
            this.bondingDex.updateSigner(this.signer);
            this.tokenFactory.updateSigner(this.signer);
            this.priceOracle.updateSigner(this.signer);
            this.lpHarvester.updateSigner(this.signer);
        }
        this.initialized = true;
    }
    /**
     * Connect a wallet (useful for browser environments)
     */
    async connect() {
        if (!('request' in this.config.provider)) {
            throw new Error('No browser wallet provider available');
        }
        const browserProvider = this.provider;
        await browserProvider.send('eth_requestAccounts', []);
        this.signer = await browserProvider.getSigner();
        const address = await this.signer.getAddress();
        // Update all contract signers
        this.launchpad.updateSigner(this.signer);
        this.bondingDex.updateSigner(this.signer);
        this.tokenFactory.updateSigner(this.signer);
        this.priceOracle.updateSigner(this.signer);
        this.lpHarvester.updateSigner(this.signer);
        return address;
    }
    /**
     * Get the current connected address
     */
    async getAddress() {
        if (!this.signer) {
            throw new Error('No signer available');
        }
        return this.signer.getAddress();
    }
    /**
     * Get the current BNB balance (BSC native token)
     */
    async getBalance(address) {
        const addr = address || (await this.getAddress());
        const balance = await this.provider.getBalance(addr);
        return ethers.ethers.formatEther(balance);
    }
    /**
     * Get network information
     */
    getNetworkInfo() {
        return this.networkConfig;
    }
    /**
     * Check if SDK is initialized
     */
    isInitialized() {
        return this.initialized;
    }
    /**
     * Get provider
     */
    getProvider() {
        return this.provider;
    }
    /**
     * Get event query provider (uses Alchemy if configured)
     */
    getEventQueryProvider() {
        return this.eventQueryProvider;
    }
    /**
     * Get signer
     */
    getSigner() {
        return this.signer;
    }
    /**
     * Update signer (useful when switching accounts)
     */
    updateSigner(signer) {
        this.signer = signer;
        this.launchpad.updateSigner(signer);
        this.bondingDex.updateSigner(signer);
        this.tokenFactory.updateSigner(signer);
        this.priceOracle.updateSigner(signer);
        this.lpHarvester.updateSigner(signer);
    }
    /**
     * Disconnect wallet
     */
    disconnect() {
        this.signer = undefined;
        this.initialized = false;
    }
    /**
     * Get current gas price
     */
    async getGasPrice() {
        const feeData = await this.provider.getFeeData();
        return ethers.ethers.formatUnits(feeData.gasPrice || 0n, 'gwei');
    }
    /**
     * Estimate gas for a transaction
     */
    async estimateGas(tx) {
        const gas = await this.provider.estimateGas(tx);
        return gas.toString();
    }
    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(txHash, confirmations = 1) {
        return this.provider.waitForTransaction(txHash, confirmations);
    }
    /**
     * Get transaction receipt
     */
    async getTransactionReceipt(txHash) {
        return this.provider.getTransactionReceipt(txHash);
    }
    /**
     * Format BNB amount (BSC native token)
     */
    formatBNB(amount) {
        return ethers.ethers.formatEther(amount);
    }
    /**
     * Parse BNB amount (BSC native token)
     */
    parseBNB(amount) {
        return ethers.ethers.parseEther(amount);
    }
    /**
     * Format token amount with decimals
     */
    formatToken(amount, decimals = 18) {
        return ethers.ethers.formatUnits(amount, decimals);
    }
    /**
     * Parse token amount with decimals
     */
    parseToken(amount, decimals = 18) {
        return ethers.ethers.parseUnits(amount, decimals);
    }
    /**
     * Get block explorer URL for address
     */
    getExplorerUrl(type, value) {
        return `${this.networkConfig.explorerUrl}/${type}/${value}`;
    }
    /**
     * Create a new SDK instance with a different signer
     */
    withSigner(signer) {
        const newSdk = new SafuPadSDK({
            ...this.config,
            privateKey: undefined,
        });
        newSdk.updateSigner(signer);
        newSdk.initialized = this.initialized;
        return newSdk;
    }
    /**
     * Check if The Graph client is available
     */
    hasGraphSupport() {
        return this.graph !== undefined;
    }
    /**
     * Get The Graph client
     * Throws if not configured
     */
    getGraph() {
        if (!this.graph) {
            throw new Error('The Graph client not configured. Provide a subgraphUrl in config or use a network with subgraph support.');
        }
        return this.graph;
    }
    /**
     * Set custom subgraph URL
     */
    setSubgraphUrl(url) {
        if (this.graph) {
            this.graph.setSubgraphUrl(url);
        }
        else {
            this.graph = new SafuPadGraph(url);
        }
    }
    /**
     * Get SDK version
     */
    static getVersion() {
        return '2.0.0';
    }
}

// src/utils/index.ts
/**
 * Format utilities
 */
class Formatter {
    /**
     * Format BNB amount to string (BSC native token)
     */
    static formatBNB(amount) {
        return ethers.ethers.formatEther(amount);
    }
    /**
     * Format token amount to string
     */
    static formatToken(amount, decimals = 18) {
        return ethers.ethers.formatUnits(amount, decimals);
    }
    /**
     * Format USD amount to string
     */
    static formatUSD(amount, decimals = 18) {
        const formatted = ethers.ethers.formatUnits(amount, decimals);
        const num = parseFloat(formatted);
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    }
    /**
     * Format percentage
     */
    static formatPercent(value, decimals = 2) {
        const num = typeof value === 'bigint' ? Number(value) : value;
        return `${num.toFixed(decimals)}%`;
    }
    /**
     * Format timestamp to date
     */
    static formatDate(timestamp) {
        const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
        return new Date(ts * 1000);
    }
    /**
     * Format duration in seconds to human readable
     */
    static formatDuration(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (days > 0) {
            return `${days}d ${hours}h`;
        }
        else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        }
        else if (minutes > 0) {
            return `${minutes}m`;
        }
        else {
            return `${seconds}s`;
        }
    }
    /**
     * Format address (shorten)
     */
    static formatAddress(address, startChars = 6, endChars = 4) {
        if (!ethers.ethers.isAddress(address)) {
            return address;
        }
        return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
    }
    /**
     * Format launch info for display
     */
    static formatLaunchInfo(info) {
        const totalRaised = parseFloat(ethers.ethers.formatEther(info.totalRaised));
        const raiseTarget = parseFloat(ethers.ethers.formatEther(info.raiseTarget));
        const progressPercent = raiseTarget > 0 ? (totalRaised / raiseTarget) * 100 : 0;
        return {
            founder: info.founder,
            raiseTarget: ethers.ethers.formatEther(info.raiseTarget),
            raiseMax: ethers.ethers.formatEther(info.raiseMax),
            totalRaised: ethers.ethers.formatEther(info.totalRaised),
            raiseDeadline: Formatter.formatDate(info.raiseDeadline),
            raiseCompleted: info.raiseCompleted,
            graduatedToPancakeSwap: info.graduatedToPancakeSwap,
            progressPercent: Math.min(progressPercent, 100),
            launchType: info.launchType === exports.LaunchType.PROJECT_RAISE ? 'PROJECT_RAISE' : 'INSTANT_LAUNCH',
            burnLP: info.burnLP,
        };
    }
    /**
     * Format pool info for display
     */
    static formatPoolInfo(info) {
        return {
            marketCapUSD: Formatter.formatUSD(info.marketCapUSD),
            marketCapBNB: Formatter.formatBNB(info.marketCapBNB),
            bnbReserve: Formatter.formatBNB(info.bnbReserve),
            tokenReserve: Formatter.formatToken(info.tokenReserve),
            currentPrice: Formatter.formatBNB(info.currentPrice),
            priceMultiplier: `${Number(info.priceMultiplier) / 100}x`,
            graduationProgress: Number(info.graduationProgress),
            graduated: info.graduated,
            currentFee: '', // Will be filled by caller
            feeStage: '', // Will be filled by caller
        };
    }
}
/**
 * Validation utilities
 */
class Validator {
    /**
     * Validate Ethereum address
     */
    static isValidAddress(address) {
        return ethers.ethers.isAddress(address);
    }
    /**
     * Validate amount
     */
    static isValidAmount(amount) {
        try {
            const parsed = ethers.ethers.parseEther(amount);
            return parsed > 0n;
        }
        catch {
            return false;
        }
    }
    /**
     * Validate token symbol
     */
    static isValidSymbol(symbol) {
        return /^[A-Z0-9]{2,10}$/.test(symbol);
    }
    /**
     * Validate token name
     */
    static isValidName(name) {
        return name.length >= 2 && name.length <= 50;
    }
    /**
     * Validate URL
     */
    static isValidURL(url) {
        try {
            new URL(url);
            return true;
        }
        catch {
            return false;
        }
    }
    /**
     * Validate private key
     */
    static isValidPrivateKey(key) {
        try {
            new ethers.ethers.Wallet(key);
            return true;
        }
        catch {
            return false;
        }
    }
}
/**
 * Calculation utilities
 */
class Calculator {
    /**
     * Calculate price impact
     */
    static calculatePriceImpact(inputAmount, outputAmount, currentPrice) {
        if (outputAmount === 0n || currentPrice === 0n) {
            return 0;
        }
        const avgPrice = (inputAmount * 10n ** 18n) / outputAmount;
        const impact = Number((avgPrice - currentPrice) * 10000n / currentPrice) / 100;
        return impact;
    }
    /**
     * Calculate slippage amount
     */
    static calculateSlippage(amount, slippagePercent) {
        const slippageBps = BigInt(Math.floor(slippagePercent * 100));
        return (amount * (10000n - slippageBps)) / 10000n;
    }
    /**
     * Calculate percentage
     */
    static calculatePercent(part, total) {
        if (total === 0n)
            return 0;
        return Number((part * 10000n) / total) / 100;
    }
    /**
     * Calculate vested amount
     */
    static calculateVestedAmount(totalAmount, startTime, duration, currentTime) {
        const now = currentTime || BigInt(Math.floor(Date.now() / 1000));
        const elapsed = now - startTime;
        if (elapsed <= 0n) {
            return 0n;
        }
        if (elapsed >= duration) {
            return totalAmount;
        }
        return (totalAmount * elapsed) / duration;
    }
    /**
     * Calculate APY from fees
     */
    static calculateAPY(totalFees, lockedValue, lockDuration) {
        if (lockedValue === 0n)
            return 0;
        const feesNum = Number(ethers.ethers.formatEther(totalFees));
        const valueNum = Number(ethers.ethers.formatEther(lockedValue));
        const yearFraction = lockDuration / (365 * 24 * 60 * 60);
        return (feesNum / valueNum / yearFraction) * 100;
    }
}
/**
 * Time utilities
 */
class TimeHelper {
    /**
     * Get current timestamp
     */
    static now() {
        return Math.floor(Date.now() / 1000);
    }
    /**
     * Convert days to seconds
     */
    static daysToSeconds(days) {
        return days * 24 * 60 * 60;
    }
    /**
     * Convert seconds to days
     */
    static secondsToDays(seconds) {
        return seconds / (24 * 60 * 60);
    }
    /**
     * Check if deadline has passed
     */
    static hasDeadlinePassed(deadline) {
        const deadlineNum = typeof deadline === 'bigint' ? Number(deadline) : deadline;
        return TimeHelper.now() > deadlineNum;
    }
    /**
     * Get time remaining
     */
    static getTimeRemaining(deadline) {
        const deadlineNum = typeof deadline === 'bigint' ? Number(deadline) : deadline;
        const remaining = deadlineNum - TimeHelper.now();
        return Math.max(remaining, 0);
    }
    /**
     * Sleep (for testing/delays)
     */
    static async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }
}
/**
 * Gas utilities
 */
class GasHelper {
    /**
     * Estimate gas cost in BNB (BSC native token)
     */
    static estimateCostBNB(gasLimit, gasPrice) {
        const cost = gasLimit * gasPrice;
        return ethers.ethers.formatEther(cost);
    }
    /**
     * Convert gwei to wei
     */
    static gweiToWei(gwei) {
        return ethers.ethers.parseUnits(gwei, 'gwei');
    }
    /**
     * Convert wei to gwei
     */
    static weiToGwei(wei) {
        return ethers.ethers.formatUnits(wei, 'gwei');
    }
    /**
     * Add gas buffer (increase by percentage)
     */
    static addBuffer(gasLimit, bufferPercent = 10) {
        const buffer = (gasLimit * BigInt(bufferPercent)) / 100n;
        return gasLimit + buffer;
    }
}
/**
 * Event utilities
 */
class EventHelper {
    /**
     * Parse event logs
     */
    static parseEventLog(log, contract) {
        try {
            return contract.interface.parseLog({
                topics: [...log.topics],
                data: log.data,
            });
        }
        catch {
            return null;
        }
    }
    /**
     * Filter events by name
     */
    static filterEventsByName(events, eventName) {
        return events.filter((e) => e.name === eventName);
    }
    /**
     * Get event argument
     */
    static getEventArg(event, argName) {
        return event.args?.[argName];
    }
}
/**
 * Token utilities
 */
class TokenHelper {
    /**
     * Get token contract instance
     */
    static getTokenContract(address, provider) {
        return new ethers.ethers.Contract(address, [
            'function name() view returns (string)',
            'function symbol() view returns (string)',
            'function decimals() view returns (uint8)',
            'function totalSupply() view returns (uint256)',
            'function balanceOf(address) view returns (uint256)',
            'function transfer(address, uint256) returns (bool)',
            'function approve(address, uint256) returns (bool)',
            'function allowance(address, address) view returns (uint256)',
        ], provider);
    }
    /**
     * Get token balance
     */
    static async getBalance(tokenAddress, userAddress, provider) {
        const contract = TokenHelper.getTokenContract(tokenAddress, provider);
        return await contract.balanceOf(userAddress);
    }
    /**
     * Get token allowance
     */
    static async getAllowance(tokenAddress, owner, spender, provider) {
        const contract = TokenHelper.getTokenContract(tokenAddress, provider);
        return await contract.allowance(owner, spender);
    }
    /**
     * Check if approval needed
     */
    static async needsApproval(tokenAddress, owner, spender, amount, provider) {
        const allowance = await TokenHelper.getAllowance(tokenAddress, owner, spender, provider);
        return allowance < amount;
    }
}
/**
 * URL utilities
 */
class URLHelper {
    /**
     * Build explorer URL
     */
    static getExplorerURL(baseURL, type, value) {
        return `${baseURL}/${type}/${value}`;
    }
    /**
     * Parse transaction hash from URL
     */
    static parseTxHash(url) {
        const match = url.match(/tx\/(0x[a-fA-F0-9]{64})/);
        return match ? match[1] : null;
    }
    /**
     * Parse address from URL
     */
    static parseAddress(url) {
        const match = url.match(/address\/(0x[a-fA-F0-9]{40})/);
        return match ? match[1] : null;
    }
}
// Re-export all utilities
const utils = {
    Formatter,
    Validator,
    Calculator,
    TimeHelper,
    GasHelper,
    EventHelper,
    TokenHelper,
    URLHelper,
};

// src/index.ts
/**
 * SafuPad SDK
 *
 * A comprehensive TypeScript SDK for interacting with SafuPad smart contracts
 *
 * @packageDocumentation
 */
// Main SDK export
// Version
const VERSION = '2.0.0';

exports.BLOCK_TIME = BLOCK_TIME;
exports.BaseContract = BaseContract;
exports.BondingCurveDEX = BondingCurveDEX;
exports.BondingCurveDEXABI = BondingCurveDEXABI;
exports.CONSTANTS = CONSTANTS;
exports.Calculator = Calculator;
exports.ContractError = ContractError;
exports.DEFAULT_CONFIG = DEFAULT_CONFIG;
exports.ERROR_MESSAGES = ERROR_MESSAGES;
exports.EVENTS = EVENTS;
exports.EventHelper = EventHelper;
exports.Formatter = Formatter;
exports.GAS_LIMITS = GAS_LIMITS;
exports.GasHelper = GasHelper;
exports.GraphQLClient = GraphQLClient;
exports.LPFeeHarvester = LPFeeHarvester;
exports.LPFeeHarvesterABI = LPFeeHarvesterABI;
exports.LaunchpadManager = LaunchpadManager;
exports.LaunchpadManagerABI = LaunchpadManagerABI;
exports.NETWORKS = NETWORKS;
exports.NetworkError = NetworkError;
exports.PriceOracle = PriceOracle;
exports.PriceOracleABI = PriceOracleABI;
exports.SafuPadError = SafuPadError;
exports.SafuPadGraph = SafuPadGraph;
exports.SafuPadSDK = SafuPadSDK;
exports.TIME = TIME;
exports.TimeHelper = TimeHelper;
exports.TokenFactory = TokenFactory;
exports.TokenFactoryABI = TokenFactoryABI;
exports.TokenHelper = TokenHelper;
exports.URLHelper = URLHelper;
exports.UTILS = UTILS;
exports.VERSION = VERSION;
exports.ValidationError = ValidationError;
exports.Validator = Validator;
exports.default = SafuPadSDK;
exports.utils = utils;
//# sourceMappingURL=index.js.map
