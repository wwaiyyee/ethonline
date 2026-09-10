# How to Use EdGraph: Complete Guide

## 1️⃣ Proving x402 Payment Works

### Quick Test

```bash
# Run the test script
./test-x402.sh
```

**Expected Output:**
```
Step 1: Check facilitator health...
{"status":"ok"}

Step 2: Check supported schemes...
{"schemes":["exact-hedera"],"feePayer":"0.0.xxxxx"}

Step 3: Request evidence without payment (should return 402)...
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: ...
{
  "requirements": [{
    "kind": "exact-hedera",
    "assetId": "0.0.0",
    "amount": "100000000",
    "payTo": "0.0.xxxxx",
    "network": "hedera:testnet",
    "timeout": 300
  }],
  "resourceInfo": {
    "url": "/api/v1/depeg-evidence",
    "description": "EdGraph depeg evidence report"
  }
}
```

✅ **If you see 402 Payment Required**, x402 is working correctly!

### What This Proves

1. **Facilitator is running** - Handles payment verification/settlement
2. **API returns 402** - Payment gate is active
3. **Payment requirements included** - Buyer knows what to pay

### What Happens Next (in production)

```
User clicks "Buy Evidence"
  ↓
1. GET /api/v1/depeg-evidence?claimId=xxx
   → 402 Payment Required (no payment yet)
  ↓
2. User signs payment with HashPack
   → TransferTransaction: buyer → seller
  ↓
3. Retry with PAYMENT-SIGNATURE header
   → Facilitator verifies signature
  ↓
4. Facilitator settles on Hedera
   → Adds fee payer signature, submits transaction
  ↓
5. Server returns evidence
   → 200 OK with evidence report
```

**Current Status:** Steps 1-5 work EXCEPT step 2 (HashPack signing needs implementation)

---

## 2️⃣ Understanding the Policy Form Fields

### Why These Addresses?

The form shows **example addresses** for USDC on Base chain:

```
Stablecoin Address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Uniswap Pool Address: 0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C
```

These are **real, production addresses**:
- **USDC on Base**: Official Circle USDC contract
- **USDC/WETH Pool**: Uniswap V3 pool used for price monitoring

### What Each Field Means

#### 1. Policyholder Name
```
Example: "Acme DAO Treasury"
```
**Purpose:** Identifies who is buying the coverage  
**Can be:** DAO name, protocol name, treasury name  
**Stored:** On-chain in PolicyRegistry contract

#### 2. Data Chain
```
Options: Base, Ethereum, Polygon
```
**Purpose:** Which blockchain to monitor for stablecoin price  
**Why Base:** Popular L2 with low fees, good USDC liquidity  
**Can change:** Yes, to monitor any chain

#### 3. Stablecoin
```
Options: USDC, USDT, DAI
```
**Purpose:** Which stablecoin to protect against depeg  
**Addresses change per chain!**

#### 4. Stablecoin Address
```
Example: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
```
**Purpose:** The actual token contract address on the data chain  
**How to find:**
- Base USDC: https://basescan.org/token/0x833589fcd6edb6e08f4c7c32d4f71b54bda02913
- Ethereum USDC: 0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
- Different per chain!

#### 5. Uniswap Pool Address
```
Example: 0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C
```
**Purpose:** The liquidity pool used to check real-time price  
**Why needed:** Price oracle - compares stablecoin:ETH ratio  
**How to find:** Go to Uniswap, find USDC/WETH pool, copy address

#### 6. Threshold (basis points)
```
Default: 9800 = 98%
```
**Purpose:** Depeg trigger threshold  
**Examples:**
- 9800 = 98% (triggers if price drops below $0.98)
- 9900 = 99% (triggers if price drops below $0.99)
- 9500 = 95% (triggers if price drops below $0.95)

#### 7. Min Duration (minutes)
```
Default: 15 minutes
```
**Purpose:** How long depeg must last to qualify  
**Why:** Prevents false positives from temporary price wicks  
**Example:** Must stay below $0.98 for at least 15 minutes

