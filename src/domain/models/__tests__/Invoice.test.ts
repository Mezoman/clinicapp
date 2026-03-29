import { describe, it, expect, beforeEach } from 'vitest';
import { Invoice } from '../billing';
import { DomainError } from '../../errors';

describe('Invoice Domain Model', () => {
    let invoice: Invoice;

    beforeEach(() => {
        invoice = Invoice.create({
            id: 'inv-1',
            patientId: 'pat-1',
            invoiceNumber: 'INV-001',
            invoiceDate: '2026-03-01',
            services: [
                { serviceId: 'svc-1', name: 'Consultation', quantity: 1, unitPrice: 500, total: 500 }
            ]
        });
    });

    it('should update balance correctly on partial payment', () => {
        const updatedInvoice = invoice.applyPayment({
            amount: 200,
            method: 'cash',
            date: '2026-03-01',
            notes: 'Partial payment'
        });

        expect(updatedInvoice.totalPaid).toBe(200);
        expect(updatedInvoice.balance).toBe(300);
        expect(updatedInvoice.status).toBe('partial');
    });

    it('should change status to paid on full payment', () => {
        const updatedInvoice = invoice.applyPayment({
            amount: 500,
            method: 'cash',
            date: '2026-03-01',
            notes: 'Full payment'
        });

        expect(updatedInvoice.balance).toBe(0);
        expect(updatedInvoice.status).toBe('paid');
    });

    it('should throw DomainError on overpayment', () => {
        expect(() => {
            invoice.applyPayment({
                amount: 600,
                method: 'cash',
                date: '2026-03-01',
                notes: 'Overpayment'
            });
        }).toThrow(DomainError);
    });

    it('should throw an error when paying a fully paid invoice', () => {
        const paidInvoice = invoice.applyPayment({
            amount: 500,
            method: 'cash',
            date: '2026-03-01',
            notes: 'Full payment'
        });

        expect(() => {
            paidInvoice.applyPayment({
                amount: 100,
                method: 'cash',
                date: '2026-03-02',
                notes: 'Extra payment'
            });
        }).toThrow(DomainError);
    });

    it('should throw INVALID_INVOICE when services array is empty', () => {
        expect(() => Invoice.create({
            id: 'inv-2',
            patientId: 'pat-1',
            invoiceNumber: 'INV-002',
            invoiceDate: '2026-03-01',
            services: []
        })).toThrow(DomainError);
    });

    it('should throw INVALID_SERVICE when quantity is zero', () => {
        expect(() => Invoice.create({
            id: 'inv-3',
            patientId: 'pat-1',
            invoiceNumber: 'INV-003',
            invoiceDate: '2026-03-01',
            services: [{ serviceId: 'svc-1', name: 'Svc', quantity: 0, unitPrice: 100, total: 0 }]
        })).toThrow(DomainError);
    });
});
