// src/application/use-cases/__tests__/BookAppointmentUseCase.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookAppointmentUseCase } from '../BookAppointmentUseCase';
import { appointmentRepository } from '../../../infrastructure/repositories/appointmentRepository';
import { Appointment } from '../../../domain/models';

vi.mock('../../../infrastructure/repositories/appointmentRepository', () => ({
    appointmentRepository: {
        bookSafe: vi.fn(),
        getById: vi.fn(),
    }
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
    }
}));

describe('BookAppointmentUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully book an appointment', async () => {
        // Arrange
        const input = {
            patientId: 'pat-1',
            patientName: 'John Doe',
            patientPhone: '1234567890',
            date: '2023-10-10',
            time: '10:00',
            duration: 30,
            type: 'examination' as any,
            notes: 'Test booking',
            sessionId: 'sess-1',
            lockId: 'lock-1'
        };

        const mockResult = { success: true, appointmentId: 'app-123' };
        vi.mocked(appointmentRepository.bookSafe).mockResolvedValueOnce(mockResult);

        const mockAppointment = Appointment.reconstruct({
            id: 'app-123',
            patientId: input.patientId,
            patientName: input.patientName,
            patientPhone: input.patientPhone,
            date: input.date,
            time: input.time,
            duration: input.duration,
            type: input.type,
            status: 'pending',
            bookedBy: 'patient',
            createdAt: '2023-10-01',
            updatedAt: '2023-10-01',
            dailyNumber: 0,
            reason: undefined,
            treatmentType: undefined,
            notes: input.notes,
            medicalRecordId: undefined
        });

        vi.mocked(appointmentRepository.getById).mockResolvedValueOnce(mockAppointment);

        // Act
        const result = await bookAppointmentUseCase.execute(input);

        // Assert
        expect(result.id).toBe('app-123');
        expect(appointmentRepository.bookSafe).toHaveBeenCalledWith(
            expect.objectContaining({ patientId: 'pat-1', date: '2023-10-10', lockId: 'lock-1' }),
            expect.anything()
        );
    });

    it('should throw AppError if a DomainError occurs', async () => {
        const input = {
            patientId: 'pat-1',
            patientName: 'John Doe',
            patientPhone: '1234567890',
            date: '2023-10-10',
            time: '10:00',
            duration: 30,
            type: 'examination' as any,
            notes: 'Test booking',
            sessionId: 'sess-1',
            lockId: 'lock-1'
        };

        const { DomainError } = await import('../../../domain/errors');
        vi.mocked(appointmentRepository.bookSafe).mockImplementationOnce(() => {
            throw new DomainError('INVALID_OPERATION', 'Domain rule broken');
        });

        await expect(bookAppointmentUseCase.execute(input)).rejects.toThrowError(/Domain rule broken/);
    });

    it('should rethrow generic errors', async () => {
        const input = {
            patientId: 'pat-1',
            patientName: 'John Doe',
            patientPhone: '1234567890',
            date: '2023-10-10',
            time: '10:00',
            duration: 30,
            type: 'examination' as any,
            notes: 'Test booking',
            sessionId: 'sess-1',
            lockId: 'lock-1'
        };

        vi.mocked(appointmentRepository.bookSafe).mockRejectedValueOnce(new Error('Generic failure'));

        await expect(bookAppointmentUseCase.execute(input)).rejects.toThrowError('Generic failure');
    });
});
