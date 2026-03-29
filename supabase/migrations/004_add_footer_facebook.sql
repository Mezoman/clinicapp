-- Add footer_facebook key to landing_content table
-- This ensures the Facebook URL field is available in the CMS

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.landing_content WHERE key = 'footer_facebook') THEN
        INSERT INTO public.landing_content (id, section, key, content, type)
        VALUES (gen_random_uuid(), 'footer', 'footer_facebook', '', 'url');
    END IF;
END $$;
