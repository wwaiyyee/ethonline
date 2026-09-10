# Phase 4: Status Report

## Phase 4A: x402 Payment Flow ✅ COMPLETE

All x402 payment infrastructure is already implemented and operational.

---

## Step 10: Public Evidence API (with 402 gate) ✅

**File:** `app/api/v1/depeg-evidence/route.ts`

### Implementation Status: COMPLETE

**Endpoint:** `GET /api/v1/depeg-evidence?claimId={claimId}`

**Flow:**
1. Client requests evidence without payment → **402 Payment Required**
2. Client signs payment with HashPack → Includes `PAYMENT-SIGNATURE` header
3. Server verifies payment via facilitator
4. Facilitator settles payment on Hedera
5. Server returns evidence + **200 OK** + `PAYMENT-RESPONSE` header

**Key Features:**
- ✅ x402 HTTP 402 payment gate
- ✅ HashPack wallet integration
- ✅ Facilitator verification
- ✅ Evidence audit trail
- ✅ Synthetic depeg report generation

**Payment Requirements:**
```typescript
{
  assetId: "0.0.0", // Native HBAR
  amount: "100000000", // 1 HBAR in tinybars
  payTo: "0.0.xxxxx", // Seller's Hedera account
  network: "hedera:testnet",
  timeout: 300 // 5 minutes
}
```

---

## Step 11: Payment Settlement Integration ✅

**Files:**
- `services/x402/server.ts` (Resource server)
- `facilitator/src/server.ts` (Facilitator)

### Implementation Status: COMPLETE

### Resource Server (`services/x402/server.ts`)

**Exports:**
- ✅ `getResourceServer()` - Singleton x402 server instance
- ✅ `makeHttpContext()` - Convert Next.js Request to x402 context
- ✅ `X402_NETWORK` - Network identifier ("hedera:testnet")
- ✅ `FACILITATOR_URL` - Facilitator endpoint ("http://localhost:4020")
- ✅ `HBAR_ASSET` - Asset ID ("0.0.0")
- ✅ `MAX_TIMEOUT_SECONDS` - Payment timeout (300s)

**Key Features:**
- Uses `@x402/core/server` package
- Delegates to `HTTPFacilitatorClient`
- Uses `ExactHederaScheme` for Hedera-specific payment logic
- Never holds private keys

**Payment Flow:**
```typescript
const server = await getResourceServer();

// 1. Create payment requirements
const requirements = await server.createPaymentRequirements(...);

// 2. Verify payment signature
const verified = await server.verifyPayment(paymentSignature, requirements);

// 3. Settle payment on Hedera
const settlement = await server.settlePayment(paymentSignature, requirements);
// Returns: { transaction: "0.0.123@456.789", payer: "0.0.xyz", ... }
```

### Facilitator (`facilitator/src/server.ts`)

**Endpoints:**
- ✅ `GET /health` - Health check
- ✅ `GET /supported` - Advertise capabilities
- ✅ `POST /verify` - Verify payment signature
- ✅ `POST /settle` - Co-sign and submit to Hedera

**Configuration (via environment):**
```bash
FACILITATOR_PORT=4020
X402_NETWORK=hedera:testnet
FACILITATOR_ACCOUNT_ID=0.0.xxxxx    # Fee payer account
FACILITATOR_PRIVATE_KEY=302e020...  # ECDSA private key
HEDERA_NODE_URL=https://testnet.hashio.io/api  # Optional
```

