# Railway Deployment Checklist

This checklist ensures the EdGraph application works correctly on Railway with no 502 errors.

## Critical Environment Variables

Set these in your Railway project environment variables:

### 1. Hedera Network & RPC
```bash
HEDERA_RPC_URL=https://testnet.hashio.io/api
```

### 2. PolicyRegistry Contract (REQUIRED - prevents 502 on /api/policies)
```bash
POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
NEXT_PUBLIC_POLICY_REGISTRY_ADDRESS=0xC3549920b94a795D75E6C003944943D552C46F97
POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942
NEXT_PUBLIC_POLICY_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443942
```

### 3. FileRegistry Contract (REQUIRED - prevents 502 on file operations)
```bash
FILE_REGISTRY_ADDRESS=0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9
NEXT_PUBLIC_FILE_REGISTRY_ADDRESS=0xF2cb3cfA36Bfb95E0FD855C1b41Ab19c517FcDB9
FILE_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443939
NEXT_PUBLIC_FILE_REGISTRY_HEDERA_CONTRACT_ID=0.0.10443939
```

### 4. WalletConnect (REQUIRED - for HashPack)
```bash
NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID=21ac6fe1145d5e738b642eaaef8019da
NEXT_PUBLIC_HEDERA_MAINNET_RPC_URL=https://mainnet.hashio.io/api
NEXT_PUBLIC_HEDERA_TESTNET_RPC_URL=https://testnet.hashio.io/api
```

### 5. x402 Payment Network
```bash
FACILITATOR_URL=https://edgraph-facilitator.up.railway.app
X402_NETWORK=hedera:testnet
NEXT_PUBLIC_X402_NETWORK=hedera:testnet
```

### 6. Database Path
```bash
EDGRAPH_DB_PATH=/app/.data/edgraph.sqlite
```

### 7. The Graph Configuration (Ethereum Mainnet USDC/WETH Pool)
```bash
EDGRAPH_GRAPH_ENDPOINT=https://gateway.thegraph.com/api/c71b0bd685814c60d1a641b9d0bba7b8/subgraphs/id/5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_SUBGRAPH_ID=5zvR82QoaXYFyDEKLZ9t6v9adgnptxYpKpSbxtgVENFV
EDGRAPH_GRAPH_API_KEY=c71b0bd685814c60d1a641b9d0bba7b8
EDGRAPH_GRAPH_POOL_ADDRESS=0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640
```

### 8. Token Configuration (USDC/WETH on Ethereum Mainnet)
```bash
EDGRAPH_STABLECOIN_ADDRESS=0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48
EDGRAPH_STABLECOIN_SYMBOL=USDC
EDGRAPH_QUOTE_TOKEN_ADDRESS=0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2
EDGRAPH_QUOTE_TOKEN_SYMBOL=WETH
EDGRAPH_QUOTE_TOKEN_USD_PRICE=2500
```

### 9. Monitor Configuration
```bash
EDGRAPH_MONITOR_INTERVAL_MS=30000
EDGRAPH_MONITOR_ONCE=false
```

### 10. Excluded Test Policies
```bash
EDGRAPH_EXCLUDED_POLICIES=0x723077b8a1b173adc35e5f0e7e3662fd1208212cb629f9c128551ea7168da722,0xa3c1274aadd82e4d12c8004c33fb244ca686dad4fcc8957fc5668588c11d9502,0xbc40fbf4394cd00f78fae9763b0c2c71b21ea442c42fdadc5b720537240ebac1,0xc651ee22c6951bb8b5bd29e8210fb394645a94315fe10eff2cc73de1aa75c137,0x09f1503d1dc0aa92c8047ff60ad10bc83f226d841f7be2233535a45c4857dc6a,0x39ccc3568a743c2e3584a2cdd4bc9fbb887441e5972ffdb4c0668d01208fda2b,0x3e725c190962efa56a5d0608be1cbd53ee8585df1a914010620f1bdfd307d75b,0xc1ece3a7f19f1aac90ebcd1bdc3d15465ae648cd0fa8ff6e732ca1adb2e9aa2f,0xafc70b47c8c8861f19f9c643c32afb0e3426e2ae1b07d5537afcb187a95f4872
```

### 11. Evidence Service Configuration
```bash
EDGRAPH_EVIDENCE_API_URL=http://localhost:3000/api/v1/depeg-evidence
EDGRAPH_AGENT_HBAR_BUDGET_TINYBAR=1000000
EDGRAPH_EVIDENCE_PRICE_TINYBAR=1000000
EDGRAPH_EVIDENCE_PAY_TO_ACCOUNT_ID=0.0.10426282
```

### 12. Agent Credentials (for autonomous claims processing)
```bash
EDGRAPH_AGENT_ACCOUNT_ID=0.0.10461760
EDGRAPH_AGENT_PRIVATE_KEY=0x8aa1ed7c9bfe9db6c7c13ba36db39dc6d548c1e08d978570a149c8d792752e44
```

### 13. S3/MinIO (Optional - not used in production)
```bash
S3_ENDPOINT=http://unused
S3_BUCKET=unused
S3_ACCESS_KEY_ID=unused
S3_SECRET_ACCESS_KEY=unused
S3_REGION=us-east-1
S3_FORCE_PATH_STYLE=true
```

## Common 502 Error Causes & Solutions

### Error: "Dashboard API unavailable" on EdGraph Monitor page

**Cause**: Missing PolicyRegistry contract address environment variables

**Solution**: Add all variables from section #2 above

### Error: "Failed to fetch policies" on Policies page

**Cause**: Missing PolicyRegistry contract address environment variables

**Solution**: Add all variables from section #2 above

### Error: "Failed to fetch claims" on Claims page

**Cause**: Missing PolicyRegistry contract address environment variables

**Solution**: Add all variables from section #2 above

### Error: HashPack connection shows "Open" button that doesn't work

**Cause**: Desktop browser cannot launch mobile deep links

**Solution**: 
1. Install HashPack browser extension (recommended)
2. Or use HashPack mobile app with QR code
3. See HASHPACK_CONNECTION_GUIDE.md for detailed instructions

## Deployment Steps

1. **Set Environment Variables**
   - Go to Railway project > Settings > Variables
   - Add all variables listed above
   - Click "Deploy" to apply changes

2. **Verify Deployment**
   - Check deployment logs for errors
   - Visit `/api/policies` - should return JSON with policies
   - Visit `/api/claims` - should return JSON with claims
   - Visit `/api/edgraph` - should return JSON with graph data
   - Visit `/edgraph-monitor` - should show "LIVE GRAPH DATA" without errors

3. **Test Frontend**
   - Visit the main application
   - Check that all pages load without 502 errors
   - Test HashPack connection (use browser extension or mobile app)

## Important Notes

- **NEXT_PUBLIC_*** variables are embedded at build time
- Changing **NEXT_PUBLIC_*** variables requires a rebuild/redeploy
- Other variables can be changed without rebuild
- The PolicyRegistry and FileRegistry addresses are for Hedera Testnet
- For Mainnet deployment, use different contract addresses

## Troubleshooting

### If APIs still return 502 after setting variables:

1. Check Railway logs for specific error messages
2. Verify the HEDERA_RPC_URL is accessible from Railway
3. Ensure contract addresses are correct for the network
4. Rebuild the application (variables with NEXT_PUBLIC_ prefix require rebuild)

### If HashPack connection still fails:

1. Check that NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID is set
2. Verify the project ID is valid at https://cloud.reown.com/
3. Use HashPack browser extension instead of mobile deep link
4. See HASHPACK_CONNECTION_GUIDE.md for alternative connection methods
