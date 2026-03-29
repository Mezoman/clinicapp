import { billingRepository } from '../../../infrastructure/repositories/billingRepository';

export class BillingAnalyticsUseCase {
    async getMonthlyComparison(): Promise<{ currentMonth: number; previousMonth: number; changePercent: number }> {
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
        const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString();

        // PERF-02 FIX: Run both queries in parallel — they are fully independent
        const [currentMonthInvoices, prevMonthInvoices] = await Promise.all([
            billingRepository.getInvoicesByDateRange(currentMonthStart),
            billingRepository.getInvoicesByDateRange(prevMonthStart, prevMonthEnd),
        ]);

        const currentMonth = currentMonthInvoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);
        const previousMonth = prevMonthInvoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);

        let changePercent = 0;
        if (previousMonth > 0) {
            changePercent = Math.round(((currentMonth - previousMonth) / previousMonth) * 100);
        } else if (currentMonth > 0) {
            changePercent = 100;
        }

        return { currentMonth, previousMonth, changePercent };
    }

    async getDashboardKPIs(): Promise<{ monthlyRevenue: number; yearlyRevenue: number; totalOutstanding: number; pendingInvoices: number; totalInvoiced: number; totalPaid: number }> {
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

        const [monthlyInvoices, yearlyInvoices, allActiveInvoices] = await Promise.all([
            billingRepository.getInvoicesByDateRange(monthStart),
            billingRepository.getInvoicesByDateRange(yearStart),
            billingRepository.getAllActiveInvoices()
        ]);

        const monthlyRevenue = monthlyInvoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);
        const yearlyRevenue = yearlyInvoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);
        const totalOutstanding = allActiveInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);
        const pendingInvoices = allActiveInvoices.filter(inv => inv.status === 'issued' || inv.status === 'partial').length;

        const totalInvoiced = allActiveInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const totalPaid = allActiveInvoices.reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);

        return { monthlyRevenue, yearlyRevenue, totalOutstanding, pendingInvoices, totalInvoiced, totalPaid };
    }

    async getMonthlyRevenueChart(): Promise<{ month: string; revenue: number }[]> {
        // PERF-01 FIX: Single query instead of 6 — fetch all 6 months at once, group in JS
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

        const allInvoices = await billingRepository.getInvoicesByDateRange(sixMonthsAgo.toISOString());

        const results: { month: string; revenue: number }[] = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const year = d.getFullYear();
            const month = d.getMonth();

            const revenue = allInvoices
                .filter(inv => {
                    if (!inv.invoiceDate) return false;
                    const invDate = new Date(inv.invoiceDate);
                    return invDate.getFullYear() === year && invDate.getMonth() === month;
                })
                .reduce((sum, inv) => sum + (inv.totalPaid || 0), 0);

            results.push({
                month: months[month] as string,
                revenue,
            });
        }

        return results;
    }
}

export const billingAnalyticsUseCase = new BillingAnalyticsUseCase();