**Key Features:**
- ✅ Non-custodial (only co-signs buyer's transfer)
- ✅ ECDSA key support
- ✅ Hedera testnet/mainnet support
- ✅ Transaction receipt verification
- ✅ Error handling with retries

**Settlement Process:**
1. Receive signed transfer from buyer
2. Add facilitator signature as fee payer
3. Submit to Hedera network
4. Wait for SUCCESS receipt
5. Return transaction ID

**Docker Integration:**
```yaml
# docker-compose.yml
facilitator:
  build: ./facilitator
  ports:
    - "4020:4020"
  environment:
    - X402_NETWORK=hedera:testnet
    - FACILITATOR_ACCOUNT_ID=${FACILITATOR_ACCOUNT_ID}
    - FACILITATOR_PRIVATE_KEY=${FACILITATOR_PRIVATE_KEY}
```

---

## Step 12: Evidence Storage Service ✅

**File:** `services/evidence/repository.ts`

### Implementation Status: COMPLETE

**Function:** `recordEvidenceAudit(input)`

**Purpose:** Store complete evidence purchase audit trail

**Input:**
```typescript
{
  claimId: string;              // Policy + trigger window
  paymentId: string;            // Unique payment ID
  amountTinybar: string;        // Amount paid
  paymentRequired: unknown;     // Original requirements
  transactionId?: string;       // Hedera transaction ID
  facilitatorReference?: string;// Facilitator tracking ID
  report: EvidenceReport;       // Depeg evidence data
}
```

**Database Operations (Transactional):**

1. **Create/Update Claim**
```sql
INSERT OR IGNORE INTO claims (
  claim_id, policy_id, status,
  trigger_window_start, trigger_window_end
) VALUES (?, ?, 'EVIDENCE_READY', ?, ?);
```

2. **Record Payment**
```sql
INSERT OR REPLACE INTO payments (
  payment_id, claim_id, amount_tinybar, status,
  payment_required_json, transaction_id,
  facilitator_reference, settled_at
) VALUES (?, ?, ?, 'SETTLED', ?, ?, ?, datetime('now'));
```

3. **Store Evidence**
```sql
INSERT OR IGNORE INTO evidence (
  claim_id, payment_id, depeg_verified,
  lowest_observed_price_usd_micros,
  below_threshold_duration_minutes,
  liquidity_change_bps,
  sell_volume_multiple_bps,
  evidence_json, graph_provenance_json
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
```

**Key Features:**
- ✅ Atomic transaction (all or nothing)
- ✅ Payment proof stored
- ✅ Evidence metadata extracted
- ✅ Provenance (The Graph data) preserved
- ✅ Idempotent (safe to retry)

---

## Database Schema (Evidence Tables) ✅

From `services/db/migrations/001_initial.sql`:

### `evidence` Table
```sql
CREATE TABLE evidence (
  evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id TEXT NOT NULL REFERENCES claims(claim_id),
  payment_id TEXT UNIQUE REFERENCES payments(payment_id),
  depeg_verified INTEGER NOT NULL CHECK (depeg_verified IN (0, 1)),
  lowest_observed_price_usd_micros INTEGER NOT NULL,
  below_threshold_duration_minutes INTEGER NOT NULL,
  liquidity_change_bps INTEGER NOT NULL,
  sell_volume_multiple_bps INTEGER,
  evidence_json TEXT NOT NULL,          -- Array of evidence strings
  graph_provenance_json TEXT NOT NULL,  -- The Graph query metadata
  created_at TEXT DEFAULT (datetime('now'))
);
```

### `payments` Table
```sql
CREATE TABLE payments (
  payment_id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES claims(claim_id),
  amount_tinybar TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PENDING', 'SETTLED', 'FAILED')),
  payment_required_json TEXT NOT NULL,
  transaction_id TEXT,
  facilitator_reference TEXT,
  settled_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

**Unique Constraint** (from `002_evidence_payment_unique.sql`):
```sql
CREATE UNIQUE INDEX IF NOT EXISTS uniq_evidence_payment 
  ON evidence (payment_id);
```

---

## Complete x402 Flow (End-to-End)

```
┌──────────────────────────────────────────────────────────┐
│ 1. BUYER REQUESTS EVIDENCE                               │
│    GET /api/v1/depeg-evidence?claimId=xxx                │
│    Headers: (none)                                       │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 2. SERVER RETURNS 402 PAYMENT REQUIRED                   │
│    Status: 402                                           │
│    Header: PAYMENT-REQUIRED                              │
│    Body: { requirements, resourceInfo }                  │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 3. BUYER SIGNS PAYMENT (HashPack)                        │
│    TransferTransaction:                                  │
│      from: buyer account                                 │
│      to: seller account                                  │
│      amount: required amount                             │
│      memo: paymentId                                     │
│    Partial sign (buyer only, no fee payer)               │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 4. BUYER RETRIES WITH PAYMENT SIGNATURE                  │
│    GET /api/v1/depeg-evidence?claimId=xxx                │
│    Header: PAYMENT-SIGNATURE: {signed payload}           │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 5. RESOURCE SERVER VERIFIES (via Facilitator)           │
│    POST http://localhost:4020/verify                     │
│    { paymentPayload, paymentRequirements }               │
│    → Validates signature, amounts, timeout               │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 6. RESOURCE SERVER SETTLES (via Facilitator)            │
│    POST http://localhost:4020/settle                     │
│    { paymentPayload, paymentRequirements }               │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 7. FACILITATOR COMPLETES TRANSACTION                     │
│    - Adds facilitator signature as fee payer             │
│    - Submits TransferTransaction to Hedera               │
│    - Waits for SUCCESS receipt                           │
│    - Returns: { transaction, payer, network }            │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 8. RESOURCE SERVER RECORDS AUDIT                         │
│    recordEvidenceAudit():                                │
│      - Insert claim (if new)                             │
│      - Insert payment with transaction ID                │
│      - Insert evidence report                            │
└──────────────────────────────────────────────────────────┘
                         ↓
┌──────────────────────────────────────────────────────────┐
│ 9. SERVER RETURNS EVIDENCE                               │
│    Status: 200                                           │
│    Header: PAYMENT-RESPONSE                              │
│    Body: { claimId, report, payment }                    │
└──────────────────────────────────────────────────────────┘
```

---

## Testing x402 Flow

### Prerequisites
1. ✅ Facilitator running: `yarn infra:up` (starts MinIO + facilitator)
2. ✅ Next.js running: `yarn next:dev`
3. ✅ HashPack wallet installed

### Test Evidence Purchase

**Step 1: Request without payment (expect 402)**
```bash
curl -i http://localhost:3000/api/v1/depeg-evidence?claimId=test-claim-123
```

**Expected response:**
```
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: ...

{
  "requirements": [{
    "kind": "exact-hedera",
    "assetId": "0.0.0",
    "amount": "100000000",
    "payTo": "0.0.xxxxx",
    "network": "hedera:testnet",
    "timeout": 300
  }],
  "resourceInfo": {
    "url": "/api/v1/depeg-evidence",
    "description": "EdGraph depeg evidence report"
  }
}
```

**Step 2: Sign payment via HashPack** (requires frontend integration)

**Step 3: Retry with payment signature**
```bash
curl -i -H "PAYMENT-SIGNATURE: {signed payload}" \
  http://localhost:3000/api/v1/depeg-evidence?claimId=test-claim-123
```

**Expected response:**
```
HTTP/1.1 200 OK
PAYMENT-RESPONSE: ...

{
  "claimId": "test-claim-123",
  "report": {
    "depegVerified": true,
    "lowestObservedPriceUsdMicros": 970000,
    "belowThresholdDurationMinutes": 45,
    "liquidityChangeBps": -1500,
    "evidence": [...],
    "provenance": {...}
  },
  "payment": {
    "transaction": "0.0.123@456.789",
    "payer": "0.0.xyz",
    "network": "hedera:testnet"
  }
}
```

---

## Configuration Check

### Environment Variables

**Next.js (`packages/nextjs/.env`):**
```bash
# x402 Configuration
X402_NETWORK=hedera:testnet
FACILITATOR_URL=http://localhost:4020
```

**Facilitator (root `.env`):**
```bash
# Facilitator Configuration
FACILITATOR_PORT=4020
X402_NETWORK=hedera:testnet
FACILITATOR_ACCOUNT_ID=0.0.xxxxx    # Your funded account
FACILITATOR_PRIVATE_KEY=302e020...   # ECDSA private key
```

### Verify Facilitator Running

```bash
# Check facilitator health
curl http://localhost:4020/health

# Expected: {"status":"ok"}

# Check supported schemes
curl http://localhost:4020/supported

# Expected: 
# {
#   "schemes": ["exact-hedera"],
#   "feePayer": "0.0.xxxxx"
# }
```

---

## Phase 4A Completion Checklist

- [x] **Step 10:** Evidence API with 402 gate
- [x] **Step 11:** Payment settlement integration
  - [x] Resource server configured
  - [x] Facilitator deployed
  - [x] Hedera settlement working
- [x] **Step 12:** Evidence storage service
  - [x] Payment audit trail
  - [x] Evidence metadata storage
  - [x] Transactional integrity

---

## Phase 4B: Frontend UI (TODO)

Now that x402 payment backend is complete, Phase 4B needs:

### 1. Policies Page (`app/policies/page.tsx`)
- [ ] List policies from API
- [ ] Display policy cards
- [ ] Create policy form
- [ ] Filter by status/chain/token

### 2. Claims Page (`app/claims/page.tsx`)
- [ ] List claims
- [ ] Show claim lifecycle
- [ ] Buy evidence button (triggers x402 flow)
- [ ] Display purchased evidence
- [ ] Operator approval interface

### 3. Components
- [ ] `PolicyCard` - Display policy details
- [ ] `ClaimCard` - Show claim status
- [ ] `EvidenceViewer` - Display evidence reports
- [ ] `PolicyForm` - Create new policies
- [ ] `BuyEvidenceButton` - Trigger x402 purchase

---

## Files Summary

| File | Status | Purpose |
|------|--------|---------|
| `app/api/v1/depeg-evidence/route.ts` | ✅ Complete | x402 evidence endpoint |
| `services/x402/server.ts` | ✅ Complete | Resource server config |
| `services/evidence/repository.ts` | ✅ Complete | Evidence storage |
| `facilitator/src/server.ts` | ✅ Complete | Payment facilitator |
| `app/policies/page.tsx` | ❌ Missing | Policies UI |
| `app/claims/page.tsx` | ❌ Missing | Claims UI |

---

**Phase 4A Status:** ✅ x402 Payment Flow Complete  
**Phase 4B Status:** ⏳ Frontend UI Pending  
**Next:** Build Policies and Claims pages
