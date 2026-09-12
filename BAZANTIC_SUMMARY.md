# Bazantic Setup - Summary

## ✅ What's Been Created

### 1. OpenAPI Specification
**File**: `bazantic/edgraph-openapi.yaml`
- Complete API documentation for all EdGraph endpoints
- Includes x402 payment protocol details
- Ready for Bazantic Gateway registration

### 2. OpenAPI Endpoint
**File**: `packages/nextjs/app/api/openapi/route.ts`
- Serves the OpenAPI spec at `/api/openapi`
- Automatically uses your deployment URL
- Test locally: `curl http://localhost:3000/api/openapi`

### 3. Recipe Template
**File**: `bazantic/edgraph-evidence.recipe.yaml`
- Pre-configured workflow for Graph + Evidence API
- Includes x402 payment configuration
- Just needs your username and Gateway URL

### 4. Documentation
- **BAZANTIC_SETUP_GUIDE.md** - Detailed step-by-step guide (15+ pages)
- **BAZANTIC_CHECKLIST.md** - Quick reference checklist with time estimates
- **docs/bazantic.md** - Template for submission information

## 🚀 Next Steps (In Order)

### Step 1: Verify Your Deployment is Public
```bash
# Replace with your actual Railway/Render URL
export DEPLOY_URL="https://your-deployment-url.com"

# Test these endpoints
curl $DEPLOY_URL/api/health
curl $DEPLOY_URL/api/openapi
```

If these don't work, your app isn't deployed or isn't public yet.

### Step 2: Create Bazantic Gateway (~10 minutes)
1. Go to https://app.bazantic.com
2. Click "Gateways" → "Create Gateway"
3. Enter your deployment URL
4. Paste or link to your OpenAPI spec
5. Click Analyze → Review → Activate
6. **Save the Gateway URL**

**Reference**: `BAZANTIC_CHECKLIST.md` Part 1

### Step 3: Update Recipe File (~5 minutes)
Edit `bazantic/edgraph-evidence.recipe.yaml`:
- Line 9: Your Bazantic username
- Line 10: Your Gateway URL (from Step 2)
- Line 14: Your Graph API endpoint
- Line 27: Your Evidence API endpoint

### Step 4: Create Bazantic Recipe (~15 minutes)
1. Go to Bazantic Dashboard → "Recipes"
2. Click "New Recipe"
3. Paste your updated recipe YAML
4. Publish
5. **Save the Recipe URL**

**Reference**: `BAZANTIC_CHECKLIST.md` Part 2

### Step 5: Test the Recipe (~5 minutes)
1. Click "Run" on your published Recipe
2. Use test policy ID: `0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025`
3. Watch it execute:
   - Call Graph API (free)
   - Get 402 Payment Required
   - Sign HBAR payment
   - Get Evidence report
4. Verify you get provenance from both services

**Reference**: `BAZANTIC_CHECKLIST.md` Part 3

### Step 6: Document Everything (~20 minutes)
1. Take screenshots of each step (15 screenshots recommended)
2. Optional: Record video of Recipe execution
3. Update `docs/bazantic.md` with your URLs
4. Save everything in `docs/bazantic-proof/`

**Reference**: `BAZANTIC_CHECKLIST.md` Part 5

## 📋 What You'll Need

### Information to Collect
- [ ] Bazantic username: `_______________`
- [ ] Gateway URL: `_______________`
- [ ] Recipe URL: `_______________`
- [ ] Deployment URL: `_______________`
- [ ] Hedera transaction ID (from test): `_______________`

### Environment Variables (Must be Set in Deployment)
```bash
# Payment
X402_NETWORK=hedera:testnet
FACILITATOR_URL=https://your-facilitator-url.com
EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID=0.0.YOUR_ACCOUNT
EDGRAPH_EVIDENCE_PRICE_TINYBAR=1000000

# The Graph
EDGRAPH_GRAPH_ENDPOINT=https://gateway.thegraph.com/api/YOUR_KEY/...
EDGRAPH_GRAPH_SUBGRAPH_ID=YOUR_SUBGRAPH_ID

# Hedera
HEDERA_RPC_URL=https://testnet.hashio.io/api
```

## 📚 Documentation Reference

