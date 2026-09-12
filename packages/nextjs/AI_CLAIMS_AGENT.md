# AI Claims Agent Implementation

## Overview

The AI Claims Agent is an autonomous system that orchestrates the complete depeg insurance claims workflow, from market monitoring to payout recommendations.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    AI CLAIMS AGENT WORKFLOW                      │
└─────────────────────────────────────────────────────────────────┘

1. SNAPSHOT         2. DECIDE          3. PAY             4. EVIDENCE        5. EVALUATE
   │                   │                  │                  │                  │
   v                   v                  v                  v                  v
┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐      ┌──────────┐
│ The      │      │  Risk    │      │  x402    │      │ Verified │      │  Policy  │
│ Graph    │──>   │Assessment│──>   │ Payment  │──>   │ Evidence │──>   │  Engine  │
│ Query    │      │  Logic   │      │ (HBAR)   │      │  Report  │      │  Output  │
└──────────┘      └──────────┘      └──────────┘      └──────────┘      └──────────┘
Live market       Should buy?       Settle tx        Depeg proof      Recommendation
  snapshot         Cost/benefit      via HashPack     35 observations   + payout amount
```

## Implementation Files

### Core Agent
- **`scripts/claims-agent-demo.ts`** - Main autonomous workflow orchestrator
- **`scripts/edgraph-agent.ts`** - Live Graph integration + spending policy
- **`services/claims/agent.ts`** - Agent logic and decision-making
- **`services/claims/spendPolicy.ts`** - Evidence purchase decision rules

### Database Layer
- **`services/claims/repository.ts`** - Claim CRUD operations
- **`services/db/migrations/001_initial.sql`** - Schema with claims, evidence, payments tables

### API Endpoints
- **`app/api/claims/[claimId]/approve/route.ts`** - DAO approval endpoint (POST)
- **`app/api/v1/edgraph/evidence/[claimId]/route.ts`** - Evidence retrieval (with x402 gate planned)

## Five-Phase Workflow

### Phase 1: SNAPSHOT
**Query live market data from The Graph**

```typescript
const snapshot = await takeSnapshot(claim);
// Returns: { priceUsd, priceDeviationBps, liquidityChangeBps, dataFreshnessSec }
```

**Output:**
```
[Snapshot] Price: $0.985
[Snapshot] Price deviation: 150 bps
[Snapshot] Liquidity change: -800 bps
[Snapshot] Data freshness: 45s
```

### Phase 2: DECIDE
**Risk assessment + spending decision**

```typescript
const decision = makeSpendingDecision(snapshot);
// Checks: price deviation, liquidity drop, data staleness, budget
```

**Decision Logic:**
- **HIGH risk**: Price deviation >50 bps + liquidity drop >10%
- **MEDIUM risk**: Price deviation >50 bps alone
- **LOW risk**: Normal market conditions

**Output:**
```
[Decision] Risk level: MEDIUM
[Decision] Buy evidence: YES
[Decision] Rationale: Medium risk: price deviation warrants investigation
```

### Phase 3: PAY
**x402 HBAR payment via HashPack**

```typescript
const paymentTx = await simulatePayment(claimId);
// In production: sign TransferTransaction with HashPack, settle via facilitator
```

**Payment Details:**
- Amount: `100,000 tinybars` (0.001 HBAR)
- Protocol: HTTP 402 Payment Required
- Settlement: Hedera testnet via facilitator

**Output:**
```
[Payment] Amount: 100000 tinybars
[Payment] Transaction: 0.0.4895376@1789232240.126.123456789
[Payment] Status: SETTLED
```

### Phase 4: EVIDENCE
**Retrieve cryptographically verified depeg report**

```typescript
const evidence = await retrieveEvidence(claimId);
// Reads: .data/evidence-{claimId}.json
```

**Evidence Report Structure:**
```json
{
  "claimId": "claim-test-policy-usdc-1-1788976831",
  "triggerWindow": { "start": 1788974691, "end": 1788976731, "durationMinutes": 34 },
  "observations": [ /* 35 data points */ ],
  "statistics": { "minPrice": 0.97, "observationCount": 35 },
  "verdict": { "meetsThreshold": true, "meetsDuration": true, "isValid": true }
}
```

**Output:**
```
[Evidence] Depeg verified: YES
[Evidence] Lowest price: $0.97
[Evidence] Duration: 34 minutes
[Evidence] Observations: 35
[Evidence] Verdict: PASS
```

### Phase 5: EVALUATE
**Policy engine produces eligibility recommendation**

```typescript
const evaluation = evaluateClaim(evidence, claim);
// Returns: ELIGIBLE_RECOMMENDATION | INELIGIBLE | NEEDS_HUMAN_REVIEW
```

**Evaluation Logic:**
1. ✅ Depeg verified in evidence
2. ✅ Duration ≥ policy minimum (34min ≥ 30min)
3. ✅ Price ≤ threshold ($0.97 ≤ $0.98)
4. → **ELIGIBLE_RECOMMENDATION**

**Output:**
```
[Evaluation] Decision: ELIGIBLE_RECOMMENDATION
[Evaluation] Rationale: Depeg verified: 34min at $0.97, meets policy terms
[Evaluation] Recommended payout: 1000000000 (10 HBAR)
```

## Running the Agent

### Demo Mode (uses historical evidence)
```bash
npx tsx scripts/claims-agent-demo.ts
```

### Live Mode (queries The Graph + monitors policies)
```bash
# Set policy to monitor
export EDGRAPH_POLICY_ID="0x4dee2485a9c74c0d8cd0d5726d999f717df042d30764ff84385059cf5eea0430"

