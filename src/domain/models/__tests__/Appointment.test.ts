import { describe, it, expect } from 'vitest';
import { Appointment } from '../appointment';
import { DomainError } from '../../errors';

describe('Appointment Model', () => {
    const defaultProps = {
        id: 'app-1',
        patientId: 'pat-1',
        patientName: 'John Doe',
        patientPhone: '1234567890',
        date: '2025-05-10',
        time: '10:00',
        duration: 30,
        type: 'examination' as const,
        bookedBy: 'admin' as const,
        dailyNumber: 1,
    };

    describe('confirm()', () => {
        it('should change status to confirmed from pending', () => {
            const appointment = Appointment.create(defaultProps);
            const confirmedAppointment = appointment.confirm();
            expect(confirmedAppointment.status).toBe('confirmed');
        });

        it('should throw DomainError when confirming an already confirmed appointment', () => {
            const appointment = Appointment.create(defaultProps).confirm();
            expect(() => appointment.confirm()).toThrow(DomainError);
            expect(() => appointment.confirm()).toThrow('Cannot confirm appointment from confirmed status');
        });

        it('should throw DomainError when confirming a cancelled appointment', () => {
            const appointment = Appointment.create(defaultProps).cancel();
            expect(() => appointment.confirm()).toThrow(DomainError);
            expect(() => appointment.confirm()).toThrow('Cannot confirm appointment from cancelled status');
        });
    });

    describe('complete()', () => {
        it('should change status to completed when confirmed', () => {
            const appointment = Appointment.create(defaultProps).confirm();
            const completedAppointment = appointment.complete();
            expect(completedAppointment.status).toBe('completed');
        });

        it('should assign medicalRecordId when provided', () => {
            const appointment = Appointment.create(defaultProps).confirm();
            const completedAppointment = appointment.complete('rec-1');
            expect(completedAppointment.medicalRecordId).toBe('rec-1');
            expect(completedAppointment.status).toBe('completed');
        });

        it('should throw DomainError when completing a pending appointment', () => {
            const appointment = Appointment.create(defaultProps);
            expect(() => appointment.complete()).toThrow(DomainError);
            expect(() => appointment.complete()).toThrow('Only confirmed appointments can be completed');
        });
    });

    describe('cancel()', () => {
        it('should change status to cancelled from pending', () => {
            const appointment = Appointment.create(defaultProps);
            const cancelledAppointment = appointment.cancel();
            expect(cancelledAppointment.status).toBe('cancelled');
        });

        it('should change status to cancelled from confirmed', () => {
            const appointment = Appointment.create(defaultProps).confirm();
            const cancelledAppointment = appointment.cancel();
            expect(cancelledAppointment.status).toBe('cancelled');
        });

        it('should throw DomainError when cancelling a completed appointment', () => {
            const appointment = Appointment.create(defaultProps).confirm().complete();
            expect(() => appointment.cancel()).toThrow(DomainError);
            expect(() => appointment.cancel()).toThrow('Cannot cancel a completed appointment');
        });

        it('should throw DomainError when cancelling a no-show appointment', () => {
            const appointment = Appointment.create(defaultProps).confirm().markNoShow();
            expect(() => appointment.cancel()).toThrow(DomainError);
            expect(() => appointment.cancel()).toThrow('Cannot cancel a no-show appointment');
        });
    });

    describe('markNoShow()', () => {
        it('should change status to no-show from confirmed', () => {
            const appointment = Appointment.create(defaultProps).confirm();
            const noShowAppointment = appointment.markNoShow();
            expect(noShowAppointment.status).toBe('no-show');
        });

        it('should throw DomainError when marking a completed appointment as no-show', () => {
            const appointment = Appointment.create(defaultProps).confirm().complete();
            expect(() => appointment.markNoShow()).toThrow(DomainError);
            expect(() => appointment.markNoShow()).toThrow('Cannot mark as no-show from completed status');
        });
    });
});
