# Public EdGraph Deployment

The submission deployment must expose the Next.js Evidence API publicly and keep SQLite on persistent storage. A small VPS, Railway, Render, Fly.io, or another Docker host is suitable.

Required public checks:

```bash
curl -i https://YOUR_HOST/api/health
curl -i -X POST https://YOUR_HOST/api/v1/depeg-evidence \
  -H 'content-type: application/json' \
  -d '{"policyId":"...","claimId":"..."}'
```

The health endpoint should report `status: ok`, a configured live Graph provider, `hedera:testnet`, and the facilitator URL. The Evidence API should return `402` before payment and return a settled evidence response only after the Blocky402 facilitator confirms the HBAR transfer.

## Persistence

Set `EDGRAPH_DB_PATH` to a mounted persistent path such as `/data/edgraph.sqlite`. Do not use an ephemeral filesystem for the submission service: policy mirrors, observations, payments, and evidence are part of the demo proof.

## Environment

Use the variables in [`packages/nextjs/.env.example`](../packages/nextjs/.env.example), including a real Graph provider endpoint/subgraph, Base pool and token addresses, public Evidence API URL, HBAR payment recipient, and facilitator URL. Keep `FACILITATOR_PRIVATE_KEY` in the facilitator service only.

