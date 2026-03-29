// src/application/services/__tests__/AppointmentService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AppointmentService } from '../AppointmentService';
import { appointmentRepository } from '../../../infrastructure/repositories/appointmentRepository';

// Mock Use Cases
const mockGetAppointmentsUC = { execute: vi.fn() };
const mockAdminBookUC = { execute: vi.fn() };
const mockUpdateStatusUC = { execute: vi.fn() };
const mockDeleteUC = { execute: vi.fn() };
const mockGetSlotsUC = { execute: vi.fn() };

vi.mock('../../../infrastructure/repositories/appointmentRepository', () => ({
    appointmentRepository: {
        subscribeToDay: vi.fn(),
        getAppointments: vi.fn(),
    }
}));

vi.mock('../../../utils/logger', () => ({
    logger: { error: vi.fn() }
}));

describe('AppointmentService', () => {
    let service: AppointmentService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new AppointmentService(
            mockGetAppointmentsUC as any,
            mockAdminBookUC as any,
            mockUpdateStatusUC as any,
            mockDeleteUC as any,
            mockGetSlotsUC as any
        );
    });

    it('getAppointmentsByDate() يجب أن ينفذ execute في UseCase', async () => {
        mockGetAppointmentsUC.execute.mockResolvedValue({ success: true, data: {} });
        await service.getAppointmentsByDate('2026-03-01');
        expect(mockGetAppointmentsUC.execute).toHaveBeenCalledWith('2026-03-01', 1, 50);
    });

    it('bookByAdmin() يجب أن ينفذ execute في UseCase', async () => {
        const dto = { patientName: 'Test' } as any;
        mockAdminBookUC.execute.mockResolvedValue({ success: true, data: {} });
        await service.bookByAdmin(dto);
        expect(mockAdminBookUC.execute).toHaveBeenCalledWith(dto);
    });

    it('updateStatus() يجب أن ينفذ execute في UseCase', async () => {
        mockUpdateStatusUC.execute.mockResolvedValue({ success: true, data: {} });
        await service.updateStatus('a1', 'confirmed');
        expect(mockUpdateStatusUC.execute).toHaveBeenCalledWith('a1', 'confirmed', undefined);
    });

    it('deleteAppointment() يجب أن ينفذ execute في UseCase', async () => {
        mockDeleteUC.execute.mockResolvedValue({ success: true });
        await service.deleteAppointment('a1');
        expect(mockDeleteUC.execute).toHaveBeenCalledWith('a1');
    });

    it('subscribeByDate() يجب أن ينادي repo ويستدعي الكولباك عند التغيير', () => {
        let capturedCallback: any;
        vi.mocked(appointmentRepository.subscribeToDay).mockImplementation((_date, cb) => {
            capturedCallback = cb;
            return () => { };
        });

        const callback = vi.fn();
        service.subscribeByDate('2026-03-01', callback);

        expect(appointmentRepository.subscribeToDay).toHaveBeenCalledWith('2026-03-01', expect.any(Function));

        // Simulate repo update
        capturedCallback([]);
        expect(callback).toHaveBeenCalledWith([]);
    });

    it('getAppointments() يجب أن ينجح في جلب البيانات', async () => {
        vi.mocked(appointmentRepository.getAppointments).mockResolvedValue({ appointments: [], total: 0 } as any);
        const result = await service.getAppointments({ date: '2026-03-01' });
        expect(result.success).toBe(true);
    });

    it('getAppointments() يجب أن يمسك خطأ الـ repo ويعيد failure', async () => {
        vi.mocked(appointmentRepository.getAppointments).mockRejectedValue(new Error('DB failure'));
        const result = await service.getAppointments({ date: '2026-03-01' });
        expect(result.success).toBe(false);
    });

    it('getAvailableSlots() يجب أن ينادي UseCase', async () => {
        mockGetSlotsUC.execute.mockResolvedValue({ success: true, data: [] });
        const result = await service.getAvailableSlots(new Date());
        expect(result.success).toBe(true);
    });
});
