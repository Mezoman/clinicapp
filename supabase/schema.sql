-- ═══════════════════════════════════════════════
-- Dental Clinic System - Complete Schema
-- ═══════════════════════════════════════════════

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Drop existing tables to ensure clean state (Optional/Safe)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS slot_locks CASCADE;
DROP TABLE IF EXISTS daily_counters CASCADE;
DROP TABLE IF EXISTS closures CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS medical_records CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS patients CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- 3. Settings Table
CREATE TABLE settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    clinic_name TEXT DEFAULT 'عيادة الدكتور محمد أسامة الرفاعي',
    doctor_name TEXT DEFAULT 'د. محمد أسامة الرفاعي',
    phone TEXT,
    whatsapp TEXT,
    address TEXT,
    working_days INTEGER[] DEFAULT '{0,1,2,3,4,6}',
    shifts JSONB DEFAULT '{"morningStart": "10:00", "morningEnd": "14:00", "eveningStart": "17:00", "eveningEnd": "21:00", "isEnabled": true}',
    slot_duration INTEGER DEFAULT 30,
    max_daily_appointments INTEGER DEFAULT 30,
    is_booking_enabled BOOLEAN DEFAULT true,
    booking_advance_days INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT singleton_id CHECK (id = 1)
);

-- Migrations for existing database
ALTER TABLE settings ADD COLUMN IF NOT EXISTS phone TEXT DEFAULT '01XXXXXXXXX';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '01XXXXXXXXX';

-- 4. Admin Users Table (Links to auth.users)
CREATE TABLE admin_users (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    role TEXT CHECK (role IN ('super_admin', 'admin', 'receptionist')) DEFAULT 'admin',
    display_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Patients Table
CREATE TABLE patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    address TEXT,
    medical_history JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Appointments Table
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    patient_name TEXT,
    patient_phone TEXT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    type TEXT DEFAULT 'examination',
    status TEXT CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled', 'no-show')) DEFAULT 'pending',
    notes TEXT,
    booked_by TEXT DEFAULT 'patient',
    daily_number INTEGER DEFAULT 0,
    duration INTEGER DEFAULT 30,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Medical Records Table
CREATE TABLE medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    visit_date DATE DEFAULT CURRENT_DATE,
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_done TEXT,
    treatment_plan TEXT,
    teeth_chart TEXT,
    prescription TEXT,
    xray_report TEXT,
    lab_report TEXT,
    doctor_notes TEXT,
    follow_up_date DATE,
    attachments JSONB DEFAULT '[]', -- Cloudinary URLs stored here
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    patient_name TEXT, -- Added for quick access/audit
    appointment_id UUID REFERENCES appointments(id),
    invoice_number TEXT UNIQUE DEFAULT '',
    subtotal NUMERIC(10, 2) DEFAULT 0, -- Added
    discount NUMERIC(10, 2) DEFAULT 0, -- Added
    discount_reason TEXT, -- Added
    total_amount NUMERIC(10, 2) DEFAULT 0,
    total_paid NUMERIC(10, 2) DEFAULT 0,
    balance NUMERIC(10, 2) DEFAULT 0,
    status TEXT CHECK (status IN ('draft', 'issued', 'partial', 'paid', 'cancelled')) DEFAULT 'issued',
    items JSONB DEFAULT '[]',
    payments JSONB DEFAULT '[]', -- Added: List of payment objects {amount, method, date, notes}
    notes TEXT, -- Restored
    invoice_date TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Strict constraints
    CONSTRAINT positive_amounts CHECK (total_amount >= 0 AND total_paid >= 0 AND balance >= 0),
    CONSTRAINT positive_discount CHECK (discount >= 0),
    CONSTRAINT subtotal_valid CHECK (subtotal >= 0)
);

-- 9. Closures (Clinic Holidays)
CREATE TABLE closures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Daily Counters (Booking limits)
CREATE TABLE daily_counters (
    date DATE PRIMARY KEY,
    count INTEGER DEFAULT 0
);

-- 11. Slot Locks (Real-time booking prevention)
CREATE TABLE slot_locks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lock_key TEXT UNIQUE NOT NULL, -- Format: date_time
    session_id TEXT NOT NULL DEFAULT '',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════
-- 13. Installments Table (نظام الأقساط)
-- ═══════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS installments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id  UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    amount      NUMERIC(10, 2) NOT NULL,
    due_date    DATE NOT NULL,
    paid_date   DATE,
    paid        BOOLEAN DEFAULT false,
    notes       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Trigger: تحديث حالة الفاتورة تلقائياً عند دفع قسط ───
