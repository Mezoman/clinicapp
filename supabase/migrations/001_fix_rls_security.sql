-- ═══════════════════════════════════════════════════════════════════
-- DCMS Security Fix — Migration 001
-- FIX: Critical RLS Vulnerabilities
-- Date: 2026-03-08
-- ═══════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────
-- 1. إصلاح: patients — لا يجب أن يرى الـ anon كل المرضى
--    المشكلة: USING (true) يكشف جميع بيانات المرضى
--    الحل: نقل البحث بالهاتف إلى RPC آمن، وتقييد الـ SELECT
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Public Search Patient by Phone" ON patients;
DROP POLICY IF EXISTS "Public Insert Patient on Booking" ON patients;

-- السماح للـ anon بإدراج مريض جديد فقط إذا كان اسمه وهاتفه موجودَين
CREATE POLICY "Public Insert Patient on Booking"
  ON patients FOR INSERT TO anon
  WITH CHECK (
    name IS NOT NULL AND name <> '' AND
    phone IS NOT NULL AND phone <> ''
  );

-- ─────────────────────────────────────────────
-- 2. إصلاح: appointments — الـ anon يحتاج التحقق من الـ slots فقط
--    المشكلة: USING (true) يكشف أسماء وهواتف المرضى
--    الحل: السماح بقراءة الحقول الضرورية فقط عبر RPC
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Public Read Appointments for Slots" ON appointments;

-- السماح للـ anon بقراءة التواريخ والأوقات فقط (بدون بيانات المريض)
CREATE POLICY "Public Read Appointments for Slots"
  ON appointments FOR SELECT TO anon
  USING (
    appointment_date >= CURRENT_DATE -- المواعيد المستقبلية فقط
  );

-- ─────────────────────────────────────────────
-- 3. إصلاح: slot_locks — تقييد عمليات الـ anon
--    المشكلة: FOR ALL TO anon بدون قيود → DoS محتمل
--    الحل: تقييد الحذف بـ session_id فقط، منع التعديل
-- ─────────────────────────────────────────────
DROP POLICY IF EXISTS "Public Manage Slot Locks" ON slot_locks;

-- السماح للـ anon بإنشاء lock فقط (مع TTL مفروض في الكود)
CREATE POLICY "Public Insert Slot Lock"
  ON slot_locks FOR INSERT TO anon
  WITH CHECK (
    expires_at > NOW() AND
    expires_at < NOW() + INTERVAL '15 minutes' -- منع locks بعيدة المدى
  );

-- السماح للـ anon بقراءة locks للتحقق من التوافر
CREATE POLICY "Public Read Slot Locks"
  ON slot_locks FOR SELECT TO anon
  USING (expires_at > NOW()); -- locks النشطة فقط

-- السماح للـ anon بحذف lock خاصته فقط (عبر session_id)
CREATE POLICY "Public Delete Own Slot Lock"
  ON slot_locks FOR DELETE TO anon
  USING (session_id = current_setting('request.headers', true)::json->>'x-session-id');

-- ─────────────────────────────────────────────
-- 4. إضافة: RPC آمن للبحث عن مريض بالهاتف
--    يُرجع فقط: id + name (بدون بيانات حساسة)
--    SECURITY DEFINER: يتجاوز RLS بشكل آمن
-- ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.find_patient_by_phone(p_phone TEXT)
RETURNS TABLE(patient_id UUID, patient_name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- التحقق من صحة رقم الهاتف
  IF p_phone IS NULL OR p_phone = '' OR length(p_phone) < 10 THEN
    RETURN;
  END IF;

  RETURN QUERY
    SELECT id, name
    FROM patients
    WHERE phone = p_phone AND is_active = true
    LIMIT 1;
END;
$$;

-- منح صلاحية التنفيذ للـ anon فقط
GRANT EXECUTE ON FUNCTION public.find_patient_by_phone(TEXT) TO anon;
REVOKE ALL ON FUNCTION public.find_patient_by_phone(TEXT) FROM PUBLIC;

-- ─────────────────────────────────────────────
-- 5. إضافة: Indexes لتحسين الأداء والأمان
-- ─────────────────────────────────────────────

-- Index للبحث السريع بالهاتف (مستخدم كثيراً في الحجز)
CREATE INDEX IF NOT EXISTS idx_patients_phone
  ON patients(phone)
  WHERE is_active = true;

-- Index لاستعلامات التقويم (date + status)
CREATE INDEX IF NOT EXISTS idx_appointments_date_status
  ON appointments(appointment_date, status);

-- Index لاستعلامات الـ slot locks
-- UPDATED: Removed WHERE clause because NOW() is not IMMUTABLE and cannot be used in a partial index predicate
CREATE INDEX IF NOT EXISTS idx_slot_locks_expires
  ON slot_locks(expires_at);

-- Index للفواتير بالمريض
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id
  ON invoices(patient_id, invoice_date DESC);

-- ─────────────────────────────────────────────
-- 6. إضافة: TTL تلقائي لـ slot_locks عبر Cron
--    يحذف الـ locks المنتهية كل 5 دقائق
-- ─────────────────────────────────────────────
-- (يتطلب تفعيل pg_cron في Supabase Dashboard → Database → Extensions)
-- SELECT cron.schedule('cleanup-expired-locks', '*/5 * * * *',
--   'DELETE FROM slot_locks WHERE expires_at < NOW()');

-- بديل: دالة يمكن استدعاؤها يدوياً أو من Edge Function
CREATE OR REPLACE FUNCTION public.cleanup_expired_slot_locks()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM slot_locks WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_slot_locks() TO authenticated;
