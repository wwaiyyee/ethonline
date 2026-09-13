# Railway Environment Variables Setup

## Critical Issue
Railway deployment is **CRASHING** because environment variables are missing or incorrectly set.

## Symptoms
- ✅ `/api/health` works
- ✅ `/api/graph/snapshot-mock` works
- ❌ `/api/graph/snapshot` returns 502 (crashes)
- ❌ `/api/policies` fails
- ❌ `/api/claims` fails
- ❌ Payment settlement fails after 402 challenge

## Root Cause
The real Graph endpoint and policy/claims APIs depend on environment variables that are either:
1. Not set in Railway
2. Set incorrectly
3. Missing required values

## Required Railway Environment Variables

Copy these **EXACTLY** into Railway dashboard → your service → Variables tab:

```bash
# === x402 Network Configuration ===
FACILITATOR_URL=https://edgraph-facilitator.up.railway.app
X402_NETWORK=hedera:testnet
NEXT_PUBLIC_X402_NETWORK=hedera:testnet

# === Database ===
EDGRAPH_DB_PATH=/app/.data/edgraph.sqlite

# === The Graph Configuration (CRITICAL for /api/graph/snapshot) ===
EDGRAPH_GRAPH_ENDPOINT=https://gateway.thegraph.com/api/c71b0bd685814c60d1a641b9d0bba7b8/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_SUBGRAPH_ID=5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_API_KEY=c71b0bd685814c60d1a641b9d0bba7b8
EDGRAPH_GRAPH_POOL_ADDRESS=0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
EDGRAPH_STABLECOIN_ADDRESS=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
EDGRAPH_STABLECOIN_SYMBOL=USDC
EDGRAPH_QUOTE_TOKEN_ADDRESS=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
EDGRAPH_QUOTE_TOKEN_SYMBOL=WETH
EDGRAPH_QUOTE_TOKEN_USD_PRICE=2500

# === Evidence API Configuration ===
EDGRAPH_EVIDENCE_PRICE_TINYBAR=1000000
EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID=0.0.10426282

# === Agent Credentials (for autonomous claims processing) ===
EDGRAPH_AGENT_ACCOUNT_ID=0.0.10461760
EDGRAPH_AGENT_PRIVATE_KEY=0x8aa1ed7c9bfe9db6c7c13ba36db39dc6d548c1e08d978570a149c8d792752e44

# === Hedera Network ===
HEDERA_RPC_URL=https://testnet.hashio.io/api

# === PolicyRegistry Contract (CRITICAL for /api/policies, /api/claims) ===
POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942
NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942

# === FileRegistry Contract (CRITICAL for x402 file operations) ===
FILE_REGISTRY_ADDRESS=0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9
NEXT_PUBLIC_FILE_REGISTRY_ADDRESS=0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9
FILE_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443939
NEXT_PUBLIC_FILE_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443939

# === WalletConnect (for HashPack integration) ===
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=21ac6fe1145d5e738b642eaaef8019da
NEXT_PUBLIC_HEDERA_MAINNET_RPC_URL=https://mainnet.hashio.io/api
NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api

# === S3/MinIO (not used in production Railway - set as unused) ===
S3_ENDPOINT=http://unused
S3_BUCKET=unused
S3_ACCESS_KEY_ID=unused
S3_SECRET_ACCESS_KEY=unused
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

## How to Add to Railway

1. Go to Railway dashboard: https://railway.app/dashboard
2. Select your project (edgraph)
3. Select the **nextjs** service
4. Click **Variables** tab
5. Click **Raw Editor** button (top right)
6. **DELETE ALL existing variables**
7. **Paste the entire block above**
8. Click **Deploy** (Railway will auto-redeploy)

## Verification After Deploy

Wait 2-3 minutes for Railway to redeploy, then test:

```bash
# 1. Test real Graph endpoint (should work now, not 502)
curl -X POST https://edgraph.up.railway.app/api/graph/snapshot \
  -H "Content-Type: application/json" \
  -d '{"poolAddress":"0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C","lookbackSeconds":3600}'

# 2. Test evidence payment (should settle now)
EVIDENCE_URL="https://edgraph.up.railway.app/api/v1/depeg-evidence" \
BUYER_ACCOUNT_ID=0.0.10461760 \
BUYER_PRIVATE_KEY=0x8aa1ed7c9bfe9db6c7c13ba36db39dc6d548c1e08d978570a149c8d792752e44 \
X402_NETWORK=hedera:testnet \
yarn tsx scripts/test-evidence-payment.ts
```

## Expected Results After Fix

- ✅ `/api/graph/snapshot` returns real Graph data (not 502)
- ✅ `/api/policies` works
- ✅ `/api/claims` works
- ✅ Evidence payment settles successfully
- ✅ Dashboard shows real monitoring data

## Why This Happened

Railway **does not automatically read `.env` files**. You must manually set environment variables in the Railway dashboard. Local `yarn dev` works because it reads your local `.env` file.

## Next Steps

1. Add all variables to Railway (instructions above)
2. Wait for redeploy
3. Test endpoints
4. Report back which ones still fail (if any)
