import { supabase } from '../clients/supabase';
import { toISODateString } from '../../utils/dateUtils';
import type { DashboardKPIs, WeeklyChartData, MonthlyRevenueData, VisitTypeData } from '../../domain/models';
import { parseAppointmentStatus } from '../contracts/appointment.contract';

export class DashboardRepository {
    async getKPIs(date: string, monthStart: string): Promise<DashboardKPIs> {
        const [
            todayStats,
            monthPatients,
            revenueStats,
            outstandingStats,
            totalPatientsStats
        ] = await Promise.all([
            supabase.from('appointments').select('status').eq('appointment_date', date),
            supabase.from('patients').select('id', { count: 'exact' }).gte('created_at', monthStart),
            supabase.from('invoices').select('total_paid').gte('invoice_date', monthStart).neq('status', 'cancelled'),
            supabase.from('invoices').select('balance').neq('status', 'cancelled'),
            supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_active', true)
        ]);

        const today = todayStats.data || [];

        return {
            todayTotal: today.length,
            totalPatients: totalPatientsStats.count || 0,
            todayCompleted: today.filter(a => parseAppointmentStatus(a.status) === 'completed').length,
            todayCancelled: today.filter(a => parseAppointmentStatus(a.status) === 'cancelled').length,
            todayPending: today.filter(a => {
                const s = parseAppointmentStatus(a.status);
                return s === 'pending' || s === 'confirmed';
            }).length,
            newPatientsMonth: monthPatients.count || 0,
            monthlyRevenue: (revenueStats.data || []).reduce((sum, r) => sum + (Number(r.total_paid) || 0), 0),
            totalOutstanding: (outstandingStats.data || []).reduce((sum, r) => sum + (Number(r.balance) || 0), 0)
        };
    }

    async getWeeklyAppointments(): Promise<WeeklyChartData[]> {
        const now = new Date();
        const days: Date[] = [];
        const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

        for (let i = 6; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            days.push(d);
        }

        const startDate = toISODateString(days[0] as Date);
        const endDate = toISODateString(days[days.length - 1] as Date);

        // ── N+1 FIX: استعلام واحد يجلب كل المواعيد للأسبوع بدل 7 استعلامات ──
        const { data } = await supabase
            .from('appointments')
            .select('appointment_date')
            .gte('appointment_date', startDate)
            .lte('appointment_date', endDate);

        const appointmentsByDate = (data || []).reduce((acc: Record<string, number>, curr) => {
            acc[curr.appointment_date] = (acc[curr.appointment_date] || 0) + 1;
            return acc;
        }, {});

        return days.map(date => {
            const dateStr = toISODateString(date);
            return {
                date: dateStr,
                dayName: dayNames[date.getDay()] || '',
                count: appointmentsByDate[dateStr] || 0
            };
        });
    }

    async getMonthlyRevenue(): Promise<MonthlyRevenueData[]> {
        const months = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
        const now = new Date();
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        
        const mStart = sixMonthsAgo.toISOString();
        const mEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

        // ── N+1 FIX: استعلام واحد يجلب كل الفواتير للـ 6 أشهر بدل 6 استعلامات ──
        const { data } = await supabase
            .from('invoices')
            .select('invoice_date, total_paid')
            .gte('invoice_date', mStart)
            .lte('invoice_date', mEnd)
            .neq('status', 'cancelled');

        const revenueByMonth = (data || []).reduce((acc: Record<string, number>, curr) => {
            if (!curr.invoice_date) return acc;
            const date = new Date(curr.invoice_date);
            const key = `${date.getFullYear()}-${date.getMonth()}`;
            acc[key] = (acc[key] || 0) + (Number(curr.total_paid) || 0);
            return acc;
        }, {});

        const results = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            results.push({
                date: months[d.getMonth()] || '',
                revenue: revenueByMonth[key] || 0
            });
        }

        return results;
    }

    async getVisitTypeDistribution(): Promise<VisitTypeData[]> {
        const { data, error } = await supabase
            .from('appointments')
            .select('type');

        if (error) throw error;

        const labels: Record<string, string> = {
            'examination': 'كشف',
            'follow-up': 'استشارة',
            'procedure': 'إجراء',
            'emergency': 'طوارئ',
            're-examination': 'إعادة كشف'
        };

        const counts = ((data as any[]) || []).reduce((acc: Record<string, number>, row: any) => {
            const type = row.type || 'examination';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {});

        return Object.entries(counts).map(([type, count]) => ({
            type,
            label: labels[type] || type,
            count: Number(count)
        }));
    }
}

export const dashboardRepository = new DashboardRepository();
