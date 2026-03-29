// src/domain/models/__tests__/AppointmentModel.test.ts
import { describe, it, expect } from 'vitest';
import { Appointment } from '../appointment';

function makeAppointment(overrides: Partial<Parameters<typeof Appointment.reconstruct>[0]> = {}) {
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
        status: 'pending',
        notes: undefined,
        medicalRecordId: undefined,
        bookedBy: 'patient',
        createdAt: '2026-03-01T00:00:00Z',
        updatedAt: '2026-03-01T00:00:00Z',
        ...overrides,
    });
}

describe('Appointment — Status Transitions', () => {
    it('يجب تأكيد موعد pending', () => {
        const appt = makeAppointment({ status: 'pending' });
        const confirmed = appt.confirm();
        expect(confirmed.status).toBe('confirmed');
    });

    it('يجب إكمال موعد confirmed', () => {
        const appt = makeAppointment({ status: 'confirmed' });
        const completed = appt.complete('med-rec-1');
        expect(completed.status).toBe('completed');
        expect(completed.medicalRecordId).toBe('med-rec-1');
    });

    it('يجب إلغاء موعد pending', () => {
        const appt = makeAppointment({ status: 'pending' });
        const cancelled = appt.cancel();
        expect(cancelled.status).toBe('cancelled');
    });

    it('يجب إلغاء موعد confirmed', () => {
        const appt = makeAppointment({ status: 'confirmed' });
        const cancelled = appt.cancel();
        expect(cancelled.status).toBe('cancelled');
    });

    it('يجب تسجيل no-show لموعد confirmed', () => {
        const appt = makeAppointment({ status: 'confirmed' });
        const noShow = appt.markNoShow();
        expect(noShow.status).toBe('no-show');
    });

    it('يجب رمي خطأ عند محاولة تغيير حالة موعد ملغى', () => {
        const appt = makeAppointment({ status: 'cancelled' });
        expect(() => appt.confirm()).toThrow();
        expect(() => appt.complete()).toThrow();
    });

    it('يجب رمي خطأ عند محاولة تغيير حالة موعد مكتمل', () => {
        const appt = makeAppointment({ status: 'completed' });
        expect(() => appt.cancel()).toThrow();
        expect(() => appt.confirm()).toThrow();
    });
});

describe('Appointment — Getters', () => {
    it('يجب إرجاع جميع الخصائص بشكل صحيح', () => {
        const appt = makeAppointment();
        expect(appt.id).toBe('appt-1');
        expect(appt.patientId).toBe('pat-1');
        expect(appt.patientName).toBe('محمد أحمد');
        expect(appt.patientPhone).toBe('01012345678');
        expect(appt.date).toBe('2026-12-01');
        expect(appt.time).toBe('10:00');
        expect(appt.duration).toBe(30);
        expect(appt.type).toBe('examination');
        expect(appt.status).toBe('pending');
        expect(appt.bookedBy).toBe('patient');
    });
});

describe('Appointment.create()', () => {
    it('يجب إنشاء موعد جديد بالحالة pending', () => {
        const appt = Appointment.create({
            id: 'new-1',
            patientId: 'pat-2',
            patientName: 'أحمد علي',
            patientPhone: '01112345678',
            date: '2026-12-15',
            time: '14:00',
            duration: 30,
            type: 'follow-up',
            bookedBy: 'admin',
        });
        expect(appt.status).toBe('pending');
        expect(appt.dailyNumber).toBe(0);
    });
});
