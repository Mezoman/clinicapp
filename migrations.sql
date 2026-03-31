-- SQL: run in Supabase SQL Editor
-- Rate limiting: max 3 pending/confirmed appointments per phone per hour
CREATE OR REPLACE FUNCTION check_booking_rate_limit(p_phone TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  recent_count INTEGER;
BEGIN
  SET search_path = public, pg_temp;
  SELECT COUNT(*) INTO recent_count
  FROM appointments a
  JOIN patients p ON p.id = a.patient_id
  WHERE p.phone = p_phone
    AND a.created_at > NOW() - INTERVAL '1 hour'
    AND a.status IN ('pending', 'confirmed');
  RETURN recent_count < 3;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION check_booking_rate_limit(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION check_booking_rate_limit(TEXT) TO authenticated;

-- SQL: run in Supabase SQL Editor (Updated for Bug #13: Normalized Insert)
CREATE OR REPLACE FUNCTION book_appointment(
  p_patient_id UUID,
  p_date DATE,
  p_time TIME,
  p_type TEXT,
  p_notes TEXT,
  p_session_id TEXT,
  p_lock_id UUID,
  p_max_daily INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_count INTEGER;
  v_appointment_id UUID;
  v_daily_number INTEGER;
BEGIN
  SET search_path = public, pg_temp;
  -- 1. Verify lock still valid and belongs to this session
  IF NOT EXISTS (
    SELECT 1 FROM slot_locks
    WHERE id = p_lock_id
      AND session_id = p_session_id
      AND expires_at > NOW()
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'lock_expired');
  END IF;

  -- 2. Check max daily appointments (with row lock)
  SELECT COUNT(*) INTO v_count
  FROM appointments
  WHERE appointment_date = p_date
    AND status IN ('pending', 'confirmed')
  FOR UPDATE;

  IF v_count >= p_max_daily THEN
    RETURN jsonb_build_object('success', false, 'error', 'day_full');
  END IF;

  -- 3. Check slot not already taken (double-check with lock)
  IF EXISTS (
    SELECT 1 FROM appointments
    WHERE appointment_date = p_date
      AND appointment_time = p_time
      AND status IN ('pending', 'confirmed')
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'slot_taken');
  END IF;

  -- 4. Insert appointment (Normalized: patient_name/phone removed as per BUG #13)
  INSERT INTO appointments (
    patient_id, 
    appointment_date, appointment_time,
    status, type, notes, booked_by
  ) VALUES (
    p_patient_id,
    p_date, p_time,
    'pending', p_type, p_notes, 'patient'
  )
  RETURNING id, daily_number INTO v_appointment_id, v_daily_number;

  -- 5. Delete the lock
  DELETE FROM slot_locks WHERE id = p_lock_id;

  RETURN jsonb_build_object(
    'success', true,
    'appointment_id', v_appointment_id,
    'daily_number', v_daily_number
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION book_appointment(UUID, DATE, TIME, TEXT, TEXT, TEXT, UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION book_appointment(UUID, DATE, TIME, TEXT, TEXT, TEXT, UUID, INTEGER) TO authenticated;

-- Bug #14: Efficient financial summary
CREATE OR REPLACE FUNCTION get_financial_summary()
RETURNS JSONB AS $$
DECLARE
  v_month_start DATE := date_trunc('month', NOW())::DATE;
  v_year_start DATE := date_trunc('year', NOW())::DATE;
  v_monthly_revenue NUMERIC;
  v_yearly_revenue NUMERIC;
  v_total_outstanding NUMERIC;
  v_pending_count INTEGER;
BEGIN
  SET search_path = public, pg_temp;
  SELECT COALESCE(SUM(total_paid), 0) INTO v_monthly_revenue FROM invoices WHERE invoice_date >= v_month_start AND status != 'cancelled';
  SELECT COALESCE(SUM(total_paid), 0) INTO v_yearly_revenue FROM invoices WHERE invoice_date >= v_year_start AND status != 'cancelled';
  SELECT COALESCE(SUM(balance), 0), COUNT(*) INTO v_total_outstanding, v_pending_count FROM invoices WHERE balance > 0 AND status != 'cancelled';

  RETURN jsonb_build_object(
    'monthlyRevenue', v_monthly_revenue,
    'yearlyRevenue', v_yearly_revenue,
    'totalOutstanding', v_total_outstanding,
    'pendingInvoices', v_pending_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION get_financial_summary() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_financial_summary() TO authenticated;

-- Bug #15: Patient financial defaults SQL
CREATE OR REPLACE FUNCTION get_patient_financial_summary(p_patient_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_visits INTEGER;
  v_total_paid NUMERIC;
  v_balance NUMERIC;
BEGIN
  SET search_path = public, pg_temp;
  SELECT COUNT(*) INTO v_total_visits FROM appointments WHERE patient_id = p_patient_id AND status != 'cancelled';
  SELECT COALESCE(SUM(total_paid), 0), COALESCE(SUM(balance), 0) INTO v_total_paid, v_balance FROM invoices WHERE patient_id = p_patient_id AND status != 'cancelled';

  RETURN jsonb_build_object(
    'totalVisits', v_total_visits,
    'totalPaid', v_total_paid,
    'balance', v_balance
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION get_patient_financial_summary(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_patient_financial_summary(UUID) TO authenticated;

-- ════════════════════════════════════════════════════
-- Phase 3: Performance Hardening
-- ════════════════════════════════════════════════════

-- Performance RPC: Consolidate 4+ dashboard queries into 1
CREATE OR REPLACE FUNCTION public.get_dashboard_kpis(p_today DATE, p_month_start DATE)
RETURNS JSONB AS $$
DECLARE
  v_today_total INTEGER;
  v_today_completed INTEGER;
  v_today_cancelled INTEGER;
  v_today_pending INTEGER;
  v_new_patients_month INTEGER;
  v_monthly_revenue NUMERIC;
  v_total_outstanding NUMERIC;
BEGIN
  SET search_path = public, pg_temp;
  -- 1. Today's Statistics
  SELECT 
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed'),
    COUNT(*) FILTER (WHERE status = 'cancelled'),
    COUNT(*) FILTER (WHERE status IN ('pending', 'confirmed'))
  INTO 
    v_today_total, v_today_completed, v_today_cancelled, v_today_pending
  FROM appointments 
  WHERE appointment_date = p_today;

  -- 2. New Patients this month
  SELECT COUNT(*) INTO v_new_patients_month
  FROM patients
  WHERE created_at >= p_month_start::TIMESTAMP;

  -- 3. Monthly Revenue
  SELECT COALESCE(SUM(total_paid), 0) INTO v_monthly_revenue
  FROM invoices
  WHERE invoice_date >= p_month_start AND status != 'cancelled';

  -- 4. Total Outstanding
  SELECT COALESCE(SUM(balance), 0) INTO v_total_outstanding
  FROM invoices
  WHERE status IN ('issued', 'partial');

  RETURN jsonb_build_object(
    'todayTotal', v_today_total,
    'todayCompleted', v_today_completed,
    'todayCancelled', v_today_cancelled,
    'todayPending', v_today_pending,
    'newPatientsMonth', v_new_patients_month,
    'monthlyRevenue', v_monthly_revenue,
    'totalOutstanding', v_total_outstanding
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.get_dashboard_kpis(DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_dashboard_kpis(DATE, DATE) TO authenticated;

-- Partial Index for active appointments (Performance optimization)
CREATE INDEX IF NOT EXISTS idx_active_appts 
ON appointments(appointment_date) 
WHERE status IN ('pending', 'confirmed');

-- ════════════════════════════════════════════════════
-- Phase 0-A: Schema Critical Fixes
-- ════════════════════════════════════════════════════

-- FIX 01: slot_locks
ALTER TABLE slot_locks ADD COLUMN IF NOT EXISTS session_id TEXT NOT NULL DEFAULT '';

-- FIX 02: appointments
ALTER TABLE appointments ALTER COLUMN patient_name DROP NOT NULL;
ALTER TABLE appointments ALTER COLUMN patient_phone DROP NOT NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booked_by TEXT DEFAULT 'patient';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS daily_number INTEGER DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 30;
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending','confirmed','completed','cancelled','no-show'));

-- FIX 03 & 10: invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE DEFAULT '';
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft','issued','partial','paid','cancelled'));

-- FIX 04: get_next_invoice_number (مفقودة كلياً)
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1000;
CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE v_year TEXT := TO_CHAR(NOW(),'YYYY'); v_num INTEGER;
BEGIN
  SET search_path = public, pg_temp;
  v_num := NEXTVAL('invoice_seq');
  RETURN v_year || '-' || LPAD(v_num::TEXT, 4, '0');
END; $$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION get_next_invoice_number() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_next_invoice_number() TO authenticated;

-- Performance Indexes (مفقودة)
CREATE INDEX IF NOT EXISTS idx_appt_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_inv_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_inv_patient ON invoices(patient_id);
-- ════════════════════════════════════════════════════
-- Phase 1 Step 2: RLS and Roles
-- ════════════════════════════════════════════════════

-- 1. Create a function to safely get the current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
  v_role text;
BEGIN
  SET search_path = public, pg_temp;
  -- We assume admin_users table links its "id" column to "auth.users.id"
  SELECT role INTO v_role 
  FROM public.admin_users 
  WHERE id = auth.uid();
  
  RETURN COALESCE(v_role, 'anon');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.get_my_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;

-- 2. Create the factory_reset_data function
CREATE OR REPLACE FUNCTION public.factory_reset_data()
RETURNS void AS $$
BEGIN
  SET search_path = public, pg_temp;
  -- Prevent executing if the caller is not a super_admin
  IF public.get_my_role() != 'super_admin' THEN
    RAISE EXCEPTION 'Access Denied: Only super_admin can perform a factory reset.';
  END IF;

  DELETE FROM public.medical_records WHERE id != '00000000-0000-0000-0000-000000000000';
  DELETE FROM public.invoices WHERE id != '00000000-0000-0000-0000-000000000000';
  DELETE FROM public.appointments WHERE id != '00000000-0000-0000-0000-000000000000';
  DELETE FROM public.patients WHERE id != '00000000-0000-0000-0000-000000000000';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.factory_reset_data() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.factory_reset_data() TO authenticated;

-- 3. Replace findOrCreatePatient logic with an RPC to hide Patients table from public read/write
CREATE OR REPLACE FUNCTION public.find_or_create_patient(p_phone TEXT, p_name TEXT)
RETURNS UUID AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  SET search_path = public, pg_temp;
  SELECT id INTO v_patient_id FROM public.patients WHERE phone = p_phone LIMIT 1;
  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (name, phone, is_active)
    VALUES (p_name, p_phone, true)
    RETURNING id INTO v_patient_id;
  END IF;
  RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.find_or_create_patient(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.find_or_create_patient(TEXT, TEXT) TO authenticated;

-- 4. Create an RPC to safely release a slot lock (since JS client can't easily set current_setting for DELETE)
CREATE OR REPLACE FUNCTION public.release_slot_lock(p_lock_id UUID, p_session_id TEXT)
RETURNS void AS $$
BEGIN
  SET search_path = public, pg_temp;
  DELETE FROM public.slot_locks 
  WHERE id = p_lock_id AND session_id = p_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.release_slot_lock(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.release_slot_lock(UUID, TEXT) TO authenticated;

-- 5. Create View for public access to booked slots
-- Drops policy on appointments later, using view instead.
CREATE OR REPLACE VIEW public.booked_slots AS
  SELECT appointment_date, appointment_time 
  FROM public.appointments
  WHERE status NOT IN ('cancelled');

GRANT SELECT ON public.booked_slots TO anon;

-- 6. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slot_locks ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS Policies

-- ► ADMIN_USERS
DROP POLICY IF EXISTS "Admins can view admin_users" ON public.admin_users;
CREATE POLICY "Admins can view admin_users" ON public.admin_users
FOR SELECT USING (auth.uid() = id OR public.get_my_role() = 'super_admin');

-- ► PATIENTS
DROP POLICY IF EXISTS "Admins full access to patients" ON public.patients;
CREATE POLICY "Admins full access to patients" ON public.patients
FOR ALL USING (public.get_my_role() IN ('admin', 'super_admin'));

-- ► APPOINTMENTS
DROP POLICY IF EXISTS "Admins full access to appointments" ON public.appointments;
CREATE POLICY "Admins full access to appointments" ON public.appointments
FOR ALL USING (public.get_my_role() IN ('admin', 'super_admin'));

-- ► MEDICAL_RECORDS & INVOICES
DROP POLICY IF EXISTS "Admins full access to medical_records" ON public.medical_records;
CREATE POLICY "Admins full access to medical_records" ON public.medical_records
FOR ALL USING (public.get_my_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins full access to invoices" ON public.invoices;
CREATE POLICY "Admins full access to invoices" ON public.invoices
FOR ALL USING (public.get_my_role() IN ('admin', 'super_admin'));

-- ► SETTINGS
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings" ON public.settings
FOR SELECT USING (true); -- Booking and Home Pages need to read clinic details/modes

DROP POLICY IF EXISTS "SuperAdmin can update settings" ON public.settings;
CREATE POLICY "SuperAdmin can update settings" ON public.settings
FOR UPDATE USING (public.get_my_role() = 'super_admin');

-- ► CLOSURES
DROP POLICY IF EXISTS "Public can view closures" ON public.closures;
CREATE POLICY "Public can view closures" ON public.closures
FOR SELECT USING (true); -- Booking page needs this

DROP POLICY IF EXISTS "Admins full access to closures" ON public.closures;
CREATE POLICY "Admins full access to closures" ON public.closures
FOR ALL USING (public.get_my_role() IN ('admin', 'super_admin'));

-- ► SLOT_LOCKS
DROP POLICY IF EXISTS "Public read slot_locks" ON public.slot_locks;
CREATE POLICY "Public read slot_locks" ON public.slot_locks
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public insert slot_locks" ON public.slot_locks;
CREATE POLICY "Public insert slot_locks" ON public.slot_locks
FOR INSERT WITH CHECK (
    session_id != '' AND
    expires_at > NOW() AND
    expires_at < NOW() + INTERVAL '15 minutes'
);

DROP POLICY IF EXISTS "Public delete own slot_locks" ON public.slot_locks;
CREATE POLICY "Public delete own slot_locks" ON public.slot_locks
FOR DELETE USING (session_id = current_setting('app.session_id', true));

-- ═══════════════════════════════════════════════
-- Audit Logs (Basic Implementation)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT ON public.audit_logs TO authenticated;

-- Issue 2: audit_logs table RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_admin_read" ON audit_logs;
CREATE POLICY "audit_admin_read" ON audit_logs
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin'));

CREATE OR REPLACE FUNCTION public.log_audit_trail(
  p_user_id UUID,
  p_user_email TEXT,
  p_user_role TEXT,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id TEXT,
  p_old_values JSONB,
  p_new_values JSONB,
  p_reason TEXT
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  SET search_path = public, pg_temp;
  INSERT INTO public.audit_logs (
    user_id,
    user_email,
    user_role,
    action,
    entity_type,
    entity_id,
    old_values,
    new_values,
    reason
  )
  VALUES (
    p_user_id,
    p_user_email,
    p_user_role,
    p_action,
    p_entity_type,
    p_entity_id,
    p_old_values,
    p_new_values,
    p_reason
  )
  RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
REVOKE ALL ON FUNCTION public.log_audit_trail(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit_trail(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, JSONB, TEXT) TO authenticated;

-- Issue 3: landing_content table RLS
ALTER TABLE landing_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_landing" ON landing_content;
CREATE POLICY "public_read_landing" ON landing_content
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "admin_write_landing" ON landing_content;
CREATE POLICY "admin_write_landing" ON landing_content
  FOR ALL TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));

-- Migration: Add tax_amount, tax_rate, and discount_reason to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_amount      NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax_rate        NUMERIC NOT NULL DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount_reason TEXT;

