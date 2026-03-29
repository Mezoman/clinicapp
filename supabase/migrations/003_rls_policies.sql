-- ════════════════════════════════════════════════════════════
-- DCMS — PHASE 1: Row Level Security (RLS) — تنفيذ كامل
-- الإصدار: 003  |  التاريخ: 2026-03-10
-- نفّذ في Supabase SQL Editor — مرة واحدة فقط
-- ════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- Helper Function: get_my_role()
-- ─────────────────────────────────────────────────────────────
-- إصلاح الخلل المذكور: تأكد أولاً من وجود عمود is_active
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT role FROM admin_users
  WHERE id = auth.uid() AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─────────────────────────────────────────────────────────────
-- ① patients — بيانات المرضى (admin + super_admin فقط)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patients_admin_all" ON patients;
CREATE POLICY "patients_admin_all" ON patients
  FOR ALL TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────
-- ② appointments — المواعيد (staff للقراءة/التعديل، anon عبر RPC)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_staff_all" ON appointments;
CREATE POLICY "appointments_staff_all" ON appointments
  FOR ALL TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin', 'receptionist'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin', 'receptionist'));

-- ─────────────────────────────────────────────────────────────
-- ③ medical_records — السجلات الطبية (admin + super_admin)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "records_admin_all" ON medical_records;
CREATE POLICY "records_admin_all" ON medical_records
  FOR ALL TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────
-- ④ invoices — الفواتير (admin + super_admin)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoices_admin_all" ON invoices;
CREATE POLICY "invoices_admin_all" ON invoices
  FOR ALL TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────
-- ⑤ installments — الأقساط (admin + super_admin)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "installments_admin_all" ON installments;
CREATE POLICY "installments_admin_all" ON installments
  FOR ALL TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────
-- ⑥ admin_users — مستخدمو النظام
-- ─────────────────────────────────────────────────────────────
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_self_read" ON admin_users;
CREATE POLICY "admin_users_self_read" ON admin_users
  FOR SELECT TO authenticated
  USING (id = auth.uid());

DROP POLICY IF EXISTS "admin_users_super_manage" ON admin_users;
CREATE POLICY "admin_users_super_manage" ON admin_users
  FOR ALL TO authenticated
  USING (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────
-- ⑦ settings — إعدادات العيادة (قراءة عامة، كتابة super_admin)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "settings_public_read" ON settings;
CREATE POLICY "settings_public_read" ON settings
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "settings_super_write" ON settings;
CREATE POLICY "settings_super_write" ON settings
  FOR ALL TO authenticated
  USING (get_my_role() = 'super_admin')
  WITH CHECK (get_my_role() = 'super_admin');

-- ─────────────────────────────────────────────────────────────
-- ⑧ landing_content — محتوى CMS (قراءة عامة، كتابة admin+)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE landing_content ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "content_public_read" ON landing_content;
CREATE POLICY "content_public_read" ON landing_content
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "content_admin_write" ON landing_content;
CREATE POLICY "content_admin_write" ON landing_content
  FOR ALL TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────
-- ⑨ slot_locks — قفل المواعيد (مفتوح للجميع — ضروري للحجز)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE slot_locks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "slot_locks_open" ON slot_locks;
CREATE POLICY "slot_locks_open" ON slot_locks
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (expires_at > NOW() AND expires_at < NOW() + INTERVAL '15 minutes');
-- ─────────────────────────────────────────────────────────────
-- ⑩ closures — أيام الإغلاق (قراءة عامة، كتابة admin+)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE closures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "closures_public_read" ON closures;
CREATE POLICY "closures_public_read" ON closures
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "closures_admin_write" ON closures;
CREATE POLICY "closures_admin_write" ON closures
  FOR ALL TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin'))
  WITH CHECK (get_my_role() IN ('admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────
-- ⑪ audit_logs — سجل النّظام (admin + super_admin)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_admin_read" ON audit_logs;
CREATE POLICY "audit_logs_admin_read" ON audit_logs
  FOR SELECT TO authenticated
  USING (get_my_role() IN ('admin', 'super_admin'));

-- ─────────────────────────────────────────────────────────────
-- factory_reset_data() — مسح كامل (super_admin فقط)
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION factory_reset_data()
RETURNS VOID AS $$
BEGIN
  IF get_my_role() != 'super_admin' THEN
    RAISE EXCEPTION 'Unauthorized: super_admin only — factory reset denied';
  END IF;
  DELETE FROM installments;
  DELETE FROM medical_records;
  DELETE FROM invoices;
  DELETE FROM appointments;
  DELETE FROM patients;
  DELETE FROM slot_locks;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- ✅ تحقق من RLS — شغّل هذه من anon role
-- يجب أن تعود بـ 0 نتائج أو خطأ permission denied
-- ─────────────────────────────────────────────────────────────
-- SELECT * FROM patients LIMIT 1;        -- يجب: 0 نتائج أو خطأ
-- SELECT * FROM invoices LIMIT 1;        -- يجب: 0 نتائج أو خطأ
-- SELECT * FROM medical_records LIMIT 1; -- يجب: 0 نتائج أو خطأ
-- SELECT * FROM settings LIMIT 1;        -- يجب: نتيجة (قراءة مسموح)
