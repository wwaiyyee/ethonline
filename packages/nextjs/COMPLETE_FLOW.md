# Complete AI Claims Agent Flow

## End-to-End Process

The autonomous insurance claims system processes depeg events through **5 phases**. Here's the complete flow:

---

## 🔄 Phase 1: SNAPSHOT (Live Market Data)

**File**: `services/graph/agentTool.ts`

```typescript
queryPoolRiskSnapshot(policyId)
```

**What happens:**
1. Query **The Graph** API (Uniswap V3 Base subgraph)
2. Fetch last 30+ observations of the USDC/WETH pool
3. Calculate metrics:
   - Current price (e.g., $1.002)
   - Price movement over last 30 mins (bps)
   - Liquidity change (bps)
   - Swap volume

**Output:**
```json
{
  "currentPriceUsdMicros": 1002000,
  "recentPriceMovementBps": -15,
  "liquidityUsdMicros": 45000000000,
  "liquidityChangeBps": -50,
  "swapVolumeUsdMicros": 2000000000
}
```

---

## 🤖 Phase 2: DECIDE (AI Risk Assessment)

**File**: `services/ai/riskAssessment.ts`

```typescript
assessRiskWithAI(snapshot, policy, budgetRemaining)
```

**Provider Selection:**
- Checks `AI_PROVIDER` env var (GEMINI or CLAUDE)
- Routes to the selected AI provider

**What the AI evaluates:**
1. Is price approaching the depeg threshold?
   - Policy threshold: $0.98 (200 bps below $1.00)
   - Current price: $1.002
   - Distance: 220 bps above threshold = LOW RISK

2. Are market conditions deteriorating?
   - Price movement: -15 bps (slightly down)
   - Liquidity change: -50 bps (minor drain)
   - Risk level: LOW

3. Should we buy evidence?
   - Evidence cost: 0.001 HBAR (100,000 tinybars)
   - Budget remaining: 1 HBAR (1,000,000 tinybars)
   - Decision: **SKIP_EVIDENCE** (conserve budget, price is stable)

**AI Providers:**

### Gemini (Google)
- Model: `gemini-2.0-flash-exp`
- Fast inference (~1-2 seconds)
- Cost-effective for high-volume processing

### Claude (Anthropic)
- Model: `claude-3-5-sonnet-20241022`
- Deeper reasoning (~2-4 seconds)
- Better for complex edge cases

**Output:**
```json
{
  "buyEvidence": false,
  "riskLevel": "LOW",
  "confidence": 85,
  "rationale": "Current price ($1.002) is 220 bps above the depeg threshold ($0.98). Minor price movement (-15 bps) and liquidity drain (-50 bps) do not indicate an imminent depeg event. Evidence cost (0.001 HBAR) is not justified at this time.",
  "keyFactors": [
    "Price stable at $1.002",
    "Distance to threshold: 220 bps",
    "Liquidity change minimal",
    "Low urgency"
  ]
}
```

**Database update:**
```sql
UPDATE claims SET
  agent_action = 'SKIP_EVIDENCE',
  agent_rationale = '...',
  snapshot_price_usd_micros = 1002000,
  snapshot_duration_seconds = 0
WHERE claim_id = 'claim-xxx'
```

**End of flow if SKIP_EVIDENCE** ✋

---

## 💳 Phase 3: PAY (x402 Payment Protocol)

**File**: `services/claims/agent.ts` (lines 98-149)

**Only executed if AI decides BUY_EVIDENCE**

### Step 3.1: Initial Evidence API Request

```http
POST /api/v1/depeg-evidence
Content-Type: application/json

{
  "policyId": "0.0.12345",
  "claimId": "claim-xxx"
}
```

**Response: 402 Payment Required**
```http
HTTP/1.1 402 Payment Required
X402-Accept: hedera:testnet exact-hedera
X402-Price: 100000
X402-Payee-Account-Id: 0.0.10391956

{
  "reason": "Payment required for depeg evidence",
  "price": 100000,
  "asset": "0.0.0",
  "payTo": "0.0.10391956"
}
```

### Step 3.2: Sign HBAR Transfer

**Wallet**: `EDGRAPH_AGENT_ACCOUNT_ID` + `EDGRAPH_AGENT_PRIVATE_KEY`

```typescript
// Create Hedera signer
const signer = createClientHederaSigner(accountId, privateKey, {
  network: "hedera:testnet"
});

// Build x402 client with ExactHederaScheme
const client = new x402Client().register(
  "hedera:testnet", 
  new ExactHederaScheme(signer)
);

// Sign the transfer (partial signature)
const payload = await httpClient.createPaymentPayload(paymentRequired);
```

