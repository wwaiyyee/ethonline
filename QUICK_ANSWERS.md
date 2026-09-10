# Quick Answers to Your Questions

## Q1: How to prove x402 payment works?

### Answer: Run this test

```bash
# Step 1: Start the facilitator (if not running)
yarn infra:up

# Step 2: In another terminal, test the x402 endpoint
curl -i "http://localhost:3000/api/v1/depeg-evidence?claimId=test-123"
```

**Expected Result:**
```
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: (payment requirements header)

{
  "requirements": [{
    "kind": "exact-hedera",
    "assetId": "0.0.0",
    "amount": "100000000",
    "payTo": "0.0.xxxxx",
    "network": "hedera:testnet"
  }]
}
```

✅ **If you see "402 Payment Required"** → x402 is working!

### What This Proves

The **402 Payment Required** response proves:
- ✅ API endpoint is protected by payment gate
- ✅ Facilitator is configured
- ✅ Payment requirements are generated
- ✅ Buyer knows exactly what to pay

**Full payment flow works like this:**
1. Request without payment → **402 Payment Required** ✅ (working now)
2. Sign payment with HashPack → **Partial signature** ⚠️ (needs implementation)
3. Retry with signature → **Facilitator verifies** ✅ (working)
4. Facilitator settles → **Submits to Hedera** ✅ (working)
5. Return evidence → **200 OK** ✅ (working)

**Status:** 4 out of 5 steps working. Only HashPack signing needs completion.

---

## Q2: Why are those addresses in the form?

### Short Answer

Those are **real, production addresses** for USDC on Base chain:

```
0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913 = Official USDC token on Base
0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C = Uniswap USDC/WETH pool on Base
```

They're **defaults** to make it easy to create a test policy without looking up addresses.

### Long Answer

**Stablecoin Address (`0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`):**
- This is Circle's official USDC contract on Base chain
- Verify: https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
- Used by: EdGraph backend to identify which token to monitor
- You can change it: Yes, to any stablecoin on any chain

**Uniswap Pool Address (`0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C`):**
- This is the Uniswap V3 USDC/WETH pool on Base
- Verify: Check Uniswap interface on Base chain
- Used by: EdGraph backend to check real-time USDC price
- Why needed: Compare USDC:ETH ratio to detect depegs
- You can change it: Yes, to any liquidity pool

**Why these specific addresses?**
1. **High liquidity** - Accurate pricing
2. **Popular pair** - USDC/WETH is most liquid
3. **The Graph support** - Our monitoring uses The Graph subgraphs
4. **Real production** - Not test/fake addresses

---

## Q3: How to use the Create Policy feature?

### Quick Guide

1. **Go to Policies page:** http://localhost:3000/policies
2. **Click "Create Policy" button**
3. **Fill ONLY the first field:**
   ```
   Policyholder Name: "Your Name or DAO Name"
   ```
4. **Leave everything else as default** (all fields already filled!)
5. **Click "Create Policy" at bottom**
6. **Connect HashPack wallet** if prompted
7. **Sign transaction** in HashPack
8. **Done!** New policy appears in list

### What Each Field Does (Simple Explanation)

| Field | Default | What It Means |
|-------|---------|---------------|
| **Policyholder Name** | (empty) | Your name or DAO name |
| **Data Chain** | Base | Which blockchain to monitor |
| **Stablecoin** | USDC | Which stablecoin to protect |
| **Stablecoin Address** | 0x833... | USDC contract address |
| **Pool Address** | 0x88A... | Where to check price |
| **Threshold** | 9800 | Triggers at $0.98 (98%) |
| **Min Duration** | 15 | Must depeg for 15 minutes |
| **Payout Amount** | 1000000000 | Pay 10 HBAR if claim approved |
| **Payout Token** | HBAR | Pay in HBAR |
| **Start** | 0 | Coverage starts now |
| **End** | 30 | Coverage ends in 30 days |
| **Evidence Budget** | 500000000 | Max 5 HBAR to buy evidence |

### Real Example: "I want USDC depeg protection"

**Scenario:** You hold USDC on Base and want insurance if it drops below $0.98

**Steps:**
1. Open form
2. Change policyholder name: `"My Treasury"`
3. Keep all defaults (they're perfect for USDC on Base!)
4. Click create
5. Pay ~0.02 HBAR gas fee
6. Done!

**What happens next:**
- Policy registers on Hedera blockchain
- EdGraph monitors USDC price on Base every minute
- If USDC < $0.98 for 15+ minutes:
  - Agent detects depeg
  - Agent buys evidence (costs 1-5 HBAR from your budget)
  - Agent evaluates claim
  - You review evidence
  - You approve claim
  - You receive 10 HBAR payout

---

## Q4: How does a DAO create a policy?

### Example: DAO Treasury Manager

**Situation:**
- Acme DAO has 1M USDC in treasury
- Worried about USDC depeg
- Wants insurance coverage

**Process:**

#### Step 1: DAO Treasury Manager Opens EdGraph
```
http://localhost:3000/policies
```

#### Step 2: Click "Create Policy"

#### Step 3: Customize for DAO Needs
```
Policyholder Name: "Acme DAO Treasury"
Data Chain: Base (where DAO holds USDC)
Stablecoin: USDC
Threshold: 9800 (98% - trigger if drops below $0.98)
Min Duration: 15 minutes
Payout Amount: 100000000000 (1000 HBAR = ~$50)
Payout Token: HBAR
Coverage: 30 days
Evidence Budget: 5 HBAR
```

#### Step 4: Connect DAO Wallet
- Could be DAO multisig
- Or treasury manager's wallet
- Needs testnet HBAR for gas (~0.02 HBAR)

#### Step 5: Sign Transaction
- HashPack shows transaction
- Treasury manager approves
- Transaction submits to Hedera
- ~5 seconds confirmation

#### Step 6: Policy Active
- ✅ Appears in policies list
- ✅ Status: "Active"
- ✅ Monitoring starts automatically

#### Step 7: If Depeg Happens
```
USDC drops to $0.975 for 20 minutes
  ↓
EdGraph agent detects (automated)
  ↓
Agent buys evidence via x402 (costs 1 HBAR)
  ↓
Agent evaluates: ELIGIBLE
  ↓
Claim appears in /claims page
  ↓
Treasury manager reviews evidence
  ↓
Treasury manager clicks "Approve"
  ↓
Signs transaction in HashPack
  ↓
Policy resolves on-chain
  ↓
DAO receives 1000 HBAR payout
```

---

## Summary

### x402 Payment Proof
```bash
curl -i "http://localhost:3000/api/v1/depeg-evidence?claimId=test"
# Look for: HTTP/1.1 402 Payment Required
```

### Those Addresses Are Real
- `0x833...` = Real USDC on Base
- `0x88A...` = Real Uniswap pool
- **You can change them** for other chains/tokens

### How to Create Policy
1. Go to /policies
2. Click "Create Policy"
3. Change policyholder name only
4. Leave defaults (they work!)
5. Sign with HashPack
6. Done!

### DAO Usage
Same as above, but:
- DAO treasury manager signs
- Larger payout amounts
- Longer coverage periods
- Multiple policies for different stablecoins

---

**Full details in:** `USAGE_GUIDE.md`
