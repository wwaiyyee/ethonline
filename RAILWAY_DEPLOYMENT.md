# Railway Deployment Guide for EdGraph

This guide covers deploying the EdGraph API to Railway with all required environment variables and services.

## Prerequisites

1. Railway account with CLI installed: `npm i -g @railway/cli`
2. All contracts deployed to Hedera Testnet
3. The Graph API key and subgraph endpoint
4. Agent Hedera account with funded HBAR balance

## Architecture

EdGraph on Railway consists of:
- **Next.js API**: Serves the evidence API, Graph monitoring, and frontend
- **Facilitator**: Self-hosted x402 payment facilitator
- **PostgreSQL**: Optional - currently using SQLite on persistent volume
- **Persistent Volume**: Stores `edgraph.sqlite` database

## Step 1: Create Railway Project

```bash
# Login to Railway
railway login

# Create new project
railway init

# Link to existing project (if already created)
railway link
```

## Step 2: Add Persistent Volume

In Railway dashboard:
1. Go to your service settings
2. Add a new Volume
3. Mount path: `/app/.data`
4. This will store the SQLite database persistently

## Step 3: Set Environment Variables

Copy all variables from `packages/nextjs/.env.production` into Railway:

```bash
cd packages/nextjs

# Set variables one by one in Railway dashboard, or use CLI:
railway variables set FACILITATOR_URL="https://edgraph-facilitator.up.railway.app"
railway variables set X402_NETWORK="hedera:testnet"
railway variables set NEXT_PUBLIC_X402_NETWORK="hedera:testnet"

# Database
railway variables set EDGRAPH_DB_PATH="/app/.data/edgraph.sqlite"

# The Graph API (Ethereum mainnet USDC/WETH pool)
railway variables set EDGRAPH_GRAPH_ENDPOINT="https://gateway.thegraph.com/api/c71b0bd685814c60d1a641b9d0bba7b8/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
railway variables set EDGRAPH_GRAPH_SUBGRAPH_ID="5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
railway variables set EDGRAPH_GRAPH_API_KEY="c71b0bd685814c60d1a641b9d0bba7b8"
railway variables set EDGRAPH_GRAPH_POOL_ADDRESS="0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
railway variables set EDGRAPH_STABLECOIN_ADDRESS="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
railway variables set EDGRAPH_STABLECOIN_SYMBOL="USDC"
railway variables set EDGRAPH_QUOTE_TOKEN_ADDRESS="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
railway variables set EDGRAPH_QUOTE_TOKEN_SYMBOL="WETH"
railway variables set EDGRAPH_QUOTE_TOKEN_USD_PRICE="2500"

# Evidence API pricing
railway variables set EDGRAPH_EVIDENCE_PRICE_TINYBAR="1000000"
railway variables set EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID="0.0.10426282"

# Agent credentials (IMPORTANT: Keep these secret!)
railway variables set EDGRAPH_AGENT_ACCOUNT_ID="0.0.10461760"
railway variables set EDGRAPH_AGENT_PRIVATE_KEY="0x8aa1ed7c9bfe9db6c7c13ba36db39dc6d548c1e08d978570a149c8d792752e44"

# Hedera RPC
railway variables set HEDERA_RPC_URL="https://testnet.hashio.io/api"

# PolicyRegistry contract
railway variables set POLICY_REGISTRY_ADDRESS="0xC3549920b94a795D75E6C003944943D552C46F97"
railway variables set NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS="0xC3549920b94a795D75E6C003944943D552C46F97"
railway variables set POLICY_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443942"
railway variables set NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443942"

# FileRegistry contract
railway variables set FILE_REGISTRY_ADDRESS="0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9"
railway variables set NEXT_PUBLIC_FILE_REGISTRY_ADDRESS="0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9"
railway variables set FILE_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443939"
railway variables set NEXT_PUBLIC_FILE_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443939"

# WalletConnect
railway variables set NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="21ac6fe1145d5e738b642eaaef8019da"
railway variables set NEXT_PUBLIC_HEDERA_MAINNET_RPC_URL="https://mainnet.hashio.io/api"
railway variables set NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL="https://testnet.hashio.io/api"

# S3 placeholders (not used in production)
railway variables set S3_ENDPOINT="http://unused"
railway variables set S3_BUCKET="unused"
railway variables set S3_ACCESS_KEY_ID="unused"
railway variables set S3_SECRET_ACCESS_KEY="unused"
railway variables set S3_REGION="us-east-1"
railway variables set S3_FORCE_PATH_STYLE="true"
```

## Step 4: Deploy

```bash
# From packages/nextjs directory
railway up

# Or push from git (if connected to GitHub)
git push origin main
```

## Step 5: Seed the Database

