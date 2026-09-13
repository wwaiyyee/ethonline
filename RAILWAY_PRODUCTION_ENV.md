# Railway Production Environment Variables

Complete production environment configuration for the EdGraph deployment on Railway.

## Required Environment Variables

Copy these into Railway's environment variables section (Service Settings > Variables).

### Core Network Configuration

```bash
# x402 Hedera Facilitator
FACILITATOR_URL="https://edgraph-facilitator.up.railway.app"
X402_NETWORK="hedera:testnet"
NEXT_PUBLIC_X402_NETWORK="hedera:testnet"

# Database
EDGRAPH_DB_PATH="/app/.data/edgraph.sqlite"
```

### The Graph Configuration (Live Data Source)

```bash
# The Graph API - Uniswap V3 USDC/WETH pool on Ethereum mainnet
EDGRAPH_GRAPH_ENDPOINT="https://gateway.thegraph.com/api/c71b0bd685814c60d1a641b9d0bba7b8/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
EDGRAPH_GRAPH_SUBGRAPH_ID="5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV"
EDGRAPH_GRAPH_API_KEY="c71b0bd685814c60d1a641b9d0bba7b8"

# Pool and Token Configuration
EDGRAPH_GRAPH_POOL_ADDRESS="0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640"
EDGRAPH_STABLECOIN_ADDRESS="0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
EDGRAPH_STABLECOIN_SYMBOL="USDC"
EDGRAPH_QUOTE_TOKEN_ADDRESS="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
EDGRAPH_QUOTE_TOKEN_SYMBOL="WETH"
EDGRAPH_QUOTE_TOKEN_USD_PRICE="2500"
```

### Evidence API Configuration

```bash
# Evidence service pricing (1 HBAR = 100,000,000 tinybars)
EDGRAPH_EVIDENCE_PRICE_TINYBAR="1000000"
EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID="0.0.10426282"
```

### Agent Configuration (Autonomous Claims Processing)

```bash
# Agent credentials - funded account for buying evidence
EDGRAPH_AGENT_ACCOUNT_ID="0.0.10461760"
EDGRAPH_AGENT_PRIVATE_KEY="0x8aa1ed7c9bfe9db6c7c13ba36db39dc6d548c1e08d978570a149c8d792752e44"
```

### Hedera Network Configuration

```bash
# Hedera RPC endpoint
HEDERA_RPC_URL="https://testnet.hashio.io/api"
```

### Smart Contract Addresses

```bash
# PolicyRegistry Contract (Hedera Testnet)
POLICY_REGISTRY_ADDRESS="0xC3549920b94a795D75E6C003944943D552C46F97"
NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS="0xC3549920b94a795D75E6C003944943D552C46F97"
POLICY_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443942"
NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443942"

# FileRegistry Contract (Hedera Testnet)
FILE_REGISTRY_ADDRESS="0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9"
NEXT_PUBLIC_FILE_REGISTRY_ADDRESS="0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9"
FILE_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443939"
NEXT_PUBLIC_FILE_REGISTRY_HEDERA_CONTRACT_ID="0.0.10443939"
```

### WalletConnect / HashPack Configuration

```bash
# WalletConnect Project ID for HashPack integration
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID="21ac6fe1145d5e738b642eaaef8019da"

# Hedera RPC URLs (public variables for frontend)
NEXT_PUBLIC_HEDERA_MAINNET_RPC_URL="https://mainnet.hashio.io/api"
NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL="https://testnet.hashio.io/api"
```

### S3/MinIO Configuration (Not Used in Production)

```bash
# These are placeholder values - Railway deployment does not use MinIO
S3_ENDPOINT="http://unused"
S3_BUCKET="unused"
S3_ACCESS_KEY_ID="unused"
S3_SECRET_ACCESS_KEY="unused"
S3_REGION="us-east-1"
S3_FORCE_PATH_STYLE="true"
```

## Railway Service Configuration

### Build Configuration

- **Build Command**: `cd packages/nextjs && yarn install && yarn build`
- **Start Command**: `cd packages/nextjs && yarn start`
- **Root Directory**: Leave empty (monorepo root)

### Volume Configuration

- **Mount Path**: `/app/.data`
- **Size**: 500 MB minimum
- **Purpose**: Persistent SQLite database for EdGraph

