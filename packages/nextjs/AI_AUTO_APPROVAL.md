# AI Auto-Approval System

## Overview

The AI agent can now **automatically approve or reject claims** based on its confidence level, eliminating the need for human review on straightforward cases.

---

## 🔄 New Flow

### **Before (Manual Review):**
```
Evidence → AI Evaluation → ELIGIBLE_RECOMMENDATION → Human clicks "Approve" → APPROVED
```

### **After (AI Auto-Approval):**
```
Evidence → AI Evaluation → Check Confidence:
  
  If confidence >= 90% → ELIGIBLE (auto-approved) ✅
  If confidence < 90%  → ELIGIBLE_RECOMMENDATION (needs human review) 👤
```

---

## ⚙️ Configuration

Edit `packages/nextjs/.env`:

```bash
# Enable AI auto-approval
AI_AUTO_APPROVE=true

# Set confidence threshold (0-100)
# Only claims with AI confidence >= this value will be auto-approved
AI_AUTO_APPROVE_CONFIDENCE_THRESHOLD=90
```

### Configuration Options:

| Setting | Default | Description |
|---------|---------|-------------|
| `AI_AUTO_APPROVE` | `false` | Enable/disable auto-approval |
| `AI_AUTO_APPROVE_CONFIDENCE_THRESHOLD` | `90` | Minimum confidence % for auto-approval |

---

## 📊 How It Works

### **Step 1: AI Evaluates the Claim**

The AI analyzes the evidence and returns:
```json
{
  "outcome": "ELIGIBLE_RECOMMENDATION",
  "confidence": 95,
  "reasoning": "Clear depeg event with complete data...",
  "reasons": [
    "Price dropped to $0.97 (below $0.98 threshold)",
    "Duration: 34 minutes (exceeds 30 min requirement)",
    "Complete data provenance with 35 observations"
  ]
}
```

### **Step 2: Check Confidence Threshold**

```typescript
if (AI_AUTO_APPROVE === true && confidence >= 90) {
  outcome = "ELIGIBLE" // Auto-approved ✅
} else {
  outcome = "ELIGIBLE_RECOMMENDATION" // Needs human review 👤
}
```

### **Step 3: Database Update**

**Auto-Approved:**
```sql
UPDATE claims SET
  status = 'ELIGIBLE',
  policy_decision_json = '{ "outcome": "ELIGIBLE", "confidence": 95, ... }',
  reasons = '["Price below threshold", ..., "Auto-approved by AI (confidence: 95%)"]'
```

**Needs Review:**
```sql
UPDATE claims SET
  status = 'ELIGIBLE_RECOMMENDATION',
  policy_decision_json = '{ "outcome": "ELIGIBLE_RECOMMENDATION", "confidence": 75, ... }'
```

---

## 🎯 Confidence Threshold Examples

### **Threshold = 90% (Recommended)**
- ✅ Confidence 95% → Auto-approve
- ✅ Confidence 92% → Auto-approve
- ❌ Confidence 88% → Human review
- ❌ Confidence 75% → Human review

### **Threshold = 80% (More Aggressive)**
- ✅ Confidence 95% → Auto-approve
- ✅ Confidence 85% → Auto-approve
- ✅ Confidence 82% → Auto-approve
- ❌ Confidence 75% → Human review

### **Threshold = 95% (Conservative)**
- ✅ Confidence 98% → Auto-approve
- ✅ Confidence 96% → Auto-approve
- ❌ Confidence 92% → Human review
- ❌ Confidence 85% → Human review

---

## 📝 Console Logs

### **Auto-Approved Claim:**
```
[Agent] Running AI claim evaluation...
[AI] Using provider: GEMINI
[AI Claim Evaluation - Gemini] Outcome: ELIGIBLE_RECOMMENDATION
[AI Claim Evaluation - Gemini] Confidence: 95%
[Agent] AI confidence (95%) >= threshold (90%)
[Agent] AUTO-APPROVING claim claim-xxx
[Agent] Claim updated with policy decision
```

