# 🚀 Deployment Action Plan - EdGraph System Fix

**Status**: Ready for deployment
**Time Required**: ~10 minutes
**Risk Level**: Low (configuration only)

---

## ✅ What Was Fixed

1. **502 Dashboard API Errors** - Added missing PolicyRegistry and FileRegistry contract addresses
2. **HashPack Connection Issue** - Documented the desktop browser extension workaround
3. **Environment Variables** - Updated all .env files with correct contract addresses

---

## 🎯 YOUR ACTION ITEMS

### Step 1: Update Railway Environment Variables (CRITICAL)

1. **Go to Railway Dashboard**
   - Open https://railway.app
   - Navigate to your EdGraph project
   - Click on your Next.js service

2. **Open Variables Tab**
   - Click "Variables" in the left sidebar
   - Click "Raw Editor" button (top right)

3. **Copy and Paste These Variables**

```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=21ac6fe1145d5e738b642eaaef8019da
NEXT_PUBLIC_HEDERA_MAINNET_RPC_URL=https://mainnet.hashio.io/api
NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
HEDERA_RPC_URL=https://testnet.hashio.io/api

POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942
NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942

FILE_REGISTRY_ADDRESS=0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9
NEXT_PUBLIC_FILE_REGISTRY_ADDRESS=0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9
FILE_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443939
NEXT_PUBLIC_FILE_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443939

EDGRAPH_DB_PATH=.data/edgraph.sqlite
EDGRAPH_GRAPH_ENDPOINT=https://gateway.thegraph.com/api/c71b0bd685814c60d1a641b9d0bba7b8/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_SUBGRAPH_ID=5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_API_KEY=c71b0bd685814c60d1a641b9d0bba7b8
EDGRAPH_GRAPH_POOL_ADDRESS=0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
EDGRAPH_STABLECOIN_ADDRESS=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
EDGRAPH_STABLECOIN_SYMBOL=USDC
EDGRAPH_QUOTE_TOKEN_ADDRESS=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
EDGRAPH_QUOTE_TOKEN_SYMBOL=WETH
EDGRAPH_QUOTE_TOKEN_USD_PRICE=2500
EDGRAPH_AGENT_ACCOUNT_ID=0.0.10461760
EDGRAPH_AGENT_PRIVATE_KEY=0x8aa1ed7c9bfe9db6c7c13ba36db39dc6d548c1e08d978570a149c8d792752e44
EDGRAPH_AGENT_HBAR_BUDGET_TINYBAR=1000000
EDGRAPH_EVIDENCE_PRICE_TINYBAR=1000000
EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID=0.0.10426282

FACILITATOR_URL=https://edgraph-facilitator.up.railway.app
X402_NETWORK=hedera:testnet
NEXT_PUBLIC_X402_NETWORK=hedera:testnet

S3_ENDPOINT=http://localhost:9000
S3_REGION=us-east-1
S3_BUCKET=x402-files
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=minioadmin
S3_FORCE_PATH_STYLE=true
```

4. **IMPORTANT**: Replace these URLs with YOUR actual Railway URL
   - Find and replace `YOUR_RAILWAY_URL` if you added these:
   ```bash
   EDGRAPH_EVIDENCE_API_URL=https://YOUR_RAILWAY_URL/api/v1/depeg-evidence
   EDGRAPH_GRAPH_SERVICE_URL=https://YOUR_RAILWAY_URL/api/graph/snapshot
   ```
   - Example: If your Railway URL is `edgraph.up.railway.app`, use:
   ```bash
   EDGRAPH_EVIDENCE_API_URL=https://edgraph.up.railway.app/api/v1/depeg-evidence
   EDGRAPH_GRAPH_SERVICE_URL=https://edgraph.up.railway.app/api/graph/snapshot
   ```

5. **Click "Deploy"**
   - Railway will automatically redeploy with the new variables
   - Wait 3-5 minutes for build to complete

---

### Step 2: Verify Deployment (After Railway Build Completes)

**Test 1: Health Check**
```bash
curl https://YOUR_RAILWAY_URL/api/health
```
Expected: `{"status":"ok"}` (not 502)

**Test 2: Dashboard API**
```bash
curl https://YOUR_RAILWAY_URL/api/dashboard
```
Expected: JSON with policy counts (not 502)

**Test 3: Open in Browser**
- https://YOUR_RAILWAY_URL/edgraph-monitor
  - ✅ Should show "LIVE GRAPH DATA" banner
  - ❌ Should NOT show "Dashboard API unavailable"

