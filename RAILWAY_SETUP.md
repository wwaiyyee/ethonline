# Railway Deployment Setup Guide

## Current Status
- Deployment URL: https://edgraph.up.railway.app
- Facilitator URL: https://edgraph-facilitator.up.railway.app
- Volume mounted at: `/app/.data` (for SQLite database)

## Issue Identified
The Railway database is empty because it's a fresh volume. You need to seed it with policies from the blockchain.

## Required Steps

### 1. Set All Environment Variables in Railway

Go to your Railway project > edgraph service > Variables and add ALL variables from `packages/nextjs/railway.env`:

**Critical Variables (Without these, APIs will fail):**
```bash
POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942
NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942
FILE_REGISTRY_ADDRESS=0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9
FILE_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443939
HEDERA_RPC_URL=https://testnet.hashio.io/api
EDGRAPH_DB_PATH=/app/.data/edgraph.sqlite
```

### 2. Seed the Database

After setting all environment variables, run the seed script on Railway:

**Option A: Via Railway CLI**
```bash
railway run yarn seed:policies
```

**Option B: Add to package.json build script (temporary)**
Modify `package.json` to run seed after build:
```json
"scripts": {
  "build": "rm -rf app/blockexplorer && next build && tsx scripts/seed-policies.ts"
}
```

Then trigger a redeploy in Railway.

### 3. Verify Database

After seeding, check the policies API:
```bash
curl https://edgraph.up.railway.app/api/policies
```

Should return 19 policies (currently returns empty because DB is not seeded).

### 4. Health Checks

Once seeded, all these should work:
- https://edgraph.up.railway.app/api/health
- https://edgraph.up.railway.app/api/policies
- https://edgraph.up.railway.app/api/claims
- https://edgraph.up.railway.app/api/graph/snapshot (may need The Graph API key)
- https://edgraph.up.railway.app/api/openapi

## Why This Happened

1. **Local vs Railway Database**: Your local `.data/edgraph.sqlite` has 19 policies. Railway's volume started empty.
2. **No Auto-Seed**: The seed script (`seed-policies.ts`) reads from the blockchain but isn't run automatically on deploy.
3. **Contract is Live**: The PolicyRegistry contract at `0xC3549920b94a795D75E6C003944943D552C46F97` exists on Hedera testnet and contains all the policies.

## Current Working Endpoints

These work because they don't need the database:
- `/api/health` - returns service info
- `/api/openapi` - returns OpenAPI spec
- `/api/graph/snapshot-mock` - returns mock data

## Broken Endpoints (need database)

These fail with "Failed to fetch" until database is seeded:
- `/api/policies` - needs seeded policies table
- `/api/claims` - needs claims table (can be empty initially)
- `/policies` page - depends on `/api/policies`
- `/claims` page - depends on `/api/claims`

## Next Steps

1. Add all variables from `railway.env` to Railway dashboard
2. Run `railway run yarn seed:policies` OR add seed to build script
3. Verify policies appear at https://edgraph.up.railway.app/api/policies
4. Test the full UI at https://edgraph.up.railway.app/policies
