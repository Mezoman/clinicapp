// src/application/use-cases/appointments/__tests__/AppointmentManagement.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { deleteAppointmentUseCase } from '../DeleteAppointmentUseCase';
import { updateAppointmentStatusUseCase } from '../UpdateAppointmentStatusUseCase';
import { appointmentRepository } from '../../../../infrastructure/repositories/appointmentRepository';
import { Appointment } from '../../../../domain/models';

vi.mock('../../../../infrastructure/repositories/appointmentRepository', () => ({
    appointmentRepository: {
        getById: vi.fn(),
        delete: vi.fn(),
        updateStatus: vi.fn(),
    }
}));
vi.mock('../../../../infrastructure/unit-of-work/SupabaseUnitOfWork', () => ({
    unitOfWork: { run: vi.fn((fn: any) => fn({ transaction: null })) }
}));

function makeAppointment(status: Appointment['status'] = 'pending') {
    return Appointment.reconstruct({
        id: 'appt-1',
        patientId: 'pat-1',
        patientName: 'محمد أحمد',
        patientPhone: '01012345678',
        date: '2026-12-01',
        time: '10:00',
        duration: 30,
        dailyNumber: 1,
        type: 'examination',
        reason: undefined,
        treatmentType: undefined,
        status,
        notes: undefined,
        medicalRecordId: undefined,
        bookedBy: 'patient',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
    });
}

// ─── DeleteAppointmentUseCase ───────────────────
describe('DeleteAppointmentUseCase', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب حذف موعد موجود بنجاح', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(makeAppointment());
        vi.mocked(appointmentRepository.delete).mockResolvedValue(undefined);

        const result = await deleteAppointmentUseCase.execute('appt-1');

        expect(result.success).toBe(true);
        expect(appointmentRepository.delete).toHaveBeenCalledWith('appt-1', expect.anything());
    });

    it('يجب إرجاع failure إذا كان الموعد غير موجود', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(null);

        const result = await deleteAppointmentUseCase.execute('non-existent');

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/غير موجود/);
        expect(appointmentRepository.delete).not.toHaveBeenCalled();
    });

    it('يجب إرجاع failure إذا فشل الحذف', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(makeAppointment());
        vi.mocked(appointmentRepository.delete).mockRejectedValue(new Error('DB error'));

        const result = await deleteAppointmentUseCase.execute('appt-1');
        expect(result.success).toBe(false);
    });
});

// ─── UpdateAppointmentStatusUseCase ────────────
describe('UpdateAppointmentStatusUseCase', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب تأكيد موعد pending بنجاح', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(makeAppointment('pending'));
        vi.mocked(appointmentRepository.updateStatus).mockResolvedValue(undefined);

        const result = await updateAppointmentStatusUseCase.execute('appt-1', 'confirmed');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.status).toBe('confirmed');
        }
        expect(appointmentRepository.updateStatus).toHaveBeenCalledWith('appt-1', 'confirmed', expect.anything());
    });

    it('يجب إكمال موعد confirmed مع medical record', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(makeAppointment('confirmed'));
        vi.mocked(appointmentRepository.updateStatus).mockResolvedValue(undefined);

        const result = await updateAppointmentStatusUseCase.execute('appt-1', 'completed', 'med-rec-1');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.status).toBe('completed');
        }
    });

    it('يجب إلغاء موعد بنجاح', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(makeAppointment('confirmed'));
        vi.mocked(appointmentRepository.updateStatus).mockResolvedValue(undefined);

        const result = await updateAppointmentStatusUseCase.execute('appt-1', 'cancelled');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.status).toBe('cancelled');
        }
    });

    it('يجب إرجاع failure إذا كان الموعد غير موجود', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(null);

        const result = await updateAppointmentStatusUseCase.execute('non-existent', 'confirmed');

        expect(result.success).toBe(false);
        expect(result.error).toMatch(/غير موجود/);
    });

    it('يجب إرجاع failure إذا كان الموعد ملغى (Domain rule)', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(makeAppointment('cancelled'));
        vi.mocked(appointmentRepository.updateStatus).mockResolvedValue(undefined);

        const result = await updateAppointmentStatusUseCase.execute('appt-1', 'confirmed');
        // DomainError يجب أن يُصطاد ويُحوَّل إلى failure
        expect(result.success).toBe(false);
    });

    it('تسجيل no-show لموعد confirmed', async () => {
        vi.mocked(appointmentRepository.getById).mockResolvedValue(makeAppointment('confirmed'));
        vi.mocked(appointmentRepository.updateStatus).mockResolvedValue(undefined);

        const result = await updateAppointmentStatusUseCase.execute('appt-1', 'no-show');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.status).toBe('no-show');
        }
    });
});
