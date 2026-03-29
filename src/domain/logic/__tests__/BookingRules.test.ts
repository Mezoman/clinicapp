import { describe, it, expect } from 'vitest';
import { BookingRules } from '../bookingRules';

describe('BookingRules', () => {
    describe('isWorkingDay()', () => {
        const dummySettings = {
            workingDays: [0, 1, 2, 3, 4], // Sun to Thu
            clinicName: 'Test',
            doctorName: 'Test',
            phone: '123',
            shifts: { morningStart: '08:00', morningEnd: '14:00', eveningStart: '16:00', eveningEnd: '21:00', isEnabled: true },
            slotDuration: 30,
            maxDailyAppointments: 20,
            bookingAdvanceDays: 30,
            isBookingEnabled: true
        } as any;

        it('should return true for a day present in workingDays', () => {
            // 2024-01-01 is Monday (1)
            const monday = new Date('2024-01-01T10:00:00Z');
            expect(BookingRules.isWorkingDay(monday, dummySettings)).toBe(true);
        });

        it('should return false for a day not present in workingDays', () => {
            // 2024-01-05 is Friday (5)
            const friday = new Date('2024-01-05T10:00:00Z');
            expect(BookingRules.isWorkingDay(friday, dummySettings)).toBe(false);
        });
    });

    describe('isDateClosed()', () => {
        const closures: any[] = [
            {
                startDate: '2024-02-10',
                endDate: '2024-02-15',
                reason: 'holiday' as any
            }
        ];

        it('should return true for a date inside closure range', () => {
            const dateInside = new Date('2024-02-12T10:00:00Z');
            expect(BookingRules.isDateClosed(dateInside, closures)).toBe(true);
        });

        it('should return false for a date outside closure range', () => {
            const dateOutside = new Date('2024-02-20T10:00:00Z');
            expect(BookingRules.isDateClosed(dateOutside, closures)).toBe(false);
        });
    });

    describe('isTimeInShift()', () => {
        const shift = { start: '08:00', end: '14:00' };

        it('should return true for time within shift', () => {
            expect(BookingRules.isTimeInShift('09:00', shift)).toBe(true);
        });

        it('should return false for time outside shift', () => {
            expect(BookingRules.isTimeInShift('15:00', shift)).toBe(false);
        });
    });
});
