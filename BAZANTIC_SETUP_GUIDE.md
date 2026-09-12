# Bazantic Gateway and Recipe Setup Guide

## Prerequisites

Before you begin, make sure you have:
- [ ] Bazantic account created at https://bazantic.com
- [ ] EdGraph app running locally on `http://localhost:3000`
- [ ] Your app deployed publicly (Railway, Render, Vercel, etc.)
- [ ] Public URL for your deployed app (e.g., `https://edgraph-xxx.railway.app`)

## Part 1: Create the Bazantic Gateway

### Step 1: Prepare Your Public Deployment

1. **Deploy your EdGraph app** (if not already deployed):
   ```bash
   # Make sure your app is pushed to Railway or your hosting platform
   # You should have done this already based on railway-deployment.md
   ```

2. **Get your public URL**:
   - Find your deployment URL (e.g., from Railway dashboard)
   - Example: `https://edgraph-production-xxxx.up.railway.app`

3. **Test that your API is publicly accessible**:
   ```bash
   # Replace with your actual deployment URL
   curl https://your-deployment-url.com/api/health
   ```
   
   Expected response:
   ```json
   {
     "status": "ok",
     "service": "edgraph-evidence-api",
     ...
   }
   ```

### Step 2: Upload OpenAPI Spec to Bazantic

1. **Go to Bazantic Dashboard**: https://app.bazantic.com/dashboard

2. **Click "Gateways" in the left sidebar**

3. **Click "Create Gateway"**

4. **Fill in Gateway Details**:

   **API BASE URL**:
   ```
   https://your-actual-deployment-url.com
   ```
   
   **DOCS URL** (Optional):
   ```
   https://github.com/your-username/ethonline
   ```
   
   **SPEC URL** (Required):
   ```
   https://your-deployment-url.com/api/openapi
   ```
   
   **OR** click "PASTE" and paste the contents of `bazantic/edgraph-openapi.yaml`

5. **Click "Analyze" button**

6. **Review the analysis**:
   - Bazantic will parse your OpenAPI spec
   - It will show detected endpoints:
     - `/api/health` (GET)
     - `/api/graph/snapshot` (POST)
     - `/api/v1/depeg-evidence` (POST)
     - `/api/policies` (GET)
     - `/api/claims` (GET)

7. **Click "Review" (Step 2)**

8. **Review and confirm**:
   - Check that all endpoints are correctly detected
   - Verify the payment configuration for `/api/v1/depeg-evidence`:
     - Protocol: x402
     - Network: hedera:testnet
     - Asset: 0.0.0 (HBAR)

9. **Click "Activate" (Step 3)**

10. **Save your Gateway URL**:
    - After activation, copy the Gateway URL
    - Example: `https://gateway.bazantic.com/v1/gateways/abc123`
    - **Save this URL - you'll need it for the Recipe**

### Step 3: Verify Gateway

Test your Gateway through Bazantic:

```bash
# Replace with your actual Gateway URL
curl "https://gateway.bazantic.com/v1/gateways/YOUR_GATEWAY_ID/health"
```

## Part 2: Create the Bazantic Recipe

### Step 1: Prepare Recipe Configuration

1. **Get your Bazantic username**:
   - Found in Bazantic dashboard (top left corner)
   - Example: `wai` or `your-username`

2. **Collect required URLs**:
   - Gateway URL (from Part 1, Step 2.10)
   - Graph service URL: `https://your-deployment-url.com/api/graph/snapshot`
   - Evidence API URL: `https://your-deployment-url.com/api/v1/depeg-evidence`

### Step 2: Update Recipe File

Edit `bazantic/edgraph-evidence.recipe.yaml`:

