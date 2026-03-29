import { CreateInvoiceUseCase, createInvoiceUseCase } from '../use-cases/billing/CreateInvoiceUseCase';
import { ProcessPaymentUseCase, processPaymentUseCase } from '../use-cases/billing/ProcessPaymentUseCase';
import { GetInvoicesUseCase, getInvoicesUseCase } from '../use-cases/billing/GetInvoicesUseCase';
import { CreateInstallmentsUseCase, createInstallmentsUseCase } from '../use-cases/billing/CreateInstallmentsUseCase';
import { GetInstallmentsUseCase, getInstallmentsUseCase } from '../use-cases/billing/GetInstallmentsUseCase';
import { CreateInvoiceDTO, InvoiceDTO, ProcessPaymentDTO } from '../dtos/billing.dto';
import { AppResult } from '../result';
import type { InstallmentFormData } from '../../domain/models';

/**
 * BillingService acts as a facade for the UI to interact with billing use cases.
 */
export class BillingService {
    constructor(
        private readonly createInvoiceUC: CreateInvoiceUseCase = createInvoiceUseCase,
        private readonly processPaymentUC: ProcessPaymentUseCase = processPaymentUseCase,
        private readonly getInvoicesUC: GetInvoicesUseCase = getInvoicesUseCase,
        private readonly createInstallmentsUC: CreateInstallmentsUseCase = createInstallmentsUseCase,
        private readonly getInstallmentsUC: GetInstallmentsUseCase = getInstallmentsUseCase
    ) { }

    async getInvoices(params?: { patientId?: string }): Promise<AppResult<readonly InvoiceDTO[]>> {
        return this.getInvoicesUC.execute(params);
    }

    async createInvoice(dto: CreateInvoiceDTO): Promise<AppResult<InvoiceDTO>> {
        return this.createInvoiceUC.execute(dto);
    }

    async processPayment(invoiceId: string, dto: ProcessPaymentDTO): Promise<AppResult<InvoiceDTO>> {
        return this.processPaymentUC.execute(invoiceId, dto);
    }

    async getDashboardKPIs() {
        try {
            const { billingAnalyticsUseCase } = await import('../use-cases/billing/BillingAnalyticsUseCase');
            const data = await billingAnalyticsUseCase.getDashboardKPIs();
            return { success: true, data } as const;
        } catch (error) {
            return { success: false, error: 'فشل في جلب الإحصائيات' } as const;
        }
    }

    // CQ-04 FIX: typed InstallmentFormData instead of any
    async createInstallments(dto: InstallmentFormData) {
        const result = await this.createInstallmentsUC.execute(dto);
        if (result.success) {
            return { success: true, data: result.data } as const;
        } else {
            return { success: false, error: result.error } as const;
        }
    }

    async getInstallmentsByInvoiceId(invoiceId: string) {
        const result = await this.getInstallmentsUC.execute(invoiceId);
        if (result.success) {
            return { success: true, data: result.data } as const;
        } else {
            return { success: false, error: result.error } as const;
        }
    }

    async getMonthlyComparison(): Promise<AppResult<{ currentMonth: number; previousMonth: number; changePercent: number }>> {
        try {
            const { billingAnalyticsUseCase } = await import('../use-cases/billing/BillingAnalyticsUseCase');
            const data = await billingAnalyticsUseCase.getMonthlyComparison();
            return { success: true, data } as const;
        } catch {
            return { success: false, error: 'فشل في جلب مقارنة الإيرادات' } as const;
        }
    }

    async getMonthlyRevenueChart(): Promise<AppResult<{ month: string; revenue: number }[]>> {
        try {
            const { billingAnalyticsUseCase } = await import('../use-cases/billing/BillingAnalyticsUseCase');
            const data = await billingAnalyticsUseCase.getMonthlyRevenueChart();
            return { success: true, data } as const;
        } catch {
            return { success: false, error: 'فشل في جلب بيانات الرسم البياني' } as const;
        }
    }
}
