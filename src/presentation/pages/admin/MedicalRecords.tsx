import { useState, useEffect, useCallback, useMemo, useRef, memo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    FileHeart, 
    Plus, 
    Loader2, 
    X, 
    Edit2, 
    Trash2, 
    Search, 
    User, 
    Calendar,
    PlusCircle,
    ImageIcon,
    Printer,
    Share2,
    CheckCircle2,
    Stethoscope,
    ChevronLeft,
    Clock
} from 'lucide-react';
import { toast } from 'sonner';
import TeethChart, { type TeethData } from '../../components/TeethChart';
import { useMedicalRecords, MEDICAL_RECORDS_QUERY_KEY } from '../../hooks/useMedicalRecords';
import { useQueryClient } from '@tanstack/react-query';
import { app } from '../../../application/container';
import { formatDate, toISODateString } from '../../../utils/dateUtils';
import type { MedicalRecordDTO, ToothChartEntryDTO } from '../../../application/dtos/medical.dto';
import type { PatientDTO } from '../../../application/dtos/patient.dto';
import { useAutoSave } from '../../hooks/useAutoSave';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { sanitize } from '../../../lib/validation';
import { EmptyState } from '../../components/ui/EmptyState';

// ─── RecordCard (hoisted above MedicalRecords for Vite Fast Refresh compatibility) ───
const RecordCard = memo(({ rec, onEdit, onDelete }: {
    rec: MedicalRecordDTO;
    onEdit: (rec: MedicalRecordDTO) => void;
    onDelete: (id: string) => void;
}) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const affectedTeeth = rec.teethChart ? Object.keys(rec.teethChart).sort().join(', ') : '';

    return (
        <div className="bg-[var(--bg-card)] border-[1.5px] border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-sm hover:shadow-xl transition-all group duration-500">
            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-[var(--border-subtle)]">
                <div className="lg:w-72 shrink-0 bg-[var(--bg-page)]/50 p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-[var(--bg-card)] shadow-xl border border-[var(--border-subtle)] flex items-center justify-center text-primary mb-4 group-hover:scale-105 transition-transform duration-500 relative">
                        <ImageIcon className="w-10 h-10 sm:w-12 sm:h-12 opacity-20" aria-hidden="true" />
                        <div className="absolute inset-0 flex items-center justify-center bg-primary/5 rounded-3xl">
                            <button className="p-3 bg-primary rounded-full text-white shadow-lg shadow-primary/20 scale-90 group-hover:scale-100 transition-transform" aria-label="إضافة مرفق جديد">
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                    </div>
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">المرفقات</p>
                    <p className="text-xs font-bold text-slate-500">لا توجد صور ملفقة</p>
                </div>

                <div className="flex-1 p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4 mb-6 sm:mb-8">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-3 mb-3">
                                <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-black rounded-lg uppercase tracking-widest border border-primary/10">
                                    سجل #{rec.id.slice(0, 6).toUpperCase()}
                                </span>
                                <span className="text-xs text-slate-400 font-bold flex items-center gap-1.5 bg-[var(--bg-page)] px-2 py-1 rounded-md">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {formatDate(rec.visitDate)}
                                </span>
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] leading-tight truncate">{rec.diagnosis}</h3>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                            <button onClick={() => onEdit(rec)} className="p-3 bg-[var(--bg-page)] text-slate-400 hover:text-primary rounded-2xl border border-[var(--border-subtle)] transition-all shadow-sm active:scale-90" aria-label="تعديل السجل">
                                <Edit2 className="w-5 h-5" />
                            </button>
                            <button onClick={() => onDelete(rec.id)} className="p-3 bg-red-500/5 text-red-300 hover:text-red-500 rounded-2xl border border-red-500/10 transition-all shadow-sm active:scale-90" aria-label="حذف السجل">
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8">
                        <div className="space-y-3">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">الإجراء المتخذ</p>
                            <div className="bg-[var(--bg-page)] p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] font-bold text-[var(--text-primary)] leading-relaxed min-h-[80px]">
                                {rec.treatmentDone}
                            </div>
                        </div>
                        {affectedTeeth && (
                            <div className="space-y-3">
                                <p className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">الأسنان المتأثرة</p>
                                <div className="bg-primary/5 p-4 sm:p-5 rounded-2xl border border-primary/10 font-black text-primary tracking-[0.3em] font-mono text-center flex items-center justify-center min-h-[80px]">
                                    {affectedTeeth}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-[var(--bg-page)] rounded-[1.5rem] p-6 border-r-4 border-primary relative overflow-hidden group/notes">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 relative z-10">تفاصيل الملاحظات الطبية</p>
                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400 font-medium relative z-10">
                            {isExpanded ? (rec.doctorNotes || 'لا توجد ملاحظات إضافية') : ((rec.doctorNotes?.slice(0, 180) || 'لا توجد ملاحظات إضافية') + (rec.doctorNotes && rec.doctorNotes.length > 180 ? '...' : ''))}
                        </p>
                        {rec.doctorNotes && rec.doctorNotes.length > 180 && (
                            <button onClick={() => setIsExpanded(!isExpanded)} className="mt-4 text-primary text-xs font-black hover:underline flex items-center gap-1 relative z-10">
                                {isExpanded ? 'طي التفاصيل' : 'عرض السجل كاملاً'}
                            </button>
                        )}
                        <Stethoscope className="absolute left-6 bottom-6 w-16 h-16 text-primary/5 -rotate-12 pointer-events-none group-hover/notes:rotate-0 transition-transform duration-500" />
                    </div>
                </div>
            </div>

            <div className="bg-[var(--bg-page)]/30 px-6 sm:px-8 py-4 flex flex-col md:flex-row items-center justify-between border-t border-[var(--border-subtle)] gap-4 transition-all group-hover:bg-[var(--bg-page)]/50">
                <div className="flex items-center gap-6">
                    <button onClick={() => window.print()} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors"><Printer className="w-4 h-4" />طباعة السجل</button>
                    <button onClick={() => navigator.share?.({ title: `سجل طبي #${rec.id.slice(0, 6).toUpperCase()}`, text: rec.diagnosis }).catch(() => {})} className="flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-primary transition-colors"><Share2 className="w-4 h-4" />مشاركة</button>
                </div>
                <button onClick={() => onEdit(rec)} className="text-xs font-black text-primary flex items-center gap-1 group/btn hover:translate-x-[-4px] transition-transform" dir="rtl">
                    عرض التفاصيل السريرية
                    <ChevronLeft className="w-4 h-4 group-hover/btn:translate-x-[-2px] transition-transform" />
                </button>
            </div>
        </div>
    );
});

