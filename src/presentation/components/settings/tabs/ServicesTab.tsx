import React, { useState, useEffect, useCallback } from 'react';
import { Loader2, Plus, Edit2, Trash2, Activity, Play, Pause, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { app } from '../../../../application/container';
import { ClinicServiceDTO } from '../../../../application/dtos/service.dto';
import { formatCurrency } from '../../../../utils/formatters';
import { ConfirmationModal } from '../../ui/ConfirmationModal';

const ServicesTableSkeleton = React.memo(() => (
    <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 border-[1.5px] border-[var(--border-color)] shadow-sm overflow-x-auto shimmer">
        <table className="w-full text-right border-collapse min-w-[600px]">
            <thead>
                <tr className="border-b-[1.5px] border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-black uppercase tracking-[0.2em]">
                    <th className="pb-4 pl-4 font-black">الخدمة</th>
                    <th className="pb-4 px-4 font-black">الاسم الإنجليزي</th>
                    <th className="pb-4 px-4 font-black">السعر الافتراضي</th>
                    <th className="pb-4 px-4 font-black text-center">الحالة</th>
                    <th className="pb-4 pr-4 font-black text-center">الإجراءات</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)]/30">
                {[1, 2, 3].map((i) => (
                    <tr key={i}>
                        <td className="py-5 pl-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-page)]" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-[var(--bg-page)] rounded-full" />
                                    <div className="h-2.5 w-24 bg-[var(--bg-page)]/50 rounded-full" />
                                </div>
                            </div>
                        </td>
                        <td className="py-5 px-4">
                            <div className="h-3 w-20 bg-[var(--bg-page)]/50 rounded-full" />
                        </td>
                        <td className="py-5 px-4">
                            <div className="h-4 w-16 bg-[var(--bg-page)] rounded-full" />
                        </td>
                        <td className="py-5 px-4 text-center">
                            <div className="h-6 w-12 bg-[var(--bg-page)]/50 rounded-lg mx-auto" />
                        </td>
                        <td className="py-5 pr-4">
                            <div className="flex items-center justify-center gap-2">
                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-page)]" />
                                <div className="w-10 h-10 rounded-xl bg-[var(--bg-page)]" />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
));

