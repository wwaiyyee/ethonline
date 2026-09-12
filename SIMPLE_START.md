# AI Claims Agent - Quick Start

## 3 Steps (5 minutes)

### Step 1: Get FREE Gemini API Key
```
https://aistudio.google.com/app/apikey

1. Click "Get API key"
2. Click "Create API key in new project"
3. Copy the key (starts with AIzaSy...)
```

### Step 2: Add to .env
```bash
# Open this file:
d:\Nebula\ethonline\packages\nextjs\.env

# Add this line:
GEMINI_API_KEY=AIzaSy...YOUR_KEY_HERE
```

### Step 3: Test It
```bash
cd d:/Nebula/ethonline/packages/nextjs
npm run ai:test test-policy-usdc-1
```

## Expected Output
```
[AI] Querying Gemini 1.5 Flash for risk assessment...
[AI Risk Assessment] Risk Level: LOW
[AI Risk Assessment] Buy Evidence: NO
[AI Risk Assessment] Confidence: 87%
[AI Risk Assessment] Rationale: Current USDC price is stable...
```

## Commands

```bash
# Test single policy
cd packages/nextjs
npm run ai:test test-policy-usdc-1

# Test multiple policies
npm run ai:test

# Compare hardcoded vs AI
npm run ai:compare test-policy-usdc-1
```

## Before vs After

### Hardcoded (OLD) ❌
```typescript
if (price < $0.98) { buy = true; }
```

### Real AI (NEW) ✅
```typescript
const decision = await assessRiskWithAI(snapshot, policy, budget);
// Gemini analyzes context and returns detailed reasoning
```

## Why Gemini?

- **FREE** - No credit card required
- **450x cheaper** than Claude ($0.00002 vs $0.009 per claim)
- **Fast** - ~2 second response
- **Smart** - Full context analysis with confidence levels

## Troubleshooting

### Error: GEMINI_API_KEY not set
```bash
# Check if key exists
cat .env | grep GEMINI

# Add it
echo "GEMINI_API_KEY=YOUR_KEY" >> .env
```

### Get API Key
https://aistudio.google.com/app/apikey

---

**Status**: ✅ Real AI implemented (Google Gemini, not hardcoded)