- https://YOUR_RAILWAY_URL/policies
  - ✅ Should show policy list or empty state
  - ❌ Should NOT show "Failed to fetch policies"

- https://YOUR_RAILWAY_URL/claims
  - ✅ Should show claims dashboard
  - ❌ Should NOT show "Failed to fetch claims"

---

### Step 3: Test HashPack Connection

**Desktop Users:**
1. Install HashPack Browser Extension:
   - Chrome: https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk
   - Firefox: https://addons.mozilla.org/en-US/firefox/addon/hashpack/

2. Open your Railway app in browser

3. Click "Connect HashPack" button

4. **IMPORTANT**: Click the "Browser" tab (NOT "Mobile")

5. Extension popup appears → Approve connection

6. ✅ Wallet connected, balance shows

**Mobile Users:**
1. Install HashPack Mobile App first

2. Open Railway app in mobile browser

3. Click "Connect HashPack" → "Mobile" tab → "Open"

4. HashPack app launches → Approve connection

5. ✅ Redirected back, wallet connected

---

## 📋 Verification Checklist

After deployment, check all these boxes:

### API Routes
- [ ] `/api/health` returns `{"status":"ok"}`
- [ ] `/api/dashboard` returns JSON (not 502)
- [ ] `/api/policies` returns JSON (not 502)
- [ ] `/api/claims` returns JSON (not 502)

### Pages
- [ ] `/edgraph-monitor` shows "LIVE GRAPH DATA" banner
- [ ] `/policies` loads without "Failed to fetch" error
- [ ] `/claims` loads without "Failed to fetch" error
- [ ] Home page displays pool data

### Wallet Connection
- [ ] HashPack connects via Browser Extension (desktop)
- [ ] Wallet balance displays after connection
- [ ] Can interact with dApp after connection

---

## 🆘 Troubleshooting

### Issue: Still seeing "Dashboard API unavailable"

**Check:**
```bash
# Verify Railway env vars are set
# Go to Railway → Service → Variables → Search for "POLICY_REGISTRY"
# You should see 4 variables (2 ADDRESS, 2 HEDERA_CONTRACT_ID)
```

**Fix:**
- Ensure ALL 4 PolicyRegistry variables are set (see Step 1)
- Click "Deploy" again to trigger rebuild

### Issue: Build fails on Railway

**Check Railway Build Logs:**
- Look for "Failed to compile" or "Type error"
- The TypeScript error in `test-evidence-payment.ts` was already fixed locally
- Make sure you pushed the latest changes to your git repository

**Fix:**
```bash
# Push the fixes to your repository
git add .
git commit -m "Fix: Add PolicyRegistry and FileRegistry env vars"
git push origin main
```

### Issue: HashPack still won't connect

**Desktop:**
- Make sure you installed the browser extension first
- Click the "Browser" tab (not "Mobile" or "Webapp")
- Check browser console for errors (F12)

**Mobile:**
- Make sure HashPack app is installed
- Use mobile browser (Safari, Chrome)
- Click "Mobile" tab → "Open"

---

## 📚 Documentation Created

For detailed information, refer to these new documents:

1. **`RAILWAY_DEPLOYMENT.md`** - Complete deployment guide
2. **`HASHPACK_CONNECTION_GUIDE.md`** - Wallet connection troubleshooting
3. **`FIX_SUMMARY.md`** - Technical details of what was fixed
4. **`DEPLOYMENT_ACTION_PLAN.md`** - This checklist

---

## ✨ Success Criteria

Your system is working when:

1. ✅ All pages load without 502 errors
2. ✅ EdGraph Monitor shows live data
3. ✅ Policies and Claims dashboards load
4. ✅ HashPack wallet connects successfully
5. ✅ Users can interact with the dApp

---

## 🎉 Expected Outcome

After following this plan:
- **EdGraph Monitor** will show real-time stablecoin coverage data
- **Policies page** will display registered coverage policies
- **Claims page** will show submitted claims
- **Wallet connection** will work via HashPack extension
- **No more 502 errors** on any dashboard API calls

---

**Need Help?**
- Check Railway build logs for errors
- Review the detailed guides in the documentation files
- Verify all environment variables are set correctly
- Test API routes with curl commands

**Estimated Total Time**: 10-15 minutes
**Difficulty**: Easy (just copy/paste env vars)
**Risk**: Low (configuration only, no code changes)

🚀 **Ready to deploy!**
