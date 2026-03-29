// src/application/use-cases/appointments/__tests__/AdminBookAndGetByDate.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { adminBookAppointmentUseCase } from '../AdminBookAppointmentUseCase';
import { getAppointmentsByDateUseCase } from '../GetAppointmentsByDateUseCase';
import { appointmentRepository } from '../../../../infrastructure/repositories/appointmentRepository';
import { Appointment } from '../../../../domain/models/appointment';

vi.mock('../../../../infrastructure/repositories/appointmentRepository', () => ({
    appointmentRepository: {
        create: vi.fn(),
        getByDate: vi.fn(),
    }
}));
vi.mock('../../../../infrastructure/clients/supabase', () => ({
    supabase: {
        rpc: vi.fn()
    }
}));
vi.mock('../../../../infrastructure/repositories/patientRepository', () => ({
    patientRepository: {
        findOrCreate: vi.fn()
    }
}));
vi.mock('../../../../infrastructure/unit-of-work/SupabaseUnitOfWork', () => ({
    unitOfWork: { run: vi.fn((fn: any) => fn({ transaction: null })) }
}));
vi.mock('../../../../utils/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn() }
}));
vi.mock('../../../../infrastructure/repositories/settingsRepository', () => ({
    settingsRepository: {
        getSettings: vi.fn().mockResolvedValue({ slotDuration: 15, maxDailyAppointments: 30 })
    }
}));

import { supabase } from '../../../../infrastructure/clients/supabase';

function makeAppointment(overrides = {}) {
    return Appointment.reconstruct({
        id: 'a1', patientId: 'p1', patientName: 'محمد أحمد', patientPhone: '01012345678',
        date: '2026-12-01', time: '10:00', duration: 15, dailyNumber: 0,
        type: 'examination', reason: undefined, treatmentType: undefined,
        status: 'pending', notes: undefined, medicalRecordId: undefined,
        bookedBy: 'admin', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
        ...overrides
    });
}

// ─── AdminBookAppointmentUseCase ───────────────
describe('AdminBookAppointmentUseCase', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب حجز موعد جديد بنجاح عندما يوجد patientId', async () => {
        vi.mocked(appointmentRepository.create).mockResolvedValue(makeAppointment());

        const result = await adminBookAppointmentUseCase.execute({
            patientId: 'p1',
            patientName: 'محمد أحمد',
            patientPhone: '01012345678',
            date: '2026-12-01',
            time: '10:00',
            type: 'examination',
            bookedBy: 'admin',
            notes: undefined,
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.patientId).toBe('p1');
            expect(result.data.date).toBe('2026-12-01');
        }
        // لا يجب استدعاء find_or_create_patient عند وجود patientId
        expect(supabase.rpc).not.toHaveBeenCalled();
    });

    it('يجب إنشاء مريض جديد عبر RPC عند غياب patientId', async () => {
        const { patientRepository } = await import('../../../../infrastructure/repositories/patientRepository');
        vi.mocked(patientRepository.findOrCreate).mockResolvedValue('new-patient-id');
        vi.mocked(appointmentRepository.create).mockResolvedValue(makeAppointment({ patientId: 'new-patient-id' }));

        const result = await adminBookAppointmentUseCase.execute({
            patientId: undefined,
            patientName: 'مريض جديد',
            patientPhone: '01099999999',
            date: '2026-12-02',
            time: '11:00',
            type: 'follow-up',
            bookedBy: 'admin',
            notes: undefined,
        });

        expect(patientRepository.findOrCreate).toHaveBeenCalledWith('مريض جديد', '01099999999');
        expect(result.success).toBe(true);
    });

    it('يجب إرجاع failure إذا فشل RPC', async () => {
        const { patientRepository } = await import('../../../../infrastructure/repositories/patientRepository');
        vi.mocked(patientRepository.findOrCreate).mockRejectedValue(new Error('RPC error'));

        const result = await adminBookAppointmentUseCase.execute({
            patientId: undefined,
            patientName: 'مريض',
            patientPhone: '01099999999',
            date: '2026-12-01',
            time: '10:00',
            type: 'examination',
            bookedBy: 'admin',
            notes: undefined,
        } as any);

        expect(result.success).toBe(false);
    });

    it('يجب إرجاع failure إذا فشل الحفظ في DB', async () => {
        vi.mocked(appointmentRepository.create).mockRejectedValue(new Error('DB error'));

        const result = await adminBookAppointmentUseCase.execute({
            patientId: 'p1',
            patientName: 'محمد',
            patientPhone: '01012345678',
            date: '2026-12-01',
            time: '10:00',
            type: 'examination',
            bookedBy: 'admin',
            notes: undefined,
        } as any);

        expect(result.success).toBe(false);
    });
});

// ─── GetAppointmentsByDateUseCase ──────────────
describe('GetAppointmentsByDateUseCase', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب إرجاع مواعيد اليوم مع pagination', async () => {
        vi.mocked(appointmentRepository.getByDate).mockResolvedValue({
            appointments: [makeAppointment(), makeAppointment({ id: 'a2' })],
            total: 2
        } as any);

        const result = await getAppointmentsByDateUseCase.execute('2026-12-01');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.appointments).toHaveLength(2);
            expect(result.data.total).toBe(2);
            expect(result.data.page).toBe(1);
        }
    });

    it('يجب حساب totalPages و hasMore بشكل صحيح', async () => {
        vi.mocked(appointmentRepository.getByDate).mockResolvedValue({
            appointments: Array(10).fill(makeAppointment()),
            total: 35
        } as any);

        const result = await getAppointmentsByDateUseCase.execute('2026-12-01', 1, 10);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.totalPages).toBe(4);  // Math.ceil(35/10)
            expect(result.data.hasMore).toBe(true);  // 1*10 < 35
        }
    });

    it('يجب أن hasMore=false للصفحة الأخيرة', async () => {
        vi.mocked(appointmentRepository.getByDate).mockResolvedValue({
            appointments: Array(5).fill(makeAppointment()),
            total: 5
        } as any);

        const result = await getAppointmentsByDateUseCase.execute('2026-12-01', 1, 10);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.hasMore).toBe(false);
    });

    it('يجب إرجاع failure عند خطأ DB', async () => {
        vi.mocked(appointmentRepository.getByDate).mockRejectedValue(new Error('DB error'));
        const result = await getAppointmentsByDateUseCase.execute('2026-12-01');
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain('فشل');
    });

    it('يجب تمرير date وpage وpageSize للـ repository', async () => {
        vi.mocked(appointmentRepository.getByDate).mockResolvedValue({ appointments: [], total: 0 } as any);
        await getAppointmentsByDateUseCase.execute('2026-12-01', 2, 20);

        expect(appointmentRepository.getByDate).toHaveBeenCalledWith('2026-12-01', 2, 20);
    });
});