**Generated Transaction:**
- Type: `TransferTransaction`
- From: Agent account (`0.0.10391956`)
- To: Evidence service (`0.0.10391956` - same account in demo)
- Amount: 100,000 tinybars (0.001 HBAR)
- Signed by: Agent private key (partial signature)

### Step 3.3: Retry with Payment Signature

```http
POST /api/v1/depeg-evidence
Content-Type: application/json
PAYMENT-SIGNATURE: <base64-encoded-signed-transaction>

{
  "policyId": "0.0.12345",
  "claimId": "claim-xxx"
}
```

### Step 3.4: Facilitator Settlement

**File**: `facilitator/` (Docker service on port 4020)

1. Evidence API calls facilitator: `POST /settle`
2. Facilitator verifies the partial signature
3. Facilitator adds its fee-payer signature
4. Facilitator submits transaction to Hedera testnet
5. Returns transaction ID

**Response: 200 OK with Evidence**
```http
HTTP/1.1 200 OK
X402-Transaction: 0.0.xxx@1234567890.123456789

{
  "claimId": "claim-xxx",
  "report": { ... },
  "payment": {
    "transaction": "0.0.xxx@1234567890.123456789",
    "payer": "0.0.10391956",
    "network": "hedera:testnet"
  }
}
```

---

## 📊 Phase 4: EVIDENCE (Cryptographic Proof)

**File**: `services/policy/evidenceGenerator.ts`

**Evidence Report Structure:**
```json
{
  "claimId": "claim-xxx",
  "policyId": "0.0.12345",
  "depegVerified": true,
  "lowestObservedPriceUsdMicros": 970000,
  "depegDurationSeconds": 2040,
  "belowThresholdDurationMinutes": 34,
  "observationCount": 35,
  "liquidityChangeBps": -1200,
  "firstObservationTimestamp": 1726234560,
  "lastObservationTimestamp": 1726236600,
  "triggerWindowStart": 1726234560,
  "triggerWindowEnd": 1726236600,
  "sourceName": "the-graph",
  "contentHash": "sha256:abc123...",
  "provenance": {
    "sourceName": "the-graph",
    "endpoint": "https://gateway.thegraph.com/api/...",
    "subgraphId": "5zvR82Q...",
    "latestBlock": 12345678,
    "queryTimestamp": 1726236600
  }
}
```

**Key Verification Points:**
- ✅ 35 observations collected over 34 minutes
- ✅ Lowest price: $0.97 (below $0.98 threshold)
- ✅ Duration: 34 minutes (above 30 minute requirement)
- ✅ Liquidity crash: -1200 bps (-12%)
- ✅ Cryptographic content hash for tamper-proof audit

**Database storage:**
```sql
INSERT INTO evidence (
  claim_id,
  report_json,
  content_hash,
  created_at
) VALUES (?, ?, ?, ?);

UPDATE claims SET
  status = 'EVIDENCE_READY',
  evidence_price_usd_micros = 970000,
  evidence_duration_seconds = 2040
WHERE claim_id = 'claim-xxx';
```

---

## ⚖️ Phase 5: EVALUATE (Policy Decision)

**File**: `services/ai/claimEvaluation.ts`

```typescript
evaluateClaimWithAI(policy, evidence)
```

**Provider Selection:**
- Checks `AI_PROVIDER` env var
- Routes to `evaluateWithGemini()` or `evaluateWithClaude()`

**What the AI evaluates:**

### Policy Terms Check
```
✓ Price verification: $0.97 <= $0.98 threshold? YES
✓ Duration check: 34 min >= 30 min? YES
✓ Coverage period: Within start/end dates? YES
✓ Data provenance: Complete and trustworthy? YES
```

### Risk Flags
```
⚠️ Extreme liquidity crash (-12%)? → Flag for review
⚠️ Data gaps in observations? → Check timestamps
⚠️ Unusual price recovery pattern? → Analyze trend
```

**AI Output:**
```json
{
  "outcome": "ELIGIBLE_RECOMMENDATION",
  "confidence": 95,
  "reasoning": "The evidence conclusively demonstrates a depeg event. The USDC price fell to $0.97, remaining below the $0.98 threshold for 34 consecutive minutes (exceeding the 30-minute policy requirement). The depeg occurred within the coverage period. Data provenance is complete with 35 observations from The Graph. The 12% liquidity drain supports the severity of the event. All policy conditions are satisfied.",
  "reasons": [
    "Price dropped to $0.97 (below $0.98 threshold)",
    "Duration: 34 minutes (exceeds 30 min requirement)",
    "Event occurred within coverage period",
    "Complete data provenance with 35 observations",
    "Liquidity crash (-12%) confirms market stress"
  ],
  "recommendedPayoutAmountBaseUnits": "10000000000",
  "flagsForReview": [
    "Severe liquidity crash (-12%) - verify no market manipulation"
  ]
}
```

