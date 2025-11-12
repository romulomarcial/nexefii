-- Nexefii core DB schema (tenant management and shared tables)
-- Notes: Tenant-specific tables should be created inside tenant schemas. This file contains shared/core tables.

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT,
  category TEXT,
  manifest JSONB,
  license JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT,
  roles TEXT[],
  hashed_password TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT now(),
  actor_id UUID,
  tenant_id UUID,
  action TEXT NOT NULL,
  module_id TEXT,
  metadata JSONB
);

CREATE TABLE IF NOT EXISTS usage_metrics (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID,
  module_id TEXT,
  metric_key TEXT,
  metric_value DOUBLE PRECISION,
  ts TIMESTAMPTZ DEFAULT now()
);

-- Example: function to create tenant schema (Postgres)
-- CREATE SCHEMA tenant_{slug};
-- Then run tenant-specific bootstrap SQL to create module tables inside the schema.
