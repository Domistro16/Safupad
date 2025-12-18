# Vercel Deployment Guide

## Required Environment Variables

Before deploying to Vercel, make sure to set these environment variables in your Vercel project settings:

### Network Configuration
```
NEXT_PUBLIC_NETWORK=bsc                    # or 'bscTestnet' for testnet
NEXT_PUBLIC_CHAIN_ID=56                    # 56 for mainnet, 97 for testnet
NEXT_PUBLIC_RPC_URL=https://bsc-dataseed1.binance.org
NEXT_PUBLIC_CHAIN_NAME=BSC Mainnet
```

### API Keys
```
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
NEXT_PUBLIC_ALCHEMY_API_KEY=your_alchemy_api_key
NEXT_PUBLIC_BSCSCAN_API_KEY=your_bscscan_api_key
NEXT_PUBLIC_COINGECKO_API_KEY=your_coingecko_api_key
NEXT_PUBLIC_UPLOAD_KEY=your_upload_key
```

### Contract Addresses
```
NEXT_PUBLIC_PLATFORM_WALLET=0x...
NEXT_PUBLIC_ACADEMY_WALLET=0x...
NEXT_PUBLIC_INFOFI_WALLET=0x...
NEXT_PUBLIC_PROJECT_RAISE_FACTORY=0x...
NEXT_PUBLIC_INSTANT_LAUNCH_FACTORY=0x...
NEXT_PUBLIC_PANCAKESWAP_ROUTER=0x10ED43C718714eb63d5aA57B78B54704E256024E
```

### Admin & Social
```
NEXT_PUBLIC_ADMIN_ADDRESSES=0x...
NEXT_PUBLIC_TWITTER_URL=https://twitter.com/...
NEXT_PUBLIC_TELEGRAM_URL=https://t.me/...
NEXT_PUBLIC_DISCORD_URL=https://discord.gg/...
NEXT_PUBLIC_DOCS_URL=https://docs...
```

### Application Settings
```
NEXT_PUBLIC_APP_NAME=Safupad
NEXT_PUBLIC_APP_DESCRIPTION=The most advanced token launchpad on Monad
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
NEXT_PUBLIC_ENABLE_TESTNET=false
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_TWEET_BOT=false
```

## Deployment Steps

1. **Connect your repository to Vercel**
   - Go to https://vercel.com/new
   - Import your GitHub repository

2. **Configure Build Settings**
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install --legacy-peer-deps`

   (These are already configured in `vercel.json`)

3. **Set Environment Variables**
   - Go to your project settings in Vercel
   - Navigate to "Environment Variables"
   - Add all the required variables listed above

4. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy your application

## Troubleshooting

### Build Fails with ENOENT error
- Make sure all environment variables are set
- Check that `vercel.json` is in the repository
- Ensure `next.config.ts` doesn't have `outputFileTracingRoot` pointing outside the project

### Runtime Errors
- Verify all `NEXT_PUBLIC_*` environment variables are set in Vercel
- Check the Vercel deployment logs for specific errors
- Make sure your WalletConnect Project ID is valid

### Network Issues
- Set `NEXT_PUBLIC_NETWORK` to either `bsc` or `bscTestnet`
- Ensure the corresponding `NEXT_PUBLIC_CHAIN_ID` matches (56 for bsc, 97 for bscTestnet)
