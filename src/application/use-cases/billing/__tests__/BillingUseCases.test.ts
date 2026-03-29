// src/application/use-cases/billing/__tests__/BillingUseCases.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { billingAnalyticsUseCase } from '../BillingAnalyticsUseCase';
import { getInvoicesUseCase } from '../GetInvoicesUseCase';
import { billingRepository } from '../../../../infrastructure/repositories/billingRepository';
import { Invoice } from '../../../../domain/models/billing';

vi.mock('../../../../infrastructure/repositories/billingRepository', () => ({
    billingRepository: {
        getInvoices: vi.fn(),
        getInvoicesByDateRange: vi.fn(),
        getAllActiveInvoices: vi.fn(),
    }
}));

function makeInvoice(overrides = {}) {
    return Invoice.reconstruct({
        id: 'inv-1', patientId: 'p1', patientName: 'محمد',
        appointmentId: undefined, invoiceNumber: 'INV-001', invoiceDate: '2026-03-01',
        services: [{ serviceId: 's1', name: 'كشف', quantity: 1, unitPrice: 500, total: 500 }],
        subtotal: 500, discount: 0, discountReason: undefined,
        taxAmount: 0, taxRate: 0,
        total: 500, payments: [], totalPaid: 300, balance: 200,
        status: 'partial', dueDate: undefined, notes: undefined,
        createdAt: '2026-03-01T00:00:00Z', updatedAt: '2026-03-01T00:00:00Z',
        ...overrides
    });
}

// ─── GetInvoicesUseCase ────────────────────────
describe('GetInvoicesUseCase', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب إرجاع قائمة الفواتير كـ DTOs', async () => {
        vi.mocked(billingRepository.getInvoices).mockResolvedValue({
            invoices: [makeInvoice(), makeInvoice({ id: 'inv-2', invoiceNumber: 'INV-002' })],
            total: 2
        } as any);
        const result = await getInvoicesUseCase.execute();

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toHaveLength(2);
            expect(result.data[0]?.invoiceNumber).toBe('INV-001');
        }
    });

    it('يجب تمرير patientId للـ repository', async () => {
        vi.mocked(billingRepository.getInvoices).mockResolvedValue({ invoices: [], total: 0 } as any);
        await getInvoicesUseCase.execute({ patientId: 'p1' });
        expect(billingRepository.getInvoices).toHaveBeenCalledWith({ patientId: 'p1' });
    });

    it('يجب إرجاع failure عند خطأ DB', async () => {
        vi.mocked(billingRepository.getInvoices).mockRejectedValue(new Error('timeout'));
        const result = await getInvoicesUseCase.execute();
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain('فشل');
    });
});

// ─── BillingAnalyticsUseCase ───────────────────
describe('BillingAnalyticsUseCase.getMonthlyComparison()', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب حساب نسبة التغيير بشكل صحيح', async () => {
        // الشهر الحالي: 1000 جنيه، الشهر الماضي: 800 جنيه
        vi.mocked(billingRepository.getInvoicesByDateRange)
            .mockResolvedValueOnce([makeInvoice({ totalPaid: 600 }), makeInvoice({ totalPaid: 400 })] as any)  // current: 1000
            .mockResolvedValueOnce([makeInvoice({ totalPaid: 800 })] as any);  // prev: 800

        const result = await billingAnalyticsUseCase.getMonthlyComparison();

        expect(result.currentMonth).toBe(1000);
        expect(result.previousMonth).toBe(800);
        expect(result.changePercent).toBe(25); // (1000-800)/800 * 100 = 25%
    });

    it('يجب إرجاع changePercent=100 عند شهر ماضٍ بصفر', async () => {
        vi.mocked(billingRepository.getInvoicesByDateRange)
            .mockResolvedValueOnce([makeInvoice({ totalPaid: 500 })] as any)  // current: 500
            .mockResolvedValueOnce([]);  // prev: 0

        const result = await billingAnalyticsUseCase.getMonthlyComparison();
        expect(result.changePercent).toBe(100);
    });

    it('يجب إرجاع changePercent=0 عند شهرين بصفر', async () => {
        vi.mocked(billingRepository.getInvoicesByDateRange)
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        const result = await billingAnalyticsUseCase.getMonthlyComparison();
        expect(result.changePercent).toBe(0);
        expect(result.currentMonth).toBe(0);
        expect(result.previousMonth).toBe(0);
    });
});

describe('BillingAnalyticsUseCase.getDashboardKPIs()', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب حساب KPIs بشكل صحيح', async () => {
        const paidInvoice = makeInvoice({ totalPaid: 500, balance: 0, status: 'paid' });
        const partialInvoice = makeInvoice({ totalPaid: 200, balance: 300, status: 'partial' });
        const issuedInvoice = makeInvoice({ totalPaid: 0, balance: 400, status: 'issued' });

        vi.mocked(billingRepository.getInvoicesByDateRange)
            .mockResolvedValueOnce([paidInvoice, partialInvoice] as any)  // monthly
            .mockResolvedValueOnce([paidInvoice, partialInvoice, issuedInvoice] as any);  // yearly

        vi.mocked(billingRepository.getAllActiveInvoices)
            .mockResolvedValue([partialInvoice, issuedInvoice] as any);  // active

        const kpis = await billingAnalyticsUseCase.getDashboardKPIs();

        expect(kpis.monthlyRevenue).toBe(700);    // 500 + 200
        expect(kpis.yearlyRevenue).toBe(700);     // 500 + 200 + 0
        expect(kpis.totalOutstanding).toBe(700);  // 300 + 400
        expect(kpis.pendingInvoices).toBe(2);     // partial + issued
    });

    it('يجب إرجاع أصفار إذا لا توجد فواتير', async () => {
        vi.mocked(billingRepository.getInvoicesByDateRange)
            .mockResolvedValue([]);
        vi.mocked(billingRepository.getAllActiveInvoices)
            .mockResolvedValue([]);

        const kpis = await billingAnalyticsUseCase.getDashboardKPIs();
        expect(kpis.monthlyRevenue).toBe(0);
        expect(kpis.yearlyRevenue).toBe(0);
        expect(kpis.totalOutstanding).toBe(0);
        expect(kpis.pendingInvoices).toBe(0);
    });
});

describe('BillingAnalyticsUseCase.getMonthlyRevenueChart()', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب إرجاع 6 أشهر من البيانات', async () => {
        vi.mocked(billingRepository.getInvoicesByDateRange)
            .mockResolvedValue([makeInvoice({ totalPaid: 1000 })] as any);

        const chart = await billingAnalyticsUseCase.getMonthlyRevenueChart();

        expect(chart).toHaveLength(6);
        const totalRevenue = chart.reduce((sum, item) => sum + item.revenue, 0);
        expect(totalRevenue).toBe(1000);
        
        chart.forEach(item => {
            expect(item.month).toBeTruthy();
            expect(typeof item.revenue).toBe('number');
        });
    });

    it('يجب أن يكون الشهر الأخير هو الشهر الحالي', async () => {
        vi.mocked(billingRepository.getInvoicesByDateRange)
            .mockResolvedValue([]);

        const chart = await billingAnalyticsUseCase.getMonthlyRevenueChart();
        const arabicMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const currentMonthName = arabicMonths[new Date().getMonth()];

        expect(chart[chart.length - 1]?.month).toBe(currentMonthName);
    });
});
