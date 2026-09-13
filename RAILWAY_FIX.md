# Railway Deployment Fix Guide

## Problem Summary

Your Railway deployment is returning 502 errors because:

1. **Missing Environment Variables** - Railway doesn't automatically load `.env.production`
2. **Database is empty** - The `postbuild` script runs but may fail if env vars are missing
3. **API routes timing out** - The `/api/policies` route was trying to read from blockchain on every request (FIXED in code)

## What I Fixed in Code

✅ Changed `/api/policies` to read from SQLite database instead of calling blockchain on every request
✅ Added `postbuild` hook to automatically seed database after build
✅ Database queries now work offline (no blockchain calls during page load)

## What You Need to Do on Railway

### Step 1: Install Railway CLI (if needed)

```bash
# macOS/Linux
curl -fsSL https://railway.app/install.sh | sh

# Or via npm
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

### Step 3: Link to Your Project

```bash
cd /Users/chloelee/wy/ethonline/packages/nextjs
railway link
```

### Step 4: Set Environment Variables

Copy ALL variables from `.env.production` to Railway:

```bash
# Core database path
railway variables set EDGRAPH_DB_PATH="/app/.data/edgraph.sqlite"

# PolicyRegistry Contract (CRITICAL)
railway variables set POLICY_REGISTRY_ADDRESS="0xC3549920b94a795D75E6C003944943D552C46F97"
railway variables set NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS="0xC3549920b94a795D75E6C003944943D552C46F97"
railway variables set POLICY_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443942"
railway variables set NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443942"

# FileRegistry Contract
railway variables set FILE_REGISTRY_ADDRESS="0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9"
railway variables set NEXT_PUBLIC_FILE_REGISTRY_ADDRESS="0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9"
railway variables set FILE_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443939"
railway variables set NEXT_PUBLIC_FILE_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443939"

# Hedera Network
railway variables set HEDERA_RPC_URL="https://testnet.hashio.io/api"

# x402 Configuration
railway variables set FACILITATOR_URL="https://edgraph-facilitator.up.railway.app"
railway variables set X402_NETWORK="hedera:testnet"
railway variables set NEXT_PUBLIC_X402_NETWORK="hedera:testnet"

# The Graph Configuration (for live data)
railway variables set EDGRAPH_GRAPH_ENDPOINT="https://gateway.thegraph.com/api/c71b0bd685814c60d1a641b9d0bba7b8/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
railway variables set EDGRAPH_GRAPH_SUBGRAPH_ID="5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
railway variables set EDGRAPH_GRAPH_API_KEY="c71b0bd685814c60d1a641b9d0bba7b8"
railway variables set EDGRAPH_GRAPH_POOL_ADDRESS="0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"

# Stablecoin Configuration
railway variables set EDGRAPH_STABLECOIN_ADDRESS="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
railway variables set EDGRAPH_STABLECOIN_SYMBOL="USDC"
railway variables set EDGRAPH_QUOTE_TOKEN_ADDRESS="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
railway variables set EDGRAPH_QUOTE_TOKEN_SYMBOL="WETH"
railway variables set EDGRAPH_QUOTE_TOKEN_USD_PRICE="2500"

# Evidence API Configuration
railway variables set EDGRAPH_EVIDENCE_PRICE_TINYBAR="1000000"
railway variables set EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID="0.0.10426282"

# Agent Credentials
railway variables set EDGRAPH_AGENT_ACCOUNT_ID="0.0.10461760"
railway variables set EDGRAPH_AGENT_PRIVATE_KEY="0x8aa1ed7c9bfe9db6c7c13ba36db39dc6d548c1e08d978570a149c8d792752e44"

# WalletConnect
railway variables set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="21ac6fe1145d5e738b642eaaef8019da"
railway variables set NEXT_PUBLIC_HEDERA_MAINNET_RPC_URL="https://mainnet.hashio.io/api"
railway variables set NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL="https://testnet.hashio.io/api"

# S3/MinIO (not used in production - set as unused)
railway variables set S3_ENDPOINT="http://unused"
railway variables set S3_BUCKET="unused"
railway variables set S3_ACCESS_KEY_ID="unused"
railway variables set S3_SECRET_ACCESS_KEY="unused"
railway variables set S3_REGION="us-east-1"
railway variables set S3_FORCE_PATH_STYLE="true"
```

### Step 5: Verify Variables Were Set

```bash
railway variables
```

### Step 6: Redeploy

```bash
railway up
```

Or trigger redeploy via Railway dashboard.

### Step 7: Verify Deployment

Wait for deployment to complete, then:

```bash
RAILWAY_URL=https://edgraph.up.railway.app yarn deploy:verify
```

## Alternative: Set Variables via Railway Dashboard

1. Go to https://railway.app
2. Open your EdGraph project
3. Click on your service
4. Go to "Variables" tab
5. Click "Raw Editor"
6. Paste all variables from `.env.production`
7. Click "Deploy"

## Expected Result After Fix

✅ `/api/health` - 200 OK
✅ `/api/policies` - Returns 19 policies
✅ `/api/claims` - Returns claims (or empty array)
✅ `/api/graph/snapshot-mock` - Returns mock pool data
✅ Website loads with policy cards visible
✅ HashPack wallet connection works

## HashPack Connection Issue

If the wallet button still can't be clicked:
1. Check browser console for errors
2. Verify `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` is set
3. Clear browser cache
4. Try incognito mode

## What Happens During Deployment

```
1. Railway builds Next.js app
2. postbuild hook runs: yarn db:init
3. seed-policies.ts reads PolicyRegistry from Hedera
4. Database populated with 19 policies
5. App starts and serves from SQLite (fast, no blockchain calls)
```

## Troubleshooting

### If seed fails during build:
```bash
# Check Railway logs
railway logs
```

Look for errors like:
- "PolicyRegistry address not found" → env vars not set
- "RPC call failed" → HEDERA_RPC_URL issue
- "Database locked" → volume mount issue

### If database is still empty:
```bash
# SSH into Railway container and manually seed
railway run yarn db:init
```

### If you see 502 errors:
- Check Railway logs for crash/timeout
- Verify all POLICY_REGISTRY_* variables are set
- Ensure volume is mounted at /app/.data
