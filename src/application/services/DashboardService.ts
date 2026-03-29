import { dashboardRepository } from '../../infrastructure/repositories/dashboardRepository';
import { AppResult, success, failure } from '../result';
import type { DashboardKPIsDTO, WeeklyChartDataDTO, MonthlyRevenueDataDTO, VisitTypeDataDTO } from '../dtos/dashboard.dto';

export class DashboardService {
    async getKPIs(date: string, monthStart: string): Promise<AppResult<DashboardKPIsDTO>> {
        try {
            const kpis = await dashboardRepository.getKPIs(date, monthStart);
            return success(kpis as DashboardKPIsDTO);
        } catch (error) {
            return failure('فشل في جلب مؤشرات الأداء');
        }
    }

    async getWeeklyAppointments(): Promise<AppResult<readonly WeeklyChartDataDTO[]>> {
        try {
            const data = await dashboardRepository.getWeeklyAppointments();
            return success(data as readonly WeeklyChartDataDTO[]);
        } catch (error) {
            return failure('فشل في جلب إحصائيات المواعيد الأسبوعية');
        }
    }

    async getMonthlyRevenue(): Promise<AppResult<readonly MonthlyRevenueDataDTO[]>> {
        try {
            const data = await dashboardRepository.getMonthlyRevenue();
            return success(data as readonly MonthlyRevenueDataDTO[]);
        } catch (error) {
            return failure('فشل في جلب إحصائيات الإيرادات الشهرية');
        }
    }

    async getVisitTypeDistribution(): Promise<AppResult<readonly VisitTypeDataDTO[]>> {
        try {
            const data = await dashboardRepository.getVisitTypeDistribution();
            return success(data as readonly VisitTypeDataDTO[]);
        } catch (error) {
            return failure('فشل في جلب توزيع أنواع الزيارات');
        }
    }
}