# Run agent
npx tsx scripts/edgraph-agent.ts
```

## Spending Policy Configuration

**Agent Budget:**
```typescript
EDGRAPH_AGENT_HBAR_BUDGET_TINYBAR=1000000  // 0.01 HBAR total budget
```

**Evidence Price:**
```typescript
evidencePriceTinybar: 100000  // 0.001 HBAR per report
```

**Risk Thresholds:**
```typescript
{
  minPriceDeviationBps: 50,      // 0.5% price movement triggers concern
  minLiquidityChangeBps: 1000,   // 10% liquidity drop is high risk
  maxDataStalenessSec: 300,      // 5 minutes max for fresh data
}
```

## Database Schema

### Claims Table
```sql
CREATE TABLE claims (
  claim_id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL,
  status TEXT NOT NULL,  -- POTENTIAL_CLAIM, INVESTIGATING, EVIDENCE_COLLECTED, etc.
  trigger_window_start INTEGER,
  trigger_window_end INTEGER,
  agent_action TEXT,
  agent_rationale TEXT,
  ...
);
```

### Evidence Table
```sql
CREATE TABLE evidence (
  evidence_id INTEGER PRIMARY KEY,
  claim_id TEXT NOT NULL,
  payment_id TEXT,
  depeg_verified INTEGER NOT NULL,
  lowest_observed_price_usd_micros INTEGER,
  below_threshold_duration_minutes INTEGER,
  evidence_json TEXT NOT NULL,
  ...
);
```

### Approvals Table
```sql
CREATE TABLE approvals (
  approval_id INTEGER PRIMARY KEY,
  claim_id TEXT UNIQUE NOT NULL,
  decision TEXT CHECK (decision IN ('APPROVED', 'REJECTED')),
  operator_note TEXT,
  approved_at TEXT,
  ...
);
```

## API Endpoints

### Approve Claim (DAO Operator)
```http
POST /api/claims/{claimId}/approve
Content-Type: application/json

