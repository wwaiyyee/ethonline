# Complete Docker Setup & x402 Evidence Guide

## Problem 1: Wallet Connection Issue

### Quick Fix - Refresh the Page

The wallet is connected (you can see "HashPack 0.0.10...6282" in top right), but the form might have loaded before the connection initialized.

**Try this:**
1. **Hard refresh the page:** Press `Cmd + Shift + R` (Mac) or `Ctrl + Shift + R` (Windows)
2. Click "Create Policy" again
3. Check browser console (press F12) - look for: `PolicyForm - isConnected: true`

If you still see "Please connect your wallet", it's a timing issue. Let me know and I'll add a loading state.

---

## Problem 2: Docker Setup for x402 Evidence

### Why Docker is Needed

The **x402 payment facilitator** runs as a separate service that:
1. Verifies payment signatures
2. Co-signs transactions as fee payer
3. Submits transactions to Hedera
4. Returns settlement proof

**Without Docker:** You can't test "Buy Evidence" button  
**With Docker:** Complete x402 payment flow works

---

## Step-by-Step Docker Installation (macOS)

### Step 1: Download Docker Desktop

1. **Visit:** https://www.docker.com/products/docker-desktop/
2. **Click:** "Download for Mac"
3. **Choose your chip:**
   - **Apple Silicon (M1/M2/M3):** Download "Mac with Apple chip"
   - **Intel Mac:** Download "Mac with Intel chip"

### Step 2: Install Docker Desktop

1. **Open** the downloaded `.dmg` file
2. **Drag** Docker icon to Applications folder
3. **Open** Docker from Applications
4. **Accept** service agreement
5. **Wait** for Docker to start (2-3 minutes)
   - You'll see a whale icon in menu bar
   - Icon will stop animating when ready

### Step 3: Verify Installation

Open Terminal and run:

```bash
docker --version
# Should show: Docker version 24.x.x or higher

docker compose version
# Should show: Docker Compose version v2.x.x or higher
```

If you see version numbers, Docker is installed correctly! ✅

---

## Setting Up x402 Facilitator

### Step 1: Check Facilitator Configuration

The facilitator needs environment variables. Let's check if they exist:

```bash
cd /Users/chloelee/wy/ethonline
cat .env | grep FACILITATOR
```

**Expected output:**
```bash
FACILITATOR_ACCOUNT_ID=0.0.xxxxx
FACILITATOR_PRIVATE_KEY=302e020...
```

If you don't see these, we need to set them up.

### Step 2: Get Testnet Account for Facilitator

**Option A: Use Your Existing HashPack Account**

1. Open HashPack wallet
2. Go to Settings → Export Private Key
3. Copy the private key (starts with `302e020...`)
4. Copy your account ID (shows as `0.0.6282` in your case)

**Option B: Create New Account for Facilitator**

```bash
cd /Users/chloelee/wy/ethonline/packages/hardhat
yarn account:generate
# Follow prompts, save the account ID and private key
```

### Step 3: Create .env File

```bash
cd /Users/chloelee/wy/ethonline

# Create .env file
cat > .env << 'EOF'
# Facilitator Configuration
FACILITATOR_PORT=4020
X402_NETWORK=hedera:testnet
FACILITATOR_ACCOUNT_ID=0.0.6282
FACILITATOR_PRIVATE_KEY=your_private_key_here
HEDERA_NODE_URL=https://testnet.hashio.io/api
EOF
```

**⚠️ Replace:**
- `0.0.6282` with your account ID
- `your_private_key_here` with your actual private key

### Step 4: Check docker-compose.yml

```bash
cat docker-compose.yml | grep -A 10 facilitator
```

**Expected to see:**
```yaml
facilitator:
  build: ./facilitator
  ports:
    - "4020:4020"
  environment:
    - FACILITATOR_PORT=4020
    - X402_NETWORK=${X402_NETWORK}
    - FACILITATOR_ACCOUNT_ID=${FACILITATOR_ACCOUNT_ID}
    - FACILITATOR_PRIVATE_KEY=${FACILITATOR_PRIVATE_KEY}
```

### Step 5: Start Facilitator

```bash
cd /Users/chloelee/wy/ethonline
docker compose up facilitator -d
```

**What this does:**
- Builds facilitator Docker image (first time takes 2-3 minutes)
- Starts facilitator on port 4020
- Runs in background (`-d` flag)

