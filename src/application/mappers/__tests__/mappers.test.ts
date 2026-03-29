// src/application/mappers/__tests__/mappers.test.ts
import { describe, it, expect } from 'vitest';
import { AppointmentMapper } from '../appointment.mapper';
import { PatientMapper } from '../patient.mapper';
import { BillingMapper } from '../billing.mapper';
import { Appointment } from '../../../domain/models/appointment';
import { Invoice } from '../../../domain/models/billing';
import type { Patient } from '../../../domain/models';

function makeAppointment(overrides = {}) {
    return Appointment.reconstruct({
        id: 'a1', patientId: 'p1', patientName: 'محمد', patientPhone: '01012345678',
        date: '2026-12-01', time: '10:00', duration: 30, dailyNumber: 3,
        type: 'examination', reason: 'ألم في الأسنان', treatmentType: undefined,
        status: 'confirmed', notes: 'ملاحظة', medicalRecordId: undefined,
        bookedBy: 'admin', createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
        ...overrides
    });
}

describe('AppointmentMapper.toAppointmentDTO()', () => {
    it('يجب تحويل Appointment إلى DTO بشكل صحيح', () => {
        const appt = makeAppointment();
        const dto = AppointmentMapper.toAppointmentDTO(appt);
        expect(dto.id).toBe('a1');
        expect(dto.status).toBe('confirmed');
    });
});

describe('PatientMapper.toDTO()', () => {
    it('يجب تحويل Patient إلى DTO بجميع الحقول', () => {
        const patient = {
            id: 'p1', fullName: 'محمد أحمد', phone: '01012345678', gender: 'male',
            birthDate: '1990-05-15', totalVisits: 5, totalPaid: 1500, balance: 200,
            isActive: true, createdAt: '', updatedAt: ''
        } as Patient;
        const dto = PatientMapper.toDTO(patient);
        expect(dto.id).toBe('p1');
        expect(dto.fullName).toBe('محمد أحمد');
    });
});

describe('BillingMapper.toInvoiceDTO()', () => {
    it('يجب تحويل Invoice إلى DTO بشكل صحيح', () => {
        const invoice = Invoice.reconstruct({
            id: 'inv-1', patientId: 'p1', patientName: 'محمد أحمد',
            invoiceNumber: 'INV-001', invoiceDate: '2026-03-01',
            services: [{ serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 300, total: 300 }],
            subtotal: 300, totalPaid: 0, balance: 300, total: 300, payments: [],
            appointmentId: undefined, discount: 0, discountReason: undefined,
            taxAmount: 0, taxRate: 0, dueDate: undefined, notes: undefined,
            status: 'issued', createdAt: '', updatedAt: ''
        });
        const dto = BillingMapper.toInvoiceDTO(invoice);
        expect(dto.invoiceNumber).toBe('INV-001');
        expect(dto.total).toBe(300);
    });
});