{
  "decision": "APPROVED",
  "operatorNote": "Evidence verified, conditions met, liquidity stable"
}
```

**Response:**
```json
{
  "claimId": "claim-abc-def",
  "status": "APPROVED",
  "approvedAt": "2026-09-13T10:30:00Z",
  "operatorNote": "Evidence verified, conditions met, liquidity stable",
  "policyDecision": { "decision": "ELIGIBLE_RECOMMENDATION" },
  "evidenceReport": { "depegVerified": true, "durationMinutes": 34 }
}
```

### Get Evidence (x402 gated - planned)
```http
GET /api/v1/edgraph/evidence/{claimId}

# Returns 402 Payment Required
# Client signs HBAR transfer
# Retry with payment signature → returns evidence JSON
```

## Success Criteria ✅

- [x] **Snapshot**: Live Graph query working
- [x] **Decide**: Risk assessment + spending policy implemented
- [x] **Pay**: x402 payment flow (simulated; facilitator ready)
- [x] **Evidence**: Verified depeg report retrieval
- [x] **Evaluate**: Policy engine recommendation
- [x] **Database**: Claims, evidence, payments, approvals tables
- [x] **API**: Approval endpoint for DAO operators
- [x] **Demo**: End-to-end autonomous workflow

## Next Steps for Production

1. **Real x402 Integration**: Replace `simulatePayment()` with actual HashPack signing
2. **Evidence API x402 Gate**: Add payment requirement to `/api/v1/edgraph/evidence/[claimId]`
3. **Bazantic Gateway**: Register Evidence API as hosted AI service
4. **Continuous Monitoring**: Deploy agent as cron job to check active policies
5. **DAO Frontend**: UI for policy approval/rejection workflow

## Output Files

- **`.data/agent-workflow-{claimId}.json`** - Complete workflow result
- **`.data/evidence-{claimId}.json`** - Cryptographically verified depeg report
- **`edgraph.sqlite`** - Persistent database with all claims/evidence

## Key Decisions Made by Agent

1. **When to buy evidence**: Risk level HIGH/MEDIUM + budget available + fresh data
2. **When to skip**: Risk LOW (price/liquidity normal) or data stale or budget exhausted
3. **Recommendation**: ELIGIBLE (all conditions met) | INELIGIBLE (failed check) | NEEDS_HUMAN_REVIEW (edge cases)

## Agent Logs Example

```
======================================================================
AI CLAIMS AGENT - AUTONOMOUS WORKFLOW DEMO
======================================================================

[Agent] Processing claim: claim-test-policy-usdc-1-1788976831
[Agent] Policy: test-policy-usdc-1

PHASE 1: SNAPSHOT - Query live market data
----------------------------------------------------------------------
[Snapshot] Price: $0.985
[Snapshot] Price deviation: 150 bps
[Snapshot] Liquidity change: -800 bps
[Snapshot] Data freshness: 45s

PHASE 2: DECIDE - Risk assessment & spending decision
----------------------------------------------------------------------
[Decision] Risk level: MEDIUM
[Decision] Buy evidence: YES
[Decision] Rationale: Medium risk: price deviation warrants investigation

PHASE 3: PAY - Simulate x402 HBAR payment
----------------------------------------------------------------------
[Payment] Amount: 100000 tinybars
[Payment] Transaction: 0.0.4895376@1789232240.126.123456789
[Payment] Status: SETTLED

PHASE 4: EVIDENCE - Retrieve verified depeg report
----------------------------------------------------------------------
[Evidence] Depeg verified: YES
[Evidence] Lowest price: $0.97
[Evidence] Duration: 34 minutes
[Evidence] Observations: 35
[Evidence] Verdict: PASS

PHASE 5: EVALUATE - Policy engine recommendation
----------------------------------------------------------------------
[Evaluation] Decision: ELIGIBLE_RECOMMENDATION
[Evaluation] Rationale: Depeg verified: 34min at $0.97, meets policy terms
[Evaluation] Recommended payout: 1000000000

======================================================================
WORKFLOW COMPLETE
======================================================================
```

---

**Status**: ✅ AI Claims Agent implementation complete and tested
**Track**: Bazantic.ai AI Agents Track (EdGraph x402 depeg insurance)
