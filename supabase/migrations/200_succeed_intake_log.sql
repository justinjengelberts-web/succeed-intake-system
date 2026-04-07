-- Pipeline logging table for the Succeed Intake System
-- Every step of the pipeline logs input/output/duration here for full traceability.

CREATE TABLE IF NOT EXISTS succeed_intake_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enquiry_id UUID NOT NULL,
  step TEXT NOT NULL,
  input JSONB,
  output JSONB,
  duration_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_intake_log_enquiry ON succeed_intake_log(enquiry_id);
CREATE INDEX IF NOT EXISTS idx_intake_log_step ON succeed_intake_log(step);
