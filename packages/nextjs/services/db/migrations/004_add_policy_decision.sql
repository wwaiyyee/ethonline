-- Add policy decision and evidence report columns to claims table
ALTER TABLE claims ADD COLUMN policy_decision_json TEXT;
ALTER TABLE claims ADD COLUMN evidence_report_json TEXT;
