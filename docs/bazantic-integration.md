# Bazantic Integration Proof

## Account Information
- **Bazantic Username:** [YOUR_USERNAME_HERE]
- **Gateway URL:** [YOUR_GATEWAY_URL_HERE]
- **Recipe URL:** [YOUR_PUBLISHED_RECIPE_URL_HERE]

## Registered Services

### 1. Graph Service (Free)
- **Name:** EdGraph Live Pool Monitor
- **Endpoint:** https://edgraph.up.railway.app/api/graph/snapshot
- **Type:** HTTP POST
- **Payment:** None
- **Purpose:** Live stablecoin pool monitoring from The Graph

### 2. Evidence API (x402 Paid)
- **Name:** EdGraph Depeg Evidence API
- **Endpoint:** https://edgraph.up.railway.app/api/v1/depeg-evidence
- **Type:** HTTP POST with x402
- **Payment:** 1,000,000 tinybars (0.01 HBAR) to 0.0.10426282
- **Purpose:** Deep evidence analysis with Graph provenance

## Test Results

### Evidence API Test (HTTP 402)
```bash
curl -i https://edgraph.up.railway.app/api/v1/depeg-evidence \
  -H "Content-Type: application/json" \
  -d '{"claimId":"test-001","policyId":"0x123","lookbackSeconds":3600}'
```

**Response:** ✅ HTTP 402 Payment Required
- Network: hedera:testnet
- Asset: 0.0.0 (native HBAR)
- Amount: 1000000 tinybars
- Receiver: 0.0.10426282
- Fee Payer: 0.0.10391956

### Facilitator Health Check
```bash
curl https://edgraph-facilitator.up.railway.app/health
```

**Response:** ✅ `{"status":"ok","network":"hedera:testnet","feePayer":"0.0.10391956"}`

## Workflow Description

The EdGraph workflow uses both services:

1. **Agent queries Graph service** (free) for live pool data
2. **Agent evaluates risk** based on price deviation, liquidity, data freshness
3. **Agent decides** whether evidence purchase is justified
4. **Agent pays HBAR** via x402 for Evidence API (if justified)
5. **Agent receives evidence** with complete Graph provenance
6. **Agent produces recommendation** (not auto-approval - DAO reviews)

## "New API" Status

The EdGraph Evidence API is a new API created during ETHOnline 2024:
- **First commit:** [COMMIT_HASH_HERE]
- **Creation date:** September 2024
- **Evidence:** The API did not exist before the hackathon

## Proof Files

Located in `docs/bazantic-proof/`:
- `account.png` - Bazantic account dashboard screenshot
- `gateway.png` - Gateway with both services registered
- `recipe.png` - Published Recipe screenshot
- `workflow.mp4` - Full agent workflow video
- `payment-tx.txt` - HashScan transaction links for test payments

## Notes

- Both services are publicly accessible
- Payment settlement happens on Hedera testnet
- Evidence includes complete Graph provenance (endpoint, subgraph, block range, query hash)
- Agent spending is controlled by policy budget limits