CREATE OR REPLACE FUNCTION sync_invoice_from_installments()
RETURNS TRIGGER AS $$
DECLARE
    v_total_amount    NUMERIC;
    v_total_paid      NUMERIC;
    v_new_balance     NUMERIC;
    v_new_status      TEXT;
BEGIN
    -- احسب إجمالي المدفوع من الأقساط المدفوعة فقط
    SELECT
        i.total_amount,
        COALESCE(SUM(ins.amount) FILTER (WHERE ins.paid = true), 0)
    INTO v_total_amount, v_total_paid
    FROM invoices i
    LEFT JOIN installments ins ON ins.invoice_id = i.id
    WHERE i.id = NEW.invoice_id
    GROUP BY i.total_amount;

    v_new_balance := v_total_amount - v_total_paid;

    IF v_total_paid = 0 THEN
        v_new_status := 'issued';
    ELSIF v_new_balance <= 0 THEN
        v_new_status := 'paid';
    ELSE
        v_new_status := 'partial';
    END IF;

    UPDATE invoices
    SET
        total_paid = v_total_paid,
        balance    = v_new_balance,
        status     = v_new_status,
        updated_at = NOW()
    WHERE id = NEW.invoice_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_invoice_from_installments
    AFTER INSERT OR UPDATE ON installments
    FOR EACH ROW EXECUTE PROCEDURE sync_invoice_from_installments();

-- ═══════════════════════════════════════════════
-- Performance Indexes
-- ═══════════════════════════════════════════════
CREATE INDEX IF NOT EXISTS idx_appointments_date     ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_patient  ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status   ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_invoices_patient      ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status       ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date         ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_installments_invoice  ON installments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_installments_patient  ON installments(patient_id);
CREATE INDEX IF NOT EXISTS idx_installments_due      ON installments(due_date);
CREATE INDEX IF NOT EXISTS idx_slot_locks_key        ON slot_locks(lock_key);
CREATE INDEX IF NOT EXISTS idx_slot_locks_expires    ON slot_locks(expires_at);

-- ═══════════════════════════════════════════════
-- Triggers for updated_at
-- ═══════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_installments_updated_at BEFORE UPDATE ON installments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ═══════════════════════════════════════════════
-- Initial Data
-- ═══════════════════════════════════════════════

-- Insert default settings
INSERT INTO settings (id, clinic_name, doctor_name) VALUES (1, 'عيادة الدكتور محمد أسامة الرفاعي', 'د. محمد أسامة الرفاعي') ON CONFLICT DO NOTHING;

-- ═══════════════════════════════════════════════
-- IMPORTANT: INITIAL ADMIN SETUP
-- ═══════════════════════════════════════════════
-- After creating a user in Supabase Authentication dashboard,
-- you MUST run the following SQL manually with the CORRECT UUID:

-- INSERT INTO admin_users (id, email, role, display_name)
-- VALUES ('USER_ID_FROM_AUTH', 'izatadel007@gmail.com', 'super_admin', 'د. محمد أسامة الرفاعي');

-- ═══════════════════════════════════════════════
-- 12. Landing Content Table (CMS)
-- ═══════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS landing_content (
    id TEXT PRIMARY KEY,
    section TEXT NOT NULL,
    key TEXT NOT NULL,
    content TEXT,
    type TEXT DEFAULT 'text', -- text, image, color
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(section, key)
);

-- Initial Content Seeding
INSERT INTO landing_content (id, section, key, content) VALUES
('hero_title', 'hero', 'title', 'الدكتور محمد أسامة الرفاعي'),
('hero_subtitle', 'hero', 'subtitle', 'طب وجراحة الأسنان'),
('hero_description', 'hero', 'description', 'نقدم أفضل خدمات طب الأسنان بأحدث الأجهزة والتقنيات العالمية'),
('hero_cta_booking', 'hero', 'cta_booking', 'احجز موعدك الآن'),
('hero_cta_whatsapp', 'hero', 'cta_whatsapp', 'تواصل عبر واتساب')
ON CONFLICT (id) DO NOTHING;

-- ═══════════════════════════════════════════════
-- 14. Audit System (Military Grade)
-- ═══════════════════════════════════════════════

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID, -- NULL if system action
    user_email TEXT,
    user_role TEXT,
    action TEXT NOT NULL, -- create, update, delete, login, etc.
    entity_type TEXT NOT NULL, -- patients, appointments, etc.
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON audit_logs(created_at DESC);

-- RPC for patient lookup/creation (Security Definer to bypass RLS)
CREATE OR REPLACE FUNCTION public.find_or_create_patient(p_phone TEXT, p_name TEXT)
RETURNS UUID AS $$
DECLARE
  v_patient_id UUID;
