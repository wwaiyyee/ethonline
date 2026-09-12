# AI Claims Agent - Setup Guide

## Step-by-Step Setup (Takes 5 Minutes)

### Step 1: Get Gemini API Key (FREE - No Credit Card)

```
1. Open browser: https://aistudio.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Click "Create API key in new project"
5. Copy the key (starts with AIza...)
```

**Screenshot Guide:**
```
Google AI Studio
├── Click "Get API key" button (top right)
├── Choose "Create API key in new project"
└── Copy your key: AIzaSy...
```

### Step 2: Add Key to .env File

**Option A: Using a Text Editor**
```
1. Open: d:\Nebula\ethonline\packages\nextjs\.env
2. Add this line at the bottom:

GEMINI_API_KEY=AIzaSy...PASTE_YOUR_KEY_HERE

3. Save the file
```

**Option B: Using Terminal**
```bash
cd d:/Nebula/ethonline/packages/nextjs
echo "GEMINI_API_KEY=AIzaSy...YOUR_KEY" >> .env
```

### Step 3: Test It Works

```bash
# From project root
cd d:/Nebula/ethonline

# Run AI agent
yarn workspace @sh/nextjs ai:test test-policy-usdc-1
```

**You should see:**
```
[AI] Querying Gemini 1.5 Flash for risk assessment...
[AI Risk Assessment] Risk Level: LOW
[AI Risk Assessment] Buy Evidence: NO
[AI Risk Assessment] Confidence: 87%
[AI Risk Assessment] Rationale: Current USDC price is stable...
```

## That's It! ✅

Your AI Claims Agent is now using **real Google Gemini AI** instead of hardcoded rules.

---

## Troubleshooting

### Problem: "GEMINI_API_KEY not set"

**Solution:**
```bash
# Check if key exists
cat packages/nextjs/.env | grep GEMINI

# Should show:
# GEMINI_API_KEY=AIzaSy...

# If not found, add it:
echo "GEMINI_API_KEY=YOUR_KEY" >> packages/nextjs/.env
```

### Problem: "Invalid API key"

**Solution:**
```
1. Check you copied the full key (starts with AIza...)
2. Check for extra spaces in .env file
3. Get a new key from: https://aistudio.google.com/app/apikey
```

### Problem: Can't find .env file

**Full path:**
```
d:\Nebula\ethonline\packages\nextjs\.env
```

If file doesn't exist, create it:
```bash
cd d:/Nebula/ethonline/packages/nextjs
touch .env
echo "GEMINI_API_KEY=YOUR_KEY" >> .env
```

---

## Test Commands

### Test Single Policy
```bash
yarn workspace @sh/nextjs ai:test test-policy-usdc-1
```

### Test All Policies
```bash
yarn workspace @sh/nextjs ai:test
```

### Compare Hardcoded vs AI
```bash
yarn workspace @sh/nextjs ai:compare test-policy-usdc-1
```

---

## What Changed?

### BEFORE (Hardcoded):
```typescript
// services/graph/agentTool.ts
if (price < threshold || movement < -25) {
  return { buy: true };
}
```

### AFTER (Real AI):
```typescript
// services/ai/riskAssessment.ts
const decision = await assessRiskWithAI(snapshot, policy, budget);
// Gemini analyzes full context and returns:
// { buyEvidence, riskLevel, confidence, rationale, keyFactors }
```

---

## Why Gemini?

| Feature | Gemini 1.5 Flash | Claude 3.5 Sonnet |
|---------|------------------|-------------------|
| **Cost** | $0.00002/claim | $0.009/claim |
| **Speed** | ~2 seconds | ~3 seconds |
| **Free Tier** | 15 req/min | None |
| **Credit Card** | Not required | Required |

**Gemini is 450x cheaper and has a FREE tier!**

---

## Next Steps

1. ✅ Get Gemini API key
2. ✅ Add to `.env` file
3. ✅ Run test command
4. ✅ See AI in action!

**Questions?** Check `QUICKSTART_GEMINI.md` for full details.

---

**Status**: ✅ Real AI (Google Gemini, not hardcoded)  
**Cost**: FREE for testing, $0.00002 per claim in production  
**Setup Time**: 5 minutes