```yaml
name: edgraph-live-coverage-evidence
version: 1
description: >-
  Decide whether a Base stablecoin pool needs deeper coverage evidence. Query
  the live Graph pool snapshot first, then call EdGraph's paid Evidence API
  only when the live price, movement, liquidity, or data-quality signals justify
  spending HBAR. The final recommendation must include provenance from both
  services and must never execute a payout.

# REPLACE THESE VALUES:
username: YOUR_BAZANTIC_USERNAME                    # e.g., wai
gateway: YOUR_GATEWAY_URL                           # From Part 1

services:
  - name: graph-live-pool
    purpose: Load-bearing live market observation.
    endpoint: https://YOUR-DEPLOYMENT-URL.com/api/graph/snapshot
    input:
      policyId: string
      lookbackSeconds: integer
    output:
      currentPriceUsdMicros: integer
      recentPriceMovementBps: integer
      liquidityChangeBps: integer
      observationTimestamps: array
      provenance: object
      
  - name: edgraph-evidence-api
    purpose: Paid deeper proof for a candidate coverage claim.
    endpoint: https://YOUR-DEPLOYMENT-URL.com/api/v1/depeg-evidence
    method: POST
    payment:
      protocol: x402
      network: hedera:testnet
      asset: 0.0.0
      unit: tinybar
    input:
      policyId: string
      claimId: string
      lookbackSeconds: integer
    output:
      evidence: object
      policyDecision: object
      payment: object

workflow:
  - Query graph-live-pool for the configured Base pool.
  - Buy edgraph-evidence-api evidence only when risk signals justify the budget.
  - If HTTP 402 is returned, sign the requested HBAR transfer and retry with PAYMENT-SIGNATURE.
  - Compare the detailed report with the initial live Graph snapshot.
  - Return a recommendation and both provenance records.

constraints:
  - Use live Graph data; never label replay or hard-coded values as live.
  - Respect the policy maxEvidenceBudgetTinybar.
  - Do not execute a real insurance or token payout.
  - Require DAO operator approval after the deterministic policy result.
```

### Step 3: Create Recipe in Bazantic

1. **Go to Bazantic Dashboard** → **Recipes** (left sidebar)

2. **Click "New Recipe"**

3. **In the text box**, describe your recipe:
   ```
   Monitor Base stablecoin pool for depeg risk. First check live Graph 
   snapshot, then purchase detailed evidence report with HBAR payment 
   if risk signals warrant deeper analysis.
   ```

4. **Click one of the example buttons** or **"Start from a blank form"**

5. **In the Recipe editor**:
   - Paste the content from your updated `bazantic/edgraph-evidence.recipe.yaml`
   - OR fill in the form fields manually:

   **Recipe Name**: `edgraph-live-coverage-evidence`
   
   **Description**: (copy from YAML)
   
   **Services**:
   - Service 1: `graph-live-pool`
     - Endpoint: Your Graph service URL
     - Method: POST
     - Input fields: policyId (string)
   
   - Service 2: `edgraph-evidence-api`
     - Endpoint: Your Evidence API URL
     - Method: POST
     - Payment: x402, hedera:testnet, 0.0.0
     - Input fields: claimId (string), policyId (string), lookbackSeconds (integer)

   **Workflow**: (copy from YAML)

6. **Click "Test Recipe"** (optional):
   - This will validate your Recipe syntax
   - Fix any errors shown

7. **Click "Publish"**

8. **Save your Recipe URL**:
   - After publishing, copy the Recipe URL
   - Example: `https://bazantic.com/recipes/wai/edgraph-live-coverage-evidence`

### Step 4: Test Your Recipe

1. **Click "Run" on your published Recipe**

2. **Fill in the test inputs**:
   ```json
   {
     "policyId": "0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025"
   }
   ```

3. **Watch the execution**:
   - First call to `graph-live-pool` (free)
   - Agent decision based on risk signals
   - If justified, call to `edgraph-evidence-api`:
     - First returns 402 Payment Required
     - Bazantic agent signs HBAR payment
     - Retry with payment signature
     - Returns evidence report with provenance

4. **Verify the output**:
   - Should include Graph snapshot
   - Should include evidence report (if payment was made)
   - Should include both provenance records
   - Should include payment receipt with Hedera transaction ID

