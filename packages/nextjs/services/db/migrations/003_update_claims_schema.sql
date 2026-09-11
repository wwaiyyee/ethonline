-- Add missing columns to claims table for agent workflow
ALTER TABLE claims ADD COLUMN detected_at INTEGER;
ALTER TABLE claims ADD COLUMN lowest_price_usd_micros INTEGER;
ALTER TABLE claims ADD COLUMN duration_minutes INTEGER;
ALTER TABLE claims ADD COLUMN decision_confidence TEXT;
ALTER TABLE claims ADD COLUMN decision_reasoning TEXT;
ALTER TABLE claims ADD COLUMN decision_recommended_payout TEXT;
ALTER TABLE claims ADD COLUMN decision_evaluated_at INTEGER;
ALTER TABLE claims ADD COLUMN last_agent_action TEXT;
ALTER TABLE claims ADD COLUMN evidence_file_ids TEXT;
ALTER TABLE claims ADD COLUMN approved_at INTEGER;
ALTER TABLE claims ADD COLUMN rejected_at INTEGER;
ALTER TABLE claims ADD COLUMN resolution_transaction_id TEXT;
ALTER TABLE claims ADD COLUMN notes TEXT;

-- Migrate existing data from old columns to new columns
UPDATE claims SET detected_at = CAST(strftime('%s', created_at) AS INTEGER) WHERE detected_at IS NULL;
UPDATE claims SET lowest_price_usd_micros = trigger_price_usd_micros WHERE lowest_price_usd_micros IS NULL;
UPDATE claims SET duration_minutes = trigger_duration_minutes WHERE duration_minutes IS NULL;
UPDATE claims SET last_agent_action = agent_action WHERE last_agent_action IS NULL;
UPDATE claims SET decision_reasoning = agent_rationale WHERE decision_reasoning IS NULL;
UPDATE claims SET decision_recommended_payout = recommended_payout_amount_base_units WHERE decision_recommended_payout IS NULL;
