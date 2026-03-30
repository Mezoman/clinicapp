import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createInvoiceUseCase } from '../billing/CreateInvoiceUseCase';
import { billingRepository } from '../../../infrastructure/repositories/billingRepository';
import { Invoice, type InvoiceService } from '../../../domain/models';

vi.mock('../../../infrastructure/repositories/billingRepository', () => ({
    billingRepository: {
        createInvoice: vi.fn(),
    }
}));

// Mock logger
vi.mock('../../../utils/logger', () => ({
    logger: {
        info: vi.fn(),
    }
}));

describe('CreateInvoiceUseCase', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should successfully create an invoice', async () => {
        // Arrange
        const services: InvoiceService[] = [
            { serviceId: 's1', name: 'Checkup', quantity: 1, unitPrice: 100, total: 100 }
        ];

        const input = {
            patientId: 'pat-1',
            patientName: 'John Doe',
            invoiceDate: '2023-01-01',
            services: services,
            discount: 10,
            taxRate: 0,
            taxAmount: 0,
            discountReason: undefined,
            notes: 'Test'
        };

        const mockSavedInvoice = Invoice.reconstruct({
            id: 'inv-generated',
            patientId: input.patientId,
            patientName: input.patientName,
            invoiceNumber: 'INV-001',
            invoiceDate: input.invoiceDate,
            services: input.services,
            subtotal: 100,
            discount: 10,
            taxAmount: 0,
            taxRate: 0,
            total: 90,
            totalPaid: 0,
            balance: 90,
            status: 'issued',
            payments: [],
            appointmentId: undefined,
            discountReason: undefined,
            dueDate: input.invoiceDate,
            notes: input.notes,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        vi.mocked(billingRepository.createInvoice).mockResolvedValueOnce(mockSavedInvoice);

        // Act
        const result = await createInvoiceUseCase.execute(input);

        // Assert
        if (!result.success) throw new Error(result.error);
        expect(result.data.id).toBe('inv-generated');
        expect(result.data.total).toBe(90);
        expect(billingRepository.createInvoice).toHaveBeenCalledWith(
            expect.objectContaining({
                patientId: 'pat-1',
                subtotal: 100,
                discount: 10,
                total: 90
            }),
            expect.anything()
        );
    });
});
