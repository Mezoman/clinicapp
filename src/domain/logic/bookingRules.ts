import type { ClinicSettings, Closure } from '../models/auth';

/**
 * Handles business rules for booking availability.
 */
export class BookingRules {
    static isWorkingDay(date: Date, settings: ClinicSettings): boolean {
        const day = date.getDay(); // 0 (Sun) - 6 (Sat)
        return settings.workingDays.includes(day);
    }

    static isDateClosed(date: Date, closures: Closure[]): boolean {
        const dateStr = date.toISOString().split('T')[0] || '';
        return closures.some(closure => {
            return dateStr >= closure.startDate && dateStr <= closure.endDate;
        });
    }

    static isTimeInShift(time: string, shifts: { start: string, end: string }): boolean {
        return time >= shifts.start && time <= shifts.end;
    }
}
