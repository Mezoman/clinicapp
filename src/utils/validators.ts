// ═══════════════════════════════════════════════
// Validators
// ═══════════════════════════════════════════════
import DOMPurify from 'dompurify';

/**
 * FIXED: استخدام DOMPurify بدلاً من regex — حماية كاملة من XSS
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';
    // DOMPurify يزيل كل HTML/XSS بشكل آمن — أفضل من regex
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],
        ALLOWED_ATTR: [],
    }).trim();
}

/**
 * Validate Egyptian phone number (01XXXXXXXXX — 11 digits)
 */
export function isValidEgyptianPhone(phone: string): boolean {
    if (!phone) return false;
    // We allow spaces but NOT script tags or other junk
    const trimmed = phone.trim();
    return /^01[0125]\d{8}$/.test(trimmed);
}


/**
 * Validate Egyptian National ID (14 digits)
 */
export function isValidNationalId(id: string): boolean {
    return /^\d{14}$/.test(sanitizeInput(id));
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
    // Simplified email regex to avoid catastrophic backtracking and SonarJS warnings
    return /^\S+@\S+\.\S+$/.test(sanitizeInput(email));
}

/**
 * Validate required string field
 */
export function isNotEmpty(value: string): boolean {
    return sanitizeInput(value).length > 0;
}

/**
 * Validate minimum length
 */
export function hasMinLength(value: string, min: number): boolean {
    return sanitizeInput(value).length >= min;
}

/**
 * Validate time format (HH:MM)
 */
export function isValidTime(time: string): boolean {
    return /^([01]?\d|2[0-3]):[0-5]\d$/.test(sanitizeInput(time));
}

/**
 * Validate date format (YYYY-MM-DD)
 */
export function isValidDate(dateStr: string): boolean {
    const sanitized = sanitizeInput(dateStr);
    const date = new Date(sanitized);
    return !isNaN(date.getTime()) && /^\d{4}-\d{2}-\d{2}$/.test(sanitized);
}

/**
 * Validate a positive number
 */
export function isPositiveNumber(value: number): boolean {
    return typeof value === 'number' && value > 0 && isFinite(value);
}

/**
 * Validate non-negative number (zero or positive)
 */
export function isNonNegativeNumber(value: number): boolean {
    return typeof value === 'number' && value >= 0 && isFinite(value);
}

// ═══════════════════════════════════════════════
// Validation Result Type
// ═══════════════════════════════════════════════

export interface ValidationError {
    field: string;
    message: string;
}

export interface ValidationResult {
    isValid: boolean;
    errors: ValidationError[];
}

/**
 * Validate patient form data
 */
export function validatePatientForm(data: {
    fullName: string;
    phone: string;
    nationalId?: string;
    email?: string;
}): ValidationResult {
    const errors: ValidationError[] = [];

    if (!hasMinLength(data.fullName, 2)) {
        errors.push({ field: 'fullName', message: 'الاسم يجب أن يكون حرفين على الأقل' });
    }

    if (!isValidEgyptianPhone(data.phone)) {
        errors.push({ field: 'phone', message: 'رقم الهاتف غير صحيح — يجب أن يكون 01XXXXXXXXX' });
    }

    if (data.nationalId && !isValidNationalId(data.nationalId)) {
        errors.push({ field: 'nationalId', message: 'الرقم القومي يجب أن يكون 14 رقماً' });
    }

    if (data.email && !isValidEmail(data.email)) {
        errors.push({ field: 'email', message: 'البريد الإلكتروني غير صحيح' });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Validate booking form data
 */
export function validateBookingForm(data: {
    patientName: string;
    patientPhone: string;
    date: string;
    time: string;
}): ValidationResult {
    const errors: ValidationError[] = [];

    if (!hasMinLength(data.patientName, 2)) {
        errors.push({ field: 'patientName', message: 'الاسم يجب أن يكون حرفين على الأقل' });
    }

    if (!isValidEgyptianPhone(data.patientPhone)) {
        errors.push({ field: 'patientPhone', message: 'رقم الهاتف غير صحيح — يجب أن يكون 01XXXXXXXXX' });
    }

    if (!isValidDate(data.date)) {
        errors.push({ field: 'date', message: 'التاريخ غير صحيح' });
    }

    if (!isValidTime(data.time)) {
        errors.push({ field: 'time', message: 'الوقت غير صحيح' });
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}