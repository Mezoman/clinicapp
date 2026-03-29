import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvailableSlotsUseCase } from '../GetAvailableSlotsUseCase';
import { settingsRepository } from '../../../../infrastructure/repositories/settingsRepository';
import { closureRepository } from '../../../../infrastructure/repositories/closureRepository';
import { appointmentRepository } from '../../../../infrastructure/repositories/appointmentRepository';
import { BookingRules } from '../../../../domain/logic/bookingRules';

vi.mock('../../../../infrastructure/repositories/settingsRepository');
vi.mock('../../../../infrastructure/repositories/closureRepository');
vi.mock('../../../../infrastructure/repositories/appointmentRepository');
vi.mock('../../../../domain/logic/bookingRules');

describe('GetAvailableSlotsUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return available: false with reason "off_day" if it is an off day', async () => {
        vi.mocked(settingsRepository.getSettings).mockResolvedValue({} as any);
        vi.mocked(closureRepository.getClosures).mockResolvedValue([] as any);
        vi.mocked(BookingRules.isWorkingDay).mockReturnValue(false);

        const result = await getAvailableSlotsUseCase.execute(new Date('2026-03-01'));

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.available).toBe(false);
            expect(result.data.reason).toBe('off_day');
        }
    });

    it('should return available: false with reason "closed" if the date is within a closure', async () => {
        vi.mocked(settingsRepository.getSettings).mockResolvedValue({} as any);
        vi.mocked(closureRepository.getClosures).mockResolvedValue([] as any);
        vi.mocked(BookingRules.isWorkingDay).mockReturnValue(true);
        vi.mocked(BookingRules.isDateClosed).mockReturnValue(true);

        const result = await getAvailableSlotsUseCase.execute(new Date('2026-03-02'));

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.available).toBe(false);
            expect(result.data.reason).toBe('closed');
        }
    });

    it('should return available: true and booked slots if it is a normal working day', async () => {
        vi.mocked(settingsRepository.getSettings).mockResolvedValue({} as any);
        vi.mocked(closureRepository.getClosures).mockResolvedValue([] as any);
        vi.mocked(BookingRules.isWorkingDay).mockReturnValue(true);
        vi.mocked(BookingRules.isDateClosed).mockReturnValue(false);
        vi.mocked(appointmentRepository.getByDate).mockResolvedValue({
            appointments: [
                { time: '10:00' },
                { time: '11:00' }
            ],
            total: 2
        } as any);

        const date = new Date('2026-03-03T00:00:00.000Z');
        const result = await getAvailableSlotsUseCase.execute(date);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.available).toBe(true);
            expect(result.data.bookedSlots).toEqual(['10:00', '11:00']);
        }
    });

    it('should return failure with proper message if an exception occurs', async () => {
        vi.mocked(settingsRepository.getSettings).mockRejectedValue(new Error('Network error'));

        const result = await getAvailableSlotsUseCase.execute(new Date('2026-03-01'));

        expect(result.success).toBe(false);
        expect(result.error).toBe('فشل في التحقق من المواعيد المتاحة');
    });
});