After first deployment, seed the policies from on-chain:

```bash
# Run seed script via Railway CLI
railway run yarn seed:policies

# Or connect to the running service and execute
railway shell
yarn seed:policies
```

## Step 6: Verify Deployment

Test the deployed endpoints:

```bash
# Health check
curl https://edgraph.up.railway.app/api/health

# OpenAPI spec
curl https://edgraph.up.railway.app/api/openapi

# Test Graph snapshot (free)
curl -X POST https://edgraph.up.railway.app/api/graph/snapshot \
  -H "Content-Type: application/json" \
  -d '{"poolAddress": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", "lookbackSeconds": 3600}'

# Test evidence API with x402 payment (requires Hedera account)
cd scripts
RESOURCE_URL="https://edgraph.up.railway.app/api/v1/depeg-evidence" \
BUYER_ACCOUNT_ID="0.0.YOUR_ACCOUNT" \
BUYER_PRIVATE_KEY="0xYOUR_KEY" \
X402_NETWORK="hedera:testnet" \
yarn x402:buy
```

## Step 7: Deploy Facilitator (Separate Service)

The x402 facilitator should be deployed as a separate Railway service:

```bash
cd ../../facilitator

# Create new Railway service
railway init

# Set facilitator env vars
railway variables set HEDERA_OPERATOR_ID="0.0.10426282"
railway variables set HEDERA_OPERATOR_KEY="your_facilitator_private_key"
railway variables set HEDERA_NETWORK="testnet"
railway variables set PORT="3001"

# Deploy
railway up
```

## Troubleshooting

### Issue: 502 errors on `/api/policies` or `/api/claims`

**Cause**: Missing `POLICY_REGISTRY_ADDRESS` or contract ABI mismatch

**Fix**:
1. Verify `POLICY_REGISTRY_ADDRESS` is set in Railway env vars
2. Check the contract is deployed: `yarn hardhat:verify --network hederaTestnet`
3. Re-run seed: `railway run yarn seed:policies`

### Issue: Graph queries returning mock data

**Cause**: `EDGRAPH_GRAPH_API_KEY` not set or incorrect

**Fix**:
1. Verify The Graph API key is set
2. Test the endpoint locally first with `yarn dev`
3. Check `/api/graph/snapshot` returns live data, not mock

### Issue: x402 payment fails with "facilitator unreachable"

**Cause**: `FACILITATOR_URL` pointing to wrong service or facilitator not deployed

**Fix**:
1. Deploy facilitator as separate service (see Step 7)
2. Update `FACILITATOR_URL` to the facilitator's Railway domain
3. Test facilitator health: `curl https://edgraph-facilitator.up.railway.app/health`

### Issue: Database "policies table not found"

**Cause**: Database not initialized or volume not mounted

**Fix**:
1. Check volume is mounted at `/app/.data`
2. Run seed script: `railway run yarn seed:policies`
3. Verify with: `railway run yarn db:inspect`

### Issue: WalletConnect not connecting in production

**Cause**: `NEXT_PUBLIC_*` env vars not set or CORS issue

**Fix**:
1. Verify all `NEXT_PUBLIC_*` vars are set
2. Check Railway domain is added to WalletConnect allowed origins
3. Rebuild: `railway up --force`

## Monitoring

View logs in Railway dashboard or via CLI:

```bash
# Stream logs
railway logs

# Tail specific service
railway logs -f
```

## Production Checklist

Before going live, verify:

- [ ] All env vars set in Railway dashboard
- [ ] Persistent volume mounted at `/app/.data`
- [ ] Database seeded with policies (`yarn seed:policies`)
- [ ] Facilitator deployed and reachable
- [ ] Health check passes: `/api/health`
- [ ] OpenAPI spec loads: `/api/openapi`
- [ ] Graph snapshot returns live data (not mock)
- [ ] Evidence API accepts x402 payment
- [ ] WalletConnect connects from frontend
- [ ] Agent credentials secured (never commit to git)
- [ ] All contract addresses match deployed contracts

## Security Notes

1. **Never commit** `.env.production` to git
2. **Rotate agent private key** regularly
3. **Use Railway secrets** for sensitive values
4. **Enable Railway MFA** on your account
5. **Monitor agent HBAR balance** - set up alerts
6. **Review Railway access logs** regularly

## Cost Estimates

- Railway Pro plan: $5/month (includes persistent storage)
- Hedera testnet: Free (mainnet: ~$0.0001 per tx)
- The Graph API: Free tier (100k queries/month)
- Estimated monthly cost: $5-20 depending on traffic

## Support

- Railway docs: https://docs.railway.app
- EdGraph issues: https://github.com/your-org/ethonline/issues
- Hedera Discord: https://hedera.com/discord
