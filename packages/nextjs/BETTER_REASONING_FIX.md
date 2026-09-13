# Better AI Reasoning for ELIGIBLE Claims

## Problem Fixed

**Before:** ELIGIBLE claims showed boring text:
> "Live Graph evidence satisfies the configured depeg duration and has complete provenance."

**After:** Will show detailed AI reasoning from Gemini 2.5 Flash.

---

## How It Works Now

### Data Priority (Waterfall)
```
1. Check policy_decision_json (NEW AI evaluation)
   ↓ If exists: Use AI's detailed reasoning
   ↓ If not: Fallback to old system
   
2. Check decision_reasoning (OLD rule-based)
   ↓ Shows: "USDC depegged below 0.97 threshold..."
   ↓ Better than agent_rationale
   
3. Check agent_rationale (Initial AI check)
   ↓ Shows: "Live Graph evidence satisfies..."
   ↓ Least detailed (last resort)
```

### NEW AI Evaluation Example
When `policy_decision_json` exists:
```json
{
  "outcome": "ELIGIBLE_RECOMMENDATION",
  "confidence": 95,
  "reasoning": "The evidence demonstrates a clear depeg event with USDC 
    falling to $0.970, which is 300 basis points below the $1.00 peg 
    and well below the policy threshold of $0.98. The depeg persisted 
    for 35 minutes, exceeding the policy's 30-minute minimum duration 
    requirement. The Graph data shows complete provenance with 35 
    continuous observations during this period. Liquidity remained 
    stable at $418M throughout, indicating this was a genuine price 
    deviation rather than a liquidity crisis. All policy criteria are 
    definitively met.",
  "reasons": [
    "Price fell to $0.970, below $0.98 threshold",
    "Duration of 35 minutes exceeds 30-minute requirement",
    "Complete Graph provenance with 35 observations",
    "Stable liquidity confirms genuine depeg event"
  ],
  "recommendedPayoutAmountBaseUnits": "50000000000000000000"
}
```

**UI Shows:**
```
┌────────────────────────────────────────────┐
│ AI Recommendation: APPROVE CLAIM           │
│                                            │
│ The evidence demonstrates a clear depeg    │
│ event with USDC falling to $0.970, which   │
│ is 300 basis points below the $1.00 peg... │
└────────────────────────────────────────────┘
```

---

## Current State

### Existing ELIGIBLE Claims (7 claims)
- Created with OLD system
- Have `decision_reasoning`: "USDC depegged below 0.97 threshold for 35 minutes..."
- **NOW SHOWS:** This text (better than before)
- Do NOT have `policy_decision_json`

### Future ELIGIBLE Claims
- Will be created by NEW AI system
- Will have `policy_decision_json` with rich reasoning
- **WILL SHOW:** Full AI analysis like the example above

---

## Code Changes

### API (`app/api/claims/route.ts`)
```typescript
// Query includes policy_decision_json
SELECT c.policy_decision_json, c.decision_reasoning, c.agent_rationale
FROM claims c

// Priority logic in rowToClaim()
decision: policyDecision  // policy_decision_json (NEW AI)
  ? policyDecision
  : row.decision_outcome   // decision_reasoning (OLD)
    ? { reasoning: row.decision_reasoning, ... }
    : undefined
```

### UI (`components/claim/ClaimCard.tsx`)
```typescript
{/* Shows best available reasoning */}
<p>{claim.decision?.reasoning || claim.agentRationale}</p>

// Priority: 
// 1. decision.reasoning (NEW AI detailed or OLD rule-based)
// 2. agentRationale (Risk assessment AI)
```

---

## How to Get Better Reasoning for Current Claims

### Option 1: Wait for New Claims
Future claims will automatically use the NEW AI evaluation with rich reasoning.

### Option 2: Re-run AI Evaluation on Existing Claims
Run the agent script again on existing ELIGIBLE claims to generate `policy_decision_json`:

```bash
# This would re-evaluate existing claims with the NEW AI system
# (Would need a script to do this)
```

---

## What Users See Now

### For Existing ELIGIBLE Claims:
```
AI Recommendation: APPROVE CLAIM

USDC depegged below 0.97 threshold for 35 minutes, 
exceeding the 30-minute minimum duration requirement. 
Price dropped to $0.970 at lowest point. Liquidity 
remained stable during the event.
```
✓ Better than "Live Graph evidence satisfies..."
✓ Shows actual price, duration, facts

### For Future ELIGIBLE Claims (with NEW AI):
```
AI Recommendation: APPROVE CLAIM

The evidence demonstrates a clear depeg event with 
USDC falling to $0.970, which is 300 basis points 
below the $1.00 peg and well below the policy 
threshold of $0.98. The depeg persisted for 35 
minutes, exceeding the policy's 30-minute minimum 
duration requirement...
```
✓ Even more detailed
✓ Shows AI's full analysis
✓ Explains why it recommends approval

---

## Summary

✅ **Fixed:** ELIGIBLE claims now show better reasoning  
✅ **Priority:** NEW AI > OLD rule-based > Initial check  
✅ **Future:** All new claims will use rich AI evaluation  
✅ **Current:** Existing claims show improved text from `decision_reasoning`
