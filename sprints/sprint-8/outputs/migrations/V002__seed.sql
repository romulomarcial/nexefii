```sql
-- V002__seed.sql
-- Seed modules, a demo tenant, admin role/user, current month partitions

-- Insert modules
INSERT INTO public.modules (id, name, version, category, created_at)
VALUES
('pms', 'Property Management', '0.1.0', 'PMS', CURRENT_TIMESTAMP),
('ems', 'Energy Management', '0.1.0', 'EMS', CURRENT_TIMESTAMP),
('bms', 'Building Mgmt', '0.1.0', 'BMS', CURRENT_TIMESTAMP),
('housekeeping', 'Housekeeping Module', '0.1.0', 'PMS', CURRENT_TIMESTAMP),
('bi', 'Business Intelligence', '0.1.0', 'COMMON', CURRENT_TIMESTAMP),
('ai', 'AI Services', '0.1.0', 'COMMON', CURRENT_TIMESTAMP)
ON CONFLICT (id) DO NOTHING;

-- Create a demo tenant
INSERT INTO public.tenants (slug, name, demo, created_at)
VALUES ('demo_001', 'Demo Tenant 001', TRUE, CURRENT_TIMESTAMP)
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO TEMP TABLE __demo_t;

-- Ensure admin role
INSERT INTO public.roles (id, name, description)
VALUES ('admin', 'Administrator', 'Tenant + Master admin') ON CONFLICT (id) DO NOTHING;

-- Create an admin user for demo tenant
DO $$
DECLARE t_id UUID;
BEGIN
  SELECT id FROM public.tenants WHERE slug = 'demo_001' INTO t_id;
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE tenant_id = t_id AND username = 'admin') THEN
    INSERT INTO public.users (tenant_id, username, email, hashed_password, created_at)
    VALUES (t_id, 'admin', 'admin@demo.local', crypt('Admin!23', gen_salt('bf')), CURRENT_TIMESTAMP);
  END IF;
  -- assign role
  INSERT INTO public.user_roles (user_id, role_id)
  SELECT u.id, 'admin' FROM public.users u WHERE u.username = 'admin' AND u.tenant_id = t_id
  ON CONFLICT DO NOTHING;
END$$;

-- Activate some tenant_modules for demo tenant
INSERT INTO public.tenant_modules (tenant_id, module_id, license_start, license_end, status)
SELECT t.id, m.id, CURRENT_TIMESTAMP, (CURRENT_TIMESTAMP + INTERVAL '1 year'), 'active'
FROM public.tenants t CROSS JOIN public.modules m WHERE t.slug = 'demo_001'
ON CONFLICT DO NOTHING;

-- Create partitions for current month explicitly
DO $$
DECLARE
  cur_month DATE := date_trunc('month', CURRENT_DATE);
  next_month DATE := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month');
  audit_name TEXT := format('audit_logs_p_%s', to_char(cur_month, 'YYYYMM'));
  metrics_name TEXT := format('usage_metrics_p_%s', to_char(cur_month, 'YYYYMM'));
BEGIN
  EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.audit_logs FOR VALUES FROM (%L) TO (%L)', audit_name, cur_month::timestamptz, next_month::timestamptz);
  EXECUTE format('CREATE TABLE IF NOT EXISTS public.%I PARTITION OF public.usage_metrics FOR VALUES FROM (%L) TO (%L)', metrics_name, cur_month::timestamptz, next_month::timestamptz);
END$$;

```
