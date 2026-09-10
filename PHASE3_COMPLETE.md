# Phase 3: Backend Services - Status Report

## ✅ Phase 3 Already Complete!

All backend services for Phase 3 (Steps 7-9) are **already implemented**.

---

## Step 7: Chain Reader Service ✅

**File:** `services/policy/chainReader.ts`

### Implementation Status: COMPLETE

**Functions implemented:**
- ✅ `readPolicyFromHedera(policyId)` - Read single policy from blockchain
- ✅ `listPoliciesFromHedera(offset, limit)` - Paginated policy listing
- ✅ `mapPolicy()` - Convert blockchain format to TypeScript `PolicyTerms`

**Key features:**
- Uses `viem` for blockchain interaction
- Reads from `deployedContracts.ts` automatically
- Error handling for `PolicyNotFound`
- Supports pagination (max 50 per page)
- Converts BigInt to string for precision

**Contract integration:**
```typescript
import { POLICY_REGISTRY_ABI, getPolicyRegistryAddress } from "~~/contracts/policyRegistryAbi";

// Reads from deployed address on Hedera testnet (chain ID 296)
const address = getPolicyRegistryAddress(targetChain.id);
// Address: 0xC3549920b94a795D75E6C003944943D552C46F97
```

---

## Step 8: Policy Repository ✅

**File:** `services/policy/repository.ts`

### Implementation Status: COMPLETE

**Functions implemented:**
- ✅ `upsertPolicy(policy)` - Insert or update policy in SQLite
- ✅ `getPolicy(policyId)` - Get single policy from database
- ✅ `getAllPolicies()` - Get all policies
- ✅ `listActivePolicies(now)` - Get currently active policies (for monitoring)
- ✅ `markPolicyResolved(policyId, resolutionHash)` - Mark policy as resolved

**Database operations:**
- Full CRUD operations
- SQLite with better-sqlite3
- Type-safe conversions (TypeScript ↔ SQLite)
- Active/resolved status tracking
- Timestamp tracking (created_at, updated_at)

**Type conversions:**
```typescript
// Handles:
// - BigInt to string (payout amounts, evidence budgets)
// - Boolean to 0/1 (active, resolved)
// - Hex addresses (0x...)
// - Timestamps (Unix seconds)
```

---

## Step 9: Database Schema ✅

**File:** `services/db/migrations/001_initial.sql`

### Implementation Status: COMPLETE

**Tables created:**

### 1. `policies` Table
```sql
CREATE TABLE policies (
  policy_id TEXT PRIMARY KEY,
  policyholder TEXT NOT NULL,
  data_chain_id TEXT NOT NULL,
  stablecoin_symbol TEXT NOT NULL,
  stablecoin_address TEXT NOT NULL,
  reference_pool_address TEXT NOT NULL,
  threshold_bps INTEGER CHECK (threshold_bps > 0 AND threshold_bps <= 10000),
  minimum_duration_minutes INTEGER CHECK (minimum_duration_minutes > 0),
  payout_amount_base_units TEXT NOT NULL,
  payout_token_symbol TEXT NOT NULL,
  coverage_start INTEGER NOT NULL,
  coverage_end INTEGER NOT NULL CHECK (coverage_end > coverage_start),
  max_evidence_budget_tinybar TEXT NOT NULL,
  active INTEGER DEFAULT 1 CHECK (active IN (0, 1)),
  resolved INTEGER DEFAULT 0 CHECK (resolved IN (0, 1)),
  resolution_hash TEXT,
  creation_transaction_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
```

**Indexes:**
- `idx_policies_active_coverage` - For finding active policies
- `idx_policies_coverage_dates` - For date range queries
- `idx_policies_chain_symbol` - For filtering by chain/stablecoin

### 2. `observations` Table
Market data observations from Base chain (The Graph)

### 3. `claims` Table
Detected depegs and claim lifecycle

### 4. `evidence` Table
Purchased evidence from x402 marketplace

