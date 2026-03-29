// src/domain/logic/__tests__/BookingRules.extended.test.ts
import { describe, it, expect } from 'vitest';
import { BookingRules } from '../bookingRules';

const baseSettings: any = {
    workingDays: [0, 1, 2, 3, 4], // الأحد - الخميس
    clinicName: 'عيادة',
    doctorName: 'دكتور',
    phone: '01012345678',
    shifts: {
        morningStart: '09:00', morningEnd: '14:00',
        eveningStart: '17:00', eveningEnd: '21:00',
        isEnabled: true
    },
    slotDuration: 30,
    maxDailyAppointments: 20,
    bookingAdvanceDays: 30,
    isBookingEnabled: true
};

describe('BookingRules.isWorkingDay() — حالات حافة', () => {
    it('يجب قبول الأحد (0) كيوم عمل', () => {
        const sunday = new Date('2026-03-08T10:00:00'); // الأحد
        expect(BookingRules.isWorkingDay(sunday, baseSettings)).toBe(true);
    });

    it('يجب رفض السبت (6) كيوم إجازة', () => {
        const saturday = new Date('2026-03-07T10:00:00'); // السبت
        expect(BookingRules.isWorkingDay(saturday, baseSettings)).toBe(false);
    });

    it('يجب رفض الجمعة (5) كيوم إجازة', () => {
        const friday = new Date('2026-03-06T10:00:00'); // الجمعة
        expect(BookingRules.isWorkingDay(friday, baseSettings)).toBe(false);
    });

    it('يجب دعم جداول عمل مختلفة (5 أيام فقط)', () => {
        const customSettings = { ...baseSettings, workingDays: [1, 2, 3, 4, 5] }; // إثنين - جمعة
        const friday = new Date('2026-03-06T10:00:00'); // الجمعة (5)
        expect(BookingRules.isWorkingDay(friday, customSettings)).toBe(true);

        const sunday = new Date('2026-03-08T10:00:00'); // الأحد (0)
        expect(BookingRules.isWorkingDay(sunday, customSettings)).toBe(false);
    });

    it('يجب دعم العمل 7 أيام في الأسبوع', () => {
        const allDays = { ...baseSettings, workingDays: [0, 1, 2, 3, 4, 5, 6] };
        const friday = new Date('2026-03-06T10:00:00');
        const saturday = new Date('2026-03-07T10:00:00');
        expect(BookingRules.isWorkingDay(friday, allDays)).toBe(true);
        expect(BookingRules.isWorkingDay(saturday, allDays)).toBe(true);
    });
});

describe('BookingRules.isDateClosed() — حالات حافة', () => {
    const closures: any[] = [
        { id: 'c1', startDate: '2026-03-10', endDate: '2026-03-15', reason: 'إجازة' }
    ];

    it('يجب رفض تاريخ في بداية فترة الإغلاق (inclusive)', () => {
        expect(BookingRules.isDateClosed(new Date('2026-03-10'), closures)).toBe(true);
    });

    it('يجب رفض تاريخ في نهاية فترة الإغلاق (inclusive)', () => {
        expect(BookingRules.isDateClosed(new Date('2026-03-15'), closures)).toBe(true);
    });

    it('يجب قبول تاريخ قبل فترة الإغلاق', () => {
        expect(BookingRules.isDateClosed(new Date('2026-03-09'), closures)).toBe(false);
    });

    it('يجب قبول تاريخ بعد فترة الإغلاق', () => {
        expect(BookingRules.isDateClosed(new Date('2026-03-16'), closures)).toBe(false);
    });

    it('يجب إرجاع false للقائمة الفارغة', () => {
        expect(BookingRules.isDateClosed(new Date('2026-03-10'), [])).toBe(false);
    });

    it('يجب دعم فترات إغلاق متعددة', () => {
        const multiClosures: any[] = [
            { id: 'c1', startDate: '2026-03-10', endDate: '2026-03-12', reason: 'أولى' },
            { id: 'c2', startDate: '2026-04-01', endDate: '2026-04-05', reason: 'ثانية' }
        ];
        expect(BookingRules.isDateClosed(new Date('2026-03-11'), multiClosures)).toBe(true);
        expect(BookingRules.isDateClosed(new Date('2026-04-03'), multiClosures)).toBe(true);
        expect(BookingRules.isDateClosed(new Date('2026-03-20'), multiClosures)).toBe(false);
    });

    it('يجب دعم إغلاق يوم واحد (startDate = endDate)', () => {
        const singleDay: any[] = [
            { id: 'c1', startDate: '2026-03-25', endDate: '2026-03-25', reason: 'عطلة' }
        ];
        expect(BookingRules.isDateClosed(new Date('2026-03-25'), singleDay)).toBe(true);
        expect(BookingRules.isDateClosed(new Date('2026-03-24'), singleDay)).toBe(false);
    });
});

describe('BookingRules.isTimeInShift()', () => {
    it('يجب قبول الوقت في منتصف الوردية', () => {
        expect(BookingRules.isTimeInShift('11:00', { start: '09:00', end: '14:00' })).toBe(true);
    });

    it('يجب قبول وقت البداية (inclusive)', () => {
        expect(BookingRules.isTimeInShift('09:00', { start: '09:00', end: '14:00' })).toBe(true);
    });

    it('يجب رفض وقت ما بعد النهاية', () => {
        expect(BookingRules.isTimeInShift('14:01', { start: '09:00', end: '14:00' })).toBe(false);
    });

    it('يجب رفض وقت قبل البداية', () => {
        expect(BookingRules.isTimeInShift('08:59', { start: '09:00', end: '14:00' })).toBe(false);
    });

    it('يجب دعم وردية المساء', () => {
        expect(BookingRules.isTimeInShift('18:30', { start: '17:00', end: '21:00' })).toBe(true);
        expect(BookingRules.isTimeInShift('21:30', { start: '17:00', end: '21:00' })).toBe(false);
    });
});
