// src/utils/__tests__/dateUtils.test.ts
import { describe, it, expect } from 'vitest';
import {
    formatTime,
    toISODateString,
    generateTimeSlots,
    formatDateShort,
} from '../dateUtils';

describe('formatTime()', () => {
    it('يجب تحويل 09:00 إلى عرض صباحاً', () => {
        const result = formatTime('09:00');
        expect(result).toContain('9');
        expect(result).toContain('صباحاً');
    });

    it('يجب إرجاع --:-- للقيمة null', () => {
        expect(formatTime(null)).toBe('--:--');
    });
});

describe('toISODateString()', () => {
    it('يجب تحويل Date إلى صيغة YYYY-MM-DD', () => {
        const date = new Date(2026, 2, 8); // 8 مارس 2026
        expect(toISODateString(date)).toBe('2026-03-08');
    });
});

describe('generateTimeSlots()', () => {
    it('يجب توليد slots صحيحة للـ 30 دقيقة', () => {
        const slots = generateTimeSlots('09:00', '12:00', 30);
        expect(slots).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00', '11:30']);
    });
});



describe('formatDateShort()', () => {
    it('يجب تنسيق التاريخ بصيغة DD/MM/YYYY', () => {
        const result = formatDateShort('2026-03-08');
        expect(result).toBe('08/03/2026');
    });
});
