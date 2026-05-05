-- =============================================================
-- ENABLE ROW LEVEL SECURITY — BRRRR App
-- Run this in: Supabase Dashboard → SQL Editor
-- =============================================================

-- ── STEP 1: Enable RLS on all tables ──────────────────────────
ALTER TABLE properties          ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials          ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenants             ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses            ENABLE ROW LEVEL SECURITY;
ALTER TABLE rehab_items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractors         ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders           ENABLE ROW LEVEL SECURITY;

-- ── STEP 2: Drop any old policies before recreating ───────────
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT policyname, tablename FROM pg_policies
           WHERE schemaname = 'public'
             AND tablename IN ('properties','financials','tenants','payments',
                               'expenses','rehab_items','maintenance_requests',
                               'contractors','project_milestones','documents','reminders')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- =============================================================
-- PROPERTIES  (has user_id)
-- =============================================================
-- Landlord: full access to their own properties
CREATE POLICY "owner_all_properties" ON properties
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tenant: can read the property they rent (needed for tenant portal join)
CREATE POLICY "tenant_select_property" ON properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants
      WHERE tenants.property_id = properties.id
        AND tenants.email       = auth.email()
        AND tenants.status      = 'active'
    )
  );

-- =============================================================
-- FINANCIALS  (no user_id — linked via property_id)
-- =============================================================
CREATE POLICY "owner_all_financials" ON financials
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = financials.property_id
              AND properties.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = financials.property_id
              AND properties.user_id = auth.uid())
  );

-- =============================================================
-- TENANTS  (no user_id — linked via property_id)
-- =============================================================
-- Landlord: full access to tenants in their properties
CREATE POLICY "owner_all_tenants" ON tenants
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = tenants.property_id
              AND properties.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = tenants.property_id
              AND properties.user_id = auth.uid())
  );

-- Tenant: can read their own tenant record (tenant portal login)
CREATE POLICY "tenant_select_own_record" ON tenants
  FOR SELECT USING (email = auth.email());

-- =============================================================
-- PAYMENTS  (has user_id)
-- =============================================================
-- Landlord: full access
CREATE POLICY "owner_all_payments" ON payments
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tenant: can read their own payment history
CREATE POLICY "tenant_select_payments" ON payments
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE email = auth.email() AND status = 'active'
    )
  );

-- =============================================================
-- EXPENSES  (has user_id)
-- =============================================================
CREATE POLICY "owner_all_expenses" ON expenses
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================
-- REHAB ITEMS  (no user_id — linked via property_id)
-- =============================================================
CREATE POLICY "owner_all_rehab_items" ON rehab_items
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = rehab_items.property_id
              AND properties.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = rehab_items.property_id
              AND properties.user_id = auth.uid())
  );

-- =============================================================
-- MAINTENANCE REQUESTS  (has user_id)
-- =============================================================
-- Landlord: full access
CREATE POLICY "owner_all_maintenance" ON maintenance_requests
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Tenant: can read their own requests (tenant portal)
-- Note: tenant SUBMISSIONS use the service client, so no INSERT policy needed here
CREATE POLICY "tenant_select_maintenance" ON maintenance_requests
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM tenants
      WHERE email = auth.email() AND status = 'active'
    )
  );

-- =============================================================
-- CONTRACTORS
-- If your contractors table has user_id, this policy works as-is.
-- If it doesn't (linked only via maintenance_requests), replace with
-- an EXISTS subquery like rehab_items above.
-- =============================================================
CREATE POLICY "owner_all_contractors" ON contractors
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================================
-- PROJECT MILESTONES  (linked via property_id)
-- =============================================================
CREATE POLICY "owner_all_milestones" ON project_milestones
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = project_milestones.property_id
              AND properties.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = project_milestones.property_id
              AND properties.user_id = auth.uid())
  );

-- =============================================================
-- DOCUMENTS  (linked via property_id)
-- =============================================================
CREATE POLICY "owner_all_documents" ON documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = documents.property_id
              AND properties.user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM properties
            WHERE properties.id = documents.property_id
              AND properties.user_id = auth.uid())
  );

-- =============================================================
-- REMINDERS  (has user_id)
-- =============================================================
CREATE POLICY "owner_all_reminders" ON reminders
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
