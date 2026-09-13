# Railway Deployment Guide - EdGraph Coverage Operations

This guide ensures the EdGraph Monitor, Policies, and Claims pages work without 502 errors on Railway.

## Critical Environment Variables

**Without these variables, the dashboard will show "Dashboard API unavailable" and return 502 errors.**

### Required Variables for Railway

Copy these into your Railway project's environment variables:

```bash
# === WalletConnect (Required for HashPack connection) ===
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=21ac6fe1145d5e738b642eaaef8019da

# === Hedera Network Configuration ===
NEXT_PUBLIC_HEDERA_MAINNET_RPC_URL=https://mainnet.hashio.io/api
NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
HEDERA_RPC_URL=https://testnet.hashio.io/api

# === PolicyRegistry Contract (CRITICAL - prevents 502 errors) ===
POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942
NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942

# === FileRegistry Contract (for x402 file operations) ===
FILE_REGISTRY_ADDRESS=0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9
NEXT_PUBLIC_FILE_REGISTRY_ADDRESS=0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9
FILE_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443939
NEXT_PUBLIC_FILE_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443939

# === EdGraph Database ===
EDGRAPH_DB_PATH=.data/edgraph.sqlite

# === The Graph Configuration (Ethereum Mainnet USDC/WETH pool) ===
EDGRAPH_GRAPH_ENDPOINT=https://gateway.thegraph.com/api/c71b0bd685814c60d1a641b9d0bba7b8/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_SUBGRAPH_ID=5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_API_KEY=c71b0bd685814c60d1a641b9d0bba7b8
EDGRAPH_GRAPH_POOL_ADDRESS=0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
EDGRAPH_STABLECOIN_ADDRESS=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
EDGRAPH_STABLECOIN_SYMBOL=USDC
EDGRAPH_QUOTE_TOKEN_ADDRESS=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
EDGRAPH_QUOTE_TOKEN_SYMBOL=WETH
EDGRAPH_QUOTE_TOKEN_USD_PRICE=2500

# === Claims Agent Configuration ===
EDGRAPH_EVIDENCE_API_URL=https://YOUR_RAILWAY_URL/api/v1/depeg-evidence
EDGRAPH_GRAPH_SERVICE_URL=https://YOUR_RAILWAY_URL/api/graph/snapshot
EDGRAPH_AGENT_ACCOUNT_ID=0.0.10461760
EDGRAPH_AGENT_PRIVATE_KEY=0x8aa1ed7c9bfe9db6c7c13ba36db39dc6d548c1e08d978570a149c8d792752e44
EDGRAPH_AGENT_HBAR_BUDGET_TINYBAR=1000000
EDGRAPH_EVIDENCE_PRICE_TINYBAR=1000000
EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID=0.0.10426282

# === x402 Configuration ===
FACILITATOR_URL=https://edgraph-facilitator.up.railway.app
X402_NETWORK=hedera:testnet
NEXT_PUBLIC_X402_NETWORK=hedera:testnet

# === MinIO / S3 Configuration (Optional - for file storage) ===
S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=x402-files
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

## Deployment Checklist

### 1. Set Environment Variables in Railway

1. Go to your Railway project dashboard
2. Click on your service
3. Navigate to the "Variables" tab
4. Click "Raw Editor" for bulk paste
5. Copy and paste ALL the variables above
6. **Replace `YOUR_RAILWAY_URL`** with your actual Railway deployment URL (e.g., `edgraph-production.up.railway.app`)
7. Click "Deploy" to apply changes

### 2. Verify Contract Addresses

Make sure these contract addresses are correct for Hedera testnet:

- **PolicyRegistry**: `0xC3549920b94a795D75E6C003944943D552C46F97` (Hedera ID: `0.0.10443942`)
- **FileRegistry**: `0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9` (Hedera ID: `0.0.10443939`)

### 3. Test Each Page

After deployment, verify:

- ✅ `/edgraph-monitor` - Should show "LIVE GRAPH DATA" banner (not "Dashboard API unavailable")
- ✅ `/policies` - Should load policy list (not "Failed to fetch policies")
- ✅ `/claims` - Should load claims dashboard (not "Failed to fetch claims")
- ✅ Home page - Should display pool data and statistics

### 4. Common Issues

#### Issue: "Dashboard API unavailable" on Monitor page

**Cause**: Missing `POLICY_REGISTRY_ADDRESS` or `POLICY_REGISTRY_HEDERA_CONTRACT_ID`

**Fix**: Ensure all 4 PolicyRegistry variables are set in Railway:
```bash
POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942
NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942
```

#### Issue: "Failed to fetch policies" or "Failed to fetch claims"

**Cause**: Same as above - PolicyRegistry variables not set

**Fix**: Apply the same fix as above

#### Issue: 502 Bad Gateway on API routes

**Cause**: One of the critical env vars is missing or the Next.js build failed

**Fix**: 
1. Check Railway build logs for errors
2. Verify all environment variables are set
3. Trigger a manual redeploy

#### Issue: HashPack wallet won't connect

**Cause**: `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` not set

**Fix**: Ensure the WalletConnect project ID is set:
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=21ac6fe1145d5e738b642eaaef8019da
```

## Build Configuration

Railway should auto-detect Next.js. Verify these settings:

- **Build Command**: `yarn build` (or `cd packages/nextjs && yarn build`)
- **Start Command**: `yarn start` (or `cd packages/nextjs && yarn start`)
- **Root Directory**: `/packages/nextjs` (if using monorepo structure)

## Database Persistence

The SQLite database (`EDGRAPH_DB_PATH=.data/edgraph.sqlite`) will be lost on redeploys unless you:

1. Use Railway's persistent volumes (recommended)
2. Or migrate to a hosted database like PostgreSQL

For hackathon demo purposes, losing data on redeploy is acceptable.

## Monitoring

After deployment, monitor the Railway logs for:
- Contract read errors
- API route failures
- Missing environment variable warnings

## Quick Verify Command

Run this after deployment to verify the API health:

```bash
curl https://YOUR_RAILWAY_URL/api/health
curl https://YOUR_RAILWAY_URL/api/dashboard
```

Both should return JSON (not 502 errors).

---

**Last updated**: 2026-09-13
**Contract deployment**: Hedera testnet
**Network**: `hedera:testnet`
