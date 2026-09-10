# Wallet Connection Investigation - Debug Guide

## New Debug Tool Added

I've added a **Wallet Debug Info** button to your app. Here's how to use it:

### Step 1: Refresh Your Browser

```bash
# Hard refresh to load new code
Press: Cmd + Shift + R (Mac) or Ctrl + Shift + R (Windows)
```

### Step 2: Find the Debug Button

Look in the **bottom-right corner** of the screen. You'll see a small magnifying glass button (🔍).

### Step 3: Click the Debug Button

A panel will appear showing:
- **isConnected:** true/false (this is the key value!)
- **accountId:** Your account ID (0.0.6282)
- **isInitializing:** true/false
- **hasHederaSession:** true/false
- **provider:** exists/null
- **isBusy:** true/false

### Step 4: Screenshot the Debug Panel

1. Click the 🔍 button
2. Take a screenshot of the debug panel
3. Share it with me

This will show exactly what's happening with the wallet connection!

---

## What We're Looking For

### Scenario 1: isConnected = false, accountId = null
**Problem:** Wallet not connecting at all  
**Solution:** Reconnect HashPack

### Scenario 2: isConnected = false, accountId = "0.0.6282"
**Problem:** AppKit not recognizing connection  
**Solution:** Provider initialization issue

### Scenario 3: isConnected = true
**Problem:** Form not reading state correctly  
**Solution:** React state sync issue

---

## Quick Tests to Run

### Test 1: Check Wallet in Header
- Look at top-right corner
- Should show: "HashPack 0.0.10...6282"
- If you see this, wallet IS connected to the app

### Test 2: Open Browser Console
```bash
Press F12 → Go to Console tab
Look for lines starting with: "=== Wallet State ==="
```

**Expected output:**
```javascript
=== Wallet State === {
  isConnected: true,
  accountId: "0.0.6282",
  isInitializing: false,
  hasHederaSession: true,
  provider: "exists"
}
```

### Test 3: Click Create Policy
1. Click "Create Policy" button
2. Look at debug panel (🔍)
3. Check if isConnected is true or false

### Test 4: Try Reconnecting
1. Click "HashPack 0.0.10...6282" in top-right
2. Click "Disconnect"
3. Click "Connect Wallet" again
4. Approve in HashPack
5. Check debug panel again

---

## Common Issues & Fixes

### Issue 1: Browser Cache
**Symptom:** Old code still loading  
**Fix:** 
```bash
1. Hard refresh: Cmd + Shift + R
2. Or clear cache: Cmd + Shift + Delete
```

### Issue 2: Multiple Wallet Extensions
**Symptom:** Conflicts between wallets  
**Fix:**
```bash
1. Disable other wallet extensions
2. Keep only HashPack enabled
3. Refresh page
```

### Issue 3: HashPack Not Updated
**Symptom:** Old HashPack version  
**Fix:**
```bash
1. Update HashPack extension
2. Restart browser
3. Reconnect wallet
```

### Issue 4: React State Out of Sync
**Symptom:** Header shows connected, form doesn't  
**Fix:**
```bash
1. Disconnect wallet
2. Close modal
3. Reconnect wallet
4. Open modal again
```

---

## Debug Console Commands

Open browser console (F12) and try these:

### Check if wallet provider exists:
```javascript
window.ethereum
// Should show object if wallet is installed
```

### Check AppKit state:
```javascript
// This will show in console automatically now
// Look for: "=== Wallet State ==="
```

### Force re-render:
```javascript
// Disconnect and reconnect
// This forces React to re-sync state
```

---

## What to Share With Me

Please provide:

1. **Screenshot of debug panel (🔍 button)**
   - Shows all wallet state values
   - Most important: isConnected and accountId

2. **Browser console output**
   - Press F12 → Console tab
   - Screenshot any errors or "Wallet State" logs

3. **What happens when you:**
   - Click "Create Policy"
   - See the error message
   - Click the debug button

4. **Your setup:**
   - Browser: Chrome/Firefox/Safari?
   - HashPack version: (check in extensions)
   - Operating system: macOS version?

---

## Expected Behavior (Working State)

### In Header:
- Shows: "HashPack 0.0.10...6282" ✓

### In Debug Panel (🔍):
```
isConnected: ✓ true
accountId: 0.0.6282
isInitializing: false
hasHederaSession: true
provider: exists
Status: ✓ Wallet fully connected
```

### In Create Policy Modal:
- Button shows: "Create Policy" (not "Connect Wallet")
- No error message at bottom
- Can submit form

---

## Emergency Workaround

If nothing works, try this direct approach:

### Option 1: Use Existing Policies
- You already have 4 policies created
- Can test approval/rejection features
- Skip policy creation for now

### Option 2: Create Via API
```bash
# Prepare policy parameters
curl -X POST http://localhost:3000/api/policies \
  -H "Content-Type: application/json" \
  -d '{
    "policyholder": "Test DAO",
    "dataChainId": "base",
    "stablecoinSymbol": "USDC",
    ...
  }'
```

### Option 3: Use Hardhat Script
```bash
cd packages/hardhat
yarn hardhat run scripts/createTestPolicy.ts --network hederaTestnet
```

---

## Next Steps

1. **Refresh browser** (Cmd + Shift + R)
2. **Click 🔍 button** in bottom-right
3. **Take screenshot** of debug panel
4. **Share screenshot** with me
5. **Share console output** (F12 → Console)

This will tell us exactly what's wrong!

---

## Files Changed

- ✅ Added `WalletDebugInfo.tsx` - Debug panel component
- ✅ Updated `ScaffoldHbarAppWithProviders.tsx` - Added debug component
- ✅ Added console logging for wallet state

**The debug tool is now live. Refresh and look for the 🔍 button!**