## Part 3: Update Documentation

Edit `docs/bazantic.md` with your actual values:

```markdown
| Field | Value |
| --- | --- |
| Bazantic username | `YOUR_USERNAME` |
| Gateway URL or identifier | `YOUR_GATEWAY_URL` |
| Published Recipe URL | `YOUR_RECIPE_URL` |
| Public Evidence API URL | `https://your-deployment-url.com/api/v1/depeg-evidence` |
| Graph service URL | `https://your-deployment-url.com/api/graph/snapshot` |
```

## Part 4: Create Proof for Submission

### Take Screenshots

1. **Bazantic account page** showing your username
2. **Gateway creation** - showing the 3 steps (Analyze, Review, Activate)
3. **Gateway details** - showing your endpoints
4. **Recipe creation** - showing the workflow
5. **Recipe execution** - showing:
   - Graph snapshot call
   - 402 Payment Required response
   - HBAR payment signature
   - Payment settlement
   - Evidence report with provenance
6. **Hedera transaction** - showing the payment on HashScan

### Record Video (Optional but Recommended)

Use OBS Studio, Loom, or QuickTime to record:
1. Navigate to your Recipe
2. Click "Run"
3. Show the entire execution flow
4. Show payment being made
5. Show final evidence report

### Save Artifacts

Create `docs/bazantic-proof/` directory:

```bash
mkdir -p docs/bazantic-proof
```

Save:
- Screenshots (numbered 01-screenshot-account.png, etc.)
- Recipe execution JSON export (if available)
- Transaction links
- Video recording link

## Troubleshooting

### Gateway Issues

**Problem**: "Cannot reach API endpoint"
- **Solution**: Verify your deployment is public and running
- Test with: `curl https://your-url.com/api/health`

**Problem**: "OpenAPI spec is invalid"
- **Solution**: Validate your YAML at https://editor.swagger.io
- Check for syntax errors

### Recipe Issues

**Problem**: "Service not found"
- **Solution**: Verify Gateway URL is correct
- Check that service names match exactly

**Problem**: "Payment failed"
- **Solution**: 
  - Verify your HBAR account has testnet funds
  - Check `FACILITATOR_URL` is accessible
  - Verify `EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID` is set

**Problem**: "Graph query failed"
- **Solution**:
  - Check `EDGRAPH_GRAPH_ENDPOINT` is set
  - Verify The Graph API key is valid
  - Test Graph endpoint directly

## Next Steps

After completing these steps:

1. ✅ Gateway created and activated
2. ✅ Recipe published and tested
3. ✅ Documentation updated
4. ✅ Proof artifacts saved
5. ✅ Ready for submission!

## Quick Reference

### Environment Variables Needed

In your deployment (Railway, etc.):

```bash
# Required for Evidence API
EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID=0.0.YOUR_ACCOUNT
EDGRAPH_EVIDENCE_PRICE_TINYBAR=1000000
FACILITATOR_URL=https://your-facilitator-url.com

# Required for Graph service
EDGRAPH_GRAPH_ENDPOINT=https://gateway.thegraph.com/...
EDGRAPH_GRAPH_SUBGRAPH_ID=your-subgraph-id

# Required for x402
X402_NETWORK=hedera:testnet
HEDERA_RPC_URL=https://testnet.hashio.io/api
```

### Test Commands

```bash
# Test health
curl https://your-url.com/api/health

# Test Graph snapshot
curl -X POST https://your-url.com/api/graph/snapshot \
  -H 'Content-Type: application/json' \
  -d '{"policyId":"0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025"}'

# Test Evidence API (should return 402)
curl -i -X POST https://your-url.com/api/v1/depeg-evidence \
  -H 'Content-Type: application/json' \
  -d '{"claimId":"test-001","policyId":"0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025"}'
```

## Support

If you encounter issues:
- Check Bazantic documentation: https://docs.bazantic.com
- Review your deployment logs
- Verify all environment variables are set
- Test each endpoint individually before creating the Recipe
