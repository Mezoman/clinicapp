import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams, Link } from 'react-router-dom';
import { useMedicalRecords } from '../../hooks/useMedicalRecords';
import { 
    User, 
    FileHeart, 
    CalendarDays, 
    Receipt, 
    Loader2, 
    AlertCircle, 
    Phone, 
    Mail, 
    Droplets, 
    Clock,
    PlusCircle,
    FilePlus,
    MoreVertical,
    Smile,
    Download,
    Edit3,
    Eye,
    FolderOpen,
    UserCog,
    Banknote
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import PatientTimeline from '../../components/PatientTimeline';
import InvoicePrintTemplate from '../../components/InvoicePrintTemplate';
import { app } from '../../../application/container';
import { APPOINTMENT_STATUS_MAP, APPOINTMENT_TYPE_MAP, INVOICE_STATUS_MAP, GENDER_MAP } from '../../../constants';
import { formatDate, formatTime } from '../../../utils/dateUtils';
import { formatCurrency, formatPhone } from '../../../utils/formatters';
import type { PatientDTO } from '../../../application/dtos/patient.dto';
import type { AppointmentDTO } from '../../../application/dtos/appointment.dto';

import type { InvoiceDTO } from '../../../application/dtos/billing.dto';

type Tab = 'info' | 'medical' | 'appointments' | 'billing' | 'timeline';

const Tooth = ({ number, status = 'healthy' }: { number: number, status?: 'healthy' | 'treated' | 'problem' }) => {
    const statusClasses = {
        healthy: 'bg-[var(--bg-card)] border-[var(--border-subtle)] text-slate-500 hover:border-primary/50',
        treated: 'bg-primary border-primary/20 text-white shadow-lg shadow-primary/20',
        problem: 'bg-red-500 border-red-200 dark:border-red-900/30 text-white shadow-lg shadow-red-500/20'
    };

    return (
        <div className={`w-10 h-14 flex flex-col items-center justify-center border-[1.5px] transition-all cursor-pointer text-xs font-black rounded-xl ${statusClasses[status]} hover:scale-110 active:scale-95 font-numbers`}>
            <span>{number}</span>
        </div>
    );
};

export default function PatientProfile() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const [patient, setPatient] = useState<PatientDTO | null>(null);
    const [appointments, setAppointments] = useState<readonly AppointmentDTO[]>([]);
    const { data: records = [] } = useMedicalRecords(id || null);
    const [invoices, setInvoices] = useState<readonly InvoiceDTO[]>([]);
    const [loading, setLoading] = useState(true);

    const queryParams = new URLSearchParams(location.search);
    const initialTab = (queryParams.get('tab') as Tab) || 'appointments';
    const [activeTab, setActiveTab] = useState<Tab>(initialTab);
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const [appointmentStatusFilter, setAppointmentStatusFilter] = useState<string>('all');
    const [printInvoice, setPrintInvoice] = useState<InvoiceDTO | null>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setShowActionsMenu(false);
            }
        };

        if (showActionsMenu) {
            document.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showActionsMenu]);

    const filteredAppointments = appointmentStatusFilter === 'all'
      ? appointments
      : appointments.filter(a => a.status === appointmentStatusFilter);

    useEffect(() => {
        const tab = queryParams.get('tab') as Tab;
        if (tab && tab !== activeTab) {
            setActiveTab(tab);
        }
    }, [location.search]);

    useEffect(() => {
        if (!id) return;
        async function load() {
            try {
                const [pRes, aRes, iRes] = await Promise.all([
                    app.patientService.getById(id!),
                    app.appointmentService.getAppointments({ patientId: id! }),
                    app.billingService.getInvoices({ patientId: id! }),
                ]);

                if (pRes.success && pRes.data) setPatient(pRes.data);
                else if (!pRes.success) toast.error(pRes.error || 'فشل في تحميل بيانات المريض');

                if (aRes.success && aRes.data) setAppointments(aRes.data);
                if (iRes.success && iRes.data) setInvoices(iRes.data);
            } catch {
                toast.error('حدث خطأ غير متوقع في تحميل بيانات المريض');
            } finally {
                setLoading(false); // يُستدعى دائماً — نجاح أو فشل
            }
        }
        load();
    }, [id]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <Loader2 className="w-12 h-12 text-primary animate-spin" role="status" aria-label="جاري تحميل بيانات المريض..." />
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">جاري تحميل الملف الشخصي...</p>
        </div>
    );
    if (!patient) return (
        <div className="text-center py-20 px-4">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">المريض غير موجود</h2>
            <p className="text-slate-500 mb-8 max-w-xs mx-auto">عذراً، لم نتمكن من العثور على ملف المريض المطلوب في قاعدة البيانات.</p>
            <Link to="/admin/patients" className="px-8 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">العودة للقائمة</Link>
        </div>
    );

    // CQ-05 FIX: LucideIcon instead of any
    const tabs: { key: Tab; label: string; icon: LucideIcon }[] = [
        { key: 'appointments', label: 'المواعيد', icon: CalendarDays },
        { key: 'medical', label: 'السجلات الطبية', icon: FolderOpen },
        { key: 'billing', label: 'الفواتير', icon: Receipt },
        { key: 'info', label: 'المعلومات الشخصية', icon: UserCog },
        { key: 'timeline', label: 'خط الزمن', icon: Clock },
    ];

    return (
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 sm:space-y-8 animate-in" dir="rtl">
            {/* Breadcrumbs Placeholder or Navigation */}
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-slate-400">
                <Link to="/admin/patients" className="hover:text-primary transition-colors">
                    المرضى
                </Link>
                <span className="text-slate-300">/</span>
                <span className="text-[var(--text-primary)]">{patient.fullName}</span>
            </div>

            {/* Patient Profile Header */}
            <div className="bg-[var(--bg-card)] rounded-[2rem] sm:rounded-[2.5rem] shadow-sm border-[1.5px] border-[var(--border-color)] p-6 sm:p-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 w-full sm:w-auto">
                        <div className="relative">
                            <div className="size-24 sm:size-28 rounded-full bg-[var(--bg-page)] flex items-center justify-center text-4xl font-black text-slate-300 ring-8 ring-[var(--bg-page)]/50 shadow-inner">
                                {patient.fullName.charAt(0)}
                            </div>
                            <span className="absolute bottom-2 right-2 size-6 bg-emerald-500 border-[3px] border-[var(--bg-card)] rounded-full shadow-sm animate-pulse-subtle"></span>
                        </div>
                        <div className="flex flex-col gap-3 text-center sm:text-right">
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 sm:gap-4">
                                <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] tracking-tight leading-tight">{patient.fullName}</h1>
                                <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest font-numbers shadow-sm border border-primary/5">معرّف: #{patient.id.slice(0, 8)}</span>
                            </div>
                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-y-3 gap-x-6 sm:gap-x-8 mt-1">
                                <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 group">
                                    <div className="p-1.5 bg-[var(--bg-page)] rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-sm border border-[var(--border-subtle)]">
                                        <Phone className="size-3.5" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold font-numbers" dir="ltr">{formatPhone(patient.phone)}</span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 group">
                                    <div className="p-1.5 bg-[var(--bg-page)] rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-sm border border-[var(--border-subtle)]">
                                        <CalendarDays className="size-3.5" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold">آخر زيارة: <span className="font-numbers">{patient.lastVisitDate ? formatDate(patient.lastVisitDate) : '---'}</span></span>
                                </div>
                                <div className="flex items-center gap-2.5 text-slate-500 dark:text-slate-400 group">
                                    <div className="p-1.5 bg-[var(--bg-page)] rounded-lg group-hover:bg-primary/10 group-hover:text-primary transition-all shadow-sm border border-[var(--border-subtle)]">
                                        <User className="size-3.5" />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold font-numbers">{patient.birthDate ? `${new Date().getFullYear() - new Date(patient.birthDate).getFullYear()} سنة` : '---'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
                        <button 
                            onClick={() => navigate('/admin/appointments', { state: { patientId: patient.id, patientName: patient.fullName } })}
                            className="flex-1 lg:flex-none bg-primary text-white font-black px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 text-xs sm:text-sm"
                        >
                            <PlusCircle className="size-5" />
                            <span>حجز موعد</span>
                        </button>
                        <button 
                             onClick={() => navigate('/admin/medical-records', { state: { patientId: patient.id, patientName: patient.fullName } })}
                             className="flex-1 lg:flex-none bg-[var(--bg-card)] text-[var(--text-primary)] font-black px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl border border-[var(--border-subtle)] hover:bg-[var(--bg-page)] transition-all flex items-center justify-center gap-3 shadow-sm text-xs sm:text-sm"
                        >
                            <FilePlus className="size-5" />
                            <span>إضافة سجل</span>
                        </button>
                        <div className="relative">
                            <button 
                                onClick={() => setShowActionsMenu(v => !v)}
                                className="size-11 sm:size-12 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-[var(--bg-page)] rounded-2xl border border-[var(--border-subtle)] transition-all shadow-sm"
                                aria-label="خيارات إضافية"
                                aria-expanded={showActionsMenu}
                                aria-haspopup="true"
                            >
                                <MoreVertical className="size-5" />
                            </button>
                            {showActionsMenu && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setShowActionsMenu(false)} />
                                    <div className="absolute left-0 top-14 z-50 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--border-subtle)] py-2 min-w-[200px]" role="menu">
                                        <button
                                            onClick={() => { setActiveTab('info'); setShowActionsMenu(false); }}
                                            className="w-full text-right px-5 py-3 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 hover:bg-[var(--bg-page)] flex items-center gap-3 transition-colors uppercase tracking-widest"
                                            role="menuitem"
                                        >
                                            <UserCog className="size-4 text-slate-400" />
                                            تعديل بيانات المريض
                                        </button>
                                        <button
                                            onClick={() => { navigate('/admin/appointments'); setShowActionsMenu(false); }}
                                            className="w-full text-right px-5 py-3 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 hover:bg-[var(--bg-page)] flex items-center gap-3 transition-colors uppercase tracking-widest"
                                            role="menuitem"
                                        >
                                            <CalendarDays className="size-4 text-slate-400" />
                                            حجز موعد جديد
                                        </button>
                                        <button
                                            onClick={() => { window.print(); setShowActionsMenu(false); }}
                                            className="w-full text-right px-5 py-3 text-xs sm:text-sm font-black text-slate-700 dark:text-slate-300 hover:bg-[var(--bg-page)] flex items-center gap-3 transition-colors uppercase tracking-widest"
                                            role="menuitem"
                                        >
                                            <Download className="size-4 text-slate-400" />
                                            طباعة الملف
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Teeth Chart Section */}
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] shadow-sm border-[1.5px] border-[var(--border-color)] p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary shadow-inner">
                            <Smile className="size-6" />
                        </div>
                        <h3 className="font-extrabold text-xl text-[var(--text-primary)] tracking-tight">
                            مخطط الأسنان (Teeth Chart)
                        </h3>
                    </div>
                    <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-slate-400">
                        <div className="flex items-center gap-2"><span className="size-3 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)]"></span> سليم</div>
                        <div className="flex items-center gap-2"><span className="size-3 rounded-full bg-primary shadow-sm shadow-primary/20"></span> معالج</div>
                        <div className="flex items-center gap-2"><span className="size-3 rounded-full bg-red-500 shadow-sm shadow-red-500/20"></span> مشكلة</div>
                    </div>
                </div>
                <div className="flex flex-col items-center gap-10 overflow-x-auto py-4">
                    {/* Upper Arch */}
                    <div className="flex flex-col items-center gap-2 min-w-max">
                        <div className="flex gap-1">
                            {/* Left Upper 18-11 */}
                            <div className="flex gap-1 ml-4">
                                {[18, 17, 16, 15, 14, 13, 12, 11].map(n => <Tooth key={n} number={n} />)}
                            </div>
                            {/* Right Upper 21-28 */}
                            <div className="flex gap-1">
                                {[21, 22, 23, 24, 25, 26, 27, 28].map(n => <Tooth key={n} number={n} />)}
                            </div>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">الفك العلوي</p>
                    </div>
                    {/* Lower Arch */}
                    <div className="flex flex-col items-center gap-2 min-w-max">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">الفك السفلي</p>
                        <div className="flex gap-1">
                            {/* Left Lower 48-41 */}
                            <div className="flex gap-1 ml-4">
                                {[48, 47, 46, 45, 44, 43, 42, 41].map(n => <Tooth key={n} number={n} />)}
                            </div>
                            {/* Right Lower 31-38 */}
                            <div className="flex gap-1">
                                {[31, 32, 33, 34, 35, 36, 37, 38].map(n => <Tooth key={n} number={n} />)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-[var(--border-subtle)] overflow-x-auto shrink-0 -mx-4 sm:-mx-8 px-4 sm:px-8" role="tablist" aria-label="ملف المريض">
                <div className="flex gap-6 sm:gap-10 whitespace-nowrap min-w-max">
                    {tabs.map((tab) => (
                        <button 
                            key={tab.key} 
                            onClick={() => setActiveTab(tab.key)} 
                            role="tab"
                            aria-selected={activeTab === tab.key}
                            className={`flex flex-col items-center pb-5 transition-all border-b-2 relative ${activeTab === tab.key ? 'text-primary font-black border-primary' : 'text-slate-400 dark:text-slate-500 font-bold border-transparent hover:text-slate-600 dark:hover:text-slate-300'}`}
                        >
                            <span className="text-xs uppercase tracking-widest flex items-center gap-3">
                                <tab.icon aria-hidden={true} className={`size-4 transition-transform duration-300 ${activeTab === tab.key ? 'scale-110' : ''}`} />
                                {tab.label}
                            </span>
                            {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full blur-[2px] opacity-30"></span>}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Contents */}
            <div className="animate-fade-in pb-10">
                {activeTab === 'appointments' && (
                    <div className="bg-[var(--bg-card)] rounded-panel shadow-sm border-[1.5px] border-[var(--border-color)] overflow-hidden mb-8" role="tabpanel">
                        <div className="p-6 border-b border-[var(--border-subtle)] flex flex-col sm:flex-row justify-between items-center gap-4">
                            <h3 className="font-black text-lg text-[var(--text-primary)] uppercase tracking-tight">سجل المواعيد</h3>
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <select
                                  aria-label="تصفية حسب الحالة"
                                  value={appointmentStatusFilter}
                                  onChange={e => setAppointmentStatusFilter(e.target.value)}
                                  className="flex-1 sm:flex-none p-2.5 bg-[var(--bg-page)] rounded-xl text-slate-600 dark:text-slate-400 text-xs font-black uppercase tracking-widest border border-[var(--border-subtle)] outline-none cursor-pointer shadow-sm"
                                >
                                  <option value="all">كل الحالات</option>
                                  <option value="confirmed">مؤكد</option>
                                  <option value="completed">مكتمل</option>
                                  <option value="cancelled">ملغي</option>
                                  <option value="no-show">لم يحضر</option>
                                </select>
                                <button
                                  aria-label="تصدير المواعيد إلى Excel"
                                  onClick={() => {
                                    const rows = [...appointments].map(apt => ({
                                      التاريخ: formatDate(apt.date),
                                      الوقت: apt.time ? formatTime(apt.time) : '---',
                                      الخدمة: APPOINTMENT_TYPE_MAP[apt.type as keyof typeof APPOINTMENT_TYPE_MAP] || apt.type,
                                      الحالة: APPOINTMENT_STATUS_MAP[apt.status as keyof typeof APPOINTMENT_STATUS_MAP]?.label || apt.status,
                                    }));
                                    import('xlsx').then(XLSX => {
                                      const ws = XLSX.utils.json_to_sheet(rows);
                                      const wb = XLSX.utils.book_new();
                                      XLSX.utils.book_append_sheet(wb, ws, 'المواعيد');
                                      XLSX.writeFile(wb, `مواعيد-${patient?.fullName ?? 'مريض'}.xlsx`);
                                    });
                                  }}
                                  className="p-2.5 bg-[var(--bg-page)] rounded-xl text-slate-600 dark:text-slate-400 hover:text-primary transition-colors border border-[var(--border-subtle)] shadow-sm"
                                >
                                    <Download className="size-4" />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto overflow-y-hidden">
                            <table className="w-full text-right border-collapse min-w-[600px] dcms-table">
                                <thead className="bg-[var(--bg-table-header)]">
                                    <tr>
                                        <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">التاريخ والوقت</th>
                                        <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">الخدمة</th>
                                        <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide">الحالة</th>
                                        <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide text-left">التكلفة</th>
                                        <th className="px-6 py-4 text-[var(--text-muted)] text-xs font-black uppercase tracking-wide"></th>
                                    </tr>
                                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                                    {appointments.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                                                <div className="size-16 bg-[var(--bg-page)] rounded-full flex items-center justify-center mx-auto mb-4 opacity-50 border border-[var(--border-subtle)]">
                                                    <CalendarDays className="w-8 h-8 text-slate-300" />
                                                </div>
                                                <p className="text-sm font-black uppercase tracking-widest text-slate-400">لا توجد مواعيد مسجلة</p>
                                            </td>
                                        </tr>
                                    ) : filteredAppointments.map((apt) => {
                                        const s = APPOINTMENT_STATUS_MAP[apt.status as keyof typeof APPOINTMENT_STATUS_MAP];
                                        const relatedInvoice = invoices.find(inv => inv.appointmentId === apt.id);
                                        return (
                                            <tr key={apt.id} className="hover:bg-[var(--bg-page)]/70 transition-colors group">
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="font-extrabold text-[var(--text-primary)] font-numbers tracking-tight">{formatDate(apt.date)}</span>
                                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest font-numbers">{apt.time ? formatTime(apt.time) : '---'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className="bg-primary/10 text-primary text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm border border-primary/5">
                                                        {APPOINTMENT_TYPE_MAP[apt.type as keyof typeof APPOINTMENT_TYPE_MAP]}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest shadow-sm ${s.bgColor} ${s.color}`}>
                                                        <span className={`size-1.5 rounded-full bg-current shadow-sm`}></span>
                                                        {s.label}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-sm font-black text-left text-[var(--text-primary)] font-numbers group-hover:text-primary transition-colors">
                                                    {relatedInvoice ? formatCurrency(relatedInvoice.total) : '---'}
                                                </td>
                                                <td className="px-6 py-5 text-left">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => navigate(`/admin/appointments?id=${apt.id}`)}
                                                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/10"
                                                            title="تعديل الموعد"
                                                            aria-label="تعديل الموعد"
                                                        >
                                                            <Edit3 className="size-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'medical' && (
                    <div className="space-y-4" role="tabpanel">
                        {records.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 shadow-sm text-center border border-slate-100 dark:border-slate-800">
                                <FileHeart className="w-16 h-16 text-slate-200 mx-auto mb-6 opacity-20" />
                                <p className="text-xl font-black text-slate-400">لا توجد سجلات طبية مسجلة</p>
                            </div>
                        ) : records.map((rec) => (
                            <div key={rec.id} className="bg-white dark:bg-slate-900 rounded-[2rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6 group hover:border-primary/20 transition-all duration-500">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary shadow-inner">
                                            <FileHeart className="size-4" />
                                        </div>
                                        <span className="text-xs font-black text-primary uppercase tracking-widest font-numbers">{formatDate(rec.visitDate)}</span>
                                    </div>
                                    <button
                                      onClick={() => navigate('/admin/medical-records', {
                                        state: { patientId: patient.id, patientName: patient.fullName, recordId: rec.id }
                                      })}
                                      className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all shadow-sm"
                                      aria-label="عرض السجل الطبي"
                                      title="عرض السجل الطبي"
                                    >
                                      <Eye className="size-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2 p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest">الشكوى الرئيسية</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-[1.75] font-numbers">{rec.chiefComplaint}</p>
                                    </div>
                                    <div className="space-y-2 p-5 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-xs text-slate-400 font-black uppercase tracking-widest">التشخيص</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-[1.75] font-numbers">{rec.diagnosis}</p>
                                    </div>
                                    <div className="md:col-span-2 space-y-2 p-5 bg-primary/5 dark:bg-primary/10 rounded-2xl border border-primary/10">
                                        <p className="text-xs text-primary font-black uppercase tracking-widest">الإجراء الطبي المنفذ</p>
                                        <p className="text-sm font-black text-slate-900 dark:text-white leading-[1.75] font-numbers">{rec.treatmentDone}</p>
                                    </div>
                                    {rec.prescription && (
                                        <div className="md:col-span-2 space-y-2 p-5 bg-emerald-50/30 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/20">
                                            <p className="text-xs text-emerald-600 font-black uppercase tracking-widest">الوصفة الطبية (Prescription)</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white underline decoration-emerald-500/30 underline-offset-8 leading-[1.75] font-numbers">{rec.prescription}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'billing' && (
                    <div className="space-y-4" role="tabpanel">
                         {invoices.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-12 shadow-sm text-center border border-slate-100 dark:border-slate-800">
                                <Receipt className="w-16 h-16 text-slate-200 mx-auto mb-6 opacity-20" />
                                <p className="text-xl font-black text-slate-400">لا توجد فواتير صادرة</p>
                            </div>
                        ) : invoices.map((inv) => {
                            const s = INVOICE_STATUS_MAP[inv.status as keyof typeof INVOICE_STATUS_MAP];
                            return (
                                <div key={inv.id} className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm border border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-10 group hover:border-emerald-500/20 transition-all duration-500">
                                    <div className="flex-1 space-y-8">
                                        <div className="flex items-center gap-4">
                                            <div className="size-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                                                <Receipt className="size-5" />
                                            </div>
                                            <span className="font-black text-slate-900 dark:text-white font-numbers text-lg tracking-tighter">{inv.invoiceNumber}</span>
                                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] shadow-sm border border-current/10 ${s.bgColor} ${s.color}`}>{s.label}</span>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-10">
                                            <div><p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2 leading-loose">قيمة الفاتورة</p><p className="font-black text-slate-900 dark:text-white font-numbers text-xl">{formatCurrency(inv.total)}</p></div>
                                            <div><p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2 leading-loose">إجمالي المدفوع</p><p className="font-black text-emerald-500 font-numbers text-xl">{formatCurrency(inv.totalPaid)}</p></div>
                                            <div><p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2 leading-loose">المبلغ المتبقي</p><p className="font-black text-red-500 font-numbers text-xl">{formatCurrency(inv.balance)}</p></div>
                                            <div><p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-2 leading-loose">تاريخ الإصدار</p><p className="font-extrabold text-slate-600 dark:text-slate-400 font-numbers">{formatDate(inv.invoiceDate)}</p></div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => {
                                            setPrintInvoice(inv);
                                            requestAnimationFrame(() => requestAnimationFrame(() => window.print()));
                                          }}
                                          className="p-3 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-2xl border border-slate-50 dark:border-slate-800 transition-all shadow-sm"
                                          title="طباعة الفاتورة"
                                          aria-label="طباعة الفاتورة"
                                        >
                                          <Download className="size-5" />
                                        </button>
                                        <button
                                          onClick={() => navigate('/admin/billing', { state: { highlightInvoice: inv.id } })}
                                          className="p-3 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-2xl border border-slate-50 dark:border-slate-800 transition-all shadow-sm"
                                          title="عرض في صفحة الفواتير"
                                          aria-label="عرض الفاتورة"
                                        >
                                          <Eye className="size-5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {activeTab === 'info' && (
                    <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-6 sm:p-10 shadow-sm border-[1.5px] border-[var(--border-color)] animate-in slide-in-from-bottom-5" role="tabpanel">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16">
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 border-r-4 border-primary pr-5">
                                    <h4 className="font-black text-xl text-[var(--text-primary)] tracking-tight">المعلومات الأساسية</h4>
                                </div>
                                <div className="space-y-4">
                                    {[
                                        { label: 'الرقم القومي', value: patient.nationalId, icon: User, classes: 'font-numbers' },
                                        { label: 'تاريخ الميلاد', value: patient.birthDate ? formatDate(patient.birthDate) : null, icon: CalendarDays, classes: 'font-numbers' },
                                        { label: 'العنوان', value: patient.address, icon: Mail },
                                        { label: 'فصيلة الدم', value: patient.bloodType, icon: Droplets, classes: 'text-red-500' },
                                        { label: 'النوع', value: GENDER_MAP[patient.gender], icon: User },
                                    ].filter(i => i.value).map((item) => (
                                        <div key={item.label} className="flex items-center gap-6 p-4 bg-[var(--bg-page)]/50 rounded-2xl border border-[var(--border-subtle)] group hover:border-primary/20 transition-all shadow-sm">
                                            <div className="size-12 rounded-xl bg-[var(--bg-card)] flex items-center justify-center text-slate-400 group-hover:text-primary shadow-sm border border-[var(--border-subtle)] group-hover:scale-110 transition-all">
                                                <item.icon className="size-6" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">({item.label})</p>
                                                <p className={`text-base font-black text-[var(--text-primary)] ${item.classes || ''}`}>{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="flex items-center gap-4 border-r-4 border-red-500 pr-5">
                                    <h4 className="font-black text-xl text-red-500 tracking-tight">التاريخ الطبي</h4>
                                </div>
                                <div className="space-y-5">
                                    {[
                                        { label: 'الحساسية والمشاكل الصحية', value: patient.allergies, type: 'alert' },
                                        { label: 'الأمراض المزمنة', value: patient.chronicDiseases },
                                        { label: 'الأدوية الحالية', value: patient.currentMedications },
                                        { label: 'ملاحظات إضافية', value: patient.notes },
                                    ].filter(i => i.value).map((item) => (
                                        <div key={item.label} className={`p-6 rounded-2.5xl border transition-all ${item.type === 'alert' ? 'bg-red-50/30 dark:bg-red-900/10 border-red-100 dark:border-red-900/30 ring-4 ring-red-500/5' : 'bg-[var(--bg-page)]/50 border-[var(--border-subtle)]'}`}>
                                            <p className={`text-xs font-black uppercase tracking-widest mb-3 ${item.type === 'alert' ? 'text-red-500' : 'text-slate-400'}`}>{item.label}</p>
                                            <p className={`text-sm leading-[1.75] ${item.type === 'alert' ? 'text-red-900 dark:text-red-200 font-black' : 'text-[var(--text-primary)] font-bold'}`}>{item.value}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'timeline' && (
                    <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-6 sm:p-10 shadow-sm border-[1.5px] border-[var(--border-color)] animate-in zoom-in-95" role="tabpanel">
                        <PatientTimeline
                            appointments={[...appointments]}
                            medicalRecords={[...records]}
                            invoices={[...invoices]}
                        />
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 shrink-0">
                <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-[2rem] border border-[var(--border-subtle)] shadow-sm flex items-center gap-6 group hover:border-primary/20 transition-all duration-500">
                    <div className="size-12 sm:size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
                        <CalendarDays className="size-6 sm:size-7" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-loose">إجمالي الزيارات</p>
                        <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-numbers tracking-tight">{patient.totalVisits.toLocaleString('ar-EG')}</p>
                    </div>
                </div>
                <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-[2rem] border border-[var(--border-subtle)] shadow-sm flex items-center gap-6 group hover:border-emerald-500/20 transition-all duration-500">
                    <div className="size-12 sm:size-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                        <Banknote className="size-6 sm:size-7" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-loose">إجمالي المدفوعات</p>
                        <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-numbers tracking-tight">{patient.totalPaid.toLocaleString('ar-EG')} <span className="text-sm">ج.م</span></p>
                    </div>
                </div>
                <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-[2rem] border border-[var(--border-subtle)] shadow-sm flex items-center gap-6 group hover:border-orange-500/20 transition-all duration-500 sm:col-span-2 md:col-span-1">
                    <div className="size-12 sm:size-14 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-inner group-hover:scale-110 transition-transform">
                        <FilePlus className="size-6 sm:size-7" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest leading-loose">السجلات الطبية</p>
                        <p className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] font-numbers tracking-tight">{records.length.toLocaleString('ar-EG')} <span className="text-sm">سجل</span></p>
                    </div>
                </div>
            </div>
            {printInvoice && (
              <InvoicePrintTemplate
                invoice={printInvoice}
                clinicName="عيادة الأسنان"
                doctorName=""
                phone=""
                address=""
              />
            )}
        </div>
    );
}
