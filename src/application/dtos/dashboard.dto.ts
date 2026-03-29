export interface DashboardKPIsDTO {
    readonly todayTotal: number;
    readonly totalPatients: number;
    readonly todayCompleted: number;
    readonly todayCancelled: number;
    readonly todayPending: number;
    readonly newPatientsMonth: number;
    readonly monthlyRevenue: number;
    readonly totalOutstanding: number;
}

export interface WeeklyChartDataDTO {
    readonly date: string;
    readonly dayName: string;
    readonly count: number;
}

export interface MonthlyRevenueDataDTO {
    readonly date: string;
    readonly revenue: number;
}

export interface VisitTypeDataDTO {
    readonly type: string;
    readonly label: string;
    readonly count: number;
}
