export interface DashboardKPIs {
    readonly todayTotal: number;
    readonly totalPatients: number;
    readonly todayCompleted: number;
    readonly todayCancelled: number;
    readonly todayPending: number;
    readonly newPatientsMonth: number;
    readonly monthlyRevenue: number;
    readonly totalOutstanding: number;
}

export interface WeeklyChartData {
    readonly date: string;
    readonly dayName: string;
    readonly count: number;
}

export interface MonthlyRevenueData {
    readonly date: string;
    readonly revenue: number;
}

export interface VisitTypeData {
    readonly type: string;
    readonly label: string;
    readonly count: number;
}
