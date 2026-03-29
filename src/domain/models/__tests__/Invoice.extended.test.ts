// src/domain/models/__tests__/Invoice.extended.test.ts
import { describe, it, expect } from 'vitest';
import { Invoice } from '../billing';
import { DomainError } from '../../errors';

function makeInvoice(overrides = {}) {
    return Invoice.create({
        id: 'inv-1',
        patientId: 'pat-1',
        patientName: 'محمد أحمد',
        invoiceNumber: 'INV-001',
        invoiceDate: '2026-03-01',
        services: [
            { serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 500, total: 500 },
        ],
        ...overrides
    });
}

// ─── Invoice.create() ─────────────────────────
describe('Invoice.create()', () => {
    it('يجب حساب subtotal من مجموع الخدمات', () => {
        const inv = Invoice.create({
            id: 'i1', patientId: 'p1', invoiceNumber: 'INV-001',
            invoiceDate: '2026-03-01',
            services: [
                { serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 300, total: 300 },
                { serviceId: 's2', name: 'أشعة', quantity: 2, unitPrice: 150, total: 300 },
            ]
        });
        expect(inv.subtotal).toBe(600);
    });

    it('يجب طرح الخصم من الإجمالي', () => {
        const inv = makeInvoice({ discount: 100 });
        expect(inv.total).toBe(400);
        expect(inv.balance).toBe(400);
    });

    it('يجب رمي INVALID_DISCOUNT للخصم الزائد (أكبر من الإجمالي)', () => {
        expect(() => Invoice.create({
            id: 'i1', patientId: 'p1', invoiceNumber: 'INV-001',
            invoiceDate: '2026-03-01',
            services: [{ serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 100, total: 100 }],
            discount: 200 // خصم أكبر من الإجمالي
        })).toThrow(DomainError);
    });

    it('يجب أن تكون الحالة الابتدائية issued', () => {
        const inv = makeInvoice();
        expect(inv.status).toBe('issued');
    });

    it('يجب أن يكون totalPaid = 0 عند الإنشاء', () => {
        const inv = makeInvoice();
        expect(inv.totalPaid).toBe(0);
    });

    it('يجب أن تكون payments فارغة عند الإنشاء', () => {
        const inv = makeInvoice();
        expect(inv.payments).toHaveLength(0);
    });

    it('يجب دعم خدمات متعددة', () => {
        const inv = Invoice.create({
            id: 'i1', patientId: 'p1', invoiceNumber: 'INV-001',
            invoiceDate: '2026-03-01',
            services: [
                { serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 200, total: 200 },
                { serviceId: 's2', name: 'حشو', quantity: 3, unitPrice: 100, total: 300 },
                { serviceId: 's3', name: 'تلميع', quantity: 1, unitPrice: 50, total: 50 },
            ]
        });
        expect(inv.subtotal).toBe(550);
        expect(inv.services).toHaveLength(3);
    });
});

