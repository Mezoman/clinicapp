-- CMS Dashboard - Refined & Safe Content Keys Migration

-- 1. Migrate existing data to new keys if they exist and new keys are empty
DO $$ 
BEGIN
    -- Migrate hero background
    IF EXISTS (SELECT 1 FROM landing_content WHERE key = 'bg' AND section = 'hero') THEN
        INSERT INTO landing_content (id, section, key, content, type)
        SELECT gen_random_uuid(), 'hero', 'hero_image', content, 'image'
        FROM landing_content WHERE key = 'bg' AND section = 'hero'
        ON CONFLICT (section, key) DO UPDATE SET content = EXCLUDED.content WHERE landing_content.content = '';
    END IF;

    -- Migrate footer description
    IF EXISTS (SELECT 1 FROM landing_content WHERE key = 'description' AND section = 'footer') THEN
        INSERT INTO landing_content (id, section, key, content, type)
        SELECT gen_random_uuid(), 'footer', 'footer_description', content, 'text'
        FROM landing_content WHERE key = 'description' AND section = 'footer'
        ON CONFLICT (section, key) DO UPDATE SET content = EXCLUDED.content WHERE landing_content.content = '';
    END IF;
END $$;

-- 2. Insert new keys (Idempotent)
-- Hero Section
INSERT INTO landing_content (id, section, key, content, type) VALUES
  (gen_random_uuid(), 'hero', 'hero_image',    '', 'image'),
  (gen_random_uuid(), 'hero', 'hero_badge',    'خبرة أكثر من 10 سنوات', 'text')
ON CONFLICT (section, key) DO NOTHING;

-- Navbar Section
INSERT INTO landing_content (id, section, key, content, type) VALUES
  (gen_random_uuid(), 'navbar', 'nav_links',    '["الرئيسية","خدماتنا","لماذا نحن؟","تواصل معنا"]', 'json'),
  (gen_random_uuid(), 'navbar', 'nav_cta',      'احجز موعداً', 'text'),
  (gen_random_uuid(), 'navbar', 'nav_show_cta', 'true', 'boolean')
ON CONFLICT (section, key) DO NOTHING;

-- Services Section
INSERT INTO landing_content (id, section, key, content, type) VALUES
  (gen_random_uuid(), 'services', 'services_title', 'خدماتنا المتميزة', 'text'),
  (gen_random_uuid(), 'services', 'services_list',  '[]', 'json')
ON CONFLICT (section, key) DO NOTHING;

-- Why Us Section
INSERT INTO landing_content (id, section, key, content, type) VALUES
  (gen_random_uuid(), 'whyus', 'whyus_title',     'لماذا عيادة الدكتور محمد أسامة الرفاعي؟', 'text'),
  (gen_random_uuid(), 'whyus', 'equipment_image', '', 'image'),
  (gen_random_uuid(), 'whyus', 'whyus_items',     '[]', 'json')
ON CONFLICT (section, key) DO NOTHING;

-- WhatsApp Section
INSERT INTO landing_content (id, section, key, content, type) VALUES
  (gen_random_uuid(), 'whatsapp', 'whatsapp_number',      '', 'text'),
  (gen_random_uuid(), 'whatsapp', 'whatsapp_message',     'مرحباً دكتور محمد، أود الاستفسار عن...', 'text'),
  (gen_random_uuid(), 'whatsapp', 'whatsapp_button_text', 'تواصل معنا عبر واتساب', 'text'),
  (gen_random_uuid(), 'whatsapp', 'whatsapp_show_float',  'true', 'boolean')
ON CONFLICT (section, key) DO NOTHING;

-- Footer Section
INSERT INTO landing_content (id, section, key, content, type) VALUES
  (gen_random_uuid(), 'footer', 'footer_description', 'نسعى دائماً لتقديم خدمات طبية متميزة تليق بكم.', 'text'),
  (gen_random_uuid(), 'footer', 'footer_address',     'المحلة الكبرى — محافظة الغربية', 'text'),
  (gen_random_uuid(), 'footer', 'footer_phone',       '', 'text'),
  (gen_random_uuid(), 'footer', 'footer_hours',       '09:00 - 21:00', 'text'),
  (gen_random_uuid(), 'footer', 'footer_copyright',   'جميع الحقوق محفوظة', 'text'),
  (gen_random_uuid(), 'footer', 'footer_links',       '["الرئيسية","خدماتنا","لماذا نحن؟","سياسة الخصوصية"]', 'json')
ON CONFLICT (section, key) DO NOTHING;

-- Theme Colors
INSERT INTO landing_content (id, section, key, content, type) VALUES
  (gen_random_uuid(), 'theme', 'theme_primary',   '#0ea5e9', 'color'),
  (gen_random_uuid(), 'theme', 'theme_secondary', '#0f172a', 'color'),
  (gen_random_uuid(), 'theme', 'theme_accent',    '#10b981', 'color')
ON CONFLICT (section, key) DO NOTHING;