export function ServicesTab() {
    const [services, setServices] = useState<ClinicServiceDTO[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<ClinicServiceDTO | null>(null);
    const [saving, setSaving] = useState(false);

    const [confirmModal, setConfirmModal] = useState<{
        readonly isOpen: boolean;
        readonly serviceId: string | null;
        readonly serviceName: string;
    }>({ isOpen: false, serviceId: null, serviceName: '' });

    const [form, setForm] = useState({
        name: '',
        nameEn: '',
        icon: 'Activity',
        description: '',
        defaultPrice: 0,
        isActive: true
    });

    const loadServices = useCallback(async () => {
        setLoading(true);
        const res = await app.clinicServiceService.getServices();
        if (res.success) {
            setServices(res.data as ClinicServiceDTO[]);
        } else {
            toast.error(res.error || 'فشل في تحميل الخدمات');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadServices();
    }, [loadServices]);

    const handleOpenModal = (service?: ClinicServiceDTO) => {
        if (service) {
            setEditingService(service);
            setForm({
                name: service.name,
                nameEn: service.nameEn,
                icon: service.icon,
                description: service.description,
                defaultPrice: service.defaultPrice,
                isActive: service.isActive
            });
        } else {
            setEditingService(null);
            setForm({
                name: '',
                nameEn: '',
                icon: 'Activity',
                description: '',
                defaultPrice: 0,
                isActive: true
            });
        }
        setShowModal(true);
    };

    const handleSave: React.FormEventHandler<HTMLFormElement> = async (e) => {
        e.preventDefault();
        setSaving(true);
        let res;
        if (editingService) {
            res = await app.clinicServiceService.updateService(editingService.id, form);
        } else {
            res = await app.clinicServiceService.createService(form);
        }

        if (res.success) {
            toast.success(editingService ? 'تم تحديث الخدمة بنجاح' : 'تم إضافة الخدمة بنجاح');
            setShowModal(false);
            loadServices();
        } else {
            toast.error(res.error || 'فشل في حفظ الخدمة');
        }
        setSaving(false);
    };

    const handleToggleActive = useCallback(async (service: ClinicServiceDTO) => {
        const res = await app.clinicServiceService.updateService(service.id, { isActive: !service.isActive });
        if (res.success) {
            toast.success(service.isActive ? 'تم إيقاف الخدمة' : 'تم تفعيل الخدمة');
            loadServices();
        } else {
            toast.error(res.error || 'فشل في تغيير حالة الخدمة');
        }
    }, [loadServices]);

    const handleDeleteRequest = useCallback((service: ClinicServiceDTO) => {
        setConfirmModal({
            isOpen: true,
            serviceId: service.id,
            serviceName: service.name,
        });
    }, []);

    const handleDeleteConfirm = useCallback(async () => {
        if (!confirmModal.serviceId) return;
        const id = confirmModal.serviceId;
        setConfirmModal({ isOpen: false, serviceId: null, serviceName: '' });
        const res = await app.clinicServiceService.deleteService(id);
        if (res.success) {
            toast.success('تم حذف الخدمة بنجاح');
            loadServices();
        } else {
            toast.error(res.error || 'فشل في حذف الخدمة');
        }
    }, [confirmModal.serviceId, loadServices]);

    const handleDeleteCancel = useCallback(() => {
        setConfirmModal({ isOpen: false, serviceId: null, serviceName: '' });
    }, []);

    if (loading) {
        return <ServicesTableSkeleton />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div>
                    <h2 className="text-2xl font-black text-[var(--text-primary)] flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-2xl">
                            <Activity aria-hidden="true" className="w-6 h-6 text-primary" />
                        </div>
                        الخدمات والإجراءات الطبية
                    </h2>
                    <p className="text-sm font-bold text-[var(--text-secondary)] mt-1.5 opacity-80">إدارة قائمة الخدمات المتاحة للفوترة وأسعارها الافتراضية</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all w-full sm:w-auto justify-center"
                >
                    <Plus aria-hidden="true" className="w-5 h-5" />
                    إضافة خدمة جديدة
                </button>
            </header>

            <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 border-[1.5px] border-[var(--border-color)] shadow-sm overflow-x-auto custom-scrollbar">
                {services.length === 0 ? (
                    <div className="text-center py-16 opacity-30">
                        <Activity aria-hidden="true" className="w-16 h-16 text-[var(--text-secondary)] mx-auto mb-4" />
                        <p className="font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] text-xs">لا توجد خدمات مضافة حتى الآن</p>
                    </div>
                ) : (
                    <table className="w-full text-right border-collapse min-w-[700px]">
                        <thead>
                            <tr className="border-b-[1.5px] border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-black uppercase tracking-[0.2em]">
                                <th className="pb-5 pl-4 font-black">الخدمة</th>
                                <th className="pb-5 px-4 font-black">الاسم الإنجليزي</th>
                                <th className="pb-5 px-4 font-black">السعر الافتراضي</th>
                                <th className="pb-5 px-4 font-black text-center">الحالة</th>
                                <th className="pb-5 pr-4 font-black text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--border-subtle)]/30">
                            {services.map((service) => (
                                <tr key={service.id} className="hover:bg-[var(--bg-page)]/50 transition-all group">
                                    <td className="py-6 pl-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-[var(--bg-page)] group-hover:bg-[var(--bg-card)] text-primary rounded-2xl transition-colors border border-transparent group-hover:border-[var(--border-subtle)]">
                                                <Activity aria-hidden="true" className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-black text-[var(--text-primary)] text-sm">{service.name}</p>
                                                {service.description && (
                                                    <p className="text-xs text-[var(--text-secondary)] font-bold max-w-[250px] truncate mt-1 opacity-70">
                                                        {service.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-xs font-black text-[var(--text-secondary)] opacity-60 uppercase tracking-wider font-mono">{service.nameEn}</td>
                                    <td className="py-6 px-4 font-black text-primary text-sm font-numbers">{formatCurrency(service.defaultPrice)}</td>
                                    <td className="py-6 px-4 text-center">
                                        <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest ${
                                            service.isActive 
                                                ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' 
                                                : 'bg-[var(--bg-page)] text-[var(--text-secondary)]'
                                        }`}>
                                            {service.isActive ? 'نشط' : 'متوقف'}
                                        </span>
                                    </td>
                                    <td className="py-6 pr-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                onClick={() => handleToggleActive(service)}
                                                className={`p-2.5 rounded-xl border border-transparent transition-all shadow-sm ${
                                                    service.isActive 
                                                        ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20' 
                                                        : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
                                                }`}
                                                title={service.isActive ? 'إيقاف' : 'تفعيل'}
                                                aria-label={service.isActive ? 'إيقاف الخدمة' : 'تفعيل الخدمة'}
                                            >
                                                {service.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                                            </button>
                                            <button
                                                onClick={() => handleOpenModal(service)}
                                                className="p-2.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all shadow-sm"
                                                title="تعديل"
                                                aria-label="تعديل الخدمة"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteRequest(service)}
                                                className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm"
                                                title="حذف"
                                                aria-label="حذف الخدمة"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div 
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="service-modal-title"
                        className="bg-[var(--bg-card)] rounded-[2.5rem] w-full max-w-xl shadow-2xl border-[1.5px] border-[var(--border-color)] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300"
                    >
                        <header className="p-8 border-b border-[var(--border-subtle)]/50 flex items-center justify-between shrink-0 bg-[var(--bg-page)]/20">
                            <h2 id="service-modal-title" className="text-xl font-black text-[var(--text-primary)] flex items-center gap-4">
                                <div className="w-2 h-10 bg-primary rounded-full" />
                                {editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
                            </h2>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="p-3 hover:bg-[var(--bg-page)] rounded-2xl transition-all text-[var(--text-secondary)] active:scale-90" 
                                aria-label="إغلاق"
                            >
                                <X className="w-6 h-6" />
                            </button>
                        </header>
                        
                        <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                <label htmlFor="service-desc" className="text-xs font-black text-[var(--text-secondary)] block mb-2 uppercase tracking-widest pl-1">وصف الخدمة (اختياري)</label>
                                    <input
                                        id="service-name-ar"
                                        required
                                        value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                        className="w-full bg-[var(--bg-page)]/50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-[var(--text-primary)] outline-none focus:border-primary focus:bg-[var(--bg-card)] transition-all"
                                        placeholder="مثال: حشو العصب"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="service-name-en" className="text-xs font-black text-[var(--text-secondary)] block mb-2 uppercase tracking-widest pl-1">اسم الخدمة (بالإنجليزية)</label>
                                    <input
                                        id="service-name-en"
                                        required
                                        value={form.nameEn}
                                        onChange={e => setForm({...form, nameEn: e.target.value})}
                                        className="w-full bg-[var(--bg-page)]/50 border-2 border-transparent rounded-2xl px-5 py-4 font-bold text-[var(--text-primary)] outline-none focus:border-primary focus:bg-[var(--bg-card)] transition-all text-left font-mono"
                                        dir="ltr"
                                        placeholder="Root Canal"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label htmlFor="service-price" className="text-xs font-black text-[var(--text-secondary)] block mb-2 uppercase tracking-widest pl-1">السعر الافتراضي</label>
                                <input
                                    id="service-price"
                                    required
                                    type="number"
                                    min="0"
                                    value={form.defaultPrice}
                                    onChange={e => setForm({...form, defaultPrice: Number(e.target.value)})}
                                    className="w-full bg-[var(--bg-page)]/50 border-2 border-transparent rounded-2xl px-5 py-4 font-black text-primary font-numbers outline-none focus:border-primary focus:bg-[var(--bg-card)] transition-all"
                                />
                            </div>

                            <div>
                                <label htmlFor="service-desc" className="text-[10px] font-black text-[var(--text-secondary)] block mb-2 uppercase tracking-widest pl-1">وصف الخدمة (اختياري)</label>
                                <textarea
                                    id="service-desc"
                                    value={form.description}
                                    onChange={e => setForm({...form, description: e.target.value})}
                                    className="w-full min-h-[120px] bg-[var(--bg-page)]/50 border-2 border-transparent rounded-2xl px-6 py-5 font-bold text-[var(--text-primary)] outline-none focus:border-primary focus:bg-[var(--bg-card)] transition-all"
                                    placeholder="وصف مختصر للخدمة ليظهر للمستخدمين..."
                                />
                            </div>

                            <div className="flex items-center gap-4 p-5 bg-[var(--bg-page)]/50 rounded-[1.5rem] border border-[var(--border-subtle)]/30">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" id="service-active-toggle" checked={form.isActive} onChange={e => setForm({...form, isActive: e.target.checked})} className="sr-only peer" />
                                    <div className="w-12 h-7 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2.5px] after:start-[2.5px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                    <span className="sr-only">تفعيل الخدمة</span>
                                </label>
                                <div className="space-y-0.5">
                                    <p className="text-sm font-black text-[var(--text-primary)]">تفعيل الخدمة</p>
                                    <p className="text-xs font-bold text-[var(--text-secondary)] opacity-70">ستظهر هذه الخدمة في قائمة الخيارات عند إنشاء الفواتير</p>
                                </div>
                            </div>

                            <footer className="pt-8 flex flex-col sm:flex-row gap-4">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-4.5 bg-[var(--bg-page)] text-[var(--text-secondary)] rounded-2xl font-black transition-all hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-subtle)]">إلغاء</button>
                                <button type="submit" disabled={saving} className="flex-[2] py-4.5 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3">
                                    {saving ? <Loader2 className="w-6 h-6 animate-spin" role="status" aria-label="جاري الحفظ..." /> : <Save className="w-6 h-6" />}
                                    حفظ البيانات
                                </button>
                            </footer>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmationModal
                isOpen={confirmModal.isOpen}
                title="حذف الخدمة"
                message={`هل أنت متأكد من حذف خدمة "${confirmModal.serviceName}" نهائياً؟ لا يمكن التراجع عن هذا الإجراء.`}
                confirmLabel="حذف نهائياً"
                cancelLabel="إلغاء"
                variant="danger"
                onConfirm={handleDeleteConfirm}
                onCancel={handleDeleteCancel}
            />
        </div>
    );
}