// ─── Invoice.applyPayment() ────────────────────
describe('Invoice.applyPayment()', () => {
    it('يجب تغيير الحالة إلى partial بعد دفع جزئي', () => {
        const inv = makeInvoice();
        const updated = inv.applyPayment({ amount: 200, method: 'cash', date: '2026-03-02', notes: undefined });
        expect(updated.status).toBe('partial');
        expect(updated.totalPaid).toBe(200);
        expect(updated.balance).toBe(300);
    });

    it('يجب تغيير الحالة إلى paid بعد الدفع الكامل', () => {
        const inv = makeInvoice();
        const updated = inv.applyPayment({ amount: 500, method: 'cash', date: '2026-03-02', notes: undefined });
        expect(updated.status).toBe('paid');
        expect(updated.balance).toBe(0);
    });

    it('يجب دعم طرق دفع مختلفة', () => {
        const inv = makeInvoice();
        const byCard = inv.applyPayment({ amount: 250, method: 'card', date: '2026-03-02', notes: undefined });
        expect(byCard.payments[0]?.method).toBe('card');

        const byTransfer = inv.applyPayment({ amount: 250, method: 'transfer', date: '2026-03-02', notes: undefined });
        expect(byTransfer.payments[0]?.method).toBe('transfer');
    });

    it('يجب رمي OVERPAYMENT_NOT_ALLOWED للدفع الزائد', () => {
        const inv = makeInvoice();
        expect(() =>
            inv.applyPayment({ amount: 600, method: 'cash', date: '2026-03-02', notes: undefined })
        ).toThrow(DomainError);
    });

    it('يجب رمي INVALID_OPERATION للدفع على فاتورة ملغاة', () => {
        const inv = makeInvoice();
        const cancelled = inv.cancel();
        expect(() =>
            cancelled.applyPayment({ amount: 100, method: 'cash', date: '2026-03-02', notes: undefined })
        ).toThrow(DomainError);
    });

    it('يجب إضافة كل دفعة إلى تاريخ الدفعات', () => {
        let inv = makeInvoice();
        inv = inv.applyPayment({ amount: 100, method: 'cash', date: '2026-03-01', notes: 'أول دفعة' });
        inv = inv.applyPayment({ amount: 200, method: 'card', date: '2026-03-02', notes: 'ثاني دفعة' });
        expect(inv.payments).toHaveLength(2);
        expect(inv.totalPaid).toBe(300);
    });

    it('يجب التعامل مع floating point بشكل آمن', () => {
        const inv = Invoice.create({
            id: 'i1', patientId: 'p1', invoiceNumber: 'INV-001',
            invoiceDate: '2026-03-01',
            services: [{ serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 0.1 + 0.2, total: 0.1 + 0.2 }],
        });
        // لا يجب رمي خطأ floating point
        expect(() =>
            inv.applyPayment({ amount: inv.total, method: 'cash', date: '2026-03-02', notes: undefined })
        ).not.toThrow();
    });
});

// ─── Invoice.cancel() ─────────────────────────
describe('Invoice.cancel()', () => {
    it('يجب إلغاء فاتورة issued', () => {
        const inv = makeInvoice();
        const cancelled = inv.cancel();
        expect(cancelled.status).toBe('cancelled');
    });

    it('يجب إلغاء فاتورة partial', () => {
        const inv = makeInvoice();
        const partial = inv.applyPayment({ amount: 200, method: 'cash', date: '2026-03-02', notes: undefined });
        const cancelled = partial.cancel();
        expect(cancelled.status).toBe('cancelled');
    });

    it('يجب رمي INVALID_OPERATION لإلغاء فاتورة مدفوعة', () => {
        const inv = makeInvoice();
        const paid = inv.applyPayment({ amount: 500, method: 'cash', date: '2026-03-02', notes: undefined });
        expect(() => paid.cancel()).toThrow(DomainError);
    });

    it('لا يجب تغيير باقي الخصائص عند الإلغاء', () => {
        const inv = makeInvoice();
        const cancelled = inv.cancel();
        expect(cancelled.id).toBe(inv.id);
        expect(cancelled.total).toBe(inv.total);
        expect(cancelled.invoiceNumber).toBe(inv.invoiceNumber);
    });
});

// ─── Invoice.toProps() ────────────────────────
describe('Invoice.toProps()', () => {
    it('يجب إرجاع نسخة من الخصائص', () => {
        const inv = makeInvoice();
        const props = inv.toProps();
        expect(props.id).toBe('inv-1');
        expect(props.patientId).toBe('pat-1');
        expect(props.total).toBe(500);
    });

    it('يجب أن تكون النسخة مستقلة (immutability)', () => {
        const inv = makeInvoice();
        const props1 = inv.toProps();
        const props2 = inv.toProps();
        expect(props1).toEqual(props2);
        expect(props1).not.toBe(props2); // نسختان مختلفتان في الذاكرة
    });
});
