CREATE UNIQUE INDEX IF NOT EXISTS idx_evidence_payment
  ON evidence (payment_id)
  WHERE payment_id IS NOT NULL;
