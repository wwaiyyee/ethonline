# Claim Status Guide - AI-Powered Workflow

## Status Flow

```
POTENTIAL_CLAIM → INVESTIGATING → [AI Decision] → ELIGIBLE/INVESTIGATING_COMPLETE
                                                 ↓
                                            [DAO Action]
                                                 ↓
                                          APPROVED/REJECTED
```

## What Each Status Means

### 🔍 POTENTIAL_CLAIM - "Potential Depeg"
**Meaning:** The system detected a possible depeg event from on-chain data.  
**What's happening:** Nothing yet - waiting for the AI agent to analyze it.  
**Your action:** None - wait for AI.

---

### ⏳ INVESTIGATING - "AI Analyzing..."
**Meaning:** The AI agent is currently evaluating market conditions.  
**What's happening:** AI is checking live prices, liquidity, and risk level to decide if it should buy evidence.  
**Your action:** None - wait for AI decision.

---

### ✓ INVESTIGATING_COMPLETE - "No Action Needed"
**Meaning:** AI decided NOT to buy evidence because the market is stable.  
**AI Decision:** `SKIP_EVIDENCE`  
**Why:** Current USDC price is stable (e.g., $1.002), no real depeg happening.  
**Your action:** None - claim closed automatically. No approve/reject needed.

**Example AI rationale:**
> "The current price of USDC is $1.000509, which is significantly above the depeg threshold of $0.9800. Liquidity conditions are normal."

---

### ✓ ELIGIBLE - "Ready for Approval"
**Meaning:** AI bought evidence, verified the depeg, and recommends APPROVAL.  
**AI Decision:** `ELIGIBLE_RECOMMENDATION`  
**What's shown:** 
- AI Recommendation: **APPROVE CLAIM** (green badge)
- Full reasoning explaining why
- Evidence data (lowest price, duration, etc.)

**Your action:** Review the AI recommendation and either:
- ✅ **Approve** - Pay out the claim
- ❌ **Reject** - Override the AI's recommendation

**Example AI rationale:**
> "Live Graph evidence satisfies the configured depeg duration and has complete provenance. Depeg verified: $0.97 for 34 minutes."

---

### ✗ INELIGIBLE - "Rejected by AI"
**Meaning:** AI bought evidence but the claim doesn't meet policy terms.  
**AI Decision:** `INELIGIBLE_RECOMMENDATION`  
**Your action:** Review and either approve (override AI) or reject.

---

### ⚠ NEEDS_REVIEW - "Needs Review"
**Meaning:** AI couldn't make a clear decision.  
**Your action:** Manual review required.

---

### ✓ APPROVED
**Meaning:** DAO approved the claim for payout.  
**What happens:** Payout transaction gets submitted to blockchain.

---

### ✗ REJECTED
**Meaning:** DAO rejected the claim.  
**What happens:** No payout, claim closed.

---

## Key Differences Between Statuses

| Status | AI Decision Shown? | Action Needed? | What You Decide |
|--------|-------------------|----------------|-----------------|
| `POTENTIAL_CLAIM` | No | No | Nothing (wait) |
| `INVESTIGATING` | No | No | Nothing (wait) |
| `INVESTIGATING_COMPLETE` | Yes (Skip reason) | **No** | **Nothing - auto-closed** |
| `ELIGIBLE` | Yes (Recommend approve) | **Yes** | Approve or Reject |
| `INELIGIBLE` | Yes (Recommend reject) | **Yes** | Approve or Reject |
| `APPROVED` | N/A | No | Done |
| `REJECTED` | N/A | No | Done |

---

## What You Actually Decide

### For `INVESTIGATING_COMPLETE`:
**Nothing!** The AI already decided the market is stable. No evidence was purchased. Claim is done.

### For `ELIGIBLE`:
**Yes/No:** Do you agree with the AI that this claim should be paid out?

- **Approve** = "Yes, I agree with the AI, pay the claim"
- **Reject** = "No, I disagree with the AI, don't pay"

The AI shows you:
1. Its recommendation (APPROVE CLAIM)
2. The evidence (price, duration, timestamps)
3. Its reasoning (why it thinks this qualifies)

You make the final DAO decision.

---

## UI Changes

### Old (Confusing)
- Icons: `?` `[+]` `[-]` `[!]` 
- Status: "Investigating Complete" with no explanation
- Decision hidden in "Show Details"

### New (Clear)
- Icons: 🔍 ⏳ ✓ ✗ ⚠
- Status: "No Action Needed" / "Ready for Approval"
- AI recommendation shown prominently at the top
- Clear "Review and decide" message for ELIGIBLE claims