// ─── Main Component ───
export default function MedicalRecords() {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    
    // Form and UI state
    const [showModal, setShowModal] = useState(false);
    const [editingRecord, setEditingRecord] = useState<MedicalRecordDTO | null>(null);
    const [saving, setSaving] = useState(false);
    const [patientResults, setPatientResults] = useState<PatientDTO[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dateRangeFilter, setDateRangeFilter] = useState('all');

    const modalRef = useRef<HTMLDivElement>(null);
    useFocusTrap(modalRef, showModal, () => setShowModal(false));

    const [form, setForm] = useState({
        patientId: '', patientName: '', appointmentId: '', visitDate: toISODateString(new Date()),
        chiefComplaint: '', diagnosis: '', treatmentDone: '', prescription: '',
        teethChart: {} as TeethData, doctorNotes: '', followUpDate: '',
    });

    const [currentPatientId, setCurrentPatientId] = useState<string | null>(
        (location.state as { patientId?: string })?.patientId || null
    );

    const { data: records = [], isLoading: loading } = useMedicalRecords(currentPatientId);

    const autoSaveKey = currentPatientId ? `medical-record-${currentPatientId}` : 'medical-record-draft';
    const { lastSaved, isSaving, clear } = useAutoSave(autoSaveKey, form);

    useEffect(() => {
        const state = location.state as { patientId?: string; patientName?: string; appointmentId?: string } | null;
        if (state?.patientId) {
            setCurrentPatientId(state.patientId);
            setForm((prev) => ({
                ...prev,
                patientId: state.patientId || '',
                patientName: state.patientName || '',
                appointmentId: state.appointmentId || '',
            }));
            setShowModal(true);
            window.history.replaceState({}, document.title);
        }
    }, [location.state]);

    const openAdd = useCallback(() => {
        setEditingRecord(null);
        setForm({
            patientId: currentPatientId || '', patientName: '', appointmentId: '',
            visitDate: toISODateString(new Date()),
            chiefComplaint: '', diagnosis: '', treatmentDone: '',
            prescription: '', teethChart: {}, doctorNotes: '', followUpDate: ''
        });
        setShowModal(true);
    }, [currentPatientId]);

    const openEdit = useCallback((rec: MedicalRecordDTO) => {
        setEditingRecord(rec);
        setForm({
            patientId: rec.patientId, patientName: '', appointmentId: rec.appointmentId ?? '',
            visitDate: rec.visitDate, chiefComplaint: rec.chiefComplaint, diagnosis: rec.diagnosis,
            treatmentDone: rec.treatmentDone, prescription: rec.prescription ?? '',
            teethChart: rec.teethChart ? Object.fromEntries(
                Object.entries(rec.teethChart).map(([t, e]) => [Number(t), e.status])
            ) as TeethData : {},
            doctorNotes: rec.doctorNotes ?? '',
            followUpDate: rec.followUpDate ?? '',
        });
        setShowModal(true);
    }, []);

    const [patientSearchTerm, setPatientSearchTerm] = useState('');

    useEffect(() => {
        if (patientSearchTerm.length < 2) {
            setPatientResults([]);
            return;
        }

        const timer = setTimeout(async () => {
            const result = await app.patientService.getPatients({ search: patientSearchTerm });
            if (result.success && result.data) {
                setPatientResults([...result.data.patients]);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [patientSearchTerm]);

    const handlePatientSearch = useCallback((term: string) => {
        setForm((p) => ({ ...p, patientName: term, patientId: '' }));
        setPatientSearchTerm(term);
    }, []);

    function selectPatient(patient: PatientDTO) {
        setForm((p) => ({ ...p, patientName: patient.fullName, patientId: patient.id }));
        setCurrentPatientId(patient.id);
        setPatientResults([]);
    }

    async function handleSave() {
        if (!form.patientId && !editingRecord) {
            toast.error('يرجى اختيار المريض');
            return;
        }
        if (!form.chiefComplaint.trim() || !form.diagnosis.trim() || !form.treatmentDone.trim()) {
            toast.error('يرجى ملء الحقول المطلوبة');
            return;
        }
        setSaving(true);
        try {
            const teethChart: Record<string, ToothChartEntryDTO> = Object.fromEntries(
                Object.entries(form.teethChart).map(([t, s]) => [t, { status: s as ToothChartEntryDTO['status'] }])
            );

            const data: Partial<MedicalRecordDTO> = {
                patientId: editingRecord?.patientId ?? form.patientId,
                appointmentId: form.appointmentId || undefined,
                visitDate: form.visitDate,
                chiefComplaint: sanitize(form.chiefComplaint.trim()),
                diagnosis: sanitize(form.diagnosis.trim()),
                treatmentDone: sanitize(form.treatmentDone.trim()),
                prescription: sanitize(form.prescription?.trim() ?? ''),
                teethChart,
                doctorNotes: sanitize(form.doctorNotes?.trim() ?? ''),
                followUpDate: form.followUpDate || undefined,
            };

            if (editingRecord) {
                const result = await app.medicalRecordService.update(editingRecord.id, data);
                if (!result.success) {
                    toast.error(result.error || 'فشل في تحديث السجل');
                } else {
                    toast.success('تم تحديث السجل');
                    setShowModal(false);
                    clear();
                    queryClient.invalidateQueries({ queryKey: [MEDICAL_RECORDS_QUERY_KEY, currentPatientId] });
                }
            } else {
                const result = await app.medicalRecordService.create(data);
                if (!result.success) {
                    toast.error(result.error || 'فشل في إضافة السجل');
                } else {
                    toast.success('تم إضافة السجل الطبي', {
                        description: 'هل تريد الانتقال إلى الفوترة الآن؟',
                        action: {
                            label: 'إصدار فاتورة',
                            onClick: () => navigate('/admin/billing', { state: { patientId: data.patientId, patientName: form.patientName } })
                        }
                    });
                    setShowModal(false);
                    clear();
                    queryClient.invalidateQueries({ queryKey: [MEDICAL_RECORDS_QUERY_KEY, currentPatientId] });
                }
            }
        } catch (err) {
            toast.error('حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى');
        } finally {
            setSaving(false);
        }
    }

    const _doDelete = useCallback(async (id: string) => {
        try {
            const result = await app.medicalRecordService.delete(id);
            if (!result.success) {
                toast.error(result.error || 'فشل في حذف السجل');
            } else {
                toast.success('تم حذف السجل');
                queryClient.invalidateQueries({ queryKey: [MEDICAL_RECORDS_QUERY_KEY, currentPatientId] });
            }
        } catch {
            toast.error('حدث خطأ غير متوقع');
        }
    }, [currentPatientId, queryClient]);

    const handleDelete = useCallback((id: string) => {
        toast('هل أنت متأكد من حذف هذا السجل؟', {
            action: { label: 'حذف', onClick: () => _doDelete(id) },
            cancel: { label: 'إلغاء', onClick: () => {} },
            duration: 6000,
        });
        return;
    }, [_doDelete]);

    const toothHistory = useMemo(() => {
        const history: Record<number, { lastTreatment: string; isTreated: boolean }> = {};
        const sortedRecords = [...records].sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
        sortedRecords.forEach(rec => {
            if (rec.teethChart) {
                Object.entries(rec.teethChart).forEach(([num, entry]) => {
                    const n = Number(num);
                    if ((entry as ToothChartEntryDTO).status !== 'healthy') {
                        history[n] = { lastTreatment: rec.treatmentDone, isTreated: true };
                    }
                });
            }
        });
        return history;
    }, [records]);

    const filteredRecords = useMemo(() => {
        let result = records;

        if (searchTerm) {
            result = result.filter(r => 
                r.diagnosis.includes(searchTerm) || 
                r.chiefComplaint.includes(searchTerm) || 
                r.treatmentDone.includes(searchTerm)
            );
        }

        if (dateRangeFilter !== 'all') {
            const pastDate = new Date();
            if (dateRangeFilter === '30days') pastDate.setDate(pastDate.getDate() - 30);
            if (dateRangeFilter === '3months') pastDate.setMonth(pastDate.getMonth() - 3);
            if (dateRangeFilter === 'year') pastDate.setFullYear(pastDate.getFullYear() - 1);
            
            result = result.filter(r => new Date(r.visitDate) >= pastDate);
        }

        // doctorFilter is reserved for future use when doctor_name column is added to medical_records table

        return result;
    }, [records, searchTerm, dateRangeFilter]);

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen space-y-12">
            {/* Header Section */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 sm:gap-8">
                <div className="flex items-center gap-4">
                    <div className="size-12 sm:size-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner shrink-0">
                        <FileHeart className="size-7 sm:size-8" />
                    </div>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight">
                            السجلات الطبية
                        </h1>
                        <p className="text-slate-500 font-bold mt-1 dark:text-slate-400 text-sm sm:text-base">إدارة وتوثيق الحالات السريرية للمرضى بدقة</p>
                    </div>
                </div>
                <button 
                    onClick={openAdd} 
                    className="w-full sm:w-auto flex items-center justify-center gap-3 bg-slate-900 dark:bg-primary px-8 py-4 rounded-[1.5rem] text-white font-black hover:opacity-90 transition-all shadow-xl shadow-primary/10 active:scale-95 group"
                >
                    <PlusCircle className="w-6 h-6 group-hover:rotate-90 transition-transform duration-500" />
                    <span>سجل جديد</span>
                </button>
            </header>

            {/* Filters Section */}
            <div className="bg-[var(--bg-card)] rounded-[2rem] border-[1.5px] border-[var(--border-color)] p-6 shadow-sm overflow-hidden relative group transition-all duration-300">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6 relative z-10">
                    <div className="md:col-span-2 relative group/item">
                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5 group-focus-within/item:text-primary transition-colors" aria-hidden="true" />
                        <input 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pr-12 pl-4 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/20 text-sm font-black transition-all text-[var(--text-primary)] outline-none" 
                            placeholder="بحث عن مريض، إجراء، أو كود السجل..." 
                            type="text"
                            aria-label="بحث في السجلات الطبية"
                        />
                    </div>
                    <div className="relative group/sel opacity-50 cursor-not-allowed" title="سيتم تفعيل هذا الفلتر قريباً">
                        <User className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" aria-hidden="true" />
                        <select
                            disabled
                            className="w-full pr-12 pl-8 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm appearance-none cursor-not-allowed font-black text-[var(--text-primary)] transition-all outline-none"
                            aria-label="تصفية حسب الطبيب (غير متاح حالياً)"
                        >
                            <option value="all">كل الأطباء</option>
                        </select>
                    </div>
                    <div className="relative group/sel">
                        <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5 group-hover/sel:text-primary transition-colors" aria-hidden="true" />
                        <select 
                            value={dateRangeFilter}
                            onChange={(e) => setDateRangeFilter(e.target.value)}
                            className="w-full pr-12 pl-8 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary/20 text-sm appearance-none cursor-pointer font-black text-[var(--text-primary)] transition-all outline-none"
                            aria-label="تصفية حسب التاريخ">
                            <option value="all" className="bg-[var(--bg-card)]">كل التواريخ</option>
                            <option value="30days" className="bg-[var(--bg-card)]">آخر 30 يوم</option>
                            <option value="3months" className="bg-[var(--bg-card)]">آخر 3 أشهر</option>
                            <option value="year" className="bg-[var(--bg-card)]">السنة الحالية</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-[var(--bg-card)] border-[1.5px] border-[var(--border-color)] rounded-[2rem] overflow-hidden shadow-sm animate-pulse">
                            <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-[var(--border-subtle)]">
                                <div className="lg:w-72 shrink-0 bg-[var(--bg-page)] p-6 flex flex-col items-center justify-center">
                                    <div className="w-24 h-24 rounded-3xl bg-slate-200 dark:bg-slate-800 mb-4" />
                                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded-full mb-2" />
                                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                </div>
                                <div className="flex-1 p-8 space-y-8">
                                    <div className="flex justify-between">
                                        <div className="space-y-3">
                                            <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                            <div className="h-8 w-64 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                        </div>
                                        <div className="flex gap-3">
                                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                                            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl" />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="bg-[var(--bg-page)] p-4 rounded-2xl h-24" />
                                        <div className="bg-[var(--bg-page)] p-4 rounded-2xl h-24" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                ) : filteredRecords.length === 0 ? (
                    <EmptyState
                        icon={FileHeart}
                        title="لا توجد سجلات طبية"
                        description={currentPatientId ? "ابدأ بإضافة أول سجل طبي لهذا المريض لتوثيق حالته الصحية وعلاجه." : "يرجى اختيار مريض لعرض سجلاته الطبية أو إضافة سجل جديد."}
                        action={{
                            label: 'إضافة سجل الآن',
                            onClick: openAdd,
                            icon: Plus,
                        }}
                    />
                ) : (
                    filteredRecords.map((rec: MedicalRecordDTO) => (
                        <RecordCard key={rec.id} rec={rec} onEdit={openEdit} onDelete={handleDelete} />
                    ))
                )}
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div 
                        ref={modalRef} 
                        role="dialog" 
                        aria-modal="true" 
                        aria-labelledby="modal-title"
                        className="bg-[var(--bg-card)] rounded-[2.5rem] w-full max-w-4xl max-h-[95vh] sm:max-h-[90vh] shadow-2xl border border-[var(--border-color)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-8 duration-300 flex flex-col"
                    >
                        <div className="p-6 border-b border-[var(--border-subtle)] flex items-center justify-between">
                            <h2 id="modal-title" className="text-xl font-black text-[var(--text-primary)] flex items-center gap-3">
                                <div className="w-2.5 h-10 bg-primary rounded-full" />
                                {editingRecord ? 'تعديل السجل الطبي' : 'سجل طبي جديد'}
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)} 
                                aria-label="إغلاق"
                                className="p-2 hover:bg-[var(--bg-page)] rounded-full transition-colors text-slate-400"
                            >
                                <X className="w-7 h-7" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-8" dir="rtl">
                            {lastSaved && (
                                <div className="bg-primary/5 px-4 py-2 rounded-xl flex items-center gap-2 border border-primary/10">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <p className="text-xs font-bold text-primary">
                                        تم الحفظ تلقائياً: {lastSaved.toLocaleTimeString()}{isSaving ? ' (جاري الحفظ...)' : ''}
                                    </p>
                                </div>
                            )}

                            {!editingRecord && !currentPatientId && (
                                <div className="relative">
                                    <label htmlFor="patient-search" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1 text-right">المريض *</label>
                                    <div className="relative group/search">
                                        <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5 group-focus-within/search:text-primary transition-colors" aria-hidden="true" />
                                        <input 
                                            id="patient-search"
                                            value={form.patientName} 
                                            onChange={(e) => handlePatientSearch(e.target.value)} 
                                            placeholder="ابحث عن المريض بالاسم..." 
                                            className="w-full pr-12 pl-4 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none transition-all text-[var(--text-primary)]" 
                                        />
                                    </div>
                                    {patientResults.length > 0 && (
                                        <div className="absolute top-full mt-2 w-full bg-[var(--bg-card)] rounded-2xl shadow-2xl border border-[var(--border-subtle)] z-50 max-h-60 overflow-y-auto p-2">
                                            {patientResults.map((p: PatientDTO) => (
                                                <button key={p.id} onClick={() => selectPatient(p)} className="w-full text-right px-4 py-3 hover:bg-[var(--bg-page)] rounded-xl text-sm font-bold transition-colors flex items-center justify-between group text-[var(--text-primary)]">
                                                    <span>{p.fullName}</span>
                                                    <span className="text-xs text-slate-400 font-bold">{p.phone}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                    {form.patientId && (
                                        <div className="flex items-center gap-2 mt-2 px-1 text-emerald-500 font-bold text-xs">
                                            <CheckCircle2 className="w-4 h-4" />
                                            تم اختيار المريض بنجاح
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="visit-date" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">تاريخ الزيارة *</label>
                                        <input id="visit-date" type="date" value={form.visitDate} onChange={(e) => setForm(p => ({ ...p, visitDate: e.target.value }))} className="w-full px-4 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none transition-all text-[var(--text-primary)]" />
                                    </div>
                                    <div>
                                        <label htmlFor="chief-complaint" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">الشكوى الرئيسية *</label>
                                        <textarea id="chief-complaint" value={form.chiefComplaint} onChange={(e) => setForm(p => ({ ...p, chiefComplaint: e.target.value }))} rows={3} className="w-full px-4 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none resize-none transition-all placeholder:text-slate-300 text-[var(--text-primary)]" placeholder="وصف شكوى المريض الرئيسية..." />
                                    </div>
                                    <div>
                                        <label htmlFor="diagnosis" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">التشخيص *</label>
                                        <textarea id="diagnosis" value={form.diagnosis} onChange={(e) => setForm(p => ({ ...p, diagnosis: e.target.value }))} rows={3} className="w-full px-4 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none resize-none transition-all placeholder:text-slate-300 text-[var(--text-primary)]" placeholder="التشخيص الطبي للحالة..." />
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label htmlFor="treatment-done" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">العلاج المقدم *</label>
                                        <textarea id="treatment-done" value={form.treatmentDone} onChange={(e) => setForm(p => ({ ...p, treatmentDone: e.target.value }))} rows={3} className="w-full px-4 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none resize-none transition-all placeholder:text-slate-300 text-[var(--text-primary)]" placeholder="تفاصيل العلاج الذي تم تنفيذه..." />
                                    </div>
                                    <div>
                                        <label htmlFor="prescription" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">الوصفة الطبية</label>
                                        <textarea id="prescription" value={form.prescription} onChange={(e) => setForm(p => ({ ...p, prescription: e.target.value }))} rows={3} className="w-full px-4 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none resize-none transition-all placeholder:text-slate-300 text-[var(--text-primary)]" placeholder="الأدوية الموصوفة..." />
                                    </div>
                                    <div>
                                        <label htmlFor="follow-up-date" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">موعد المتابعة القادمة</label>
                                        <input id="follow-up-date" type="date" value={form.followUpDate} onChange={(e) => setForm(p => ({ ...p, followUpDate: e.target.value }))} className="w-full px-4 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none transition-all text-[var(--text-primary)]" />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-1">مخطط الأسنان السريري</label>
                                <div className="bg-[var(--bg-page)] rounded-[2.5rem] p-6 sm:p-8 border border-[var(--border-subtle)]">
                                    <TeethChart
                                        value={form.teethChart ?? {}}
                                        history={toothHistory}
                                        onChange={(data) => setForm(prev => ({ ...prev, teethChart: data }))}
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="doctor-notes" className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">ملاحظات الطبيب الإضافية</label>
                                <textarea id="doctor-notes" value={form.doctorNotes} onChange={(e) => setForm(p => ({ ...p, doctorNotes: e.target.value }))} rows={4} className="w-full px-4 py-4 bg-[var(--bg-page)] border border-transparent rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/10 focus:border-primary/20 outline-none resize-none transition-all placeholder:text-slate-300 text-[var(--text-primary)]" placeholder="أي ملاحظات سريرية أخرى..." />
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-[var(--bg-card)] border-t border-[var(--border-subtle)] p-6 flex flex-col sm:flex-row gap-4">
                            <button onClick={() => setShowModal(false)} className="w-full sm:flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black rounded-2xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-sm uppercase tracking-widest">إلغاء</button>
                            <button onClick={handleSave} disabled={saving} className="w-full sm:flex-[2] py-4 bg-primary text-white font-black rounded-2xl hover:opacity-90 transition-all text-sm uppercase tracking-widest disabled:opacity-50 shadow-lg shadow-primary/20 flex items-center justify-center gap-3">
                                {saving ? <Loader2 className="w-5 h-5 animate-spin" role="status" aria-label="جاري الحفظ" /> : <CheckCircle2 className="w-5 h-5" />}
                                {editingRecord ? 'حفظ التغييرات' : 'اعتماد السجل الطبي'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
