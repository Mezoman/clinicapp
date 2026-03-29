import { useNavigate, useSearchParams } from 'react-router-dom';
import { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
    Users,
    Plus,
    Search,
    Eye,
    Edit2,
    Trash2,
    ChevronLeft,
    ChevronRight,
    X,
    Loader2,
    Download,
    Phone,
    Mail,
    BadgeCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { usePatients } from '../../hooks/usePatients';
import { useAuditLog } from '../../hooks/useAuditLog';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { app } from '../../../application/container';
import { exportPatientsToExcel } from '../../../utils/exportUtils';
import { BLOOD_TYPES, GENDER_MAP } from '../../../constants';
import { formatDate } from '../../../utils/dateUtils';
import { formatPhone } from '../../../utils/formatters';
import { validatePatientForm } from '../../../utils/validators';
import { sanitize } from '../../../lib/validation';
import { logger } from '../../../utils/logger';
import { Badge } from '../../components/ui/Badge';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';

import type { PatientDTO, GenderDTO, BloodTypeDTO } from '../../../application/dtos/patient.dto';

type TabType = 'general' | 'medical' | 'notes';

export default function Patients() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [activeFilter, setActiveFilter] = useState<boolean | undefined>(undefined);
    const { patients, loading, search, refresh, page, setPage, totalCount } = usePatients({ isActive: activeFilter });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const s = searchParams.get('search');
        if (s) {
            setSearchTerm(s);
            search(sanitize(s));
        }
    }, [searchParams, search]);
    const [showModal, setShowModal] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('general');
    const [editingPatient, setEditingPatient] = useState<PatientDTO | null>(null);
    const [saving, setSaving] = useState(false);
    const { logAudit } = useAuditLog();
    const modalRef = useRef<HTMLDivElement>(null);

    useFocusTrap(modalRef, showModal, () => setShowModal(false));

    const [form, setForm] = useState({
        fullName: '',
        phone: '',
        nationalId: '',
        birthDate: '',
        gender: 'male' as GenderDTO,
        address: '',
        email: '',
        bloodType: undefined as unknown as BloodTypeDTO,
        allergies: '',
        chronicDiseases: '',
        currentMedications: '',
        notes: ''
    });

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        search(sanitize(searchTerm));
    }, [search, searchTerm]);

    const handleOpenModal = useCallback((patient: PatientDTO | null = null) => {
        setActiveTab('general');
        if (patient) {
            setEditingPatient(patient);
            setForm({
                fullName: patient.fullName,
                phone: patient.phone,
                nationalId: patient.nationalId || '',
                birthDate: patient.birthDate || '',
                gender: patient.gender,
                address: patient.address || '',
                email: patient.email || '',
                bloodType: patient.bloodType as BloodTypeDTO,
                allergies: patient.allergies || '',
                chronicDiseases: patient.chronicDiseases || '',
                currentMedications: patient.currentMedications || '',
                notes: patient.notes || ''
            });
        } else {
            setEditingPatient(null);
            setForm({
                fullName: '', phone: '', nationalId: '', birthDate: '', gender: 'male',
                address: '', email: '', bloodType: undefined as unknown as BloodTypeDTO, allergies: '',
                chronicDiseases: '', currentMedications: '', notes: ''
            });
        }
        setShowModal(true);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const sanitizedForm = {
            ...form,
            fullName: sanitize(form.fullName),
            phone: sanitize(form.phone),
            nationalId: sanitize(form.nationalId),
            address: sanitize(form.address),
            email: sanitize(form.email),
            allergies: sanitize(form.allergies),
            chronicDiseases: sanitize(form.chronicDiseases),
            currentMedications: sanitize(form.currentMedications),
            notes: sanitize(form.notes)
        };

        const validation = validatePatientForm(sanitizedForm);
        if (!validation.isValid) {
            validation.errors.forEach((err) => toast.error(err.message));
            return;
        }

        setSaving(true);
        try {
            if (editingPatient) {
                const before = { ...editingPatient };
                const result = await app.patientService.update(editingPatient.id, sanitizedForm);
                if (!result.success) {
                    toast.error(result.error || 'فشل في تحديث بيانات المريض');
                } else {
                    await logAudit('update', 'patient', editingPatient.id, before, sanitizedForm, 'تحديث بيانات المريض');
                    toast.success('تم تحديث بيانات المريض بنجاح');
                    setShowModal(false);
                    refresh();
                }
            } else {
                const result = await app.patientService.create(sanitizedForm);
                if (!result.success || !result.data) {
                    toast.error(result.error || 'فشل في إضافة المريض');
                } else {
                    await logAudit('create', 'patient', result.data.id, null, sanitizedForm, 'إضافة مريض جديد');
                    toast.success('تم إضافة المريض بنجاح');
                    setShowModal(false);
                    refresh();
                }
            }
        } catch (err) {
            logger.error('Error saving patient', err as Error);
            toast.error('حدث خطأ غير متوقع');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = useCallback(async () => {
        if (!confirmDelete) return;
        const { id } = confirmDelete;

        try {
            const before = patients.find((p: PatientDTO) => p.id === id) || null;
            const result = await app.patientService.delete(id);
            if (!result.success) {
                toast.error(result.error || 'فشل في حذف المريض');
            } else {
                await logAudit('delete', 'patient', id, before, null, 'حذف مريض');
                toast.success('تم حذف المريض بنجاح');
                setConfirmDelete(null);
                refresh();
            }
        } catch (err) {
            logger.error('Error deleting patient', err as Error);
            toast.error('خطأ في الاتصال بالخادم');
        }
    }, [confirmDelete, patients, logAudit, refresh]);

    const handleExport = async () => {
        await exportPatientsToExcel(patients as PatientDTO[]);
        toast.success('تم تصدير البيانات بنجاح');
    };

    return (
        <div className="flex flex-col animate-in fade-in duration-700">
            {/* Header Section */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-10 animate-in slide-in-from-right-4 duration-700">
                <div className="flex flex-col gap-2">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tight">سجل المرضى</h1>
                    <div className="flex items-center gap-3 px-6 py-3 bg-[var(--bg-card)] rounded-[1.5rem] border-[1.5px] border-[var(--border-color)] shadow-sm w-fit">
                        <div className="size-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest">إجمالي المرضى: <span className="text-slate-900 dark:text-white ml-1 font-numbers">{totalCount.toLocaleString('ar-EG')}</span></span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={handleExport} className="flex items-center gap-3 px-8 py-4 bg-slate-100 dark:bg-secondary-800 rounded-2xl text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:bg-primary hover:text-white hover:shadow-xl hover:shadow-primary/20 transition-all active:scale-95 group border-b-2 border-slate-200 dark:border-secondary-700">
                        <Download className="w-4 h-4 group-hover:bounce" />
                        تصدير Excel
                    </button>
                    <button 
                        onClick={() => handleOpenModal()} 
                        className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary/90 active:scale-95 transition-all group border-b-4 border-primary-700"
                    >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
                        إضافة مريض جديد
                    </button>
                </div>
            </header>

            {/* Filter & Search Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-10 p-6 md:p-8 bg-[var(--bg-card)] rounded-[2rem] md:rounded-[2.5rem] border border-[var(--border-color)] shadow-sm animate-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-1.5 p-1.5 bg-[var(--bg-table-header)] border border-[var(--border-color)] rounded-xl">
                    <button onClick={() => { setActiveFilter(undefined); setPage(1); }} aria-pressed={activeFilter === undefined}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === undefined ? 'bg-[var(--bg-card)] text-primary shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                        الكل
                    </button>
                    <button onClick={() => { setActiveFilter(true); setPage(1); }} aria-pressed={activeFilter === true}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === true ? 'bg-[var(--bg-card)] text-emerald-600 shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                        نشط
                    </button>
                    <button onClick={() => { setActiveFilter(false); setPage(1); }} aria-pressed={activeFilter === false}
                        className={`px-5 py-2 rounded-lg text-sm font-bold transition-all ${activeFilter === false ? 'bg-[var(--bg-card)] text-[var(--text-secondary)] shadow-sm border border-[var(--border-subtle)]' : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'}`}>
                        مؤرشف
                    </button>
                </div>

                <form onSubmit={handleSearch} className="relative w-full md:w-[400px] group">
                    <Search className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-hover:text-primary transition-colors" />
                    <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="ابحث عن مريض بالاسم أو الهاتف..." 
                        aria-label="بحث عن مريض"
                        className="w-full bg-[var(--bg-page)] border-none rounded-2xl pr-14 pl-6 py-4 text-sm font-bold text-[var(--text-primary)] placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                    {searchTerm && (
                        <button type="button" onClick={() => { setSearchTerm(''); search(''); }} aria-label="مسح البحث" className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-500 transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </form>
            </div>

            {/* List Table Section */}
            <div className="bg-[var(--bg-card)] rounded-xl border-[1.5px] border-[var(--border-color)] shadow-[var(--shadow-card)] overflow-hidden animate-in slide-in-from-bottom-8 duration-1000">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="dcms-table">
                        <thead>
                            <tr>
                                <th className="w-16 text-center">#</th>
                                <th>المريض</th>
                                <th>بيانات التواصل</th>
                                <th>آخر زيارة / الحالة</th>
                                <th className="text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-10 py-8"><div className="h-12 bg-slate-100 dark:bg-secondary-800 rounded-2xl w-full"></div></td>
                                    </tr>
                                ))
                            ) : patients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-32 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="size-20 bg-[var(--bg-page)] rounded-[2rem] flex items-center justify-center text-slate-200 dark:text-secondary-700 border border-[var(--border-subtle)]">
                                                <Users className="w-10 h-10" />
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-base font-black text-[var(--text-primary)] uppercase tracking-widest">لا يوجد مرضى حالياً</p>
                                                <p className="text-xs font-black text-slate-500 uppercase tracking-widest">ابدأ بإضافة أول مريض لنظامك</p>
                                            </div>
                                            <button onClick={() => handleOpenModal()} className="px-8 py-3 bg-primary text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20">إضافة مريض</button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                patients.map((patient, index) => (
                                    <PatientRow
                                        key={patient.id}
                                        patient={patient}
                                        index={(page - 1) * 10 + index + 1}
                                        onView={(id) => navigate(`/admin/patients/${id}`)}
                                        onEdit={handleOpenModal}
                                        onDelete={(id, name) => setConfirmDelete({ id, name })}
                                    />
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Footer */}
                <div className="px-6 py-5 bg-[var(--bg-table-header)] flex flex-col md:flex-row items-center justify-between gap-4 border-t-[1.5px] border-[var(--border-color)]">
                    <p className="text-sm font-semibold text-[var(--text-muted)] font-numbers">
                        عرض من <span className="text-slate-900 dark:text-white font-numbers">{(page - 1) * 10 + 1}</span> إلى <span className="text-slate-900 dark:text-white font-numbers">{Math.min(page * 10, totalCount)}</span> مريض من إجمالي <span className="text-slate-900 dark:text-white font-numbers">{totalCount.toLocaleString('ar-EG')}</span>
                    </p>
                    
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => setPage(prev => Math.max(1, prev - 1))} 
                            disabled={page === 1}
                            aria-label="الصفحة السابقة"
                            className="size-12 bg-white dark:bg-secondary-900 border border-slate-200 dark:border-secondary-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm group"
                        >
                            <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                        </button>
                        
                        <div className="px-6 py-3 bg-white dark:bg-secondary-900 border border-slate-200 dark:border-secondary-800 rounded-2xl shadow-sm text-xs font-black text-slate-500 uppercase tracking-widest">
                            صفحة <span className="text-primary mx-1 font-numbers">{page.toLocaleString('ar-EG')}</span>
                        </div>

                        <button 
                            onClick={() => setPage(prev => prev + 1)} 
                            disabled={page * 10 >= totalCount}
                            aria-label="الصفحة التالية"
                            className="size-12 bg-white dark:bg-secondary-900 border border-slate-200 dark:border-secondary-800 rounded-2xl flex items-center justify-center text-slate-400 hover:text-primary hover:border-primary disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm group"
                        >
                            <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Enhanced Patient Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300 px-4">
                    <div
                        ref={modalRef}
                        className="bg-[var(--bg-card)] rounded-[2rem] md:rounded-[3rem] w-full max-w-3xl shadow-2xl border border-[var(--border-subtle)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="patient-modal-title"
                    >
                        {/* Modal Header */}
                        <div className="p-10 border-b border-[var(--border-subtle)] flex items-center justify-between bg-gradient-to-r from-slate-50/50 to-white dark:from-secondary-800/50 dark:to-secondary-900">
                            <div className="flex items-center gap-6">
                                <div className="size-16 bg-primary/10 rounded-[1.5rem] flex items-center justify-center text-primary shadow-inner">
                                    {editingPatient ? <Edit2 className="w-8 h-8" /> : <Plus className="w-8 h-8" />}
                                </div>
                                <div>
                                    <h3 id="patient-modal-title" className="text-2xl font-black text-[var(--text-primary)] uppercase tracking-tight">
                                        {editingPatient ? 'تعديل السجل' : 'إضافة مريض جديد'}
                                    </h3>
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">تأكد من دقة البيانات المدخلة</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowModal(false)}
                                aria-label="إغلاق"
                                className="size-12 flex items-center justify-center bg-[var(--bg-page)] rounded-2xl transition-all text-slate-400 hover:text-red-500 hover:rotate-90 active:scale-90 border border-[var(--border-subtle)]"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Modal Tabs */}
                        <div className="px-10 flex gap-8 border-b border-[var(--border-subtle)] bg-[var(--bg-card)]">
                            {[
                                { id: 'general', label: 'البيانات الشخصية' },
                                { id: 'medical', label: 'التاريخ الطبي' },
                                { id: 'notes', label: 'ملاحظات إضافية' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`pb-5 pt-6 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === tab.id ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    {tab.label}
                                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-t-full shadow-[0_-2px_10px_rgba(59,130,246,0.3)]" />}
                                </button>
                            ))}
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                            <div className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                            {activeTab === 'general' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-3">
                                        <label htmlFor="patient-fullName" className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">الاسم بالكامل</label>
                                        <div className="relative group">
                                            <Users className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                            <input
                                                id="patient-fullName"
                                                type="text"
                                                value={form.fullName}
                                                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                                                className="w-full bg-[var(--bg-page)] border-none rounded-2xl pr-12 pl-4 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[var(--text-primary)]"
                                                placeholder="أدخل الاسم الرباعي..."
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="patient-phone" className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">رقم الهاتف</label>
                                        <div className="relative group">
                                            <Phone className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                                            <input
                                                id="patient-phone"
                                                type="tel"
                                                value={form.phone}
                                                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                                                className="w-full bg-[var(--bg-page)] border-none rounded-2xl pr-12 pl-4 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[var(--text-primary)] text-left font-numbers"
                                                dir="ltr"
                                                required
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="patient-nationalId" className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">الرقم القومي</label>
                                        <input
                                            id="patient-nationalId"
                                            type="text"
                                            value={form.nationalId}
                                            onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                                            className="w-full bg-[var(--bg-page)] border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[var(--text-primary)] font-numbers"
                                            placeholder="2990101XXXXXXXX"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="patient-birthDate" className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">تاريخ الميلاد</label>
                                        <input
                                            id="patient-birthDate"
                                            type="date"
                                            value={form.birthDate}
                                            onChange={(e) => setForm({ ...form, birthDate: e.target.value })}
                                            className="w-full bg-[var(--bg-page)] border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[var(--text-primary)] font-numbers"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="patient-gender" className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">النوع</label>
                                        <select
                                            id="patient-gender"
                                            value={form.gender}
                                            onChange={(e) => setForm({ ...form, gender: e.target.value as GenderDTO })}
                                            className="w-full bg-[var(--bg-page)] border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[var(--text-primary)] appearance-none"
                                        >
                                            {Object.entries(GENDER_MAP).map(([key, label]) => (
                                                <option key={key} value={key}>{label}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="patient-bloodType" className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">فصيلة الدم</label>
                                        <select
                                            id="patient-bloodType"
                                            value={form.bloodType}
                                            onChange={(e) => setForm({ ...form, bloodType: e.target.value as BloodTypeDTO })}
                                            className="w-full bg-[var(--bg-page)] border-none rounded-2xl px-6 py-4 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[var(--text-primary)] appearance-none"
                                        >
                                            <option value="">غير محدد</option>
                                            {BLOOD_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'medical' && (
                                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                    <div className="space-y-3">
                                        <label htmlFor="patient-allergies" className="text-xs font-black uppercase tracking-widest text-red-500 mr-2 flex items-center gap-3">
                                            <div className="size-2 bg-red-500 rounded-full animate-ping" />
                                            الحساسية والمشاكل الصحية الحرجة
                                        </label>
                                        <textarea
                                            id="patient-allergies"
                                            value={form.allergies}
                                            onChange={(e) => setForm({ ...form, allergies: e.target.value })}
                                            className="w-full bg-red-500/5 dark:bg-red-500/10 border-2 border-dashed border-red-200 dark:border-red-900/30 rounded-3xl p-6 outline-none focus:border-red-500 transition-all font-bold text-slate-900 dark:text-white h-40 resize-none placeholder:text-red-300"
                                            placeholder="اكتب هنا أي حساسية دوائية، فوبيا، أو مشاكل في التخدير..."
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label htmlFor="patient-chronicDiseases" className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">التاريخ الطبي والأمراض المزمنة</label>
                                        <textarea
                                            id="patient-chronicDiseases"
                                            value={form.chronicDiseases}
                                            onChange={(e) => setForm({ ...form, chronicDiseases: e.target.value })}
                                            className="w-full bg-[var(--bg-page)] border-none rounded-[2rem] p-6 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[var(--text-primary)] h-40 resize-none"
                                            placeholder="السكر، الضغط، القلب، أو أي عمليات جراحية سابقة..."
                                        />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notes' && (
                                <div className="animate-in slide-in-from-right-4 duration-500 group">
                                    <div className="space-y-3">
                                        <label htmlFor="patient-notes" className="text-xs font-black uppercase tracking-widest text-slate-500 mr-2">ملاحظات الطبيب السرية</label>
                                        <textarea
                                            id="patient-notes"
                                            value={form.notes}
                                            onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                            className="w-full bg-[var(--bg-page)] border-none rounded-[2.5rem] p-8 outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-[var(--text-primary)] h-80 resize-none shadow-inner"
                                            placeholder="أي تفاصيل أخرى ترغب في تذكرها عن المريض..."
                                        />
                                    </div>
                                </div>
                            )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-10 border-t border-[var(--border-subtle)] bg-[var(--bg-page)]/50 flex flex-col sm:flex-row gap-6">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-primary text-white py-5 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/30 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {saving ? (
                                        <>
                                            <Loader2 className="w-6 h-6 animate-spin" aria-hidden="true" />
                                            <span className="sr-only">جاري الحفظ...</span>
                                        </>
                                    ) : (
                                        <>
                                            {editingPatient ? <BadgeCheck className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
                                            {editingPatient ? 'حفظ التعديلات' : 'إضافة المريض الآن'}
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-10 py-5 bg-[var(--bg-card)] border border-[var(--border-subtle)] text-slate-500 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-all font-bold"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            
            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={!!confirmDelete}
                title="تأكيد حذف المريض"
                message={`هل أنت متأكد من حذف المريض ${confirmDelete?.name}؟ لا يمكن التراجع عن هذا الإجراء.`}
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(null)}
                variant="danger"
            />
        </div>
    );
}

interface PatientRowProps {
    patient: PatientDTO;
    index: number;
    onView: (id: string) => void;
    onEdit: (patient: PatientDTO) => void;
    onDelete: (id: string, name: string) => void;
}

const PatientRow = memo(({ patient, index, onView, onEdit, onDelete }: PatientRowProps) => {
    if (!patient) return null;
    const initialArr = (patient.fullName || 'P').trim().split(/\s+/);
    const first = initialArr[0] || 'P';
    const last = initialArr[initialArr.length - 1] || first;
    const initials = initialArr.length > 1 
        ? `${first.charAt(0)}${last.charAt(0)}`
        : first.charAt(0);

    return (
        <tr className="group transition-all duration-200">
            <td className="text-center">
                <span className="text-sm font-bold text-[var(--text-muted)] font-numbers">{index}</span>
            </td>
            <td>
                <div className="flex items-center gap-3">
                    <div className="size-9 rounded-lg bg-primary/10 text-primary font-bold text-sm flex items-center justify-center shrink-0 border border-primary/20">
                        {initials.toUpperCase()}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-primary transition-colors">{patient.fullName}</p>
                        <p className="text-xs text-[var(--text-muted)] font-numbers mt-0.5">#{patient.id.slice(0, 8)}</p>
                    </div>
                </div>
            </td>
            <td>
                <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
                        <span dir="ltr" className="font-numbers">{formatPhone(patient.phone)}</span>
                    </p>
                    {patient.email && (
                        <p className="text-xs text-[var(--text-muted)] flex items-center gap-2">
                            <Mail className="w-3 h-3 shrink-0" />
                            {patient.email}
                        </p>
                    )}
                </div>
            </td>
            <td>
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-[var(--text-secondary)] bg-[var(--bg-table-header)] border border-[var(--border-subtle)] px-3 py-1 rounded-lg font-numbers">
                        {patient.lastVisitDate ? formatDate(patient.lastVisitDate) : 'لم يتم الزيارة'}
                    </span>
                    <Badge variant={patient.isActive !== false ? 'active' : 'inactive'} className="px-3 py-1 rounded-lg text-xs font-bold" />
                </div>
            </td>
            <td>
                <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => onView(patient.id)}
                        className="dcms-action-btn hover:bg-primary hover:text-white hover:border-primary"
                        title="عرض التفاصيل" aria-label="عرض التفاصيل">
                        <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => onEdit(patient)}
                        className="dcms-action-btn hover:bg-emerald-500 hover:text-white hover:border-emerald-500"
                        title="تعديل" aria-label="تعديل">
                        <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => onDelete(patient.id, patient.fullName)}
                        className="dcms-action-btn hover:bg-red-500 hover:text-white hover:border-red-500"
                        title="حذف" aria-label="حذف">
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
});

PatientRow.displayName = 'PatientRow';

