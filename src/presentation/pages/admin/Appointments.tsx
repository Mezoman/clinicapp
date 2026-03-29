import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    CalendarDays, 
    Loader2, 
    X, 
    ChevronRight, 
    ChevronLeft,
    Clock, 
    XCircle, 
    Trash2, 
    MessageCircle, 
    User,
    List,
    LayoutGrid,
    MoreVertical,
    Calendar as CalendarIcon,
    PlusCircle,
    CheckCircle2,
    CalendarClock,
    Activity,
    ChevronDown,
    UserCog
} from 'lucide-react';
import { toast } from 'sonner';
import { app } from '../../../application/container';
import { APPOINTMENT_STATUS_MAP, APPOINTMENT_TYPE_MAP } from '../../../constants';
import { formatDate, formatTime, toISODateString, formatDayName, generateTimeSlots } from '../../../utils/dateUtils';
import { formatWhatsAppUrl, generateBookingWhatsAppMessage } from '../../../utils/formatters';
import { DataTable } from '../../components/ui/DataTable';
import { Badge } from '../../components/ui/Badge';
import AppointmentsCalendarGrid from '../../components/calendar/AppointmentsCalendarGrid';
import EnhancedAppointmentForm from '../../components/forms/EnhancedAppointmentForm';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { AppointmentDTO, AppointmentStatusDTO } from '../../../application/dtos/appointment.dto';
import { ClinicSettingsDTO } from '../../../application/dtos/settings.dto';
import { useAuditLog } from '../../hooks/useAuditLog';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { logger } from '../../../utils/logger';

type CalendarView = 'day' | 'week' | 'list';


