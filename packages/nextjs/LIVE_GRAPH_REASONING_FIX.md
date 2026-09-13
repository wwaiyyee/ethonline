# "Live Graph evidence satisfies..." Issue - Summary

## Problem

Some ELIGIBLE claims still show boring reasoning:
> "Live Graph evidence satisfies the configured depeg duration and has complete provenance."

## Root Cause

**7 ELIGIBLE claims in database:**
- 1 claim has `decision_reasoning` (better text)
- **6 claims have NO `decision_reasoning`** and NO `policy_decision_json`
- They only have generic `agent_rationale`

These 6 claims went through the OLD workflow before the NEW AI evaluation system was added.

## Why It Happens

### OLD Workflow (Missing Better Reasoning):
```
1. AI Risk Assessment → stores agent_rationale (generic)
2. Buy Evidence → stores evidence
3. OLD Rule-Based Check → SKIPPED storing decision_reasoning
4. Status set to ELIGIBLE
```

Result: Only has generic `agent_rationale`

### NEW Workflow (Has Better Reasoning):
```
1. AI Risk Assessment → stores agent_rationale
2. Buy Evidence → stores evidence  
3. NEW AI Evaluation → stores policy_decision_json (detailed!)
4. Status set to ELIGIBLE
```

Result: Has rich AI reasoning in `policy_decision_json`

## Solution

### For Existing Claims
Run the migration script to generate NEW AI reasoning:

```bash
cd packages/nextjs
npx tsx scripts/re-evaluate-eligible-claims.ts
```

**Requirements:**
- `GEMINI_API_KEY` must be set in `.env`
- Will call Gemini AI for each of the 6 claims
- Stores rich reasoning in `policy_decision_json`

**What it does:**
```
1. Finds all ELIGIBLE claims without policy_decision_json
2. Loads their evidence from database
3. Calls evaluateClaimWithAI() (NEW AI system)
4. Stores detailed reasoning in policy_decision_json
```

### For Future Claims
They will automatically use the NEW AI system and have rich reasoning from day one.

## Expected Output After Migration

### Before:
```
AI Recommendation: APPROVE CLAIM

Live Graph evidence satisfies the configured depeg 
duration and has complete provenance.
```

### After:
```
AI Recommendation: APPROVE CLAIM

The evidence demonstrates a clear depeg event with 
USDC falling to $0.970, which is 300 basis points 
below the $1.00 peg and well below the policy 
threshold of $0.98. The depeg persisted for 35 
minutes, exceeding the policy's 30-minute minimum 
duration requirement. The Graph data shows complete 
provenance with 35 continuous observations during 
this period. Liquidity remained stable at $418M 
throughout, indicating this was a genuine price 
deviation rather than a liquidity crisis. All policy 
criteria are definitively met.
```

## Files Changed

### 1. API Returns policy_decision_json
`app/api/claims/route.ts`
- Added `c.policy_decision_json` to query
- Priority: policy_decision_json > decision_reasoning > agent_rationale

### 2. UI Shows Best Reasoning
`components/claim/ClaimCard.tsx`
- Shows: `{claim.decision?.reasoning || claim.agentRationale}`
- Automatically picks the best available

### 3. Migration Script Created
`scripts/re-evaluate-eligible-claims.ts`
- Re-runs NEW AI evaluation on old claims
- Generates rich reasoning via Gemini 2.5 Flash

## To Run Migration

```bash
# Make sure GEMINI_API_KEY is in .env
cd packages/nextjs
npx tsx scripts/re-evaluate-eligible-claims.ts
```

**Expected output:**
```
Found 6 ELIGIBLE claims without AI evaluation

Processing: claim-0x4dee2485a9c74c0d8cd0d5726d999f71...
  Running AI evaluation...
  Outcome: ELIGIBLE_RECOMMENDATION
  Reasoning: The evidence demonstrates a clear depeg event with USDC falling to $0.970...
  ✓ Updated with AI evaluation

Processing: claim-0x50715b611f4f9cec85d0423f187785c4...
  Running AI evaluation...
  Outcome: ELIGIBLE_RECOMMENDATION  
  Reasoning: Strong evidence of a sustained depeg lasting 38 minutes at $0.968...
  ✓ Updated with AI evaluation

...

Done!
```

## Verification

After running the script, check claims:

```bash
npx tsx -e "import { getDb } from './services/db/client.js'; \
const db = getDb(); \
const claims = db.prepare('SELECT claim_id, policy_decision_json FROM claims WHERE status = \"ELIGIBLE\"').all(); \
console.log('Claims with AI reasoning:', claims.filter(c => c.policy_decision_json).length); \
console.log('Claims without:', claims.filter(c => !c.policy_decision_json).length);"
```

Should show: **7 with AI reasoning, 0 without**

## Summary

✅ **Root cause identified:** 6 old claims missing `policy_decision_json`  
✅ **Fix created:** Migration script re-evaluates with NEW AI  
✅ **UI fixed:** Shows best available reasoning automatically  
⏳ **Action needed:** Run migration script with GEMINI_API_KEY