### 5. `payments` Table (with `002_evidence_payment_unique.sql`)
Payment proofs for evidence purchases

### 6. `approvals` Table
Operator approval decisions

**Migration system:**
- ✅ Auto-applied on first database access
- ✅ Version tracking in `schema_migrations` table
- ✅ Transactional (rollback on failure)

---

## Step 10: Policy API Route ✅

**File:** `app/api/policies/route.ts`

### Implementation Status: COMPLETE

### GET `/api/policies`
**Purpose:** List policies with pagination

**Query params:**
- `offset` - Starting index (default: 0)
- `limit` - Page size (max: 50, default: 50)

**Response:**
```json
{
  "policies": [
    {
      "policyId": "0xabc...",
      "policyholder": "Acme DAO",
      "dataChainId": "base",
      "stablecoinSymbol": "USDC",
      ...
    }
  ],
  "total": 10,
  "offset": 0,
  "limit": 50
}
```

**Data flow:**
1. Read from Hedera blockchain via `listPoliciesFromHedera()`
2. Upsert each policy into SQLite via `upsertPolicy()`
3. Return data to client

### POST `/api/policies`
**Purpose:** Prepare policy creation parameters

**Request body:**
```json
{
  "policyholder": "Acme DAO",
  "dataChainId": "base",
  "stablecoinSymbol": "USDC",
  "stablecoinAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  "referencePoolAddress": "0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C",
  "thresholdBps": 9800,
  "minimumDurationMinutes": 15,
  "payoutAmountBaseUnits": "1000000000",
  "payoutTokenSymbol": "HBAR",
  "coverageStart": 1694000000,
  "coverageEnd": 1696592000,
  "maxEvidenceBudgetTinybar": "500000000"
}
```

**Response:**
```json
{
  "status": "ready_for_wallet",
  "functionName": "createPolicy",
  "args": [...],
  "message": "Submit these arguments through HashPack native ContractExecuteTransaction."
}
```

**Why this design:**
The backend validates parameters but **doesn't create the policy directly** because:
1. Policy creation requires paying gas in HBAR
2. User must sign with HashPack wallet
3. Frontend calls `createPolicy()` via `ContractExecuteTransaction`
4. After on-chain creation, GET endpoint syncs to SQLite

---

## Additional Infrastructure ✅

### Database Client
**File:** `services/db/client.ts`

**Features:**
- ✅ Singleton pattern (one connection per process)
- ✅ Auto-migration on first access
- ✅ WAL mode for concurrent reads
- ✅ Foreign key enforcement
- ✅ 5-second busy timeout
- ✅ Environment variable support (`EDGRAPH_DB_PATH`)

**Default location:** `.data/edgraph.sqlite`

### Contract ABI Helper
**File:** `contracts/policyRegistryAbi.ts`

**Features:**
- ✅ Extracts ABI from `deployedContracts.ts`
- ✅ Type-safe function calls
- ✅ Multi-chain support (resolves by chain ID)
- ✅ Includes all functions: `createPolicy`, `getPolicy`, `getPolicies`, `resolvePolicy`

---

## Testing Phase 3

### Test 1: Database Migrations
```bash
# Migrations auto-run on first API call
# Or manually test:
node -e "const {getDb} = require('./services/db/client.ts'); getDb();"
```

### Test 2: Read from Blockchain
```bash
# Start Next.js
yarn next:dev

# Call API
curl http://localhost:3000/api/policies
```

**Expected response:**
```json
{
  "policies": [],
  "total": 0,
  "offset": 0,
  "limit": 50
}
```
(Empty initially - no policies created yet via wallet)

### Test 3: Direct Repository Test
```typescript
// services/policy/__tests__/repository.test.ts
import { upsertPolicy, getPolicy } from '../repository';

const testPolicy = {
  policyId: '0x123...',
  policyholder: 'Test DAO',
  // ... all fields
};

upsertPolicy(testPolicy);
const retrieved = getPolicy('0x123...');
// Should match testPolicy
```

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│ Frontend (Next.js Client)                               │
│ - Policy creation form                                  │
│ - HashPack wallet integration                           │
└─────────────────────────────────────────────────────────┘
                    ↓ POST /api/policies (validate)
                    ↓ Get contract call params
