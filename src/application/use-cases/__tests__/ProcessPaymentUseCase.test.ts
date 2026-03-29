import { describe, it, expect, vi, beforeEach } from 'vitest';
import { processPaymentUseCase } from '../billing/ProcessPaymentUseCase';
import { billingRepository } from '../../../infrastructure/repositories/billingRepository';
import { Invoice } from '../../../domain/models';


vi.mock('../../../infrastructure/repositories/billingRepository', () => ({
    billingRepository: {
        getById: vi.fn(),
        updatePaymentData: vi.fn(),
    }
}));

// Mock logger to avoid cluttering test output
vi.mock('../../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
        error: vi.fn(),
    }
}));

describe('ProcessPaymentUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully process a valid payment', async () => {
        // Arrange
        const mockInvoice = Invoice.reconstruct({
            id: 'inv-123',
            patientId: 'pat-1',
            patientName: 'John Doe',
            invoiceNumber: 'INV-001',
            invoiceDate: '2023-01-01',
            services: [],
            subtotal: 100,
            discount: 0,
            taxAmount: 0,
            taxRate: 0,
            total: 100,
            totalPaid: 0,
            balance: 100,
            status: 'issued',
            payments: [],
            appointmentId: undefined,
            discountReason: undefined,
            dueDate: '2023-01-01',
            notes: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        vi.mocked(billingRepository.getById).mockResolvedValueOnce(mockInvoice);
        vi.mocked(billingRepository.updatePaymentData).mockResolvedValueOnce();

        // Mocking the second getById call (final consistency check)
        const updatedInvoice = mockInvoice.applyPayment({ amount: 50, method: 'cash', date: '2023-01-02', notes: undefined });
        vi.mocked(billingRepository.getById).mockResolvedValueOnce(updatedInvoice);

        // Act
        const result = await processPaymentUseCase.execute('inv-123', { amount: 50, method: 'cash', notes: undefined });

        // Assert
        if (!result.success) throw new Error(result.error);
        expect(result.data.balance).toBe(50);
        expect(result.data.totalPaid).toBe(50);
        expect(billingRepository.updatePaymentData).toHaveBeenCalledWith(
            'inv-123',
            expect.objectContaining({ balance: 50, totalPaid: 50 }),
            expect.anything()
        );
    });

    it('should return failure if invoice not found', async () => {
        vi.mocked(billingRepository.getById).mockResolvedValueOnce(null);

        const result = await processPaymentUseCase.execute('invalid', { amount: 50, method: 'cash', notes: undefined });
        expect(result.success).toBe(false);
        expect(result.error).toMatch(/غير موجود/); // Or appropriate error message
    });

    it('should return failure if payment exceeds balance', async () => {
        const mockInvoice = Invoice.reconstruct({
            id: 'inv-123',
            patientId: 'pat-1',
            patientName: 'John Doe',
            invoiceNumber: 'INV-001',
            invoiceDate: '2023-01-01',
            services: [],
            subtotal: 100,
            discount: 0,
            taxAmount: 0,
            taxRate: 0,
            total: 100,
            totalPaid: 0,
            balance: 100,
            status: 'issued',
            payments: [],
            appointmentId: undefined,
            discountReason: undefined,
            dueDate: '2023-01-01',
            notes: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        vi.mocked(billingRepository.getById).mockResolvedValueOnce(mockInvoice);

        const result = await processPaymentUseCase.execute('inv-123', { amount: 150, method: 'cash', notes: undefined });
        expect(result.success).toBe(false);
    });
});
