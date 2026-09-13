# AI Claims Workflow Update

## Summary

Removed the old rule-based workflow and enforced the new AI-powered agent workflow as the only claims processing path.

## Changes Made

### 1. Fixed Claim Status Flow
**File:** `services/claims/repository.ts`

The AI agent now properly updates claim status based on its decision:
- `SKIP_EVIDENCE` → status becomes `INVESTIGATING_COMPLETE` (AI decided not to buy)
- `BUY_EVIDENCE` → status becomes `EVIDENCE_PENDING` (AI decided to purchase)

**Before:**
```typescript
// All claims stayed at "INVESTIGATING" regardless of AI decision
SET status = 'INVESTIGATING'
```

**After:**
```typescript
// Status reflects AI decision
SET status = CASE
  WHEN ? = 'SKIP_EVIDENCE' THEN 'INVESTIGATING_COMPLETE'
  WHEN ? = 'BUY_EVIDENCE' THEN 'EVIDENCE_PENDING'
  ELSE status
END
```

### 2. Removed Manual "Buy Evidence" Button
**File:** `components/claim/ClaimCard.tsx`

**Before:** Users could manually trigger evidence purchase even after AI decided `SKIP_EVIDENCE`

**After:** 
- AI decision is final
- `INVESTIGATING_COMPLETE` shows: "AI Agent decided not to purchase evidence at this time."
- `INVESTIGATING` shows: "Waiting for AI agent evaluation..."
- Manual button completely removed

### 3. Deleted Old Workflow Script
**Removed:** `scripts/evaluate-claims.ts`

This was the old rule-based evaluation script that used `decision_reasoning` column. 
Only `process-all-claims.ts` (AI-powered) should be used now.

### 4. Updated Type Definitions
**File:** `services/policy/types.ts`

Added new claim statuses:
```typescript
export type ClaimStatus =
  | "POTENTIAL_CLAIM"
  | "INVESTIGATING"
  | "INVESTIGATING_COMPLETE"  // NEW: AI decided to skip
  | "EVIDENCE_PENDING"        // NEW: AI decided to buy
  | "EVIDENCE_READY"
  | DecisionOutcome
  | "APPROVED"
  | "REJECTED";
```

### 5. Migrated Existing Data
**Script:** `scripts/update-skip-evidence-status.ts`

Updated 17 existing claims from `INVESTIGATING` to `INVESTIGATING_COMPLETE` where AI had already decided `SKIP_EVIDENCE`.

## Current Database State

```
Claims by status:
- ELIGIBLE: 7 (ready for DAO approval)
- INVESTIGATING: 1 (waiting for AI)
- INVESTIGATING_COMPLETE: 17 (AI decided to skip)
- POTENTIAL_CLAIM: 18 (not yet evaluated)
```

## New Workflow (AI-Only)

```
POTENTIAL_CLAIM
    ↓
INVESTIGATING (AI evaluating...)
    ↓
    ├─ SKIP_EVIDENCE → INVESTIGATING_COMPLETE (done, no evidence needed)
    └─ BUY_EVIDENCE → EVIDENCE_PENDING → ELIGIBLE/INELIGIBLE → APPROVED/REJECTED
```

## Benefits

1. **No user confusion**: Can't manually buy evidence after AI decided to skip
2. **Clear AI authority**: The agent's decision is respected and visible
3. **Consistent workflow**: Only one processing path (AI-powered)
4. **Better UX**: Status messages explain what the AI decided
5. **Cost efficiency**: AI conserves budget by skipping unnecessary evidence purchases

## Migration Notes

All future claims will use the new workflow automatically. The 17 existing claims that were stuck at "INVESTIGATING" with `SKIP_EVIDENCE` decisions are now properly marked as complete.
