import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteAppointmentUseCase } from '../DeleteAppointmentUseCase';
import { appointmentRepository } from '../../../../infrastructure/repositories/appointmentRepository';
import { DomainError } from '../../../../domain/errors';

vi.mock('../../../../infrastructure/repositories/appointmentRepository')
vi.mock('../../../../infrastructure/unit-of-work/SupabaseUnitOfWork', () => ({
    unitOfWork: { run: vi.fn((fn) => fn({})) }
}))

describe('DeleteAppointmentUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should return failure if appointment is not found', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(null);

        const result = await deleteAppointmentUseCase.execute('1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('الموعد غير موجود');
    });

    it('should return success after calling repository.delete when appointment exists', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue({ id: '1' } as any);
        vi.mocked(appointmentRepository.delete).mockResolvedValue();

        const result = await deleteAppointmentUseCase.execute('1');

        expect(result.success).toBe(true);
        expect(appointmentRepository.delete).toHaveBeenCalledWith('1', expect.anything());
    });

    it('should return failure with appropriate message if repository throws an error', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue({ id: '1' } as any);
        vi.mocked(appointmentRepository.delete).mockRejectedValue(new Error('Network error'));

        const result = await deleteAppointmentUseCase.execute('1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('Network error');
    });

    it('should return mapped failure message if repository throws DomainError', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue({ id: '1' } as any);
        vi.mocked(appointmentRepository.delete).mockRejectedValue(new DomainError('INVALID_OPERATION', 'Not allowed'));

        const result = await deleteAppointmentUseCase.execute('1');

        expect(result.success).toBe(false);
        expect(result.error).toBe('هذه العملية غير مسموح بها حالياً.');
    });
});
