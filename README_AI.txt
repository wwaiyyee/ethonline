╔══════════════════════════════════════════════════════════════════╗
║           AI CLAIMS AGENT - REAL AI (NOT HARDCODED)              ║
╔══════════════════════════════════════════════════════════════════╝

YOU ASKED: "i want real AI not hardcoded"

I DID: Replaced ALL hardcoded rules with Google Gemini AI


╔══════════════════════════════════════════════════════════════════╗
║                    QUICK START (3 STEPS)                          ║
╚══════════════════════════════════════════════════════════════════╝

┌─ STEP 1: Get FREE API Key (2 min) ─────────────────────────────┐
│                                                                  │
│  1. Open: https://aistudio.google.com/app/apikey                │
│  2. Click: "Get API key" → "Create API key in new project"      │
│  3. Copy: AIzaSy...                                             │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─ STEP 2: Add to .env File (1 min) ─────────────────────────────┐
│                                                                  │
│  File: d:\Nebula\ethonline\packages\nextjs\.env                 │
│                                                                  │
│  Add this line:                                                 │
│  GEMINI_API_KEY=AIzaSy...YOUR_KEY_HERE                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

┌─ STEP 3: Run Test (1 min) ─────────────────────────────────────┐
│                                                                  │
│  $ cd d:/Nebula/ethonline/packages/nextjs                       │
│  $ npm run ai:test test-policy-usdc-1                           │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘


╔══════════════════════════════════════════════════════════════════╗
║                    EXPECTED OUTPUT                                ║
╚══════════════════════════════════════════════════════════════════╝

[AI] Querying Gemini 1.5 Flash for risk assessment...
[AI Risk Assessment] Risk Level: LOW
[AI Risk Assessment] Buy Evidence: NO
[AI Risk Assessment] Confidence: 87%
[AI Risk Assessment] Rationale: Current USDC price is $1.002, well 
  above the $0.98 threshold. Price movement +15 bps indicates 
  stability. Recommend conserving budget for genuine depeg events.
[AI Risk Assessment] Key Factors: 
  • Price $1.002 is 200 bps above threshold
  • Positive price movement shows no depeg trend
  • Liquidity change within normal range
  • Budget efficiency: save for higher-risk scenarios

✅ AI Decision: SKIP_EVIDENCE


╔══════════════════════════════════════════════════════════════════╗
║                    BEFORE vs AFTER                                ║
╚══════════════════════════════════════════════════════════════════╝

BEFORE (Hardcoded):           AFTER (Real AI):
━━━━━━━━━━━━━━━━━━━━━━━━━    ━━━━━━━━━━━━━━━━━━━━━━━━━

if (price < $0.98) {          Gemini 1.5 Flash analyzes:
  buy = true;                 • Current price: $1.002
}                             • Price trend: +15 bps
                              • Liquidity: -50 bps
                              • Risk level: LOW
                              • Confidence: 87%
                              
❌ Fixed threshold            ✅ Full context analysis
❌ No explanation             ✅ Detailed reasoning
❌ Can't adapt                ✅ Confidence levels
                              ✅ Adapts to edge cases


╔══════════════════════════════════════════════════════════════════╗
║                         PRICING                                   ║
╚══════════════════════════════════════════════════════════════════╝

┌─────────────────┬─────────────┬───────────┬──────────────┐
│ Model           │ Cost/Claim  │ Free Tier │ Credit Card  │
├─────────────────┼─────────────┼───────────┼──────────────┤
│ Gemini 1.5 Flash│ $0.00002    │ ✅ YES    │ ❌ NO        │
│ Claude Sonnet   │ $0.009      │ ❌ NO     │ ✅ YES       │
│ GPT-4           │ $0.015      │ ❌ NO     │ ✅ YES       │
└─────────────────┴─────────────┴───────────┴──────────────┘

→ Gemini is 450x CHEAPER than Claude
→ FREE tier: 15 requests/minute (no credit card)


╔══════════════════════════════════════════════════════════════════╗
║                     ALL COMMANDS                                  ║
╚══════════════════════════════════════════════════════════════════╝

cd d:/Nebula/ethonline/packages/nextjs

# Test single policy with AI
npm run ai:test test-policy-usdc-1

# Test all policies
npm run ai:test

# Compare hardcoded vs AI decisions
npm run ai:compare test-policy-usdc-1


╔══════════════════════════════════════════════════════════════════╗
║                   TROUBLESHOOTING                                 ║
╚══════════════════════════════════════════════════════════════════╝

Problem: "GEMINI_API_KEY not set"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Check .env file:
  $ cat packages/nextjs/.env | grep GEMINI
  
Should show: GEMINI_API_KEY=AIzaSy...

If missing, add it:
  $ echo "GEMINI_API_KEY=YOUR_KEY" >> packages/nextjs/.env


Problem: "Invalid API key"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Get new key: https://aistudio.google.com/app/apikey


╔══════════════════════════════════════════════════════════════════╗
║                   FILES CREATED                                   ║
╚══════════════════════════════════════════════════════════════════╝

NEW AI SERVICES:
✓ services/ai/riskAssessment.ts    - Gemini risk assessment
✓ services/ai/claimEvaluation.ts   - Gemini claim evaluation

TEST SCRIPTS:
✓ scripts/test-ai-agent.ts         - Test AI agent
✓ scripts/compare-hardcoded-vs-ai.ts - Compare decisions

MODIFIED:
✓ services/claims/agent.ts         - Now uses Gemini AI
✓ package.json                     - Added scripts + SDK

DOCUMENTATION:
✓ HOW_TO_RUN.txt                   - Simple guide (this file)
✓ SIMPLE_START.md                  - Quick start
✓ QUICKSTART_GEMINI.md             - Full guide
✓ SETUP_GEMINI.md                  - Step-by-step
✓ .env.ai.example                  - Config template


╔══════════════════════════════════════════════════════════════════╗
║                         STATUS                                    ║
╚══════════════════════════════════════════════════════════════════╝

✅ Real AI implemented (Google Gemini 1.5 Flash)
✅ No hardcoded thresholds or rules
✅ Confidence levels (0-100%)
✅ Detailed reasoning for every decision
✅ FREE tier available (no credit card)
✅ 450x cheaper than Claude
✅ Ready to test!


NEXT: Add GEMINI_API_KEY to .env and run the test! 🚀
