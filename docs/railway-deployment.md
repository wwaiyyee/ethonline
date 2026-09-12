# Railway Deployment Guide

## Overview

EdGraph consists of two Railway services:
1. **Next.js App** - Evidence API + Graph service + UI
2. **Facilitator** - x402 payment verification/settlement

---

## Service 1: Next.js App (Evidence API)

### Configuration
- **Root directory:** `.` (repository root)
- **Branch:** `wy1`
- **Build command:** `yarn next:build` (auto-detected from nixpacks.toml)
- **Start command:** `yarn next:serve` (auto-detected from nixpacks.toml)

### Environment Variables

```bash
# Facilitator (update after deploying facilitator service)
FACILITATOR_URL=https://your-facilitator.up.railway.app
X402_NETWORK=hedera:testnet
NEXT_PUBLIC_X402_NETWORK=hedera:testnet

# Database
EDGRAPH_DB_PATH=/app/.data/edgraph.sqlite

# The Graph
EDGRAPH_GRAPH_ENDPOINT=https://gateway.thegraph.com/api/9e6bf769402a4811a05a661dfe3d1546/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_SUBGRAPH_ID=5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_API_KEY=9e6bf769402a4811a05a661dfe3d1546
EDGRAPH_GRAPH_POOL_ADDRESS=0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C
EDGRAPH_STABLECOIN_ADDRESS=0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
EDGRAPH_STABLECOIN_SYMBOL=USDC
EDGRAPH_QUOTE_TOKEN_ADDRESS=0x4200000000000000000000000000000000000006
EDGRAPH_QUOTE_TOKEN_SYMBOL=WETH
EDGRAPH_QUOTE_TOKEN_USD_PRICE=3000

# Evidence API
EDGRAPH_EVIDENCE_PRICE_TINYBAR=1000000
EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID=0.0.10426282

# Hedera
HEDERA_RPC_URL=https://testnet.hashio.io/api
POLICY_REGISTRY_ADDRESS=0xYOUR_DEPLOYED_CONTRACT_ADDRESS
POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.YOUR_CONTRACT_ID

# WalletConnect (get from cloud.reown.com)
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=your_project_id

# Template S3 (not used by Evidence API but required)
S3_ENDPOINT=http://unused
S3_BUCKET=unused
S3_ACCESS_KEY_ID=unused
S3_SECRET_ACCESS_KEY=unused
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

### Testing

```bash
# Test Evidence API returns 402
curl -i -X POST https://your-app.up.railway.app/api/v1/depeg-evidence \
  -H "Content-Type: application/json" \
  -d '{
    "policyId": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
    "claimId": "test-claim-001",
    "lookbackSeconds": 3600
  }'

# Expected: HTTP 402 Payment Required
```

---

## Service 2: Facilitator (x402 Payment)

### Configuration
- **Root directory:** `facilitator`
- **Branch:** `wy1`
- **Build command:** None (auto-detected from nixpacks.toml)
- **Start command:** `npm start` (auto-detected from nixpacks.toml)

### Environment Variables

```bash
PORT=4020
FACILITATOR_PORT=4020
X402_NETWORK=hedera:testnet
FACILITATOR_ACCOUNT_ID=0.0.10426282
FACILITATOR_PRIVATE_KEY=YOUR_FACILITATOR_PRIVATE_KEY
HEDERA_NODE_URL=https://testnet.hashio.io/api
```

### Testing

```bash
# Test facilitator health endpoint
curl https://your-facilitator.up.railway.app/health

# Expected: {"status":"ok"}
```

---

## Deployment Steps

### 1. Deploy Next.js App First
1. Railway dashboard → New Project → Deploy from GitHub
2. Select `ethonline` repo
3. Root directory: `.` (leave default)
4. Branch: `wy1`
5. Add all environment variables above
6. Deploy will start automatically
7. **Note the public URL** (e.g., `https://edgraph-production-abc.up.railway.app`)

### 2. Deploy Facilitator
1. Railway dashboard → New Service (same project)
2. Select `ethonline` repo
3. Root directory: `facilitator`
4. Branch: `wy1`
5. Add facilitator environment variables
6. Deploy will start automatically
7. **Copy the public URL** (e.g., `https://edgraph-facilitator-production-xyz.up.railway.app`)

### 3. Update Next.js App with Facilitator URL
1. Go to Next.js service → Variables tab
2. Update `FACILITATOR_URL` to the facilitator's public URL
3. Railway will auto-redeploy

### 4. Test End-to-End
```bash
# 1. Test Evidence API returns 402
curl -i https://your-app.up.railway.app/api/v1/depeg-evidence

# 2. Run payment test with agent
yarn tsx scripts/test-evidence-payment.ts
```

---

## Troubleshooting

### Build fails with "better-sqlite3" error
- Check Node.js version is pinned to `20.18.3` in root `package.json`
- Check `nixpacks.toml` includes `python3`, `gcc`, `gnumake`

### Evidence API returns 500 instead of 402
- Check `FACILITATOR_URL` points to deployed facilitator
- Check facilitator is running (hit `/health` endpoint)
- Check environment variables are set correctly

### Payment fails to settle
- Check `FACILITATOR_ACCOUNT_ID` has testnet HBAR
- Check `FACILITATOR_PRIVATE_KEY` is correct ECDSA key
- Check facilitator logs for errors

---

## Public URLs

After deployment, record these URLs:

- **Evidence API:** `https://________.up.railway.app/api/v1/depeg-evidence`
- **Graph Service:** `https://________.up.railway.app/api/graph/snapshot`
- **Facilitator:** `https://________.up.railway.app`

These URLs will be used in Bazantic Recipe configuration.
