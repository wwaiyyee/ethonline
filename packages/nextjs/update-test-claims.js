const { getDb, closeDb } = require('./services/db/client.ts');

const db = getDb();

// Update the first claim with more complete data
db.prepare(`
  UPDATE claims
  SET
    lowest_price_usd_micros = 970000,
    duration_minutes = 35,
    decision_outcome = 'ELIGIBLE_RECOMMENDATION',
    decision_confidence = 'HIGH',
    decision_reasoning = 'USDC depegged below 0.97 threshold for 35 minutes, exceeding the 30-minute minimum duration requirement. Price dropped to $0.970 at lowest point. Liquidity remained stable during the event.',
    decision_recommended_payout = '1000000000000000000',
    decision_evaluated_at = 1788977000,
    last_agent_action = 'EVALUATED_CLAIM',
    evidence_file_ids = '[]',
    notes = 'Automated depeg detection triggered by EdGraph monitor'
  WHERE claim_id = 'claim-test-policy-usdc-1-1788976831'
`).run();

// Update the second claim
db.prepare(`
  UPDATE claims
  SET
    detected_at = 1789153591,
    lowest_price_usd_micros = 985000,
    duration_minutes = 15,
    last_agent_action = 'MONITORING',
    notes = 'Short depeg event - monitoring for extension'
  WHERE claim_id = 'claim-0x4dee2485a9c74c0d8cd0d5726d999f717df042d30764ff84385059cf5eea0430-1789153591'
`).run();

console.log('Claims updated successfully');
closeDb();
