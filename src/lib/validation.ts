import { z } from 'zod';
import DOMPurify from 'dompurify';

/**
 * Sanitizes a string using DOMPurify to prevent XSS.
 * Useful for strings that might be rendered as HTML or just general input cleaning.
 */
export function sanitize(input: string): string {
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [], // No tags allowed by default
        ALLOWED_ATTR: [], // No attributes allowed by default
    });
}

/**
 * Common regex and schemas
 */
const phoneRegex = /^01[0125][0-9]{8}$/; // Egyptian mobile format
const nationalIdRegex = /^[23][0-9]{13}$/; // Egyptian National ID format

export const commonSchemas = {
    phone: z.string().regex(phoneRegex, 'رقم هاتف غير صالح (يجب أن يبدأ بـ 01 ومكون من 11 رقم)'),
    nationalId: z.string().regex(nationalIdRegex, 'رقم قومي غير صالح (14 رقم)').optional().or(z.literal('')),
    name: z.string().min(3, 'الاسم يجب أن يكون 3 أحرف على الأقل').max(100),
    email: z.string().email('بريد إلكتروني غير صالح').optional().or(z.literal('')),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'تاريخ غير صالح (YYYY-MM-DD)'),
    time: z.string().regex(/^\d{2}:\d{2}$/, 'توقيت غير صالح (HH:MM)'),
};

/**
 * Patient Schema
 */
export const patientSchema = z.object({
    fullName: commonSchemas.name,
    phone: commonSchemas.phone,
    nationalId: commonSchemas.nationalId,
    email: commonSchemas.email,
    gender: z.enum(['male', 'female']),
    birthDate: z.string().optional().or(z.literal('')),
    address: z.string().max(200).optional().or(z.literal('')),
    bloodType: z.string().optional().or(z.literal('')),
    allergies: z.string().max(500).optional().or(z.literal('')),
    chronicDiseases: z.string().max(500).optional().or(z.literal('')),
    currentMedications: z.string().max(500).optional().or(z.literal('')),
    notes: z.string().max(1000).optional().or(z.literal('')),
});

/**
 * Appointment Schema
 */
export const appointmentSchema = z.object({
    patientId: z.string().uuid('ID المريض غير صالح'),
    date: commonSchemas.date,
    time: commonSchemas.time,
    type: z.enum(['examination', 'follow_up', 'surgery', 'emergency', 'consultation']),
    notes: z.string().max(500).optional().or(z.literal('')),
});

/**
 * Generic Validation Helper
 */
export function validateData<T>(schema: z.Schema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
    const result = schema.safeParse(data);
    if (result.success) {
        return { success: true, data: result.data };
    }
    return {
        success: false,
        errors: result.error.issues.map(err => err.message),
    };
}