### **Needs Human Review:**
```
[Agent] Running AI claim evaluation...
[AI] Using provider: GEMINI
[AI Claim Evaluation - Gemini] Outcome: ELIGIBLE_RECOMMENDATION
[AI Claim Evaluation - Gemini] Confidence: 75%
[Agent] AI confidence (75%) < threshold (90%)
[Agent] Keeping ELIGIBLE_RECOMMENDATION - requires human review
[Agent] Claim updated with policy decision
```

---

## 🛡️ Safety Features

### **1. Confidence Tracking**
Every decision includes the AI's confidence score in the database for audit trails.

### **2. Human Override Available**
Auto-approved claims can still be reviewed and reversed by humans if needed.

### **3. Threshold Tuning**
Adjust `AI_AUTO_APPROVE_CONFIDENCE_THRESHOLD` based on your risk tolerance:
- **Conservative (95%)**: Fewer auto-approvals, more human reviews
- **Balanced (90%)**: Recommended default
- **Aggressive (85%)**: More auto-approvals, faster processing

### **4. Easy Disable**
Set `AI_AUTO_APPROVE=false` to revert to full manual review anytime.

---

## 🚀 Complete End-to-End Flow

```
1. Monitor detects USDC < $0.98
   ↓
2. Agent queries The Graph snapshot
   ↓
3. AI decides: BUY_EVIDENCE (risk: MEDIUM, confidence: 92%)
   ↓
4. Agent pays 0.001 HBAR
   ↓
5. Evidence API queries The Graph for 30-min proof
   ↓
6. Evidence returned: "$0.97 for 34 minutes"
   ↓
7. AI evaluates evidence:
   - Price: $0.97 < $0.98 ✅
   - Duration: 34 min >= 30 min ✅
   - Coverage period: Within range ✅
   - Outcome: ELIGIBLE_RECOMMENDATION
   - Confidence: 95%
   ↓
8. Auto-Approval Check:
   - AI_AUTO_APPROVE = true ✅
   - Confidence (95%) >= Threshold (90%) ✅
   ↓
9. Status: ELIGIBLE (auto-approved) 🎉
   ↓
10. DAO can execute payout on Hedera
```

---

## 📊 Database Schema Changes

The `claims` table now stores the AI confidence:

```sql
policy_decision_json = {
  "outcome": "ELIGIBLE",
  "confidence": 95,  // ← NEW: numeric confidence score
  "reasoning": "Clear depeg event...",
  "reasons": [
    "Price dropped to $0.97",
    "Duration: 34 minutes",
    "Auto-approved by AI (confidence: 95%)"  // ← NEW: audit trail
  ]
}
```

---

## 🎓 When to Use Auto-Approval

### ✅ **Good Use Cases:**
- High-volume depeg events
- Clear-cut policy violations
- Automated payouts for small claims
- Testing and demonstration

### ⚠️ **Use with Caution:**
- Large payout amounts
- New or untested policies
- Unusual market conditions
- Legal/regulatory requirements for human oversight

---

## 🔧 Disable Auto-Approval

To revert to manual review for all claims:

```bash
# In packages/nextjs/.env
AI_AUTO_APPROVE=false
```

All claims will return to `ELIGIBLE_RECOMMENDATION` status requiring human approval.

---

## 📈 Monitoring Auto-Approvals

Check auto-approved claims in the database:

```sql
SELECT 
  claim_id,
  status,
  json_extract(policy_decision_json, '$.confidence') as confidence,
  json_extract(policy_decision_json, '$.reasons') as reasons
FROM claims
WHERE status = 'ELIGIBLE'
  AND policy_decision_json LIKE '%Auto-approved%';
```

---

## 🎯 Summary

**AI Auto-Approval is NOW ENABLED** in your system with:
- ✅ **Threshold**: 90% confidence
- ✅ **Provider**: GEMINI (or switch to CLAUDE)
- ✅ **Safety**: Confidence tracking + audit trail
- ✅ **Control**: Easy to disable or adjust threshold

**Restart your dev server** to activate:
```bash
yarn dev
```

The next depeg event with high AI confidence will be **automatically approved** without human intervention! 🚀
