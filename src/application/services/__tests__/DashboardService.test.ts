// src/application/services/__tests__/DashboardService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardService } from '../DashboardService';
import { dashboardRepository } from '../../../infrastructure/repositories/dashboardRepository';

vi.mock('../../../infrastructure/repositories/dashboardRepository', () => ({
    dashboardRepository: {
        getKPIs: vi.fn(),
        getWeeklyAppointments: vi.fn(),
        getMonthlyRevenue: vi.fn(),
        getVisitTypeDistribution: vi.fn(),
    }
}));

describe('DashboardService', () => {
    let service: DashboardService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new DashboardService();
    });

    it('getKPIs() تعيد البيانات بنجاح', async () => {
        vi.mocked(dashboardRepository.getKPIs).mockResolvedValue({ todayTotal: 10 } as any);
        const result = await service.getKPIs('2026-03-01', '2026-03-01');
        expect(result.success).toBe(true);
    });

    it('getWeeklyAppointments() تعيد البيانات بنجاح', async () => {
        vi.mocked(dashboardRepository.getWeeklyAppointments).mockResolvedValue([]);
        const result = await service.getWeeklyAppointments();
        expect(result.success).toBe(true);
    });

    it('getMonthlyRevenue() تعيد البيانات بنجاح', async () => {
        vi.mocked(dashboardRepository.getMonthlyRevenue).mockResolvedValue([]);
        const result = await service.getMonthlyRevenue();
        expect(result.success).toBe(true);
    });

    it('getVisitTypeDistribution() تعيد البيانات بنجاح', async () => {
        vi.mocked(dashboardRepository.getVisitTypeDistribution).mockResolvedValue([]);
        const result = await service.getVisitTypeDistribution();
        expect(result.success).toBe(true);
    });

    describe('Error Handling', () => {
        it('getKPIs() يمسك الخطأ', async () => {
            vi.mocked(dashboardRepository.getKPIs).mockRejectedValue(new Error('err'));
            const result = await service.getKPIs('2026-03-01', '2026-03-01');
            expect(result.success).toBe(false);
        });

        it('getWeeklyAppointments() يمسك الخطأ', async () => {
            vi.mocked(dashboardRepository.getWeeklyAppointments).mockRejectedValue(new Error('err'));
            const result = await service.getWeeklyAppointments();
            expect(result.success).toBe(false);
        });

        it('getMonthlyRevenue() يمسك الخطأ', async () => {
            vi.mocked(dashboardRepository.getMonthlyRevenue).mockRejectedValue(new Error('err'));
            const result = await service.getMonthlyRevenue();
            expect(result.success).toBe(false);
        });

        it('getVisitTypeDistribution() يمسك الخطأ', async () => {
            vi.mocked(dashboardRepository.getVisitTypeDistribution).mockRejectedValue(new Error('err'));
            const result = await service.getVisitTypeDistribution();
            expect(result.success).toBe(false);
        });
    });
});
