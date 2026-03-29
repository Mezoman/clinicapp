import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateAppointmentStatusUseCase } from '../UpdateAppointmentStatusUseCase';
import { appointmentRepository } from '../../../../infrastructure/repositories/appointmentRepository';
import { DomainError } from '../../../../domain/errors';

vi.mock('../../../../infrastructure/repositories/appointmentRepository')
vi.mock('../../../../infrastructure/unit-of-work/SupabaseUnitOfWork', () => ({
    unitOfWork: { run: vi.fn((fn) => fn({})) }
}))

describe('UpdateAppointmentStatusUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return failure if appointment is not found', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(null);

        const result = await updateAppointmentStatusUseCase.execute('1', 'confirmed');

        expect(result.success).toBe(false);
        expect(result.error).toBe('الموعد غير موجود');
    });

    it('should return success with status = "confirmed" when transitioning from pending to confirmed', async () => {
        const appointmentMock = {
            confirm: vi.fn().mockReturnValue({ id: '1', status: 'confirmed', patientId: 'p1' }),
        };
        vi.mocked(appointmentRepository.getById).mockResolvedValue(appointmentMock as any);
        vi.mocked(appointmentRepository.updateStatus).mockResolvedValue();

        const result = await updateAppointmentStatusUseCase.execute('1', 'confirmed');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.status).toBe('confirmed');
        }
        expect(appointmentMock.confirm).toHaveBeenCalled();
        expect(appointmentRepository.updateStatus).toHaveBeenCalledWith('1', 'confirmed', expect.anything());
    });

    it('should return success when transitioning from confirmed to completed with medicalRecordId', async () => {
        const appointmentMock = {
            complete: vi.fn().mockReturnValue({ id: '1', status: 'completed', patientId: 'p1' }),
        };
        vi.mocked(appointmentRepository.getById).mockResolvedValue(appointmentMock as any);
        vi.mocked(appointmentRepository.updateStatus).mockResolvedValue();

        const result = await updateAppointmentStatusUseCase.execute('1', 'completed', 'mr1');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.status).toBe('completed');
        }
        expect(appointmentMock.complete).toHaveBeenCalledWith('mr1');
        expect(appointmentRepository.updateStatus).toHaveBeenCalledWith('1', 'completed', expect.anything());
    });

    it('should return failure if transitioning from completed to cancelled', async () => {
        const appointmentMock = {
            cancel: vi.fn().mockImplementation(() => { throw new DomainError('APPOINTMENT_CANNOT_CHANGE_STATUS', 'Cannot cancel appointment'); }),
        };
        vi.mocked(appointmentRepository.getById).mockResolvedValue(appointmentMock as any);

        const result = await updateAppointmentStatusUseCase.execute('1', 'cancelled');

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
    });

    it('should return failure if transitioning from no-show to cancelled', async () => {
        const appointmentMock = {
            cancel: vi.fn().mockImplementation(() => { throw new DomainError('APPOINTMENT_CANNOT_CHANGE_STATUS', 'Cannot cancel appointment'); }),
        };
        vi.mocked(appointmentRepository.getById).mockResolvedValue(appointmentMock as any);

        const result = await updateAppointmentStatusUseCase.execute('1', 'cancelled');

        expect(result.success).toBe(false);
        expect(result.error).toBeTruthy();
    });

    it('should return failure if repository throws an error', async () => {
        vi.mocked(appointmentRepository.getById).mockRejectedValue(new Error('DB Error'));

        const result = await updateAppointmentStatusUseCase.execute('1', 'confirmed');

        expect(result.success).toBe(false);
        expect(result.error).toBe('DB Error');
    });

    it('should return failure if updateStatus throws an error', async () => {
        const appointmentMock = {
            confirm: vi.fn().mockReturnValue({ id: '1', status: 'confirmed', patientId: 'p1' }),
        };
        vi.mocked(appointmentRepository.getById).mockResolvedValue(appointmentMock as any);
        vi.mocked(appointmentRepository.updateStatus).mockRejectedValue(new Error('Update DB Error'));

        const result = await updateAppointmentStatusUseCase.execute('1', 'confirmed');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Update DB Error');
    });
});
