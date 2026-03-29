import { useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toISODateString } from '../../utils/dateUtils';
import { logger } from '../../utils/logger';
import { app } from '../../application/container';
import type {
    DashboardKPIsDTO,
    WeeklyChartDataDTO,
    MonthlyRevenueDataDTO,
    VisitTypeDataDTO
} from '../../application/dtos/dashboard.dto';

interface DashboardData {
    kpis: DashboardKPIsDTO | null;
    weeklyData: WeeklyChartDataDTO[];
    monthlyData: MonthlyRevenueDataDTO[];
    visitTypes: VisitTypeDataDTO[];
    monthlyComparison: { currentMonth: number; previousMonth: number; changePercent: number } | null;
    monthlyRevenueChart: { month: string; revenue: number }[];
}

const DASHBOARD_QUERY_KEY = 'dashboard';

export function useDashboard() {
    const {
        data,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
    } = useQuery<DashboardData, Error>({
        queryKey: [DASHBOARD_QUERY_KEY],
        staleTime: 5 * 60 * 1000,
        queryFn: async () => {
            const today = toISODateString(new Date());
            const now = new Date();
            const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01T00:00:00Z`;

            // PERF-03 FIX: All dashboard data fetched in one cached Promise.all
            // getMonthlyComparison and getMonthlyRevenueChart moved here from Dashboard.tsx useEffect
            const [kpisResult, weeklyResult, monthlyResult, typesResult, compResult, chartResult] = await Promise.all([
                app.dashboardService.getKPIs(today, monthStart),
                app.dashboardService.getWeeklyAppointments(),
                app.dashboardService.getMonthlyRevenue(),
                app.dashboardService.getVisitTypeDistribution(),
                app.billingService.getMonthlyComparison(),
                app.billingService.getMonthlyRevenueChart(),
            ]);

            if (!kpisResult.success) throw new Error(kpisResult.error);
            if (!weeklyResult.success) throw new Error(weeklyResult.error);
            if (!monthlyResult.success) throw new Error(monthlyResult.error);
            if (!typesResult.success) throw new Error(typesResult.error);

            return {
                kpis: kpisResult.data,
                weeklyData: [...weeklyResult.data],
                monthlyData: [...monthlyResult.data],
                visitTypes: [...typesResult.data],
                monthlyComparison: compResult.success ? compResult.data : null,
                monthlyRevenueChart: chartResult.success ? chartResult.data : [],
            };
        }
    });

    useEffect(() => {
        if (isError && error) {
            logger.error('Dashboard Load Error:', error);
        }
    }, [isError, error]);

    const refresh = useCallback(async () => {
        await refetch();
    }, [refetch]);

    return {
        kpis: data?.kpis ?? null,
        weeklyData: data?.weeklyData ?? [],
        monthlyData: data?.monthlyData ?? [],
        visitTypes: data?.visitTypes ?? [],
        monthlyComparison: data?.monthlyComparison ?? null,
        monthlyRevenueChart: data?.monthlyRevenueChart ?? [],
        loading: isLoading || isFetching,
        error: isError ? (error?.message ?? 'فشل في تحميل بيانات لوحة التحكم') : null,
        refresh,
    };
}