export default function Appointments() {
    const navigate = useNavigate();
    const [view, setView] = useState<CalendarView>('day');
    const [selectedDate, setSelectedDate] = useState<string>(toISODateString(new Date()));
    const [appointments, setAppointments] = useState<AppointmentDTO[]>([]);
    const [stats, setStats] = useState({ total: 0, completed: 0, upcoming: 0, cancelled: 0 });
    const [loading, setLoading] = useState(true);
    const [selectedAppointment, setSelectedAppointment] = useState<AppointmentDTO | null>(null);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [bookingInitialData, setBookingInitialData] = useState<{ date?: string; time?: string }>({});
    const [settings, setSettings] = useState<ClinicSettingsDTO | null>(null);
    const [flashingIds] = useState<Set<string>>(new Set());

    const bookingModalRef = useRef<HTMLDivElement>(null);

    useFocusTrap(bookingModalRef, showBookingModal, () => setShowBookingModal(false));

    // Audit Log
    const { logAudit } = useAuditLog();

    const fetchAppointments = useCallback(async () => {
        try {
            setLoading(true);
            
            let queryParams: { date?: string, startDate?: string, endDate?: string } = { date: selectedDate };
            
            if (view === 'week') {
                const date = new Date(selectedDate + 'T00:00:00');
                const day = date.getDay();
                // Adjust to Monday (1) through Sunday (0 -> 7)
                const diff = date.getDate() - day + (day === 0 ? -6 : 1); 
                const weekStart = new Date(date.setDate(diff));
                const weekEnd = new Date(weekStart);
                weekEnd.setDate(weekStart.getDate() + 6);
                
                queryParams = {
                    startDate: toISODateString(weekStart),
                    endDate: toISODateString(weekEnd)
                };
            }

            const result = await app.appointmentService.getAppointments(queryParams);
            if (result.success && result.data) {
                const data = result.data;
                setAppointments([...data]);
                
                // Calculate stats based on fetched data
                const s = {
                    total: data.length,
                    completed: data.filter(a => a.status === 'completed').length,
                    upcoming: data.filter(a => a.status === 'confirmed').length,
                    cancelled: data.filter(a => a.status === 'cancelled' || a.status === 'no-show').length
                };
                setStats(s);
            } else {
                setAppointments([]);
            }
        } catch (error) {
            logger.error('Error fetching appointments:', error);
            toast.error('خطأ في تحميل المواعيد');
        } finally {
            setLoading(false);
        }
    }, [selectedDate, view]);

    const fetchSettings = useCallback(async () => {
        try {
            const result = await app.settingsService.getSettings();
            if (result.success && result.data) {
                setSettings(result.data);
            }
        } catch (error) {
            logger.error('Error fetching settings:', error);
        }
    }, []);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            await Promise.all([fetchAppointments(), fetchSettings()]);
            setLoading(false);
        };
        load();
    }, [fetchAppointments, fetchSettings]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setSelectedAppointment(null);
        };
        if (selectedAppointment) {
            globalThis.addEventListener('keydown', handleEscape);
        }
        return () => globalThis.removeEventListener('keydown', handleEscape);
    }, [selectedAppointment]);

    // CQ-05 FIX: AppointmentStatusDTO instead of any
    const handleUpdateStatus = async (id: string, status: AppointmentStatusDTO) => {
        // Optimistic update — نحدّث الـ UI فوراً بدون انتظار الـ DB
        const previousAppointments = appointments;
        setAppointments(prev => 
            prev.map(a => a.id === id ? { ...a, status } : a)
        );

        try {
            await app.appointmentService.updateStatus(id, status);
            toast.success('تم تحديث حالة الموعد');
            
            await logAudit('update', 'appointment', id, undefined, { status }, `Updated status to ${status}`);

            // ✅ نجح — الـ UI محدَّث بالفعل، لا نحتاج refetch
            if (selectedAppointment?.id === id) {
                setSelectedAppointment((prev: AppointmentDTO | null) => prev ? { ...prev, status } : null);
            }
        } catch (error) {
            // ❌ فشل — rollback للحالة السابقة
            setAppointments(previousAppointments);
            logger.error('فشل تحديث الحالة:', error);
            toast.error('خطأ في تحديث الحالة');
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await app.appointmentService.deleteAppointment(id);
            toast.success('تم حذف الموعد بنجاح');
            
            await logAudit('delete', 'appointment', id, undefined, undefined, 'Deleted appointment');

            setConfirmDeleteId(null);
            setSelectedAppointment(null);
            fetchAppointments();
        } catch (error) {
            logger.error('Error deleting appointment:', error);
            toast.error('خطأ في حذف الموعد');
        }
    };

    const handleAddAppointment = (date?: string, time?: string) => {
        setBookingInitialData({ date, time } as { date?: string; time?: string });
        setShowBookingModal(true);
    };

    const timeSlots = useMemo(() => {
        if (!settings) return [];
        const slots1 = generateTimeSlots(settings.shifts.morningStart, settings.shifts.morningEnd, settings.slotDuration);
        const slots2 = generateTimeSlots(settings.shifts.eveningStart, settings.shifts.eveningEnd, settings.slotDuration);
        return [...slots1, ...slots2];
    }, [settings]);

    const columns = [
        {
            header: 'رقم اليوم',
            accessor: (row: AppointmentDTO) => <span className="font-numbers font-black">{row.dailyNumber}</span>
        },
        {
            header: 'المريض',
            accessor: (row: AppointmentDTO) => (
                    <button 
                        type="button"
                        className="flex items-center gap-3 cursor-pointer group outline-none focus:ring-2 focus:ring-primary/20 rounded-lg p-1 text-right w-full"
                        onClick={() => navigate(`/admin/patients/${row.patientId}`)}
                    >
                        <div className="size-10 rounded-xl bg-[var(--bg-card)] flex items-center justify-center font-black group-hover:bg-primary group-hover:text-white transition-all shadow-inner border border-[var(--border-subtle)]">
                            {row.patientName?.charAt(0)}
                        </div>
                        <div>
                            <div className="font-black text-[var(--text-primary)] group-hover:text-primary transition-colors">{row.patientName}</div>
                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.patientPhone}</div>
                        </div>
                    </button>
            )
        },
        {
            header: 'الوقت',
            accessor: (row: AppointmentDTO) => (
                <div className="flex flex-col">
                    <span className="font-numbers font-black text-primary text-base">{formatTime(row.time)}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{row.time}</span>
                </div>
            )
        },
        {
            header: 'الخدمة',
            accessor: (row: AppointmentDTO) => (
                <span className="font-black text-slate-600 dark:text-slate-400">
                    {APPOINTMENT_TYPE_MAP[row.type as keyof typeof APPOINTMENT_TYPE_MAP] || row.type}
                </span>
            )
        },
        {
            header: 'الحالة',
            accessor: (row: AppointmentDTO) => {
                const s = APPOINTMENT_STATUS_MAP[row.status as keyof typeof APPOINTMENT_STATUS_MAP];
                return <Badge variant={row.status as AppointmentStatusDTO}>{s?.label || row.status}</Badge>;
            }
        },
        {
            header: 'الإجراءات',
            className: 'text-left',
            accessor: (row: AppointmentDTO) => (
                <button
                    aria-label="عرض تفاصيل الموعد"
                    onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(row);
                    }}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-secondary-800 rounded-xl transition-colors"
                >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                </button>
            )
        }
    ];

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-12">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white flex items-center gap-4">
                        <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                            <CalendarDays className="size-7" />
                        </div>
                        المواعيد
                    </h1>
                    <p className="text-slate-500 font-bold mt-2 dark:text-slate-400 mr-16">إدارة وتنظيم مواعيد العيادة بدقة واحترافية</p>
                </div>

                <div className="flex flex-wrap items-center gap-6 self-start lg:self-center">
                    {/* View Switcher */}
                    <div className="bg-[var(--bg-card)] p-1.5 rounded-[1.5rem] shadow-sm border border-[var(--border-subtle)] flex gap-1">
                        {[
                            { id: 'day', label: 'اليوم', icon: Clock },
                            { id: 'week', label: 'الإسبوع', icon: LayoutGrid },
                            { id: 'list', label: 'القائمة', icon: List }
                        ].map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setView(v.id as CalendarView)}
                                className={`px-4 sm:px-6 py-2.5 rounded-xl text-[10px] sm:text-xs font-black transition-all duration-300 flex items-center gap-2 ${view === v.id ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' : 'text-slate-400 hover:bg-[var(--bg-page)] hover:text-slate-600'}`}
                            >
                                <v.icon aria-hidden={true} className="w-4 h-4" />
                                <span className="hidden xs:inline">{v.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Date Navigator */}
                    <div className="flex items-center gap-2 sm:gap-4 bg-[var(--bg-card)] p-2 rounded-[1.5rem] shadow-sm border border-[var(--border-subtle)]">
                        <button
                            onClick={() => setSelectedDate(toISODateString(new Date()))}
                            className="px-3 sm:px-4 py-2 hover:bg-primary/10 text-primary text-[10px] sm:text-xs font-black rounded-xl transition-all mr-1 sm:mr-2 whitespace-nowrap border border-primary/20"
                        >
                            اليوم
                        </button>
                        <button
                            aria-label="اليوم السابق"
                            onClick={() => setSelectedDate(toISODateString(new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() - 1))))}
                            className="p-2 sm:p-3 hover:bg-[var(--bg-page)] rounded-xl transition-all hover:scale-110 active:scale-90 text-slate-400"
                        >
                            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                        <div className="px-3 sm:px-6 text-center min-w-[120px] sm:min-w-[160px] border-x border-[var(--border-subtle)]">
                            <div className="text-[9px] sm:text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">{formatDayName(selectedDate)}</div>
                            <div className="text-xs sm:text-sm font-black text-[var(--text-primary)] font-numbers">{formatDate(selectedDate)}</div>
                        </div>
                        <button
                            aria-label="اليوم التالي"
                            onClick={() => setSelectedDate(toISODateString(new Date(new Date(selectedDate).setDate(new Date(selectedDate).getDate() + 1))))}
                            className="p-2 sm:p-3 hover:bg-[var(--bg-page)] rounded-xl transition-all hover:scale-110 active:scale-90 text-slate-400"
                        >
                            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                        </button>
                    </div>

                    <button
                        onClick={() => setShowBookingModal(true)}
                        className="flex items-center gap-3 bg-slate-900 dark:bg-primary px-6 sm:px-8 py-4 rounded-[1.5rem] text-white font-black hover:opacity-90 transition-all shadow-xl shadow-primary/10 active:scale-95 group"
                    >
                        <PlusCircle aria-hidden={true} className="w-5 h-5 sm:w-6 sm:h-6 group-hover:rotate-90 transition-transform duration-500" />
                        <span className="text-sm sm:text-base">موعد جديد</span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="space-y-12">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="relative">
                            <Loader2 role="status" aria-label="جاري تحميل المواعيد..." className="w-16 h-16 text-primary animate-spin" />
                            <div className="absolute inset-0 bg-primary/20 blur-2xl -z-10 animate-pulse" />
                        </div>
                        <p className="text-slate-400 font-black animate-pulse uppercase tracking-widest text-xs">جاري تحميل المواعيد...</p>
                    </div>
                ) : (
                    <>
                        {view === 'list' && (
                            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-subtle)] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <DataTable
                                    columns={columns}
                                    data={appointments}
                                    onRowClick={setSelectedAppointment}
                                    rowClassName={(apt) => flashingIds.has(apt.id) ? 'flash-success' : ''}
                                />
                            </div>
                        )}

                        {view === 'day' && settings && (
                            <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] overflow-hidden shadow-sm animate-in fade-in slide-in-from-bottom-8 duration-700">
                                <div className="grid grid-cols-1 divide-y divide-[var(--border-subtle)]">
                                    {timeSlots.map((time, idx) => {
                                        const apt = appointments.find(a => a.time?.substring(0, 5) === time);
                                        const status = apt ? APPOINTMENT_STATUS_MAP[apt.status as keyof typeof APPOINTMENT_STATUS_MAP] : null;
                                        
                                        const morningSlots = generateTimeSlots(settings.shifts.morningStart, settings.shifts.morningEnd, settings.slotDuration);
                                        const isLastMorning = idx === morningSlots.length - 1;

                                        return (
                                            <div key={time}>
                                                <div className="flex min-h-[120px] group/slot">
                                                    <div className="w-20 sm:w-28 py-8 px-2 sm:px-4 text-center border-l border-[var(--border-subtle)] bg-[var(--bg-page)]/30 flex flex-col justify-center shrink-0">
                                                        <span className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest font-numbers mb-1">{formatTime(time)}</span>
                                                        <div className="text-[9px] sm:text-[10px] text-slate-300 font-bold font-numbers">{time}</div>
                                                    </div>
                                                    <div className="flex-1 p-3 sm:p-5 flex flex-col justify-center relative min-w-0">
                                                        {apt ? (
                                                            <button 
                                                                type="button"
                                                                onClick={() => setSelectedAppointment(apt)}
                                                                className={`
                                                                    ${status?.bgColor || 'bg-[var(--bg-page)]'} ${status?.color || 'text-[var(--text-primary)]'}
                                                                    border-r-[6px] ${status?.color.replace('text-', 'border-') || 'border-slate-300'}
                                                                    rounded-[1.5rem] p-4 sm:p-5 flex flex-wrap gap-4 justify-between items-center group/card cursor-pointer hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500
                                                                    relative overflow-hidden active:scale-[0.98] ring-4 ring-transparent hover:ring-primary/5 outline-none focus:ring-primary/30 w-full text-right
                                                                `}
                                                            >
                                                                <div className="flex items-center gap-3 sm:gap-5 relative z-10 min-w-0">
                                                                    <div className={`shrink-0 size-10 sm:size-14 rounded-2xl ${status?.bgColor.replace('50', '200') || 'bg-slate-200'} flex items-center justify-center font-black transition-all group-hover/card:scale-110 shadow-inner text-lg sm:text-xl border-4 border-white/50 dark:border-black/10`}>
                                                                        {apt.patientName?.charAt(0)}
                                                                    </div>
                                                                    <div className="min-w-0">
                                                                        <h4 className="font-black text-base sm:text-xl tracking-tight mb-1 min-w-0 truncate">{apt.patientName}</h4>
                                                                        <p className="text-[9px] sm:text-xs font-black opacity-60 uppercase tracking-widest truncate">{APPOINTMENT_TYPE_MAP[apt.type as keyof typeof APPOINTMENT_TYPE_MAP] || apt.type}</p>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-4 sm:gap-8 relative z-10">
                                                                    <div className="text-left text-[10px] sm:text-xs font-black hidden xs:block opacity-60">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <Clock className="size-3 sm:size-4" />
                                                                            <span className="font-numbers">{apt.duration} دقيقة</span>
                                                                        </div>
                                                                        <div className="font-numbers tracking-widest text-[9px] sm:text-[10px]">#{apt.dailyNumber}</div>
                                                                    </div>
                                                                    <span className={`
                                                                        ${status?.color.replace('text-', 'bg-') || 'bg-slate-500'} 
                                                                        text-white text-[9px] sm:text-[10px] px-3 sm:px-5 py-1.5 sm:py-2 rounded-full font-black uppercase tracking-[0.1em] shadow-md border border-white/20
                                                                    `}>
                                                                        {status?.label || apt.status}
                                                                    </span>
                                                                </div>
                                                                
                                                                <div className="absolute -left-4 -bottom-4 size-32 opacity-[0.03] pointer-events-none group-hover/card:scale-150 transition-transform duration-1000">
                                                                    <CalendarDays className="size-full rotate-12" />
                                                                </div>
                                                            </button>
                                                        ) : (
                                                            <button 
                                                                onClick={() => handleAddAppointment(selectedDate, time)}
                                                                className="w-full h-full min-h-[70px] border-2 border-dashed border-[var(--border-subtle)] rounded-[1.5rem] flex items-center justify-center text-slate-300 text-xs font-black gap-3 hover:bg-primary/5 hover:border-primary/20 hover:text-primary transition-all duration-300 group/btn"
                                                            >
                                                                <PlusCircle className="size-6 group-hover/btn:scale-125 group-hover/btn:rotate-90 transition-all duration-500 text-slate-200 group-hover/btn:text-primary" />
                                                                <span className="uppercase tracking-widest text-[10px]">فترة متاحة - اضغط للحجز</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                                {isLastMorning && (
                                                    <div className="flex h-16 bg-[var(--bg-page)]/50 items-center justify-center border-y border-[var(--border-subtle)] relative my-2">
                                                        <div className="flex items-center gap-4 px-8 py-2 bg-[var(--bg-card)] rounded-full shadow-sm border border-[var(--border-subtle)] relative z-10 transition-all hover:scale-105">
                                                            <div className="size-2 bg-orange-500 rounded-full animate-pulse" />
                                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">فترة راحة (وقت الغداء)</span>
                                                            <div className="size-2 bg-orange-500 rounded-full animate-pulse" />
                                                        </div>
                                                        <div className="absolute w-[calc(100%-40px)] h-[1px] bg-[var(--border-subtle)]" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {view === 'week' && settings && (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <AppointmentsCalendarGrid
                                    view="week"
                                    selectedDate={selectedDate}
                                    appointments={appointments}
                                    settings={settings}
                                    onAddAppointment={handleAddAppointment}
                                    onSelectAppointment={setSelectedAppointment}
                                    onUpdateStatus={handleUpdateStatus}
                                    onDelete={handleDelete}
                                />
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Stats Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
                {[
                    { label: 'إجمالي المواعيد', value: stats.total, icon: CalendarIcon, color: 'text-slate-400', bg: 'bg-[var(--bg-page)]' },
                    { label: 'مكتمل', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'قادم', value: stats.upcoming, icon: CalendarClock, color: 'text-primary', bg: 'bg-primary/10' },
                    { label: 'ملغى / لم يحضر', value: stats.cancelled, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' }
                ].map((stat) => (
                    <div key={stat.label} className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-[2rem] border border-[var(--border-subtle)] flex items-center justify-between shadow-sm group hover:border-primary/20 transition-all duration-500">
                        <div>
                            <p className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase mb-2 tracking-[0.2em] leading-loose">{stat.label}</p>
                            <p className={`text-3xl sm:text-4xl font-black ${stat.color} leading-tight font-numbers tracking-tighter`}>{stat.value}</p>
                        </div>
                        <div className={`size-12 sm:size-16 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.color} shadow-inner group-hover:scale-110 transition-transform`}>
                            <stat.icon className="size-6 sm:size-8" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Booking Modal */}
            {showBookingModal && settings && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div
                        ref={bookingModalRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="booking-modal-title"
                        className="bg-[var(--bg-card)] rounded-[2.5rem] w-full max-w-5xl max-h-[95vh] sm:max-h-[90vh] shadow-2xl border border-[var(--border-color)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col"
                    >
                        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <h3 id="booking-modal-title" className="text-lg sm:text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                                <div className="w-2.5 h-10 bg-primary rounded-full" />
                                حجز موعد جديد
                            </h3>
                            <button aria-label="إغلاق" onClick={() => setShowBookingModal(false)} className="p-2 hover:bg-[var(--bg-page)] rounded-full transition-colors text-slate-400">
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <EnhancedAppointmentForm
                                settings={settings}
                                initialDate={bookingInitialData.date || selectedDate}
                                initialTime={bookingInitialData.time}
                                onClose={() => setShowBookingModal(false)}
                                onSuccess={(bookedDate?: string) => {
                                    setShowBookingModal(false);
                                    // Switch to the booked date so the new appointment is visible
                                    if (bookedDate && bookedDate !== selectedDate) {
                                        setSelectedDate(bookedDate);
                                    } else {
                                        fetchAppointments();
                                    }
                                    toast.success('تم حجز الموعد بنجاح');
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Detail Slide-in Panel */}
            <div 
                role="dialog" 
                aria-modal="true" 
                aria-labelledby="apt-detail-title"
                className={`
                fixed inset-y-0 left-0 w-full xs:w-[450px] bg-[var(--bg-card)] shadow-3xl border-r border-[var(--border-subtle)] 
                flex flex-col transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] z-50
                ${selectedAppointment ? 'translate-x-0' : '-translate-x-full'}
            `}>
                {selectedAppointment && (
                    <>
                        <div className="p-6 sm:p-8 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card)]/80 backdrop-blur-md sticky top-0 z-10">
                            <div>
                                <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)]">تفاصيل الموعد</h3>
                                <p className="text-[10px] sm:text-xs font-black text-slate-400 uppercase tracking-widest mt-1"># {selectedAppointment.dailyNumber}</p>
                            </div>
                            <button 
                                aria-label="إغلاق"
                                onClick={() => setSelectedAppointment(null)}
                                className="size-10 sm:size-12 flex items-center justify-center rounded-2xl bg-[var(--bg-page)] text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-300"
                            >
                                <X className="size-5 sm:size-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar text-right" dir="rtl">
                            {/* Patient Info Card */}
                            <div className="flex flex-col items-center text-center p-8 bg-slate-50/50 dark:bg-slate-800/30 rounded-[2.5rem] border border-slate-100 dark:border-slate-800/50 relative overflow-hidden group">
                                <div className="size-28 rounded-[2rem] bg-primary/10 text-primary mb-6 flex items-center justify-center border-[6px] border-white dark:border-slate-900 shadow-2xl shadow-primary/20 overflow-hidden text-3xl font-black transition-all group-hover:scale-105 duration-700 relative z-10">
                                    {selectedAppointment.patientName?.charAt(0)}
                                </div>
                                <h4 id="apt-detail-title" className="text-2xl font-black text-slate-900 dark:text-white mb-2 relative z-10">{selectedAppointment.patientName}</h4>
                                <div className="flex items-center gap-2 text-primary bg-primary/5 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest relative z-10 border border-primary/10">
                                    <User className="size-3.5" />
                                    <span>مريض مسجل</span>
                                </div>
                                
                                <div className="absolute top-0 right-0 size-40 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl opacity-50" />
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label htmlFor="apt-service-detail" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-4 block text-right">الخدمة المطلوبة</label>
                                    <div id="apt-service-detail" className="flex items-center gap-4 p-5 bg-[var(--bg-page)] rounded-3xl border border-[var(--border-subtle)] shadow-sm transition-all hover:border-primary/20 group/item">
                                        <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover/item:scale-110 transition-transform">
                                            <Activity className="size-6" />
                                        </div>
                                        <span className="font-black text-[var(--text-primary)]">
                                            {APPOINTMENT_TYPE_MAP[selectedAppointment.type as keyof typeof APPOINTMENT_TYPE_MAP] || selectedAppointment.type}
                                        </span>
                                    </div>
                                </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-4 block text-right">الوقت</span>
                                            <div className="p-5 bg-[var(--bg-page)] rounded-3xl border border-[var(--border-subtle)] shadow-sm font-black font-numbers text-center text-primary text-xl">
                                                {formatTime(selectedAppointment.time)}
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-4 block text-right">التاريخ</span>
                                            <div className="p-5 bg-[var(--bg-page)] rounded-3xl border border-[var(--border-subtle)] shadow-sm font-black text-sm font-numbers text-center text-slate-500 dark:text-slate-400 leading-relaxed">
                                                {formatDate(selectedAppointment.date)}
                                            </div>
                                        </div>
                                    </div>

                                <div className="space-y-3">
                                    <label htmlFor="apt-status-select" className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-4 block text-right">حالة الموعد</label>
                                    <div className="relative group/select">
                                        <select 
                                            id="apt-status-select"
                                            value={selectedAppointment.status}
                                            onChange={(e) => handleUpdateStatus(selectedAppointment.id, e.target.value as AppointmentStatusDTO)}
                                            className="w-full bg-[var(--bg-page)] border border-[var(--border-subtle)] rounded-3xl focus:ring-4 focus:ring-primary/10 font-black text-sm p-4 pr-12 appearance-none shadow-sm transition-all group-hover/select:border-primary/20 text-right text-[var(--text-primary)]"
                                        >
                                            {Object.entries(APPOINTMENT_STATUS_MAP).map(([key, value]) => (
                                                <option key={key} value={key} className="bg-[var(--bg-card)]">{value.label}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="size-5 absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover/select:text-primary transition-colors" />
                                    </div>
                                </div>

                                {selectedAppointment.notes && (
                                    <div className="space-y-3">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mr-4 block text-right">ملاحظات</span>
                                        <div className="p-6 bg-blue-500/5 border border-blue-500/20 rounded-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300 font-bold italic text-right">
                                            "{selectedAppointment.notes}"
                                        </div>
                                    </div>
                                )}

                                {/* WhatsApp and Patient Profile Actions */}
                                <div className="space-y-4 pt-6">
                                    <button
                                        onClick={() => {
                                            const url = formatWhatsAppUrl(selectedAppointment.patientPhone, generateBookingWhatsAppMessage(selectedAppointment.patientName, selectedAppointment.date, selectedAppointment.time, selectedAppointment.dailyNumber));
                                            window.open(url, '_blank');
                                        }}
                                        className="w-full flex items-center justify-center gap-4 p-5 bg-[#25D366] text-white rounded-[2rem] font-black shadow-xl shadow-green-100/30 hover:shadow-green-200/50 transition-all hover:scale-[1.02] active:scale-95 group/wa"
                                    >
                                        <MessageCircle className="size-6 group-hover/wa:rotate-12 transition-transform" />
                                        <span>إرسال تذكير واتساب</span>
                                    </button>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <button
                                            onClick={() => navigate(`/admin/patients/${selectedAppointment.patientId}`)}
                                            className="flex items-center justify-center gap-3 p-5 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-[2rem] border border-[var(--border-subtle)] font-black text-sm shadow-sm hover:bg-[var(--bg-page)] transition-all hover:scale-[1.02] active:scale-95 group/patient"
                                        >
                                            <UserCog className="size-5 group-hover/patient:scale-110 transition-transform" />
                                            ملف المريض
                                        </button>
                                        <button
                                            onClick={() => setConfirmDeleteId(selectedAppointment.id)}
                                            className="flex items-center justify-center gap-3 p-5 bg-red-500/10 text-red-500 rounded-[2rem] border border-red-500/20 font-black text-sm shadow-sm hover:bg-red-500/20 transition-all hover:scale-[1.02] active:scale-95 group/del"
                                        >
                                            <Trash2 className="size-5 group-hover/del:scale-110 transition-transform" />
                                            حذف الموعد
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto p-8 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]/80 backdrop-blur-md sticky bottom-0 z-10 w-full">
                            <button 
                                onClick={() => setSelectedAppointment(null)}
                                className="w-full py-5 rounded-[2rem] bg-slate-900 dark:bg-primary text-white font-black text-base hover:opacity-90 shadow-2xl transition-all active:scale-95"
                            >
                                إغلاق التفاصيل
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Backdrop */}
            {selectedAppointment && (
                <div
                    aria-hidden="true"
                    onClick={() => setSelectedAppointment(null)}
                    className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[45] animate-in fade-in duration-300"
                />
            )}

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!confirmDeleteId}
                title="حذف الموعد"
                message="هل أنت متأكد من حذف هذا الموعد؟ لا يمكن التراجع عن هذا الإجراء."
                confirmLabel="حذف الموعد"
                cancelLabel="إلغاء"
                onConfirm={() => confirmDeleteId && handleDelete(confirmDeleteId)}
                onCancel={() => setConfirmDeleteId(null)}
            />
        </div>
    );
}
