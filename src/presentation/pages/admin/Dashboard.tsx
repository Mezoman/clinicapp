import React from 'react';
import { useNavigate } from 'react-router-dom';
import { memo } from 'react';
import {
    Calendar,
    Users,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    RefreshCw,
    CreditCard,
    Plus,
    Clock,
    Eye,
    MoreHorizontal,
    Minus
} from 'lucide-react';
import {
    AreaChart,
    Area,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useDashboard } from '../../hooks/useDashboard';
import { useTodayAppointments } from '../../hooks/useAppointments';
import { formatCurrency } from '../../../utils/formatters';
import { DashboardSkeleton } from '../../components/ui/PageLoader';
import { Badge } from '../../components/ui/Badge';
import type { AppointmentDTO } from '../../../application/dtos/appointment.dto';

const PIE_COLORS = ['#2563eb', '#059669', '#d97706', '#dc2626', '#7c3aed'];

/* KPI configuration */
interface KpiConfig {
    key: 'totalPatients' | 'todayTotal' | 'monthlyRevenue' | 'totalOutstanding';
    label: string;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    accent: string;
    accentLight: string;
    accentMed: string;
    isCurrency?: boolean;
}

const KPI_CONFIG: KpiConfig[] = [
    {
        key: 'totalPatients',
        label: 'إجمالي المرضى',
        icon: Users,
        accent: '#2563eb',
        accentLight: 'rgba(37,99,235,0.08)',
        accentMed: 'rgba(37,99,235,0.14)',
    },
    {
        key: 'todayTotal',
        label: 'مواعيد اليوم',
        icon: Calendar,
        accent: '#059669',
        accentLight: 'rgba(5,150,105,0.08)',
        accentMed: 'rgba(5,150,105,0.14)',
    },
    {
        key: 'monthlyRevenue',
        label: 'إيراد الشهر',
        icon: CreditCard,
        accent: '#7c3aed',
        accentLight: 'rgba(124,58,237,0.08)',
        accentMed: 'rgba(124,58,237,0.14)',
        isCurrency: true,
    },
    {
        key: 'totalOutstanding',
        label: 'ديون متأخرة',
        icon: AlertCircle,
        accent: '#dc2626',
        accentLight: 'rgba(220,38,38,0.08)',
        accentMed: 'rgba(220,38,38,0.14)',
        isCurrency: true,
    },
];