#### 8. Payout Amount
```
Default: 1000000000 base units = 10 HBAR
```
**Purpose:** How much gets paid if claim approved  
**Format:** Base units (like wei for ETH)
- 100000000 = 1 HBAR
- 1000000000 = 10 HBAR
- 10000000000 = 100 HBAR

#### 9. Payout Token
```
Options: HBAR, USDC, USDT
```
**Purpose:** What token the payout is in  
**Note:** Must have liquidity to pay claims!

#### 10. Coverage Period
```
Start: 0 days from now (starts immediately)
End: 30 days from now (30-day coverage)
```
**Purpose:** When the coverage is active  
**Examples:**
- 0 → 30: Coverage starts now, ends in 30 days
- 7 → 37: Coverage starts in 7 days, lasts 30 days

#### 11. Evidence Budget
```
Default: 500000000 tinybars = 5 HBAR
```
**Purpose:** Max agent can spend buying x402 evidence  
**Why:** Prevents unlimited spending on evidence purchases  
**Cost:** Each evidence purchase costs ~1 HBAR via x402

---

## 3️⃣ How to Create a Policy (Step-by-Step)

### Prerequisites

1. **HashPack Wallet Installed**
   - Download: https://www.hashpack.app/
   - Create account
   - Fund with testnet HBAR (https://portal.hedera.com/faucet)

2. **Next.js Running**
```bash
yarn next:dev
```

### Step 1: Navigate to Policies Page

Visit: http://localhost:3000/policies

You should see your 4 existing policies.

### Step 2: Click "Create Policy"

A modal dialog opens with the form.

### Step 3: Fill the Form

**Quick Start (Use Defaults):**
Just change the **Policyholder Name**:
```
Policyholder Name: "My DAO Treasury"
```

All other fields have working defaults:
- Base chain
- USDC stablecoin
- Real addresses (USDC contract + Uniswap pool)
- 98% threshold
- 15 min duration
- 10 HBAR payout
- 30-day coverage
- 5 HBAR evidence budget

### Step 4: Connect Wallet

Click "Create Policy" button at bottom of form.

If not connected, button shows "Connect Wallet".

HashPack will open → Click "Connect" → Approve connection.

### Step 5: Review Transaction

HashPack shows transaction details:
- Function: `createPolicy`
- Contract: `0xC3549920b94a795D75E6C003944943D552C46F97`
- Network: Hedera Testnet
- Gas: ~0.02 HBAR

### Step 6: Sign Transaction

Click "Approve" in HashPack.

Wait for confirmation (5-10 seconds).

### Step 7: Verify Success

✅ Modal closes  
✅ New policy appears in list  
✅ Policy has your policyholder name  
✅ Status badge shows "Active"

### Step 8: Verify On-Chain

Click "View Token" button on policy card → Opens HashScan

Or visit: https://hashscan.io/testnet/contract/0xC3549920b94a795D75E6C003944943D552C46F97

Look for your transaction in recent activity.

---

## 4️⃣ How a DAO Creates a Policy

### Scenario: DAO Treasury Wants USDC Depeg Coverage

**DAO Setup:**
- Name: "Acme DAO"
- Treasury: 1M USDC on Base
- Risk: USDC depeg would hurt treasury value
- Want: Insurance if USDC drops below $0.98 for 15+ minutes

### Process:

#### Step 1: DAO Treasury Manager Opens EdGraph

Navigate to http://localhost:3000/policies

#### Step 2: Click "Create Policy"

#### Step 3: Fill Form with DAO's Requirements

```
Policyholder Name: "Acme DAO Treasury"
Data Chain: Base
Stablecoin: USDC
Stablecoin Address: 0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913
Reference Pool: 0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C
Threshold: 9800 (98%)
Min Duration: 15 minutes
Payout Amount: 100000000000 (1000 HBAR = ~$50 at $0.05/HBAR)
Payout Token: HBAR
Start: 0 (now)
End: 30 (30 days)
Evidence Budget: 500000000 (5 HBAR)
```

#### Step 4: Connect DAO's Hedera Wallet

- Could be DAO multisig
- Or authorized signer
- Needs HBAR for gas

#### Step 5: Sign & Submit

Transaction creates policy on-chain.

#### Step 6: EdGraph Monitors Automatically

Backend agent:
1. Reads policy from blockchain
2. Monitors Base chain USDC price (via The Graph)
3. Detects if price < $0.98 for 15+ minutes
4. Buys evidence via x402 (costs 1-5 HBAR from budget)
5. Evaluates claim
6. Recommends approval if eligible

#### Step 7: Operator Reviews & Approves

Human operator (DAO treasury manager or EdGraph operator):
1. Goes to http://localhost:3000/claims
2. Reviews evidence
3. Clicks "Approve"
4. Signs transaction with HashPack
5. Policy resolves on-chain

#### Step 8: Payout

DAO receives 1000 HBAR payout to cover losses from depeg.

---

## 5️⃣ Common Use Cases

### Use Case 1: Protocol Treasury Protection
```
Policyholder: "Uniswap DAO Treasury"
Coverage: DAI depeg on Ethereum
Threshold: 99% (tight)
Duration: 30 min (longer confirmation)
Payout: 10,000 HBAR
Period: 90 days
```

### Use Case 2: Yield Farm Coverage
```
Policyholder: "Aave Liquidity Provider"
Coverage: USDT depeg on Polygon
Threshold: 98%
Duration: 15 min
Payout: 1,000 HBAR
Period: 30 days
```

### Use Case 3: CEX Reserves Monitoring
```
Policyholder: "Exchange Hot Wallet"
Coverage: USDC depeg on Base
Threshold: 95% (only major depegs)
Duration: 60 min (very conservative)
Payout: 100,000 HBAR
Period: 365 days
```

---

## 6️⃣ Understanding the Addresses

### How to Find Correct Addresses

#### Stablecoin Address (Example: USDC on Base)

1. **Visit Base explorer:** https://basescan.org
2. **Search:** "USDC"
3. **Click official token:** Circle USDC
4. **Copy address:** `0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913`

**Other chains:**
- **Ethereum USDC:** `0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48`
- **Polygon USDC:** `0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174`

#### Uniswap Pool Address (Example: USDC/WETH on Base)

1. **Visit Uniswap:** https://app.uniswap.org/
2. **Select Base chain**
3. **Find USDC/WETH pool**
4. **Click pool info**
5. **Copy contract address:** `0x88A43bbDF9D098eEC7bCEda4e2494615dfD9bB9C`

**Why these specific addresses?**
- Real, production contracts
- High liquidity (accurate pricing)
- Used by The Graph (our data source)

---

## 7️⃣ Troubleshooting

### "Connect Wallet" button grayed out
**Solution:** Install HashPack extension, create account, connect to testnet

### Transaction fails with "insufficient balance"
**Solution:** Get testnet HBAR from https://portal.hedera.com/faucet

### Policy doesn't appear after creation
**Solution:** Click refresh button, wait 10 seconds for blockchain sync

### "Failed to fetch policies"
**Solution:** Make sure Next.js is running (`yarn next:dev`)

### x402 payment shows error
**Solution:** Make sure facilitator is running (`yarn infra:up`)

---

## 8️⃣ Summary

**x402 Proof:**
```bash
./test-x402.sh  # Should show 402 Payment Required
```

**Policy Creation:**
1. Go to /policies
2. Click "Create Policy"
3. Fill form (or use defaults + change policyholder name)
4. Connect HashPack
5. Sign transaction
6. Done!

**DAO Usage:**
- DAO treasury manager creates policy
- Specifies coverage terms (chain, token, threshold, payout)
- EdGraph monitors automatically
- Claims processed when depeg detected
- Operator approves, DAO receives payout

**The addresses are real production contracts** - they're not placeholders, they're the actual USDC and Uniswap addresses used by the backend monitoring system!
