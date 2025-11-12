```sql
-- V001__init.sql
-- Nexefii core public schema and partitioned audit/metrics
-- UTF-8

-- Extensions (pgcrypto for UUIDs and crypt if available)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- tenants: master registry
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  demo BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);
ALTER TABLE public.tenants
  RENAME CONSTRAINT tenants_pkey TO pk_tenants;

-- modules registry
CREATE TABLE IF NOT EXISTS public.modules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  version TEXT,
  category TEXT,
  manifest JSONB,
  license JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.modules RENAME CONSTRAINT modules_pkey TO pk_modules;

-- tenant_modules linking table
CREATE TABLE IF NOT EXISTS public.tenant_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL,
  module_id TEXT NOT NULL,
  license_start TIMESTAMPTZ,
  license_end TIMESTAMPTZ,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB,
  CONSTRAINT fk_tenant_modules__tenants FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE,
  CONSTRAINT fk_tenant_modules__modules FOREIGN KEY (module_id) REFERENCES public.modules(id) ON DELETE RESTRICT
);
ALTER TABLE public.tenant_modules RENAME CONSTRAINT tenant_modules_pkey TO pk_tenant_modules;

-- users (stored in public for master-level users; tenant users may be stored in tenant schema if preferred)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  email TEXT,
  hashed_password TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  metadata JSONB
);
ALTER TABLE public.users RENAME CONSTRAINT users_pkey TO pk_users;

-- roles and user_roles
CREATE TABLE IF NOT EXISTS public.roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);
ALTER TABLE public.roles RENAME CONSTRAINT roles_pkey TO pk_roles;

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID NOT NULL,
  role_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_roles__users FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles__roles FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_roles__user_role ON public.user_roles(user_id, role_id);

-- role_claims (permissions/claims attached to roles)
CREATE TABLE IF NOT EXISTS public.role_claims (
  id BIGSERIAL PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES public.roles(id) ON DELETE CASCADE,
  claim_key TEXT NOT NULL,
  claim_value TEXT
);
ALTER TABLE public.role_claims RENAME CONSTRAINT role_claims_pkey TO pk_role_claims;

-- demo_properties and fake_data_jobs
CREATE TABLE IF NOT EXISTS public.demo_properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE public.demo_properties RENAME CONSTRAINT demo_properties_pkey TO pk_demo_properties;

CREATE TABLE IF NOT EXISTS public.fake_data_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_property_id UUID REFERENCES public.demo_properties(id) ON DELETE CASCADE,
  interval_seconds INT DEFAULT 300,
  last_run TIMESTAMPTZ,
  status TEXT DEFAULT 'idle',
  metadata JSONB
);
ALTER TABLE public.fake_data_jobs RENAME CONSTRAINT fake_data_jobs_pkey TO pk_fake_data_jobs;

-- Partitioned audit_logs: parent
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actor_id UUID,
  tenant_id UUID,
  entity TEXT,
  action TEXT,
  payload JSONB
) PARTITION BY RANGE (occurred_at);
ALTER TABLE public.audit_logs RENAME CONSTRAINT audit_logs_pkey TO pk_audit_logs;

-- Partitioned usage_metrics: parent
CREATE TABLE IF NOT EXISTS public.usage_metrics (
  id BIGSERIAL PRIMARY KEY,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  metric TEXT NOT NULL,
  value DOUBLE PRECISION,
  tenant_id UUID
) PARTITION BY RANGE (period_start);
ALTER TABLE public.usage_metrics RENAME CONSTRAINT usage_metrics_pkey TO pk_usage_metrics;

-- helper function: ensure_tenant_schema
CREATE OR REPLACE FUNCTION public.ensure_tenant_schema(tenant_slug TEXT) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  schema_name TEXT := 'tenant_' || replace(lower(tenant_slug), '-', '_');
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = schema_name) THEN
    EXECUTE format('CREATE SCHEMA IF NOT EXISTS %I', schema_name);
  END IF;
  RETURN schema_name;
END;
$$;

-- helper: rotate_partitions (creates next month's partitions for audit_logs and usage_metrics)
CREATE OR REPLACE FUNCTION public.rotate_partitions() RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
  next_mon DATE := date_trunc('month', CURRENT_DATE) + INTERVAL '1 month';
  next_mon_end DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '2 month');
  name_audit TEXT := format('audit_logs_p_%s', to_char(next_mon, 'YYYYMM'));
  name_metrics TEXT := format('usage_metrics_p_%s', to_char(next_mon, 'YYYYMM'));
BEGIN
  -- audit_logs partition
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = name_audit) THEN
    EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.audit_logs FOR VALUES FROM (%L) TO (%L)',
      name_audit, next_mon::timestamptz, next_mon_end::timestamptz);
  END IF;
  -- usage_metrics partition
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = name_metrics) THEN
    EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.usage_metrics FOR VALUES FROM (%L) TO (%L)',
      name_metrics, next_mon::timestamptz, next_mon_end::timestamptz);
  END IF;
END;
$$;

-- helper: upsert_metric
CREATE OR REPLACE FUNCTION public.upsert_metric(p_tenant UUID, p_metric TEXT, p_period_start TIMESTAMPTZ, p_period_end TIMESTAMPTZ, p_value DOUBLE PRECISION)
RETURNS VOID LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO public.usage_metrics (period_start, period_end, metric, value, tenant_id)
  VALUES (p_period_start, p_period_end, p_metric, p_value, p_tenant);
END;
$$;

-- Create current month partitions immediately
SELECT public.rotate_partitions();

-- Index recommendations
CREATE INDEX IF NOT EXISTS idx_audit_logs__occurred_at ON public.audit_logs (occurred_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs__tenant ON public.audit_logs (tenant_id);
CREATE INDEX IF NOT EXISTS idx_usage_metrics__period_start ON public.usage_metrics (period_start);
CREATE INDEX IF NOT EXISTS idx_usage_metrics__tenant ON public.usage_metrics (tenant_id);

```
