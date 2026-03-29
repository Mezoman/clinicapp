// src/utils/__tests__/validators.test.ts
import { describe, it, expect } from 'vitest';
import {
    isValidEgyptianPhone,
    isValidEmail,
    isValidDate,
    isValidTime,
    validatePatientForm,
    validateBookingForm,
} from '../validators';

describe('isValidEgyptianPhone()', () => {
    it('يجب قبول أرقام مصرية صحيحة', () => {
        expect(isValidEgyptianPhone('01012345678')).toBe(true);
        expect(isValidEgyptianPhone('01112345678')).toBe(true);
    });

    it('يجب رفض الأرقام غير الصحيحة', () => {
        expect(isValidEgyptianPhone('1234567890')).toBe(false);
        expect(isValidEgyptianPhone('abc')).toBe(false);
    });
});

describe('isValidEmail()', () => {
    it('يجب قبول بريد إلكتروني صحيح', () => {
        expect(isValidEmail('test@example.com')).toBe(true);
    });

    it('يجب رفض البريد الإلكتروني غير الصحيح', () => {
        expect(isValidEmail('notanemail')).toBe(false);
    });
});

describe('isValidDate()', () => {
    it('يجب قبول التاريخ بصيغة YYYY-MM-DD', () => {
        expect(isValidDate('2026-03-08')).toBe(true);
    });
});

describe('isValidTime()', () => {
    it('يجب قبول الوقت بصيغة HH:MM', () => {
        expect(isValidTime('09:00')).toBe(true);
        expect(isValidTime('23:59')).toBe(true);
    });
});

describe('validatePatientForm()', () => {
    it('يجب اجتياز النموذج الصحيح', () => {
        const result = validatePatientForm({
            fullName: 'محمد أحمد',
            phone: '01012345678',
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
});
