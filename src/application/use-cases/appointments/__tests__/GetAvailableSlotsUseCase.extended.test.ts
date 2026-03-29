// src/application/use-cases/appointments/__tests__/GetAvailableSlotsUseCase.extended.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAvailableSlotsUseCase } from '../GetAvailableSlotsUseCase';
import { settingsRepository } from '../../../../infrastructure/repositories/settingsRepository';
import { closureRepository } from '../../../../infrastructure/repositories/closureRepository';
import { appointmentRepository } from '../../../../infrastructure/repositories/appointmentRepository';

vi.mock('../../../../infrastructure/repositories/settingsRepository', () => ({
    settingsRepository: { getSettings: vi.fn() }
}));
vi.mock('../../../../infrastructure/repositories/closureRepository', () => ({
    closureRepository: { getClosures: vi.fn() }
}));
vi.mock('../../../../infrastructure/repositories/appointmentRepository', () => ({
    appointmentRepository: { getByDate: vi.fn() }
}));

const mockSettings = {
    clinicName: 'عيادة الدكتور',
    doctorName: 'د. محمد',
    phone: '01012345678',
    workingDays: [0, 1, 2, 3, 4], // الأحد للخميس
    shifts: {
        morningStart: '09:00', morningEnd: '14:00',
        eveningStart: '17:00', eveningEnd: '21:00',
        isEnabled: true
    },
    slotDuration: 30,
    maxDailyAppointments: 20,
    bookingAdvanceDays: 30,
    isBookingEnabled: true,
};

describe('GetAvailableSlotsUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(settingsRepository.getSettings).mockResolvedValue(mockSettings as any);
        vi.mocked(closureRepository.getClosures).mockResolvedValue([]);
        vi.mocked(appointmentRepository.getByDate).mockResolvedValue({ appointments: [], total: 0 } as any);
    });

    it('يجب إرجاع available: false ليوم الجمعة (يوم إجازة)', async () => {
        // 2026-03-06 = الجمعة (يوم 5)
        const friday = new Date('2026-03-06T10:00:00Z');
        const result = await getAvailableSlotsUseCase.execute(friday);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.available).toBe(false);
            expect(result.data.reason).toBe('off_day');
        }
    });

    it('يجب إرجاع available: false لتاريخ إغلاق', async () => {
        vi.mocked(closureRepository.getClosures).mockResolvedValue([
            { id: 'cls-1', startDate: '2026-03-09', endDate: '2026-03-11', reason: 'إجازة رسمية', createdAt: '' }
        ] as any);

        const monday = new Date('2026-03-09T10:00:00Z'); // الاثنين = يوم عمل لكن مغلق
        const result = await getAvailableSlotsUseCase.execute(monday);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.available).toBe(false);
            expect(result.data.reason).toBe('closed');
        }
    });

    it('يجب إرجاع available: true مع الـ bookedSlots ليوم عمل عادي', async () => {
        vi.mocked(appointmentRepository.getByDate).mockResolvedValue({
            appointments: [
                { time: '10:00' },
                { time: '10:30' },
            ],
            total: 2
        } as any);

        const sunday = new Date('2026-03-08T10:00:00Z'); // الأحد = يوم عمل
        const result = await getAvailableSlotsUseCase.execute(sunday);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.available).toBe(true);
            expect(result.data.bookedSlots).toContain('10:00');
            expect(result.data.bookedSlots).toContain('10:30');
        }
    });

    it('يجب إرجاع failure إذا فشل تحميل الإعدادات', async () => {
        vi.mocked(settingsRepository.getSettings).mockRejectedValue(new Error('DB error'));

        const result = await getAvailableSlotsUseCase.execute(new Date('2026-03-08'));
        expect(result.success).toBe(false);
    });

    it('يجب تضمين الـ settings في الاستجابة عند التوافر', async () => {
        const sunday = new Date('2026-03-08T10:00:00Z');
        const result = await getAvailableSlotsUseCase.execute(sunday);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.settings).toBeDefined();
        }
    });
});
