# AI Claims Agent - Quick Start (Gemini)

## 3-Step Setup (5 minutes)

### Step 1: Get Gemini API Key (FREE)

1. Go to: https://aistudio.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key (starts with `AIza...`)

### Step 2: Add Key to .env

Open `packages/nextjs/.env` and add:

```bash
GEMINI_API_KEY=AIzaSy...YOUR_KEY_HERE
```

### Step 3: Test It Works

```bash
# From project root
cd d:/Nebula/ethonline

# Test AI agent on a policy
yarn workspace @sh/nextjs ai:test test-policy-usdc-1
```

## What You'll See

```
======================================================================
AI CLAIMS AGENT - AUTONOMOUS WORKFLOW
======================================================================

[Agent] Processing claim: claim-test-policy-usdc-1-1726167890
[Agent] Policy: test-policy-usdc-1

PHASE 2: AI RISK ASSESSMENT
----------------------------------------------------------------------
[AI] Querying Gemini 1.5 Flash for risk assessment...
[AI Risk Assessment] Risk Level: LOW
[AI Risk Assessment] Buy Evidence: NO
[AI Risk Assessment] Confidence: 85%
[AI Risk Assessment] Rationale: Current USDC price is $1.002, well above 
  the $0.98 threshold. Price movement is minimal at +15 bps. Liquidity 
  change of -50 bps is within normal range. This appears to be market 
  noise rather than a depeg signal. Recommend conserving budget.
[AI Risk Assessment] Key Factors: Price stable above threshold, 
  Positive price trend, Normal liquidity, Budget efficiency

[Agent] AI Decision: SKIP_EVIDENCE
```

## Commands

### Test Single Policy
```bash
yarn workspace @sh/nextjs ai:test test-policy-usdc-1
```

### Test Multiple Policies
```bash
yarn workspace @sh/nextjs ai:test
```

### Compare Hardcoded vs AI
```bash
yarn workspace @sh/nextjs ai:compare test-policy-usdc-1
```

## What Changed?

### BEFORE: Hardcoded Rules ❌
```typescript
if (price < threshold || movement < -25 bps) {
  return { buy: true };
} else {
  return { buy: false };
}
```

### AFTER: Real AI ✅
```typescript
const aiDecision = await assessRiskWithAI(snapshot, policy, budget);
// Gemini 1.5 Flash analyzes all factors and returns:
// { buyEvidence, riskLevel, confidence, rationale, keyFactors }
```

## Why Gemini?

- **FREE**: 15 requests/minute, no credit card required
- **FAST**: ~1-2 second response time
- **CHEAP**: After free tier, $0.00001 per call
- **SMART**: Gemini 1.5 Flash is optimized for fast reasoning

## Cost Comparison

| Model | Cost per Claim | Speed |
|-------|----------------|-------|
| Gemini 1.5 Flash | **$0.00002** | ~2 sec |
| Claude 3.5 Sonnet | $0.009 | ~3 sec |
| GPT-4 | $0.015 | ~4 sec |

Gemini is **450x cheaper** than Claude!

## Troubleshooting

### Error: GEMINI_API_KEY not set
```
Solution: Add to packages/nextjs/.env:
GEMINI_API_KEY=AIzaSy...
```

### Get API Key Link
```
https://aistudio.google.com/app/apikey
```

### Still not working?
```bash
# Check .env file
cat packages/nextjs/.env | grep GEMINI

# Should show:
# GEMINI_API_KEY=AIzaSy...
```

## Files Modified

- ✅ `services/ai/riskAssessment.ts` - Now uses Gemini
- ✅ `services/ai/claimEvaluation.ts` - Now uses Gemini
- ✅ `package.json` - Added @google/generative-ai
- ✅ `.env` - Add GEMINI_API_KEY here

## What's Different from Hardcoded?

### Hardcoded (OLD):
- ❌ Fixed thresholds (price < $0.98)
- ❌ Simple yes/no decision
- ❌ No explanation
- ❌ Can't adapt to unusual situations

### AI-Powered (NEW):
- ✅ Analyzes full market context
- ✅ Provides confidence levels (0-100%)
- ✅ Detailed reasoning for every decision
- ✅ Adapts to edge cases automatically
- ✅ Lists key factors influencing decision

## Example: Real AI Decision

```json
{
  "buyEvidence": false,
  "riskLevel": "LOW",
  "confidence": 87,
  "rationale": "The current USDC price of $1.0020 is stable and well above the $0.9800 depeg threshold. While there's minor liquidity fluctuation of -50 bps, this represents normal market noise rather than a depeg signal. The recent price movement of +15 bps indicates stability. Given the 0.001 HBAR evidence cost versus the low probability of a valid claim, I recommend conserving the budget for genuine depeg events.",
  "keyFactors": [
    "Price $1.0020 is 200 bps above threshold (very stable)",
    "Positive price movement (+15 bps) shows no depeg trend",
    "Liquidity change within normal range (-50 bps)",
    "Budget efficiency: save for higher-risk scenarios"
  ]
}
```

## Next Steps

1. ✅ Get Gemini API key (FREE)
2. ✅ Add to .env
3. ✅ Run `yarn workspace @sh/nextjs ai:test`
4. ✅ See real AI decision-making in action!

---

**Status**: ✅ Real AI with Google Gemini (not hardcoded)  
**Cost**: $0.00002 per claim (450x cheaper than Claude)  
**Speed**: ~2 seconds per decision  
**API**: FREE tier available
