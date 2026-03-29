import { useState, useEffect, useCallback } from 'react';
import { Calendar, CreditCard, Plus, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { app } from '../../../application/container';
import { formatCurrency } from '../../../utils/formatters';
import { formatDate, toISODateString } from '../../../utils/dateUtils';
import { Badge, BadgeVariant } from '../ui/Badge';
import { Installment } from '../../../domain/models';

interface InstallmentManagerProps {
    invoiceId: string;
    patientId: string;
    invoiceTotal: number;
}

export default function InstallmentManager({
    invoiceId,
    patientId,
    invoiceTotal
}: InstallmentManagerProps) {
    const [installments, setInstallments] = useState<Installment[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [form, setForm] = useState({
        numberOfInstallments: 3,
        firstDueDate: toISODateString(new Date())
    });

    const loadInstallments = useCallback(async () => {
        setLoading(true);
        const result = await app.billingService.getInstallmentsByInvoiceId(invoiceId);
        if (result.success) {
            setInstallments(result.data as Installment[]);
        } else {
            toast.error(result.error);
        }
        setLoading(false);
    }, [invoiceId]);

    useEffect(() => {
        loadInstallments();
    }, [loadInstallments]);

    const handleCreate = async () => {
        setSaving(true);
        const result = await app.billingService.createInstallments({
            invoiceId,
            patientId,
            numberOfInstallments: form.numberOfInstallments,
            firstDueDate: form.firstDueDate,
            totalAmount: invoiceTotal
        });

        if (result.success) {
            toast.success(`تم إنشاء ${form.numberOfInstallments} أقساط بنجاح`);
            loadInstallments();
        } else {
            toast.error(result.error);
        }
        setSaving(false);
    };

    const installmentAmount = invoiceTotal / form.numberOfInstallments;

    return (
        <div className="space-y-6" dir="rtl">
            {/* Summary */}
            <div className="bg-primary-50 dark:bg-primary-900/10 rounded-3xl p-6 text-center border-[1.5px] border-primary-100 dark:border-primary-900/20">
                <p className="text-xs font-black text-primary-500 mb-1 uppercase tracking-wider">إجمالي المديونية</p>
                <p className="text-3xl font-black text-primary-700 dark:text-primary-400 font-numbers">{formatCurrency(invoiceTotal)}</p>
            </div>

            {/* Create Installments Form (only if none exist) */}
            {installments.length === 0 && !loading && (
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-6 shadow-sm border-[1.5px] border-[var(--border-color)] space-y-4">
                    <h3 className="text-sm font-black text-secondary-900 dark:text-white flex items-center gap-2">
                        <Plus className="w-4 h-4 text-primary-500" />
                        إعداد خطة تقسيط جديدة
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black text-secondary-500 mr-1">عدد الأقساط (2-12)</label>
                            <select
                                value={form.numberOfInstallments}
                                onChange={(e) => setForm(f => ({ ...f, numberOfInstallments: parseInt(e.target.value) }))}
                                className="w-full bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-100 dark:border-secondary-700 rounded-2xl px-4 py-3 font-bold text-secondary-900 dark:text-white outline-none focus:border-primary-500 transition-all"
                            >
                                {[2, 3, 4, 5, 6, 8, 10, 12].map(n => (
                                    <option key={n} value={n}>{n} أقساط</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black text-secondary-500 mr-1">تاريخ استحقاق أول قسط</label>
                            <input
                                type="date"
                                value={form.firstDueDate}
                                onChange={(e) => setForm(f => ({ ...f, firstDueDate: e.target.value }))}
                                className="w-full bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-100 dark:border-secondary-700 rounded-2xl px-4 py-3 font-bold text-secondary-900 dark:text-white outline-none focus:border-primary-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border-[1.5px] border-amber-100 dark:border-amber-900/20 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-black text-amber-600 uppercase">القسط الشهري</p>
                            <p className="text-lg font-black text-amber-700 dark:text-amber-400 font-numbers">{formatCurrency(installmentAmount)}</p>
                        </div>
                        <button
                            onClick={handleCreate}
                            disabled={saving}
                            className="bg-primary-600 text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-primary-700 transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                            اعتماد الخطة
                        </button>
                    </div>
                </div>
            )}

            {/* Existing Installments List */}
            <div className="space-y-3">
                <h3 className="text-sm font-black text-secondary-900 dark:text-white px-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    جدول الأقساط الحالي
                </h3>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-12 text-secondary-400 gap-3">
                        <Loader2 className="w-8 h-8 animate-spin" />
                        <p className="text-sm font-bold">جاري تحميل البيانات...</p>
                    </div>
                ) : installments.length > 0 ? (
                    <div className="grid gap-3">
                        {installments.map((inst, index) => (
                                <div
                                    key={inst.id}
                                    className="bg-[var(--bg-card)] p-4 rounded-2xl border-[1.5px] border-[var(--border-color)] flex items-center justify-between hover:border-primary transition-all"
                                >
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center text-secondary-400 font-mono font-black">
                                        {index + 1}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-secondary-900 dark:text-white font-numbers">{formatCurrency(inst.amount)}</p>
                                        <p className="text-xs text-secondary-500">{formatDate(inst.dueDate)}</p>
                                    </div>
                                </div>
                                <Badge variant={inst.status as BadgeVariant} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-secondary-50 dark:bg-secondary-800/50 rounded-[2rem] py-12 text-center border-2 border-dashed border-secondary-200 dark:border-secondary-700">
                        <AlertCircle className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
                        <p className="text-secondary-500 font-bold">لا توجد أقساط مسجلة لهذه الفاتورة</p>
                    </div>
                )}
            </div>
        </div>
    );
}
