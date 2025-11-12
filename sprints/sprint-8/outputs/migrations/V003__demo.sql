```sql
-- V003__demo.sql
-- Create a demo tenant schema and sample tenant-level tables (rooms, reservations, guests)

DO $$
DECLARE
  tenant_slug TEXT := 'demo_001';
  schema_name TEXT;
  t_id UUID;
BEGIN
  SELECT id INTO t_id FROM public.tenants WHERE slug = tenant_slug;
  IF t_id IS NULL THEN
    RAISE EXCEPTION 'Tenant % not found', tenant_slug;
  END IF;
  schema_name := public.ensure_tenant_schema(tenant_slug);

  -- Create example tenant tables
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.rooms (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), number TEXT, name TEXT, created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP)', schema_name);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.guests (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, email TEXT)', schema_name);
  EXECUTE format('CREATE TABLE IF NOT EXISTS %I.reservations (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), room_id UUID REFERENCES %I.rooms(id) ON DELETE CASCADE, guest_id UUID REFERENCES %I.guests(id) ON DELETE SET NULL, start_ts TIMESTAMPTZ, end_ts TIMESTAMPTZ, status TEXT)', schema_name, schema_name, schema_name);

  -- Seed sample data
  EXECUTE format('INSERT INTO %I.rooms (number, name) VALUES (''101'',''Room 101''),(''102'',''Room 102'') ON CONFLICT DO NOTHING', schema_name);
  EXECUTE format('INSERT INTO %I.guests (name, email) VALUES (''John Demo'',''john@example.com'') ON CONFLICT DO NOTHING', schema_name);

  -- Add a fake_data_jobs entry to trigger periodic refresh
  INSERT INTO public.fake_data_jobs (demo_property_id, interval_seconds, status)
  VALUES (
    (SELECT dp.id FROM public.demo_properties dp WHERE dp.tenant_id = t_id LIMIT 1),
    300,
    'scheduled'
  ) ON CONFLICT DO NOTHING;
END$$;

```