BEGIN
  SELECT id INTO v_patient_id FROM public.patients WHERE phone = p_phone LIMIT 1;
  IF v_patient_id IS NULL THEN
    INSERT INTO public.patients (name, phone, is_active)
    VALUES (p_name, p_phone, true)
    RETURNING id INTO v_patient_id;
  END IF;
  RETURN v_patient_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC for logging (Security Definer to bypass RLS for logging)
CREATE OR REPLACE FUNCTION log_audit_trail(
    p_user_id UUID,
    p_user_email TEXT,
    p_user_role TEXT,
    p_action TEXT,
    p_entity_type TEXT,
    p_entity_id UUID,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id, user_email, user_role, action, entity_type, entity_id, old_values, new_values, reason
    ) VALUES (
        p_user_id, p_user_email, p_user_role, p_action, p_entity_type, p_entity_id, p_old_values, p_new_values, p_reason
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════
-- 15. Security (Row Level Security)
-- ═══════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE closures ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE slot_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE installments ENABLE ROW LEVEL SECURITY;
ALTER TABLE landing_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Admin/Staff Policies (Authenticated Users)
-- RLS policies are managed via migrations/003_rls_policies.sql — Do NOT add policies here

-- 2. Public (Guest/Patient) Policies (Anonymous Users)
-- Limited access required for the public booking form and landing page
CREATE POLICY "Public Read Settings" ON settings FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Closures" ON closures FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Counters" ON daily_counters FOR SELECT TO anon USING (true);
CREATE POLICY "Public Read Landing" ON landing_content FOR SELECT TO anon USING (true);
CREATE POLICY "Public Insert Appointments" ON appointments FOR INSERT TO anon WITH CHECK (booked_by = 'patient');
CREATE POLICY "Public Manage Slot Locks" ON slot_locks FOR ALL TO anon USING (true);

-- FIX 1: Targeted RLS Policies for Public Booking
CREATE POLICY "Public Search Patient by Phone" 
  ON patients FOR SELECT TO anon 
  USING (true);

CREATE POLICY "Public Insert Patient on Booking" 
  ON patients FOR INSERT TO anon 
  WITH CHECK (true);

CREATE POLICY "Public Read Appointments for Slots" 
  ON appointments FOR SELECT TO anon 
  USING (true);
CREATE OR REPLACE FUNCTION public.book_appointment_safe(
    p_patient_id UUID,
    p_date DATE,
    p_time TIME,
    p_type TEXT,
    p_notes TEXT,
    p_session_id TEXT,
    p_lock_id UUID,
    p_max_daily INTEGER DEFAULT 30
)
RETURNS JSONB AS \$\$
DECLARE
    v_count INTEGER;
    v_appointment_id UUID;
    v_daily_number INTEGER;
BEGIN
    -- 1. Verify lock still valid
    IF NOT EXISTS (
        SELECT 1 FROM slot_locks
        WHERE id = p_lock_id::UUID
          AND session_id = p_session_id
          AND expires_at > NOW()
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'lock_expired',
            'appointmentId', NULL,
            'dailyNumber', NULL
        );
    END IF;

    -- 2. Check max daily
    SELECT COUNT(*) INTO v_count
    FROM appointments
    WHERE appointment_date = p_date
      AND status IN ('pending', 'confirmed')
    FOR UPDATE;

    IF v_count >= p_max_daily THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'day_full',
            'appointmentId', NULL,
            'dailyNumber', NULL
        );
    END IF;

    -- 3. Check slot conflict
    IF EXISTS (
        SELECT 1 FROM appointments
        WHERE appointment_date = p_date
          AND appointment_time = p_time
          AND status IN ('pending', 'confirmed')
    ) THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'slot_taken',
            'appointmentId', NULL,
            'dailyNumber', NULL
        );
    END IF;

    -- 4. Insert appointment
    INSERT INTO appointments (
        patient_id, appointment_date, appointment_time,
        status, type, notes, booked_by
    ) VALUES (
        p_patient_id, p_date, p_time,
        'pending', p_type, p_notes, 'patient'
    )
    RETURNING id, daily_number INTO v_appointment_id, v_daily_number;

    -- 5. Delete lock
    DELETE FROM slot_locks WHERE id = p_lock_id::UUID;

    -- NOTE: Returns camelCase keys to match frontend rpc.contract.ts
    RETURN jsonb_build_object(
        'success', true,
        'appointmentId', v_appointment_id,
        'dailyNumber', v_daily_number
    );
END;
\$\$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.book_appointment_safe TO anon;
GRANT EXECUTE ON FUNCTION public.book_appointment_safe TO authenticated;
