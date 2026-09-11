#!/bin/bash

# Test x402 Payment Flow - Step by Step

echo "════════════════════════════════════════════════════════════════"
echo "  x402 Payment Flow Test Guide"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Step 1: Check facilitator is running
echo "Step 1: Check facilitator health..."
curl -s http://localhost:4020/health | jq .
echo ""

# Step 2: Check supported payment schemes
echo "Step 2: Check supported schemes..."
curl -s http://localhost:4020/supported | jq .
echo ""

# Step 3: Request evidence WITHOUT payment (expect 402)
echo "Step 3: Request evidence without payment (should return 402)..."
echo ""
curl -i "http://localhost:3000/api/v1/depeg-evidence?claimId=test-claim-123" 2>&1 | head -20
echo ""

echo "════════════════════════════════════════════════════════════════"
echo "  Expected Results:"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "1. Facilitator health: {\"status\":\"ok\"}"
echo "2. Supported schemes: {\"schemes\":[\"exact-hedera\"], \"feePayer\":\"0.0.xxxxx\"}"
echo "3. Evidence request: HTTP/1.1 402 Payment Required"
echo "   with PAYMENT-REQUIRED header and payment requirements in body"
echo ""
echo "If you see these results, x402 is working correctly!"
echo ""
echo "════════════════════════════════════════════════════════════════"
