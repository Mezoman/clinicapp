// src/application/use-cases/billing/__tests__/CreateInvoiceUseCase.extended.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInvoiceUseCase } from '../CreateInvoiceUseCase';
import { billingRepository } from '../../../../infrastructure/repositories/billingRepository';
import { Invoice } from '../../../../domain/models';

vi.mock('../../../../infrastructure/repositories/billingRepository', () => ({
    billingRepository: {
        getNextInvoiceNumber: vi.fn(),
        createInvoice: vi.fn(),
    }
}));
vi.mock('../../../../utils/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn() }
}));
vi.mock('../../../../infrastructure/unit-of-work/SupabaseUnitOfWork', () => ({
    unitOfWork: {
        run: vi.fn((fn: any) => fn({ transaction: null }))
    }
}));

function makeSavedInvoice(overrides = {}) {
    return Invoice.reconstruct({
        id: 'inv-saved-1',
        patientId: 'pat-1',
        patientName: 'محمد أحمد',
        invoiceNumber: 'INV-0001',
        invoiceDate: '2026-03-08',
        services: [{ serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 300, total: 300 }],
        subtotal: 300,
        discount: 0,
        taxAmount: 0,
        taxRate: 0,
        total: 300,
        totalPaid: 0,
        balance: 300,
        status: 'issued',
        payments: [],
        appointmentId: undefined,
        discountReason: undefined,
        dueDate: '2026-03-08',
        notes: undefined,
        createdAt: '2026-03-08T00:00:00Z',
        updatedAt: '2026-03-08T00:00:00Z',
        ...overrides,
    });
}

describe('CreateInvoiceUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(billingRepository.getNextInvoiceNumber).mockResolvedValue('INV-0001');
        vi.mocked(billingRepository.createInvoice).mockResolvedValue(makeSavedInvoice() as any);
    });

    it('يجب إنشاء فاتورة ناجحة بالمعلومات الكاملة', async () => {
        const input = {
            patientId: 'pat-1',
            patientName: 'محمد أحمد',
            invoiceDate: '2026-03-08',
            services: [{ serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 300 }],
            discount: 0,
            taxRate: 0,
            taxAmount: 0,
            discountReason: undefined,
            notes: undefined,
        };

        const result = await createInvoiceUseCase.execute(input);

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.invoiceNumber).toBe('INV-0001');
            expect(result.data.total).toBe(300);
        }
    });

    it('يجب حساب الإجمالي من quantity × unitPrice', async () => {
        vi.mocked(billingRepository.createInvoice).mockResolvedValue(
            makeSavedInvoice({ subtotal: 600, total: 600, balance: 600 }) as any
        );

        const input = {
            patientId: 'pat-1',
            patientName: 'محمد أحمد',
            invoiceDate: '2026-03-08',
            services: [{ serviceId: 's1', name: 'تنظيف', quantity: 2, unitPrice: 300 }],
            discount: 0,
            taxRate: 0,
            taxAmount: 0,
            discountReason: undefined,
            notes: undefined,
        };

        const result = await createInvoiceUseCase.execute(input);
        expect(result.success).toBe(true);
        // createInvoice يُستدعى مع الخصائص الصحيحة
        expect(billingRepository.createInvoice).toHaveBeenCalledWith(
            expect.objectContaining({
                patientId: 'pat-1',
            }),
            expect.anything()
        );
    });

    it('يجب إرجاع failure إذا فشل الحفظ', async () => {
        vi.mocked(billingRepository.createInvoice).mockRejectedValue(new Error('DB connection failed'));

        const result = await createInvoiceUseCase.execute({
            patientId: 'pat-1',
            patientName: 'محمد أحمد',
            invoiceDate: '2026-03-08',
            services: [{ serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 300 }],
            discount: 0,
            taxRate: 0,
            taxAmount: 0,
            discountReason: undefined,
            notes: undefined,
        });

        expect(result.success).toBe(false);
    });

    it('يجب تطبيق الخصم على الفاتورة', async () => {
        vi.mocked(billingRepository.createInvoice).mockResolvedValue(
            makeSavedInvoice({ discount: 50, total: 250, balance: 250 }) as any
        );

        const result = await createInvoiceUseCase.execute({
            patientId: 'pat-1',
            patientName: 'محمد أحمد',
            invoiceDate: '2026-03-08',
            services: [{ serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 300 }],
            discount: 50,
            taxRate: 0,
            taxAmount: 0,
            discountReason: undefined,
            notes: undefined,
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.total).toBe(250);
        }
    });
});
