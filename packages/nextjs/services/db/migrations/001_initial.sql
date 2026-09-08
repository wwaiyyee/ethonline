CREATE TABLE IF NOT EXISTS policies (
  policy_id TEXT PRIMARY KEY,
  policyholder TEXT NOT NULL,
  data_chain_id TEXT NOT NULL,
  stablecoin_symbol TEXT NOT NULL,
  stablecoin_address TEXT NOT NULL,
  reference_pool_address TEXT NOT NULL,
  threshold_bps INTEGER NOT NULL CHECK (threshold_bps > 0 AND threshold_bps <= 10000),
  minimum_duration_minutes INTEGER NOT NULL CHECK (minimum_duration_minutes > 0),
  payout_amount_base_units TEXT NOT NULL,
  payout_token_symbol TEXT NOT NULL,
  coverage_start INTEGER NOT NULL,
  coverage_end INTEGER NOT NULL CHECK (coverage_end > coverage_start),
  max_evidence_budget_tinybar TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  resolved INTEGER NOT NULL DEFAULT 0 CHECK (resolved IN (0, 1)),
  resolution_hash TEXT,
  creation_transaction_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_policies_active_window
  ON policies (active, coverage_start, coverage_end);

CREATE TABLE IF NOT EXISTS observations (
  observation_id INTEGER PRIMARY KEY AUTOINCREMENT,
  policy_id TEXT NOT NULL REFERENCES policies(policy_id) ON DELETE CASCADE,
  observed_at INTEGER NOT NULL,
  price_usd_micros INTEGER NOT NULL CHECK (price_usd_micros >= 0),
  liquidity_usd_micros INTEGER NOT NULL CHECK (liquidity_usd_micros >= 0),
  volume_usd_micros INTEGER NOT NULL DEFAULT 0 CHECK (volume_usd_micros >= 0),
  source_block INTEGER,
  source_timestamp INTEGER,
  data_complete INTEGER NOT NULL CHECK (data_complete IN (0, 1)),
  source_name TEXT NOT NULL DEFAULT 'the-graph',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (policy_id, observed_at)
);

CREATE INDEX IF NOT EXISTS idx_observations_policy_time
  ON observations (policy_id, observed_at);

CREATE TABLE IF NOT EXISTS claims (
  claim_id TEXT PRIMARY KEY,
  policy_id TEXT NOT NULL REFERENCES policies(policy_id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  trigger_window_start INTEGER NOT NULL,
  trigger_window_end INTEGER NOT NULL,
  trigger_price_usd_micros INTEGER,
  trigger_duration_minutes INTEGER,
  agent_action TEXT,
  agent_rationale TEXT,
  decision_outcome TEXT,
  recommended_payout_amount_base_units TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_claims_policy_status
  ON claims (policy_id, status);

CREATE TABLE IF NOT EXISTS payments (
  payment_id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,
  amount_tinybar TEXT NOT NULL,
  asset TEXT NOT NULL DEFAULT '0.0.0',
  status TEXT NOT NULL,
  payment_required_json TEXT,
  transaction_id TEXT,
  facilitator_reference TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  settled_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_payments_claim_status
  ON payments (claim_id, status);

CREATE TABLE IF NOT EXISTS evidence (
  evidence_id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id TEXT NOT NULL REFERENCES claims(claim_id) ON DELETE CASCADE,
  payment_id TEXT REFERENCES payments(payment_id),
  depeg_verified INTEGER NOT NULL CHECK (depeg_verified IN (0, 1)),
  lowest_observed_price_usd_micros INTEGER NOT NULL,
  below_threshold_duration_minutes INTEGER NOT NULL,
  liquidity_change_bps INTEGER NOT NULL,
  sell_volume_multiple_bps INTEGER,
  evidence_json TEXT NOT NULL,
  graph_provenance_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_evidence_claim
  ON evidence (claim_id, created_at);

CREATE TABLE IF NOT EXISTS approvals (
  approval_id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id TEXT NOT NULL UNIQUE REFERENCES claims(claim_id) ON DELETE CASCADE,
  reviewer_account_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'REJECTED')),
  note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL DEFAULT (datetime('now'))
);
