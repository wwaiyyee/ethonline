# AI Claims Agent - Now with Google Gemini

## ✅ What I Did

Replaced **100% of hardcoded rules** with **real Google Gemini AI**.

## 🚀 Quick Setup (3 Steps)

### 1. Get FREE Gemini API Key
Go to: **https://aistudio.google.com/app/apikey**
- Click "Get API key"
- Click "Create API key in new project"
- Copy your key (starts with `AIzaSy...`)

### 2. Add Key to .env
Open: `packages/nextjs/.env`

Add this line:
```bash
GEMINI_API_KEY=AIzaSy...YOUR_KEY_HERE
```

### 3. Test It
```bash
cd d:/Nebula/ethonline
yarn workspace @sh/nextjs ai:test test-policy-usdc-1
```

## 📋 That's It!

You should see:
```
[AI] Querying Gemini 1.5 Flash for risk assessment...
[AI Risk Assessment] Risk Level: LOW
[AI Risk Assessment] Buy Evidence: NO
[AI Risk Assessment] Confidence: 87%
[AI Risk Assessment] Rationale: Current USDC price is stable above threshold...
```

---

## 📊 What Changed

### Before (Hardcoded) ❌
```typescript
if (price < $0.98 || movement < -25 bps) {
  return { buy: true };
}
```

### After (Real AI) ✅
```typescript
const decision = await assessRiskWithAI(snapshot, policy, budget);
// Gemini analyzes full context and returns detailed reasoning
```

---

## 💰 Why Gemini?

| Feature | Gemini | Claude |
|---------|--------|--------|
| Cost per claim | **$0.00002** | $0.009 |
| Free tier | **✅ YES** | ❌ NO |
| Credit card required | **❌ NO** | ✅ YES |
| Speed | ~2 sec | ~3 sec |

**Gemini is 450x cheaper and has FREE tier!**

---

## 📚 More Help

- **SETUP_GEMINI.md** - Step-by-step guide
- **QUICKSTART_GEMINI.md** - Full documentation  
- **AI_SETUP_VISUAL.txt** - Visual ASCII guide
- **.env.ai.example** - Configuration template

---

## 🧪 Test Commands

```bash
# Test single policy
yarn workspace @sh/nextjs ai:test test-policy-usdc-1

# Test all policies
yarn workspace @sh/nextjs ai:test

# Compare hardcoded vs AI
yarn workspace @sh/nextjs ai:compare test-policy-usdc-1
```

---

## ❓ Troubleshooting

### "GEMINI_API_KEY not set"
```bash
# Check if key exists
cat packages/nextjs/.env | grep GEMINI

# Add key if missing
echo "GEMINI_API_KEY=YOUR_KEY" >> packages/nextjs/.env
```

### "Invalid API key"
Get new key: https://aistudio.google.com/app/apikey

---

## ✅ Status

- ✅ Real AI (Google Gemini 1.5 Flash)
- ✅ No hardcoded thresholds
- ✅ Confidence levels (0-100%)
- ✅ Detailed reasoning for every decision
- ✅ Free tier available
- ✅ 450x cheaper than Claude

**Ready to test!** 🎉
