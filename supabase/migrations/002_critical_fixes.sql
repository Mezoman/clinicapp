-- ════════════════════════════════════════════════════════════
-- DCMS — PHASE 0-A: Critical Schema Fixes (v2 — Fixed)
-- الإصدار: 002  |  التاريخ: 2026-03-10
-- نفّذ في Supabase SQL Editor — مرة واحدة فقط
-- ════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────
-- FIX 1: slot_locks — session_id مفقود يُعطّل كل الحجوزات
-- ─────────────────────────────────────────────────────────────
ALTER TABLE slot_locks
  ADD COLUMN IF NOT EXISTS session_id TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_slot_locks_session ON slot_locks(session_id);

-- ─────────────────────────────────────────────────────────────
-- FIX 2: appointments — أعمدة مفقودة
-- ─────────────────────────────────────────────────────────────
-- أضف status أولاً إن لم يكن موجوداً
ALTER TABLE appointments
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- أضف باقي الأعمدة المفقودة
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booked_by    TEXT    DEFAULT 'patient';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS daily_number INTEGER DEFAULT 0;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration     INTEGER DEFAULT 30;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_phone TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'examination';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reason TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS treatment_type TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS medical_record_id UUID;

-- ─────────────────────────────────────────────────────────────
-- FIX 3: appointments.status constraint — يشمل 'no-show'
-- ─────────────────────────────────────────────────────────────
ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_status_check
  CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show'));

ALTER TABLE appointments DROP CONSTRAINT IF EXISTS appointments_type_check;
ALTER TABLE appointments ADD CONSTRAINT appointments_type_check
  CHECK (type IN ('examination', 'follow-up', 're-examination', 'procedure', 'emergency'));

-- ─────────────────────────────────────────────────────────────
-- FIX 4: invoices — أعمدة مفقودة
-- ─────────────────────────────────────────────────────────────
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS invoice_number TEXT UNIQUE DEFAULT '';

-- أضف status إن لم يكن موجوداً
ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';

-- أضف باقي الأعمدة المالية المفقودة
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS subtotal       NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS discount       NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax            NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_amount   NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total_paid     NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance        NUMERIC DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date       DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS notes         TEXT;

-- ─────────────────────────────────────────────────────────────
-- FIX 5: invoices.status constraint — يشمل 'draft'
-- ─────────────────────────────────────────────────────────────
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_status_check
  CHECK (status IN ('draft', 'issued', 'partial', 'paid', 'cancelled'));

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_method_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_method_check
  CHECK (payment_method IS NULL OR payment_method IN ('cash', 'card', 'transfer', 'installment'));

-- ─────────────────────────────────────────────────────────────
-- FIX 6: get_next_invoice_number() — دالة مفقودة
-- ─────────────────────────────────────────────────────────────
CREATE SEQUENCE IF NOT EXISTS invoice_seq START 1000;

CREATE OR REPLACE FUNCTION get_next_invoice_number()
RETURNS TEXT AS $$
DECLARE
  v_year TEXT    := TO_CHAR(NOW(), 'YYYY');
  v_num  INTEGER;
BEGIN
  v_num := NEXTVAL('invoice_seq');
  RETURN v_year || '-' || LPAD(v_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─────────────────────────────────────────────────────────────
-- FIX 7: installments table — جدول الأقساط
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS installments (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id  UUID        NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  due_date    DATE        NOT NULL,
  amount      NUMERIC     NOT NULL CHECK (amount > 0),
  paid_amount NUMERIC     DEFAULT 0,
  paid_date   DATE,
  status      TEXT        DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'overdue')),
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- Performance Indexes
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_appt_date    ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appt_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appt_status  ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_inv_date     ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_inv_patient  ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_inv_status   ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_med_patient  ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_inst_invoice ON installments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_inst_status  ON installments(status);

-- ─────────────────────────────────────────────────────────────
-- ✅ تحقق — شغّل هذه الثلاثة للتأكد
-- ─────────────────────────────────────────────────────────────
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name = 'slot_locks' AND column_name = 'session_id';

-- SELECT get_next_invoice_number();

-- SELECT table_name FROM information_schema.tables
--   WHERE table_name = 'installments';
