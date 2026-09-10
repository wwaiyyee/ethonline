# Wallet Connection Fix - Quick Guide

## Issue: "Please connect your wallet" even though HashPack is connected

### Quick Fixes (Try in order)

### Fix 1: Hard Refresh the Page
```
Press: Cmd + Shift + R (Mac) or Ctrl + Shift + R (Windows)
```

This clears the cache and reloads the wallet connection state.

### Fix 2: Reconnect Wallet
1. Click on "HashPack 0.0.10...6282" in top right
2. Click "Disconnect"
3. Click "Connect Wallet"
4. Approve in HashPack
5. Try creating policy again

### Fix 3: Check Browser Console
1. Press F12 to open Developer Tools
2. Go to Console tab
3. Click "Create Policy" button
4. Look for any error messages
5. Take a screenshot and share if you see errors

### Fix 4: Wait for Initialization
The button now shows different states:
- "Initializing..." - Wait a few seconds
- "Connect Wallet" - Wallet not connected
- "Create Policy" - Ready to submit ✓

---

## Code Changes Made

I added:
1. ✅ `isInitializing` check - handles connection timing
2. ✅ Better button states - shows "Initializing..." while loading
3. ✅ Debug info - shows connection status at bottom of form

**Refresh your browser now** and the button should work!

---

## Alternative: Use Browser Console to Test

If the form still doesn't work, we can test the contract directly:

```javascript
// Open browser console (F12)
// Paste this:

const { accountId } = await window.ethereum.request({ 
  method: 'eth_requestAccounts' 
});
console.log('Account:', accountId);
```

---

## Docker Setup Summary

### For x402 Evidence Feature:

**Do you need it now?**
- ❌ No - Skip Docker, 95% of features work without it
- ✅ Yes - Follow `DOCKER_SETUP_GUIDE.md` step-by-step

**What Docker enables:**
- Only the "Buy Evidence" button
- Everything else works without Docker

**Installation time:**
- Docker Desktop download: 5 minutes
- Installation: 5 minutes  
- Facilitator setup: 5 minutes
- Total: ~15 minutes

---

## Next Steps

### Option A: Fix Wallet First
1. Hard refresh page (Cmd + Shift + R)
2. Check if button now says "Create Policy"
3. Try submitting
4. Share screenshot if still broken

### Option B: Install Docker
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Install and start Docker
3. Run: `docker --version` to verify
4. Follow `DOCKER_SETUP_GUIDE.md` for x402 setup

### Option C: Skip Both for Now
- Use existing 4 policies to test UI
- Approval/rejection works
- Come back to policy creation later

---

## Expected Behavior After Fix

**When you click "Create Policy":**
1. Button shows "Initializing..." (2-3 seconds)
2. Button changes to "Create Policy"
3. You fill the form
4. You click "Create Policy"
5. HashPack opens for signature
6. You approve transaction
7. Policy appears in list

**Debug info at bottom shows:**
- "Wallet connection: connected ✓ (0.0.6282)"

---

## What to Share if Still Broken

1. **Screenshot** of the form with button state
2. **Browser console** errors (press F12, Console tab)
3. **Network tab** showing API calls (F12, Network tab)
4. **HashPack extension** version

This will help me identify the exact issue.