| Document | Purpose | Time to Complete |
|----------|---------|------------------|
| `BAZANTIC_SETUP_GUIDE.md` | Detailed walkthrough with explanations | Read: 15 min |
| `BAZANTIC_CHECKLIST.md` | Quick reference checklist | Use as guide: 50 min |
| `bazantic/edgraph-openapi.yaml` | API specification | Already done ✅ |
| `bazantic/edgraph-evidence.recipe.yaml` | Recipe template | Edit: 5 min |
| `docs/bazantic.md` | Submission information | Fill out: 5 min |

## 🧪 Testing Commands

### Local Testing
```bash
# Test OpenAPI endpoint
curl http://localhost:3000/api/openapi | jq .info.title

# Test Graph snapshot
curl -X POST http://localhost:3000/api/graph/snapshot \
  -H 'Content-Type: application/json' \
  -d '{"policyId":"0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025"}'

# Test Evidence API (expect 402)
curl -i -X POST http://localhost:3000/api/v1/depeg-evidence \
  -H 'Content-Type: application/json' \
  -d '{"claimId":"test-001"}'
```

### Production Testing
```bash
# Replace with your deployment URL
export DEPLOY_URL="https://your-deployment-url.com"

curl $DEPLOY_URL/api/openapi | jq .info.title
curl -X POST $DEPLOY_URL/api/graph/snapshot \
  -H 'Content-Type: application/json' \
  -d '{"policyId":"0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025"}'
```

## ⏱️ Time Estimate

| Task | Time |
|------|------|
| Step 1: Verify deployment | 5 min |
| Step 2: Create Gateway | 10 min |
| Step 3: Update Recipe | 5 min |
| Step 4: Create Recipe | 15 min |
| Step 5: Test Recipe | 5 min |
| Step 6: Documentation | 20 min |
| **Total** | **~60 minutes** |

## ❓ Common Questions

### Q: Do I need to deploy before creating the Gateway?
**A**: Yes. Bazantic needs to access your public API to validate the OpenAPI spec.

### Q: Can I test locally first?
**A**: You can test the OpenAPI endpoint locally (`/api/openapi`), but Bazantic needs a public URL to create the Gateway.

### Q: What if my Graph query fails?
**A**: Check that `EDGRAPH_GRAPH_ENDPOINT` is set in your deployment environment variables.

### Q: What if payment fails in the Recipe?
**A**: Verify your testnet HBAR account has funds and that `FACILITATOR_URL` is accessible.

### Q: Can I update the Gateway/Recipe after creation?
**A**: Yes, both can be updated. For the Gateway, you may need to re-analyze. For Recipes, you can edit and republish.

## 🎯 Success Criteria

You'll know you're done when:
- ✅ Gateway is activated in Bazantic
- ✅ Recipe is published in Bazantic
- ✅ Recipe test execution completes successfully
- ✅ You have screenshots of the entire flow
- ✅ Documentation is updated with your URLs
- ✅ You have a Hedera transaction ID proving payment worked

## 🆘 Getting Help

If you get stuck:
1. Check `BAZANTIC_CHECKLIST.md` for common issues
2. Review `BAZANTIC_SETUP_GUIDE.md` for detailed explanations
3. Test each endpoint individually before creating Gateway/Recipe
4. Check your deployment logs for errors
5. Verify all environment variables are set

## 📁 File Structure

```
ethonline/
├── bazantic/
│   ├── edgraph-openapi.yaml          # ✅ API spec
│   └── edgraph-evidence.recipe.yaml  # 📝 Edit this
├── docs/
│   ├── bazantic.md                   # 📝 Fill this out
│   └── bazantic-proof/               # 📸 Save screenshots here
├── packages/nextjs/app/api/
│   └── openapi/route.ts              # ✅ Serves OpenAPI spec
├── BAZANTIC_SETUP_GUIDE.md           # 📖 Read for details
├── BAZANTIC_CHECKLIST.md             # ✓ Use as checklist
├── BAZANTIC_SUMMARY.md               # 📄 This file
└── DATABASE_RECOVERY.md              # ✅ Database fixed
```

## 🎉 You're Ready!

Everything is set up. Just follow the steps in order, and you'll have your Bazantic Gateway and Recipe ready for submission in about an hour.

**Start with**: `BAZANTIC_CHECKLIST.md` and work through it step by step.

Good luck! 🚀
