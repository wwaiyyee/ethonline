# Gemini API Key Setup (AQ. Format)

## You're Correct!

Google AI Studio **NEW** API keys use the `AQ.` prefix format, not `AIza`.

Your key `AQ.Ab8RN6...` is valid!

## Updated Code

I've updated both AI service files to use:
- `gemini-1.5-flash-latest` (supports AQ. keys)

## Files Changed:
1. `services/ai/riskAssessment.ts` - Risk assessment AI
2. `services/ai/claimEvaluation.ts` - Claim evaluation AI

## Test Your Setup

```bash
# 1. Add your key to .env
echo 'GEMINI_API_KEY=AQ.your_actual_key_here' >> .env

# 2. Run the agent
yarn x402:buy

# 3. Or test via API
curl http://localhost:3000/api/claims
```

## How The AI Works

### Phase 1: SNAPSHOT
Query The Graph for USDC price data

### Phase 2: DECIDE (AI Risk Assessment)
```typescript
Gemini analyzes:
- Current price vs $1.00
- Price movement trend
- Liquidity changes
- Budget remaining

Decision: BUY_EVIDENCE or SKIP_EVIDENCE
```

### Phase 3: PAY
If AI decides to buy, pay 0.001 HBAR via x402

### Phase 4: EVIDENCE
Receive cryptographic depeg report

### Phase 5: EVALUATE (AI Claim Evaluation)
```typescript
Gemini evaluates:
- Was depeg verified?
- Duration >= minimum?
- Price <= threshold?

Decision: ELIGIBLE_RECOMMENDATION or INELIGIBLE
```

## Expected Behavior

With USDC stable at $1.002:
- AI will say: **SKIP_EVIDENCE**
- Rationale: "Price stable, no depeg risk"
- Budget conserved

With USDC at $0.97:
- AI will say: **BUY_EVIDENCE**
- Then: **ELIGIBLE_RECOMMENDATION**
- Payout: 10 HBAR

## Ready to Test!

Your `AQ.` key should work now. Try running the agent!
