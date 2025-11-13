-- Migration V006: ai_insight_logs
CREATE TABLE IF NOT EXISTS public.ai_insight_logs (
  id SERIAL PRIMARY KEY,
  property_id TEXT NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()
);
