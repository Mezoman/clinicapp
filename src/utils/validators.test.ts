import { describe, it, expect } from 'vitest';
import {
    isValidEgyptianPhone,
    isValidEmail,
    isValidDate,
    isValidTime,
    isPositiveNumber,
    isNonNegativeNumber,
    validatePatientForm,
    validateBookingForm,
} from './validators';

describe('isValidEgyptianPhone()', () => {
    it('يجب قبول أرقام مصرية صحيحة', () => {
        expect(isValidEgyptianPhone('01012345678')).toBe(true);
        expect(isValidEgyptianPhone('01112345678')).toBe(true);
        expect(isValidEgyptianPhone('01212345678')).toBe(true);
        expect(isValidEgyptianPhone('01512345678')).toBe(true);
    });

    it('يجب رفض الأرقام غير الصحيحة', () => {
        expect(isValidEgyptianPhone('0201012345678')).toBe(false); // مع كود الدولة
        expect(isValidEgyptianPhone('1234567890')).toBe(false);    // 10 أرقام
        expect(isValidEgyptianPhone('0901234567')).toBe(false);    // لا يبدأ بـ 01
        expect(isValidEgyptianPhone('')).toBe(false);
        expect(isValidEgyptianPhone('abc')).toBe(false);
    });

    it('يجب تنظيف المدخل قبل التحقق', () => {
        expect(isValidEgyptianPhone('<script>01012345678</script>')).toBe(false);
    });
});

describe('isValidEmail()', () => {
    it('يجب قبول بريد إلكتروني صحيح', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
        expect(isValidEmail('doctor@clinic.eg')).toBe(true);
        expect(isValidEmail('user+tag@domain.co.uk')).toBe(true);
    });

    it('يجب رفض البريد الإلكتروني غير الصحيح', () => {
        expect(isValidEmail('notanemail')).toBe(false);
        expect(isValidEmail('@domain.com')).toBe(false);
        expect(isValidEmail('user@')).toBe(false);
        expect(isValidEmail('')).toBe(false);
    });
});

describe('isValidDate()', () => {
    it('يجب قبول التاريخ بصيغة YYYY-MM-DD', () => {
        expect(isValidDate('2026-03-08')).toBe(true);
        expect(isValidDate('2000-01-01')).toBe(true);
    });

    it('يجب رفض صيغ التاريخ غير الصحيحة', () => {
        expect(isValidDate('08-03-2026')).toBe(false);  // DD-MM-YYYY
        expect(isValidDate('2026/03/08')).toBe(false);  // بشرطة مائلة
        expect(isValidDate('not-a-date')).toBe(false);
        expect(isValidDate('')).toBe(false);
    });
});

describe('isValidTime()', () => {
    it('يجب قبول الوقت بصيغة HH:MM', () => {
        expect(isValidTime('09:00')).toBe(true);
        expect(isValidTime('23:59')).toBe(true);
        expect(isValidTime('00:00')).toBe(true);
        expect(isValidTime('9:30')).toBe(true);
    });

    it('يجب رفض صيغ الوقت غير الصحيحة', () => {
        expect(isValidTime('25:00')).toBe(false);  // ساعة غير موجودة
        expect(isValidTime('09:60')).toBe(false);  // دقيقة غير موجودة
        expect(isValidTime('9am')).toBe(false);
        expect(isValidTime('')).toBe(false);
    });
});

describe('isPositiveNumber() + isNonNegativeNumber()', () => {
    it('isPositiveNumber يقبل فقط الأرقام الموجبة', () => {
        expect(isPositiveNumber(1)).toBe(true);
        expect(isPositiveNumber(0.5)).toBe(true);
        expect(isPositiveNumber(0)).toBe(false);
        expect(isPositiveNumber(-1)).toBe(false);
        expect(isPositiveNumber(Infinity)).toBe(false);
    });

    it('isNonNegativeNumber يقبل الصفر والأرقام الموجبة', () => {
        expect(isNonNegativeNumber(0)).toBe(true);
        expect(isNonNegativeNumber(100)).toBe(true);
        expect(isNonNegativeNumber(-1)).toBe(false);
    });
});

describe('validatePatientForm()', () => {
    it('يجب اجتياز النموذج الصحيح', () => {
        const result = validatePatientForm({
            fullName: 'محمد أحمد',
            phone: '01012345678',
        });
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
    });

    it('يجب إرجاع خطأ للاسم القصير', () => {
        const result = validatePatientForm({
            fullName: 'م',
            phone: '01012345678',
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'fullName')).toBe(true);
    });

    it('يجب إرجاع خطأ لرقم الهاتف الخاطئ', () => {
        const result = validatePatientForm({
            fullName: 'محمد أحمد',
            phone: '123',
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'phone')).toBe(true);
    });

    it('يجب إرجاع خطأ لبريد إلكتروني خاطئ (إذا أُدخل)', () => {
        const result = validatePatientForm({
            fullName: 'محمد أحمد',
            phone: '01012345678',
            email: 'not-valid',
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'email')).toBe(true);
    });

    it('يجب قبول البريد الإلكتروني الصحيح', () => {
        const result = validatePatientForm({
            fullName: 'محمد أحمد',
            phone: '01012345678',
            email: 'mohamed@clinic.eg',
        });
        expect(result.isValid).toBe(true);
    });
});

describe('validateBookingForm()', () => {
    it('يجب اجتياز نموذج الحجز الصحيح', () => {
        const result = validateBookingForm({
            patientName: 'محمد أحمد',
            patientPhone: '01012345678',
            date: '2026-12-01',
            time: '10:00',
        });
        expect(result.isValid).toBe(true);
    });

    it('يجب رفض نموذج الحجز بمعلومات ناقصة', () => {
        const result = validateBookingForm({
            patientName: '',
            patientPhone: '01012345678',
            date: '2026-12-01',
            time: '10:00',
        });
        expect(result.isValid).toBe(false);
        expect(result.errors.some(e => e.field === 'patientName')).toBe(true);
    });
});