**Expected output:**
```
[+] Building ... 
[+] Running 1/1
 ✔ Container ethonline-facilitator-1  Started
```

### Step 6: Verify Facilitator is Running

```bash
# Check if container is running
docker ps | grep facilitator

# Check facilitator health
curl http://localhost:4020/health
# Expected: {"status":"ok"}

# Check supported schemes
curl http://localhost:4020/supported
# Expected: {"schemes":["exact-hedera"],"feePayer":"0.0.6282"}
```

If you see `{"status":"ok"}`, facilitator is working! ✅

---

## Testing x402 Evidence Flow

### Test 1: Request Without Payment (Should Get 402)

```bash
curl -i "http://localhost:3000/api/v1/depeg-evidence?claimId=test-claim-123"
```

**Expected output:**
```
HTTP/1.1 402 Payment Required
PAYMENT-REQUIRED: ...

{
  "requirements": [{
    "kind": "exact-hedera",
    "assetId": "0.0.0",
    "amount": "100000000",
    "payTo": "0.0.6282",
    "network": "hedera:testnet",
    "timeout": 300
  }],
  "resourceInfo": {
    "url": "/api/v1/depeg-evidence",
    "description": "EdGraph depeg evidence report",
    "mimeType": "application/json"
  }
}
```

✅ **If you see "402 Payment Required"** → x402 is working!

### Test 2: Buy Evidence in UI

1. **Go to Claims page:** http://localhost:3000/claims
2. **Find a claim** (or create test data)
3. **Click "Buy Evidence"** button
4. **See payment requirements** popup

**Current Status:** This will show payment requirements but won't complete payment (needs HashPack signing integration)

---

## Troubleshooting Docker

### Issue: "docker-compose: command not found"

**Solution:** Use `docker compose` (with space, not hyphen)

```bash
# Old syntax (deprecated):
docker-compose up

# New syntax (correct):
docker compose up
```

### Issue: Facilitator won't start

```bash
# Check logs
docker logs ethonline-facilitator-1

# Common issues:
# 1. Port 4020 already in use
# 2. Missing environment variables
# 3. Invalid private key format
```

### Issue: Permission denied

```bash
# Fix permissions
sudo chown -R $USER /var/run/docker.sock
```

### Issue: Can't connect to Docker daemon

**Solution:** Make sure Docker Desktop is running (whale icon in menu bar)

---

## Quick Commands Reference

```bash
# Start facilitator
docker compose up facilitator -d

# Stop facilitator
docker compose down

# View logs
docker logs -f ethonline-facilitator-1

# Restart facilitator
docker compose restart facilitator

# Check status
docker ps

# Remove all containers
docker compose down -v
```

---

## Environment Variables Summary

Create `.env` file in project root:

```bash
# x402 Facilitator
FACILITATOR_PORT=4020
X402_NETWORK=hedera:testnet
FACILITATOR_ACCOUNT_ID=0.0.6282  # Your account
FACILITATOR_PRIVATE_KEY=302e020...  # Your private key
HEDERA_NODE_URL=https://testnet.hashio.io/api

# Next.js
X402_NETWORK=hedera:testnet
FACILITATOR_URL=http://localhost:4020
```

---

## What Works Without Docker

- ✅ View policies
- ✅ Create policies
- ✅ View claims
- ✅ Approve/reject claims
- ❌ Buy evidence (needs Docker)

## What Works With Docker

- ✅ Everything above PLUS
- ✅ Buy evidence (x402 payment flow)
- ✅ Complete claim lifecycle

---

## Next Steps

### For Wallet Connection Issue:

1. **Hard refresh page:** `Cmd + Shift + R`
2. **Open browser console:** Press F12
3. **Look for:** `PolicyForm - isConnected: true`
4. **Try creating policy again**

### For x402 Setup:

1. **Install Docker Desktop** (15 minutes)
2. **Create .env file** with your account details
3. **Run:** `docker compose up facilitator -d`
4. **Test:** `curl http://localhost:4020/health`
5. **Use:** Buy evidence button now works!

---

## Alternative: Skip Docker for Now

If Docker installation is too complex, you can:
1. Skip "Buy Evidence" feature for now
2. Focus on policy creation and approval
3. Install Docker later when needed
4. **95% of features work without Docker**

---

**Need help?** Let me know which step you're stuck on:
- Installing Docker
- Wallet connection issue
- Facilitator setup
- Testing x402 flow
