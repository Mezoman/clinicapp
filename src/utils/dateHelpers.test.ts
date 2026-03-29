import { describe, it, expect } from 'vitest';
import { toISODateString, formatTime } from './dateUtils';

describe('Date Utilities', () => {
    it('should correctly convert Date object to ISO Date String (yyyy-MM-dd)', () => {
        const testDate = new Date('2026-02-23T12:00:00Z');
        expect(toISODateString(testDate)).toBe('2026-02-23');
    });

    it('should format time and return a non-empty string', () => {
        const result = formatTime('14:30');
        expect(result).toBeTruthy();
        expect(typeof result).toBe('string');
    });
});