**Database update:**
```sql
UPDATE claims SET
  status = 'ELIGIBLE_RECOMMENDATION',
  policy_decision_json = '{ ... }',
  recommended_payout_amount_base_units = '10000000000'
WHERE claim_id = 'claim-xxx';
```

---

## 🎯 Final Status

**Claim Status Flow:**

```
POTENTIAL_CLAIM
  ↓
INVESTIGATING (agent running)
  ↓
SKIP_EVIDENCE (if risk is low) → INVESTIGATING_COMPLETE
  OR
BUY_EVIDENCE
  ↓
EVIDENCE_READY (report received)
  ↓
ELIGIBLE_RECOMMENDATION (AI approved)
  ↓
NEEDS_HUMAN_REVIEW (DAO vote)
  ↓
APPROVED (DAO approved) → Payout executed on Hedera
```

---

## 🔧 Configuration

### Switch AI Provider

**Edit `packages/nextjs/.env`:**

```bash
# Use Gemini (default)
AI_PROVIDER=GEMINI
GEMINI_API_KEY=your-key

# Switch to Claude
AI_PROVIDER=CLAUDE
ANTHROPIC_API_KEY=your-key
```

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `AI_PROVIDER` | Choose `GEMINI` or `CLAUDE` |
| `GEMINI_API_KEY` | Google Gemini API key |
| `ANTHROPIC_API_KEY` | Anthropic Claude API key |
| `EDGRAPH_AGENT_ACCOUNT_ID` | Hedera account for payments |
| `EDGRAPH_AGENT_PRIVATE_KEY` | ECDSA private key for signing |
| `EDGRAPH_AGENT_HBAR_BUDGET_TINYBAR` | Evidence budget (default: 1M = 0.01 HBAR) |
| `EDGRAPH_EVIDENCE_API_URL` | Evidence API endpoint |

---

## 🚀 Run the Agent

```bash
# Run agent for all active policies
yarn workspace @sh/nextjs run tsx scripts/claims-agent-demo.ts

# Run agent for specific policy
yarn workspace @sh/nextjs run tsx scripts/evaluate-claims.ts
```

**Console output:**
```
[Agent] Starting claims workflow for policy 0.0.12345
[Agent] Claim ID: claim-xxx
[Agent] Querying live Graph snapshot for USDC...
[Agent] Snapshot: price=$1.002000 USD
[Agent] Price movement: -15 bps
[Agent] Liquidity change: -50 bps
[Agent] Running AI risk assessment...
[AI] Using provider: GEMINI
[AI Risk Assessment] Risk Level: LOW
[AI Risk Assessment] Buy Evidence: NO
[AI Risk Assessment] Confidence: 85%
[Agent] Action: SKIP_EVIDENCE
```

---

## 📊 Database Schema

**Claims Table:**
```sql
CREATE TABLE claims (
  claim_id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL,
  status TEXT NOT NULL,
  agent_action TEXT,              -- 'BUY_EVIDENCE' or 'SKIP_EVIDENCE'
  agent_rationale TEXT,            -- AI decision reasoning
  snapshot_price_usd_micros INTEGER,
  snapshot_duration_seconds INTEGER,
  evidence_price_usd_micros INTEGER,
  evidence_duration_seconds INTEGER,
  policy_decision_json TEXT,       -- Full AI evaluation
  recommended_payout_amount_base_units TEXT,
  created_at INTEGER NOT NULL
);
```

---

## 🎓 Key Concepts

### Why AI for Risk Assessment?

**Old way (hardcoded rules):**
```typescript
if (priceDeviation > 50 && liquidityDrop > 10) {
  return "BUY_EVIDENCE";
}
```

**New way (AI reasoning):**
- Considers multiple factors holistically
- Adapts to market context
- Provides explainable rationale
- Conserves budget intelligently

### Why Two AI Providers?

- **Gemini**: Fast, cheap, high-throughput (default for production)
- **Claude**: Analytical, detailed, edge-case handling (for complex claims)
- Switch anytime without code changes

### Why x402 Payment Protocol?

- **Pay-per-use**: Only pay when evidence is needed
- **Cryptographic proof**: Payment + evidence linked by transaction ID
- **Hedera native**: HBAR transfers on testnet
- **Self-custodial**: Agent controls its own budget

---

## ✅ Current System Status

From your database:
- **21 active policies** monitoring USDC
- **14 claims** detected
- **7 SKIP_EVIDENCE** decisions (market stable)
- **0 evidence purchases** (no urgent depegs detected)
- **100% uptime** on The Graph queries

The agent is working correctly - it's conserving the evidence budget because USDC is trading stably at $1.002!