┌─────────────────────────────────────────────────────────┐
│ API Routes (Next.js Server)                             │
│ - GET /api/policies → Read & sync                       │
│ - POST /api/policies → Validate & prepare               │
└─────────────────────────────────────────────────────────┘
        ↓                           ↓
┌──────────────────┐    ┌──────────────────────────────┐
│ Chain Reader     │    │ Policy Repository            │
│ (chainReader.ts) │    │ (repository.ts)              │
│                  │    │                              │
│ - Read from      │    │ - SQLite CRUD                │
│   Hedera         │    │ - Active policy queries      │
│ - Map to types   │    │ - Resolution tracking        │
└──────────────────┘    └──────────────────────────────┘
        ↓                           ↓
┌──────────────────┐    ┌──────────────────────────────┐
│ PolicyRegistry   │    │ SQLite Database              │
│ Smart Contract   │    │ (.data/edgraph.sqlite)       │
│ 0x.10443942      │    │                              │
│                  │    │ Tables:                      │
│ - Hedera Testnet │    │ - policies                   │
│ - Immutable      │    │ - observations               │
│   terms          │    │ - claims                     │
└──────────────────┘    │ - evidence                   │
                        │ - payments                   │
                        │ - approvals                  │
                        └──────────────────────────────┘
```

---

## Data Flow: Policy Creation

```
1. User fills form → Frontend
2. POST /api/policies → Backend validates
3. Backend returns contract call params
4. Frontend calls PolicyRegistry.createPolicy() via HashPack
5. User signs transaction with wallet
6. Transaction confirmed on Hedera
7. GET /api/policies → Backend reads new policy from chain
8. Backend upserts to SQLite
9. Frontend displays updated policy list
```

---

## Phase 3 Completion Checklist

- [x] **Step 7:** Chain reader service (`chainReader.ts`)
- [x] **Step 8:** Policy repository (`repository.ts`)
- [x] **Step 9:** Database schema (`001_initial.sql`)
- [x] **Step 10:** Policy API route (`/api/policies`)
- [x] **Bonus:** Database client with migrations
- [x] **Bonus:** Contract ABI helpers
- [x] **Bonus:** Additional tables (observations, claims, evidence, payments, approvals)

---

## Next Steps: Phase 4 (Frontend UI)

Now that backend is complete, Phase 4 will build:

1. **Policies Page** (`app/policies/page.tsx`)
   - List all policies
   - Filter by status, chain, stablecoin
   - Policy creation form

2. **Claims Page** (`app/claims/page.tsx`)
   - List all claims
   - Show claim lifecycle
   - Display evidence
   - Operator approval interface

3. **Components**
   - PolicyCard
   - ClaimCard
   - EvidenceViewer
   - ApprovalControls

---

## Files Summary

| File | Status | Purpose |
|------|--------|---------|
| `services/policy/chainReader.ts` | ✅ Complete | Read policies from blockchain |
| `services/policy/repository.ts` | ✅ Complete | SQLite CRUD operations |
| `services/policy/types.ts` | ✅ Complete | TypeScript type definitions |
| `services/db/client.ts` | ✅ Complete | Database connection & migrations |
| `services/db/schema.ts` | ✅ Complete | Table names & helpers |
| `services/db/migrations/001_initial.sql` | ✅ Complete | Database schema |
| `services/db/migrations/002_evidence_payment_unique.sql` | ✅ Complete | Constraint addition |
| `app/api/policies/route.ts` | ✅ Complete | REST API endpoint |
| `contracts/policyRegistryAbi.ts` | ✅ Complete | Contract interface |

---

**Phase 3 Status:** ✅ 100% Complete  
**Ready for:** Phase 4 (Frontend UI)  
**Total Files:** 9 core files + supporting infrastructure
