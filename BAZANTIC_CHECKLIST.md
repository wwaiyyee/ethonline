# Bazantic Setup Checklist

Use this as a quick reference while setting up your Gateway and Recipe.

## Before You Start

- [ ] Bazantic account created at https://bazantic.com
- [ ] EdGraph app deployed publicly (Railway/Render/Vercel)
- [ ] Public deployment URL saved: `_______________________________`
- [ ] Deployment is live and accessible

## Test Your Deployment

```bash
# Replace YOUR_URL with your actual deployment URL
export DEPLOY_URL="https://your-deployment-url.com"

# Test health endpoint
curl $DEPLOY_URL/api/health

# Test OpenAPI spec endpoint
curl $DEPLOY_URL/api/openapi

# Test Graph snapshot (free endpoint)
curl -X POST $DEPLOY_URL/api/graph/snapshot \
  -H 'Content-Type: application/json' \
  -d '{"policyId":"0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025"}'

# Test Evidence API (should return 402 Payment Required)
curl -i -X POST $DEPLOY_URL/api/v1/depeg-evidence \
  -H 'Content-Type: application/json' \
  -d '{"claimId":"test-claim-001"}'
```

## Part 1: Create Gateway (10 minutes)

### In Bazantic Dashboard

1. **Navigate**: Dashboard → Gateways → "Create Gateway"

2. **Fill in form**:
   - [ ] **API BASE URL**: `https://your-deployment-url.com`
   - [ ] **SPEC URL**: `https://your-deployment-url.com/api/openapi`
   - [ ] Click "Analyze" button
   
3. **Review Analysis**:
   - [ ] Verify 5 endpoints detected:
     - `/api/health`
     - `/api/graph/snapshot`
     - `/api/v1/depeg-evidence`
     - `/api/policies`
     - `/api/claims`
   - [ ] Check payment config on Evidence API shows x402/hedera:testnet
   - [ ] Click "Review"
   
4. **Activate**:
   - [ ] Review endpoint details
   - [ ] Click "Activate"
   - [ ] **Copy Gateway URL**: `_______________________________`
   - [ ] Save Gateway URL for Recipe creation

## Part 2: Create Recipe (15 minutes)

### Update Recipe File

Edit `bazantic/edgraph-evidence.recipe.yaml`:

```yaml
# Line 9 - Replace with your Bazantic username
username: _______________________

# Line 10 - Replace with Gateway URL from Part 1
gateway: _______________________

# Line 14 - Replace with your deployment URL
endpoint: https://_____________________.com/api/graph/snapshot

# Line 27 - Replace with your deployment URL  
endpoint: https://_____________________.com/api/v1/depeg-evidence
```

### In Bazantic Dashboard

1. **Navigate**: Dashboard → Recipes → "New Recipe"

2. **Describe Recipe**:
   ```
   Monitor Base stablecoin pool for depeg risk. Query live Graph snapshot, 
   then purchase detailed evidence with HBAR payment if risk signals warrant it.
   ```

3. **Build Recipe**:
   - [ ] Option A: Paste updated `edgraph-evidence.recipe.yaml` content
   - [ ] Option B: Fill form manually using the YAML as reference
   
4. **Configure Services**:
   
   **Service 1: graph-live-pool**
   - [ ] Name: `graph-live-pool`
   - [ ] Endpoint: `https://your-url.com/api/graph/snapshot`
   - [ ] Method: `POST`
   - [ ] Input: `policyId` (string)
   - [ ] Payment: None (free service)
   
   **Service 2: edgraph-evidence-api**
   - [ ] Name: `edgraph-evidence-api`
   - [ ] Endpoint: `https://your-url.com/api/v1/depeg-evidence`
   - [ ] Method: `POST`
   - [ ] Input: `claimId` (string), `policyId` (string)
   - [ ] Payment Protocol: `x402`
   - [ ] Payment Network: `hedera:testnet`
   - [ ] Payment Asset: `0.0.0` (HBAR)
   - [ ] Payment Unit: `tinybar`

5. **Set Workflow**:
   ```
   1. Query graph-live-pool for the configured Base pool.
   2. Buy edgraph-evidence-api evidence only when risk signals justify the budget.
   3. If HTTP 402 is returned, sign the requested HBAR transfer and retry.
   4. Compare the detailed report with the initial live Graph snapshot.
   5. Return a recommendation and both provenance records.
   ```

6. **Add Constraints**:
   - [ ] Use live Graph data; never use replay or hard-coded values
   - [ ] Respect the policy maxEvidenceBudgetTinybar
   - [ ] Do not execute a real insurance or token payout
   - [ ] Require DAO operator approval after the deterministic policy result

7. **Publish**:
   - [ ] Click "Publish"
   - [ ] **Copy Recipe URL**: `_______________________________`

## Part 3: Test Recipe (5 minutes)

### Run Test Execution

1. **In Bazantic**: Navigate to your Recipe → Click "Run"

