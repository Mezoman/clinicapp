// src/application/services/__tests__/BillingService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BillingService } from '../BillingService';

// Mock Use Cases
const mockCreateInvoiceUC = { execute: vi.fn() };
const mockProcessPaymentUC = { execute: vi.fn() };
const mockGetInvoicesUC = { execute: vi.fn() };
const mockCreateInstallmentsUC = { execute: vi.fn() };
const mockGetInstallmentsUC = { execute: vi.fn() };

vi.mock('../use-cases/billing/CreateInvoiceUseCase', () => ({
    createInvoiceUseCase: { execute: vi.fn() },
    CreateInvoiceUseCase: vi.fn().mockImplementation(() => mockCreateInvoiceUC)
}));

vi.mock('../use-cases/billing/ProcessPaymentUseCase', () => ({
    processPaymentUseCase: { execute: vi.fn() },
    ProcessPaymentUseCase: vi.fn().mockImplementation(() => mockProcessPaymentUC)
}));

vi.mock('../use-cases/billing/GetInvoicesUseCase', () => ({
    getInvoicesUseCase: { execute: vi.fn() },
    GetInvoicesUseCase: vi.fn().mockImplementation(() => mockGetInvoicesUC)
}));

vi.mock('../../../infrastructure/repositories/installmentRepository', () => ({
    installmentRepository: {
        createInstallments: vi.fn(),
        getByInvoiceId: vi.fn(),
    }
}));

vi.mock('../../../utils/logger', () => ({
    logger: {
        error: vi.fn(),
        info: vi.fn()
    }
}));

describe('BillingService', () => {
    let service: BillingService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new BillingService(
            mockCreateInvoiceUC as any,
            mockProcessPaymentUC as any,
            mockGetInvoicesUC as any,
            mockCreateInstallmentsUC as any,
            mockGetInstallmentsUC as any
        );
    });

    it('getInvoices() يجب أن ينادي الـ UseCase', async () => {
        mockGetInvoicesUC.execute.mockResolvedValue({ success: true, data: [] });
        const result = await service.getInvoices({});
        expect(result.success).toBe(true);
        expect(mockGetInvoicesUC.execute).toHaveBeenCalled();
    });

    it('createInvoice() يجب أن ينادي الـ UseCase', async () => {
        const dto = { appointmentId: 'a1', totalAmount: 100 } as any;
        mockCreateInvoiceUC.execute.mockResolvedValue({ success: true, data: { id: 'i1' } } as any);
        const result = await service.createInvoice(dto);
        expect(result.success).toBe(true);
        expect(mockCreateInvoiceUC.execute).toHaveBeenCalledWith(dto);
    });

    it('processPayment() يجب أن ينادي الـ UseCase', async () => {
        const dto = { amount: 50, method: 'cash' } as any;
        mockProcessPaymentUC.execute.mockResolvedValue({ success: true, data: { id: 'i1' } } as any);
        const result = await service.processPayment('i1', dto);
        expect(result.success).toBe(true);
        expect(mockProcessPaymentUC.execute).toHaveBeenCalledWith('i1', dto);
    });

    it('getDashboardKPIs() يجب أن يستدعي الـ analytics UseCase', async () => {
        const result = await service.getDashboardKPIs();
        expect(result.success).toBe(true);
    });

    it('createInstallments() يجب أن ينادي الـ UseCase', async () => {
        mockCreateInstallmentsUC.execute.mockResolvedValue({ success: true, data: [] });
        const result = await service.createInstallments({} as any);
        expect(result.success).toBe(true);
        expect(mockCreateInstallmentsUC.execute).toHaveBeenCalled();
    });

    it('getInstallmentsByInvoiceId() يجب أن ينادي الـ UseCase', async () => {
        mockGetInstallmentsUC.execute.mockResolvedValue({ success: true, data: [] });
        const result = await service.getInstallmentsByInvoiceId('i1');
        expect(result.success).toBe(true);
        expect(mockGetInstallmentsUC.execute).toHaveBeenCalledWith('i1');
    });

    it('getMonthlyComparison() يجب أن يعمل بنجاح', async () => {
        const result = await service.getMonthlyComparison();
        expect(result.success).toBe(true);
    });

    it('getMonthlyRevenueChart() يجب أن يعمل بنجاح', async () => {
        const result = await service.getMonthlyRevenueChart();
        expect(result.success).toBe(true);
    });
});
