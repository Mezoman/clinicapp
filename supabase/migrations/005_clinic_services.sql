-- Create Clinic Services Table
CREATE TABLE clinic_services (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    name_en text NOT NULL,
    icon text NOT NULL DEFAULT 'Activity',
    description text,
    default_price numeric NOT NULL DEFAULT 0,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE clinic_services ENABLE ROW LEVEL SECURITY;

-- ✅ قراءة عامة للخدمات النشطة (للعرض في CMS والموقع)
CREATE POLICY "Allow public read access to active services" ON clinic_services
    FOR SELECT USING (is_active = true);

-- ✅ قراءة كاملة للـ admins (لعرض الخدمات المعطّلة أيضاً في Settings)
CREATE POLICY "Allow admin read all services" ON clinic_services
    FOR SELECT TO authenticated
    USING (get_my_role() IN ('admin', 'super_admin'));

-- ✅ إضافة خدمات — للـ admins فقط
CREATE POLICY "Allow admin insert services" ON clinic_services
    FOR INSERT TO authenticated
    WITH CHECK (get_my_role() IN ('admin', 'super_admin'));

-- ✅ تعديل خدمات — للـ admins فقط
CREATE POLICY "Allow admin update services" ON clinic_services
    FOR UPDATE TO authenticated
    USING (get_my_role() IN ('admin', 'super_admin'));

-- ✅ حذف خدمات — للـ admins فقط
CREATE POLICY "Allow admin delete services" ON clinic_services
    FOR DELETE TO authenticated
    USING (get_my_role() IN ('admin', 'super_admin'));