2. **Input test data**:
   ```json
   {
     "policyId": "0x37fa3d9cde09def97e688634b3ba7ee1c51af6418dd24432a03555bd15968025"
   }
   ```

3. **Watch execution flow**:
   - [ ] Step 1: Graph snapshot called (free)
   - [ ] Step 2: Agent evaluates risk signals
   - [ ] Step 3: If warranted, Evidence API called
   - [ ] Step 4: 402 Payment Required returned
   - [ ] Step 5: Bazantic agent signs HBAR payment
   - [ ] Step 6: Retry with payment signature
   - [ ] Step 7: Evidence report returned
   - [ ] Step 8: Payment receipt with Hedera transaction ID

4. **Verify output**:
   - [ ] Graph snapshot included
   - [ ] Evidence report included (if payment made)
   - [ ] Both provenance records present
   - [ ] Hedera transaction ID present

## Part 4: Update Documentation (5 minutes)

Edit `docs/bazantic.md`:

```markdown
| Bazantic username | YOUR_USERNAME |
| Gateway URL or identifier | YOUR_GATEWAY_URL |
| Published Recipe URL | YOUR_RECIPE_URL |
| Public Evidence API URL | https://your-url.com/api/v1/depeg-evidence |
| Graph service URL | https://your-url.com/api/graph/snapshot |
```

## Part 5: Create Submission Proof (15 minutes)

### Screenshots to Capture

- [ ] 01-bazantic-account.png - Your Bazantic dashboard/profile
- [ ] 02-gateway-create.png - Gateway creation form filled
- [ ] 03-gateway-analyze.png - Analysis results showing endpoints
- [ ] 04-gateway-review.png - Review screen
- [ ] 05-gateway-activated.png - Activated Gateway with URL
- [ ] 06-recipe-create.png - Recipe creation form
- [ ] 07-recipe-services.png - Services configuration
- [ ] 08-recipe-published.png - Published Recipe page
- [ ] 09-recipe-run-start.png - Recipe execution started
- [ ] 10-recipe-run-graph.png - Graph snapshot step
- [ ] 11-recipe-run-402.png - 402 Payment Required
- [ ] 12-recipe-run-payment.png - HBAR payment signature
- [ ] 13-recipe-run-evidence.png - Evidence report returned
- [ ] 14-recipe-run-complete.png - Final output with provenance
- [ ] 15-hedera-transaction.png - Transaction on HashScan

### Optional: Video Recording

- [ ] Record full Recipe execution (2-5 minutes)
- [ ] Show: Run → Graph call → 402 → Payment → Evidence → Result
- [ ] Upload to YouTube/Loom and save link

### Save Everything

```bash
mkdir -p docs/bazantic-proof
# Move your screenshots to this directory
# Save transaction links in a text file
```

## Submission Information

Once complete, you'll have:

- ✅ Gateway URL: `_______________________________`
- ✅ Recipe URL: `_______________________________`
- ✅ Bazantic username: `_______________________________`
- ✅ Screenshots saved in `docs/bazantic-proof/`
- ✅ Documentation updated in `docs/bazantic.md`
- ✅ Test execution completed successfully
- ✅ Hedera payment transaction ID: `_______________________________`

## Common Issues and Solutions

### "Cannot reach API endpoint"
```bash
# Test your deployment
curl https://your-url.com/api/health

# Check logs
railway logs  # or your platform's log command
```

### "OpenAPI spec is invalid"
```bash
# Validate locally
curl http://localhost:3000/api/openapi | jq .

# Or validate at https://editor.swagger.io
```

### "Payment failed"
- Check testnet HBAR balance
- Verify `FACILITATOR_URL` is accessible
- Check `EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID` is set in deployment

### "Graph query failed"
- Verify `EDGRAPH_GRAPH_ENDPOINT` environment variable
- Check The Graph API key is valid
- Test Graph endpoint directly

## Required Environment Variables

Make sure these are set in your deployment:

```bash
# x402 Payment
X402_NETWORK=hedera:testnet
FACILITATOR_URL=https://your-facilitator-url.com
EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID=0.0.YOUR_ACCOUNT
EDGRAPH_EVIDENCE_PRICE_TINYBAR=1000000

# The Graph
EDGRAPH_GRAPH_ENDPOINT=https://gateway.thegraph.com/api/YOUR_KEY/subgraphs/id/YOUR_SUBGRAPH
EDGRAPH_GRAPH_SUBGRAPH_ID=YOUR_SUBGRAPH_ID

# Hedera
HEDERA_RPC_URL=https://testnet.hashio.io/api
```

## Time Estimate

- Part 1 (Gateway): 10 minutes
- Part 2 (Recipe): 15 minutes
- Part 3 (Testing): 5 minutes
- Part 4 (Documentation): 5 minutes
- Part 5 (Proof): 15 minutes

**Total: ~50 minutes**

## Questions?

- Bazantic docs: https://docs.bazantic.com
- EdGraph setup guide: `BAZANTIC_SETUP_GUIDE.md`
- Check deployment logs for API errors
- Test each endpoint individually before creating Recipe
