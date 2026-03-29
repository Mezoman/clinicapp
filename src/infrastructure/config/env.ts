import { z } from 'zod';


const envSchema = z.object({
    // Supabase
    VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
    VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),

    // Cloudinary
    VITE_CLOUDINARY_CLOUD_NAME: z.string().min(1, 'VITE_CLOUDINARY_CLOUD_NAME is required'),
    VITE_CLOUDINARY_UPLOAD_PRESET: z.string().min(1, 'VITE_CLOUDINARY_UPLOAD_PRESET is required'),

    // Phase 0-B: بيانات العيادة (لا hardcode في الكود)
    // Relaxed validation to allow any string (placeholders or real numbers) to prevent app crashes
    VITE_CLINIC_PHONE: z.string().optional(),
    VITE_CLINIC_WHATSAPP: z.string().optional(),

    // Sentry (اختياري)
    VITE_SENTRY_DSN: z.string().url().optional(),
});

export function validateEnv() {
    const rawData = {
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
        VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        VITE_CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        VITE_CLINIC_PHONE: import.meta.env.VITE_CLINIC_PHONE,
        VITE_CLINIC_WHATSAPP: import.meta.env.VITE_CLINIC_WHATSAPP,
        VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    };

    const result = envSchema.safeParse(rawData);

    if (!result.success) {
        const errors = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('\n');
        
        // Final Safety: Only THROW on missing fundamental keys (Supabase/Cloudinary)
        // Log warnings for others to avoid crashing the whole UI for just a phone number
        const criticalFields = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY', 'VITE_CLOUDINARY_CLOUD_NAME', 'VITE_CLOUDINARY_UPLOAD_PRESET'];
        const hasCriticalError = result.error.issues.some(issue => criticalFields.includes(issue.path[0] as string));

        if (hasCriticalError) {
            throw new Error(`❌ Critical environment variables missing/broken:\n${errors}`);
        } else {
            console.warn(`⚠️ Non-critical env variables invalid:\n${errors}`);
            // Return what we have
            return rawData as ValidatedEnv;
        }
    }

    return result.data;
}

export const env = validateEnv();

export type ValidatedEnv = z.infer<typeof envSchema>;
