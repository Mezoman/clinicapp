import { z } from 'zod';

// Egyptian phone regex: 01X XXXXXXXXX (11 digits starting with 01)
const egyptianPhone = z.string().regex(/^01[0-9]{9}$/, 'يجب أن يكون رقم مصري صحيح (01XXXXXXXXX)');

const envSchema = z.object({
    // Supabase
    VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL must be a valid URL'),
    VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY is required'),

    // Cloudinary
    VITE_CLOUDINARY_CLOUD_NAME: z.string().min(1, 'VITE_CLOUDINARY_CLOUD_NAME is required'),
    VITE_CLOUDINARY_UPLOAD_PRESET: z.string().min(1, 'VITE_CLOUDINARY_UPLOAD_PRESET is required'),

    // Phase 0-B: بيانات العيادة (لا hardcode في الكود)
    VITE_CLINIC_PHONE: egyptianPhone.optional().or(z.literal('01XXXXXXXXX')),
    VITE_CLINIC_WHATSAPP: egyptianPhone.optional().or(z.literal('01XXXXXXXXX')),

    // Sentry (اختياري)
    VITE_SENTRY_DSN: z.string().url().optional(),
});

export function validateEnv() {
    const result = envSchema.safeParse({
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
        VITE_CLOUDINARY_CLOUD_NAME: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        VITE_CLOUDINARY_UPLOAD_PRESET: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        VITE_CLINIC_PHONE: import.meta.env.VITE_CLINIC_PHONE,
        VITE_CLINIC_WHATSAPP: import.meta.env.VITE_CLINIC_WHATSAPP,
        VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
    });

    if (!result.success) {
        const errors = result.error.issues
            .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
            .join('\n');
        throw new Error(`❌ Invalid environment variables:\n${errors}`);
    }

    return result.data;
}

export const env = validateEnv();

export type ValidatedEnv = z.infer<typeof envSchema>;