export default function Dashboard() {
    const navigate = useNavigate();
    const { kpis, visitTypes, loading, error, refresh, monthlyComparison, monthlyRevenueChart } = useDashboard();
    const { appointments: todayAppointments, loading: todayLoading } = useTodayAppointments();

    const renderTimelineContent = () => {
        if (todayLoading) {
            return Array.from({ length: 4 }).map((_, i) => (
                <div key={`skel-${i}`} className="w-72 h-28 rounded-card border border-[var(--border-subtle)] animate-pulse bg-[var(--bg-card)]" />
            ));
        }
        if (todayAppointments.length === 0) {
            return (
                <div className="w-full min-h-[112px] rounded-panel border border-dashed border-[var(--border-color)] flex flex-col items-center justify-center gap-2 text-[var(--text-muted)] px-6 py-8">
                    <Calendar className="w-8 h-8 opacity-25" aria-hidden="true" />
                    <p className="text-sm font-semibold">لا توجد مواعيد متبقية لليوم</p>
                </div>
            );
        }
        return todayAppointments.map((apt) => (
            <AppointmentCard
                key={apt.id}
                apt={apt}
                onClick={() => navigate(`/admin/patients/${apt.patientId}`)}
            />
        ));
    };

    const renderTableContent = () => {
        if (todayLoading) {
            return Array.from({ length: 3 }).map((_, i) => (
                <tr key={`skel-row-${i}`}>
                    <td colSpan={5} className="px-5 py-3.5 animate-pulse">
                        <div className="h-9 bg-[var(--color-gray-100)] dark:bg-[var(--color-gray-800)] rounded-card w-full" />
                    </td>
                </tr>
            ));
        }
        if (todayAppointments.length === 0) {
            return (
                <tr>
                    <td colSpan={5} className="px-5 py-14 text-center text-[var(--text-muted)]">
                        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-20" aria-hidden="true" />
                        <p className="text-base font-semibold">لا توجد مواعيد لليوم</p>
                    </td>
                </tr>
            );
        }
        return todayAppointments.map((apt) => (
            <AppointmentRow
                key={apt.id}
                apt={apt}
                onViewPatient={() => navigate(`/admin/patients/${apt.patientId}`)}
                onManage={() => navigate('/admin/appointments')}
            />
        ));
    };

    if (loading) return <DashboardSkeleton />;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-20 animate-in">
                <div className="text-center p-10 bg-[var(--bg-card)] rounded-panel border border-[var(--border-subtle)] shadow-[var(--shadow-lg)] max-w-md mx-auto">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <AlertCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">تعذر تحميل البيانات</h2>
                    <p className="text-[var(--text-muted)] text-sm mb-7 leading-relaxed">{error}</p>
                    <button
                        onClick={refresh}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-red-600 text-white rounded-card font-semibold hover:bg-red-700 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                        حاول مرة أخرى
                    </button>
                </div>
            </div>
        );
    }

    const changePercent = monthlyComparison?.changePercent;

    return (
        <div className="space-y-6 animate-in pb-20" dir="rtl">

            {/* ── KPI Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {KPI_CONFIG.map((cfg) => {
                    const Icon = cfg.icon;
                    const rawVal = kpis?.[cfg.key] ?? 0;
                    const displayVal = cfg.isCurrency ? formatCurrency(rawVal as number) : (rawVal as number);
                    const showTrend = cfg.key === 'totalPatients' || cfg.key === 'monthlyRevenue';
                    const isPositive = (changePercent ?? 0) >= 0;

                    return (
                        <div
                            key={cfg.key}
                            className="kpi-card dcms-card p-5 group"
                            style={{ '--kpi-accent': cfg.accent } as React.CSSProperties}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div
                                    className="w-10 h-10 rounded-card flex items-center justify-center shrink-0 transition-all duration-300"
                                    style={{ background: cfg.accentLight, color: cfg.accent }}
                                >
                                    <Icon className="w-5 h-5" aria-hidden="true" />
                                </div>
                                {showTrend && changePercent != null && (
                                    <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
                                        isPositive
                                            ? 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10'
                                            : 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-500/10'
                                    }`}>
                                        {isPositive
                                            ? <TrendingUp className="w-3 h-3" />
                                            : <TrendingDown className="w-3 h-3" />
                                        }
                                        <span>{isPositive ? '+' : ''}{changePercent}%</span>
                                    </div>
                                )}
                                {!showTrend && (
                                    <div className="flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full text-[var(--text-muted)] bg-[var(--color-gray-100)] dark:bg-[var(--color-gray-800)]">
                                        <Minus className="w-3 h-3" />
                                    </div>
                                )}
                            </div>
                            <p className="text-sm text-[var(--text-muted)] mb-1">{cfg.label}</p>
                            <p className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                                {displayVal}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* ── Charts Row ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Revenue Area Chart */}
                <div className="lg:col-span-2 dcms-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-[var(--text-primary)]">الإيرادات — آخر 6 أشهر</h3>
                            <p className="text-sm text-[var(--text-muted)] mt-0.5">تحليل التدفق النقدي الشهري</p>
                        </div>
                    </div>
                    <div className="h-64" style={{ direction: 'ltr' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlyRevenueChart} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                                <defs>
                                    <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.12} />
                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-subtle)" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'Cairo, sans-serif' }}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: 'var(--text-muted)', fontSize: 12, fontFamily: 'Cairo, sans-serif' }}
                                    tickFormatter={(v) => `${v / 1000}k`}
                                    width={44}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-subtle)',
                                        boxShadow: 'var(--shadow-lg)',
                                        backgroundColor: 'var(--bg-card)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="revenue"
                                    stroke="#2563eb"
                                    strokeWidth={2.5}
                                    fillOpacity={1}
                                    fill="url(#gradRevenue)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#2563eb', stroke: '#fff', strokeWidth: 2 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Donut Chart */}
                <div className="dcms-card p-6">
                    <h3 className="text-base font-bold text-[var(--text-primary)] mb-5">التخصصات والزيارات</h3>
                    <div className="relative h-52 mb-5">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={visitTypes}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={62}
                                    outerRadius={86}
                                    paddingAngle={4}
                                    dataKey="count"
                                    nameKey="label"
                                    stroke="none"
                                >
                                    {visitTypes.map((entry, index) => (
                                        <Cell key={`cell-${entry.label}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: '10px',
                                        border: '1px solid var(--border-subtle)',
                                        boxShadow: 'var(--shadow-lg)',
                                        backgroundColor: 'var(--bg-card)',
                                        color: 'var(--text-primary)',
                                        fontSize: '13px',
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-2xl font-bold text-[var(--text-primary)]">
                                {visitTypes.reduce((a, c) => a + c.count, 0)}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] mt-0.5">إجمالي</span>
                        </div>
                    </div>
                    <div className="space-y-2.5">
                        {visitTypes.slice(0, 4).map((type, i) => (
                            <div key={type.label} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                                    <span className="text-sm text-[var(--text-secondary)]">{type.label}</span>
                                </div>
                                <span className="text-sm font-semibold text-[var(--text-primary)]">{type.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Today's Timeline ── */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <div>
                        <h4 className="text-base font-bold text-[var(--text-primary)]">الجدول الزمني لليوم</h4>
                        <p className="text-sm text-[var(--text-muted)] mt-0.5">المواعيد القادمة مرتبة زمنياً</p>
                    </div>
                    <button
                        onClick={() => navigate('/admin/appointments')}
                        className="text-sm font-semibold text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] transition-colors"
                    >
                        عرض الكل
                    </button>
                </div>
                <div className="overflow-x-auto pb-4 -mx-1 custom-scrollbar">
                    <div className="flex gap-4 min-w-max px-1">
                        {renderTimelineContent()}
                    </div>
                </div>
            </div>

            {/* ── Appointments Table ── */}
            <div className="dcms-card overflow-hidden">
                <div className="px-6 py-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-bold text-[var(--text-primary)]">قائمة مواعيد اليوم</h3>
                        <p className="text-sm text-[var(--text-muted)] mt-0.5">تتبع تفصيلي لقائمة المواعيد</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-right dcms-table">
                        <thead>
                            <tr>
                                <th>المريض</th>
                                <th>الخدمة</th>
                                <th>الوقت</th>
                                <th>الحالة</th>
                                <th className="text-left" />
                            </tr>
                        </thead>
                        <tbody>{renderTableContent()}</tbody>
                    </table>
                </div>
            </div>

            {/* ── FAB ── */}
            <button
                onClick={() => navigate('/admin/appointments')}
                aria-label="إضافة موعد جديد"
                className="fixed bottom-8 left-8 gradient-primary text-white flex items-center gap-2.5 px-6 py-4 rounded-full shadow-[var(--shadow-primary)] hover:opacity-90 active:scale-95 transition-all z-50 text-sm font-semibold"
            >
                <Plus className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>موعد جديد</span>
            </button>
        </div>
    );
}

const AppointmentCard = memo(({ apt, onClick }: { apt: AppointmentDTO; onClick: () => void }) => (
    <button
        onClick={onClick}
        className="w-72 bg-[var(--bg-card)] p-4 rounded-card border border-[var(--border-subtle)] shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all text-right group border-r-[3px] border-r-[var(--color-primary-500)]"
    >
        <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 bg-[var(--color-primary-50)] dark:bg-[rgba(37,99,235,0.10)] text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] font-semibold px-2.5 py-1 rounded-full text-xs">
                <Clock className="w-3 h-3" aria-hidden="true" />
                <span>{apt.time}</span>
            </div>
            <span className="text-xs font-medium text-[var(--text-muted)]">مؤكد</span>
        </div>
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-card bg-[var(--color-primary-50)] dark:bg-[rgba(37,99,235,0.10)] flex items-center justify-center text-[var(--color-primary-600)] font-bold text-sm shrink-0 group-hover:bg-[var(--color-primary-500)] group-hover:text-white transition-all">
                {apt.patientName.charAt(0)}
            </div>
            <div className="min-w-0">
                <p className="font-semibold text-[var(--text-primary)] text-sm truncate">{apt.patientName}</p>
                <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">{apt.type}</p>
            </div>
        </div>
    </button>
));

const AppointmentRow = memo(({ apt, onViewPatient, onManage }: { apt: AppointmentDTO; onViewPatient: () => void; onManage: () => void }) => (
    <tr>
        <td>
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-card bg-[var(--color-primary-50)] dark:bg-[rgba(37,99,235,0.10)] flex items-center justify-center text-[var(--color-primary-600)] dark:text-[var(--color-primary-400)] font-semibold text-sm shrink-0">
                    {apt.patientName.charAt(0)}
                </div>
                <div>
                    <div className="text-sm font-semibold text-[var(--text-primary)]">{apt.patientName}</div>
                    <div className="text-xs text-[var(--text-muted)]">#{apt.patientId?.slice(0, 6)}</div>
                </div>
            </div>
        </td>
        <td>
            <span className="text-sm text-[var(--text-secondary)]">{apt.type}</span>
        </td>
        <td>
            <div className="inline-flex items-center gap-1.5 bg-[var(--bg-table-header)] px-2.5 py-1 rounded-card text-sm font-medium text-[var(--text-secondary)] border border-[var(--border-subtle)]">
                <Clock className="w-3 h-3 text-[var(--text-muted)]" aria-hidden="true" />
                <span className="ltr-text">{apt.time}</span>
            </div>
        </td>
        <td>
            <Badge variant={apt.status as any} />
        </td>
        <td className="text-left">
            <div className="flex items-center justify-end gap-1.5">
                <button
                    onClick={onViewPatient}
                    className="dcms-action-btn"
                    title="عرض الملف"
                    aria-label="عرض الملف الشخصي للمريض"
                >
                    <Eye className="w-4 h-4" />
                </button>
                <button
                    onClick={onManage}
                    className="dcms-action-btn"
                    title="خيارات"
                    aria-label="خيارات إضافية للموعد"
                >
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </td>
    </tr>
));

AppointmentCard.displayName = 'AppointmentCard';
AppointmentRow.displayName = 'AppointmentRow';