### Domain Configuration

- **Production Domain**: `edgraph.up.railway.app`
- **Custom Domain**: (optional) Configure in Railway dashboard

## Environment Variable Categories

### Critical for Core Functionality

These MUST be set or the service will not function:

1. **FACILITATOR_URL** - x402 payment verification endpoint
2. **EDGRAPH_DB_PATH** - SQLite database file location
3. **POLICY_REGISTRY_ADDRESS** - On-chain policy storage
4. **FILE_REGISTRY_ADDRESS** - On-chain file metadata

### Required for Live Data

These enable real-time stablecoin monitoring:

1. **EDGRAPH_GRAPH_ENDPOINT** - The Graph API endpoint
2. **EDGRAPH_GRAPH_API_KEY** - Authentication for The Graph
3. **EDGRAPH_GRAPH_POOL_ADDRESS** - Uniswap pool to monitor

### Required for Payment Flow

These enable x402 payment processing:

1. **EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID** - Payment recipient
2. **EDGRAPH_EVIDENCE_PRICE_TINYBAR** - Evidence cost
3. **X402_NETWORK** - Hedera network identifier

### Required for Autonomous Agent

These enable the claims processing agent:

1. **EDGRAPH_AGENT_ACCOUNT_ID** - Agent's Hedera account
2. **EDGRAPH_AGENT_PRIVATE_KEY** - Agent's signing key

## Verification Checklist

After setting all variables in Railway:

- [ ] Service rebuilds successfully
- [ ] `/api/health` returns 200 OK
- [ ] `/api/openapi` returns the OpenAPI spec
- [ ] `/api/policies` returns policy list from PolicyRegistry
- [ ] `/api/graph/snapshot` returns live pool data from The Graph
- [ ] `/api/v1/depeg-evidence` returns 402 Payment Required with x402 headers
- [ ] Frontend loads at `https://edgraph.up.railway.app`
- [ ] Database volume is mounted at `/app/.data`

## Common Issues

### Missing Graph Configuration

**Symptom**: `/api/graph/snapshot` returns 503 Service Unavailable

**Fix**: Ensure these are set:
- `EDGRAPH_GRAPH_ENDPOINT`
- `EDGRAPH_GRAPH_API_KEY`
- `EDGRAPH_GRAPH_POOL_ADDRESS`

### Missing Contract Addresses

**Symptom**: `/api/policies` returns 502 Bad Gateway

**Fix**: Ensure these are set:
- `POLICY_REGISTRY_ADDRESS`
- `POLICY_REGISTRY_HEDERA_CONTRACT_ID`

### Database Not Persisting

**Symptom**: Policies disappear after redeployment

**Fix**: 
1. Check volume is mounted at `/app/.data`
2. Verify `EDGRAPH_DB_PATH="/app/.data/edgraph.sqlite"`
3. Run seed script after first deploy: `yarn seed:policies`

### x402 Payment Failing

**Symptom**: Payment signature validation fails

**Fix**: Ensure these match:
- `FACILITATOR_URL` points to the actual facilitator deployment
- `X402_NETWORK="hedera:testnet"` matches facilitator network
- `EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID` is a valid Hedera account

## Deployment Process

1. **Set all environment variables** in Railway dashboard
2. **Deploy from GitHub** - connect the `wy1` branch
3. **Wait for build** - Next.js build takes 2-3 minutes
4. **Verify health** - Check `/api/health` endpoint
5. **Seed policies** - Run `railway run yarn seed:policies` (one-time)
6. **Test evidence API** - Try accessing `/api/v1/depeg-evidence`

## Security Notes

- **EDGRAPH_AGENT_PRIVATE_KEY** is an ECDSA private key - keep it secure
- **EDGRAPH_GRAPH_API_KEY** authenticates to The Graph - treat as sensitive
- **NEXT_PUBLIC_* variables** are embedded in the client bundle - safe for public exposure
- Private keys should NEVER be committed to git - only set in Railway dashboard

## Monitoring

Railway automatically provides:
- **Logs**: Real-time application logs
- **Metrics**: CPU, memory, network usage
- **Health checks**: HTTP endpoint monitoring
- **Alerts**: Email notifications on crashes

Access via: `railway logs` or Railway dashboard
