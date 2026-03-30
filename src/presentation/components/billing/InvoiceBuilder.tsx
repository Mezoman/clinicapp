import React, { useState } from 'react';
import { Plus, X, Receipt, Calculator, Save, AlertCircle } from 'lucide-react';
import { PatientCombobox } from '../ui/PatientCombobox';
import { app } from '../../../application/container';
import { InvoiceServiceDTO } from '../../../application/dtos/billing.dto';
import { ClinicServiceDTO } from '../../../application/dtos/service.dto';
import { PatientDTO } from '../../../application/dtos/patient.dto';
import { formatCurrency } from '../../../utils/formatters';
import { sanitize } from '../../../lib/validation';

export interface CreateInvoiceFormData {
    readonly patientId: string;
    readonly patientName: string;
    readonly invoiceDate: string;
    readonly services: readonly InvoiceServiceDTO[];
    readonly discount: number;
    readonly taxRate: number;
    readonly taxAmount: number;
    readonly discountReason: string | undefined;
    readonly notes: string;
}

interface InvoiceBuilderProps {
    readonly initialPatient?: { readonly id: string; readonly fullName: string } | undefined;
    readonly onSubmit: (data: CreateInvoiceFormData) => Promise<void>;
    readonly onCancel: () => void;
    readonly saving?: boolean;
}

export default function InvoiceBuilder({ initialPatient, onSubmit, onCancel, saving }: InvoiceBuilderProps) {
    const [form, setForm] = useState<CreateInvoiceFormData>({
        patientId: initialPatient?.id || '',
        patientName: initialPatient?.fullName || '',
        invoiceDate: new Date().toISOString().split('T')[0] ?? '',
        services: [] as InvoiceServiceDTO[],
        discount: 0,
        taxRate: 0,
        taxAmount: 0,
        discountReason: undefined,
        notes: '',
    });

    const [availableServices, setAvailableServices] = useState<ClinicServiceDTO[]>([]);

    React.useEffect(() => {
        const loadServices = async () => {
            const res = await app.clinicServiceService.getServices();
            if (res.success) {
                // Show only active services in the dropdown
                setAvailableServices(res.data.filter(s => s.isActive));
            }
        };
        loadServices();
    }, []);

    const subtotal = form.services.reduce((sum, s) => sum + s.total, 0);
    const taxAmount = subtotal * (form.taxRate / 100);
    const total = Math.max(0, subtotal - form.discount + taxAmount);

    const addService = () => {
        const firstSvc = availableServices[0];
        if (!firstSvc) return;
        setForm(prev => ({
            ...prev,
            services: [...prev.services, {
                serviceId: firstSvc.id,
                name: firstSvc.name,
                quantity: 1,
                unitPrice: firstSvc.defaultPrice,
                total: firstSvc.defaultPrice
            }]
        }));
    };

    function updateService(idx: number, field: string, value: string | number) {
        setForm(prevForm => {
            const nextServices = [...prevForm.services];
            const s = { ...nextServices[idx] };
            if (field === 'serviceId') {
                const svc = availableServices.find(d => d.id === value);
                if (svc) {
                    s.serviceId = svc.id;
                    s.name = svc.name;
                    s.unitPrice = svc.defaultPrice;
                    s.total = svc.defaultPrice * (s.quantity || 1);
                }
            } else if (field === 'quantity') {
                s.quantity = Number(value);
                s.total = (s.unitPrice || 0) * s.quantity;
            } else if (field === 'unitPrice') {
                s.unitPrice = Number(value);
                s.total = s.unitPrice * (s.quantity || 1);
            }
            nextServices[idx] = s as InvoiceServiceDTO;
            return { ...prevForm, services: nextServices };
        });
    }

    const removeService = (idx: number) => {
        setForm(prev => ({
            ...prev,
            services: prev.services.filter((_, i) => i !== idx)
        }));
    };

    const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
        e.preventDefault();
        onSubmit({
            ...form,
            taxAmount,
            discountReason: form.discountReason || undefined,
            notes: sanitize(form.notes.trim()) || ''
        });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 h-full">
            {/* Right Column: Content */}
            <div className="flex-1 space-y-8">
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-sm border-[1.5px] border-[var(--border-color)]">
                    <h3 className="text-sm font-black text-[var(--text-primary)] mb-6 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Receipt className="w-5 h-5 text-primary" />
                        </div>
                        بيانات الفاتورة
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <PatientCombobox
                            value={{ id: form.patientId, fullName: form.patientName }}
                            onSelect={(p: PatientDTO) => setForm(f => ({ ...f, patientId: p.id, patientName: p.fullName }))}
                        />
                        <div>
                            <label htmlFor="invoice-date" className="text-xs font-black text-[var(--text-secondary)] mb-2 block mr-1 uppercase tracking-widest">تاريخ الفاتورة</label>
                            <input
                                id="invoice-date"
                                type="date"
                                value={form.invoiceDate}
                                onChange={(e) => setForm(f => ({ ...f, invoiceDate: e.target.value }))}
                                className="w-full bg-[var(--bg-page)]/50 border-2 border-transparent rounded-2xl px-5 py-4 outline-none focus:border-primary focus:bg-[var(--bg-card)] transition-all font-bold text-[var(--text-primary)] font-numbers"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-sm border-[1.5px] border-[var(--border-color)]">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                        <h3 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Calculator className="w-5 h-5 text-primary" />
                            </div>
                            الخدمات والإجراءات
                        </h3>
                        <button
                            type="button"
                            onClick={addService}
                            className="px-5 py-2.5 bg-primary/10 text-primary rounded-xl text-xs font-black hover:bg-primary hover:text-white transition-all flex items-center gap-2 group"
                        >
                            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            إضافة خدمة
                        </button>
                    </div>

                    <div className="space-y-4">
                        {form.services.length === 0 ? (
                            <div className="text-center py-12 border-2 border-dashed border-[var(--border-subtle)]/50 rounded-2xl bg-[var(--bg-page)]/30">
                                <AlertCircle className="w-10 h-10 text-[var(--text-secondary)]/30 mx-auto mb-3" />
                                <p className="text-[var(--text-secondary)]/50 text-xs font-black uppercase tracking-[0.2em]">لا توجد خدمات مضافة بعد</p>
                            </div>
                        ) : (
                            form.services.map((svc, idx) => (
                                <div key={`svc-${svc.serviceId}-${idx}`} className="flex flex-col lg:flex-row gap-4 p-5 bg-[var(--bg-page)]/50 rounded-2xl border border-[var(--border-subtle)]/50 items-center animate-in fade-in slide-in-from-right-2 duration-300">
                                    <div className="flex-1 w-full">
                                            <label htmlFor={`unit-price-${idx}`} className="text-xs font-black text-[var(--text-secondary)] mb-1 block mr-1 uppercase tracking-widest">السعر</label>
                                        <select
                                            id={`service-select-${idx}`}
                                            value={svc.serviceId || ''}
                                            onChange={(e) => updateService(idx, 'serviceId', e.target.value)}
                                            aria-label="اختر الخدمة"
                                            className="w-full bg-[var(--bg-card)] border-2 border-transparent rounded-xl px-4 py-3 text-xs font-bold text-[var(--text-primary)] outline-none focus:border-primary transition-all appearance-none"
                                        >
                                            {availableServices.map(d => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex items-end gap-3 w-full lg:w-auto">
                                        <div className="flex-1 sm:w-24">
                                            <label htmlFor={`quantity-${idx}`} className="text-xs font-black text-[var(--text-secondary)] mb-1 block mr-1 uppercase tracking-widest">الكمية</label>
                                            <input
                                                id={`quantity-${idx}`}
                                                type="number"
                                                value={svc.quantity}
                                                onChange={(e) => updateService(idx, 'quantity', e.target.value)}
                                                min={1}
                                                className="w-full bg-[var(--bg-card)] border-2 border-transparent rounded-xl px-3 py-3 text-xs text-center font-bold text-[var(--text-primary)] font-numbers outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                        <div className="flex-1 sm:w-32">
                                            <label htmlFor={`unit-price-${idx}`} className="text-xs font-black text-[var(--text-secondary)] mb-1 block mr-1 uppercase tracking-widest">السعر</label>
                                            <input
                                                id={`unit-price-${idx}`}
                                                type="number"
                                                value={svc.unitPrice}
                                                onChange={(e) => updateService(idx, 'unitPrice', e.target.value)}
                                                className="w-full bg-[var(--bg-card)] border-2 border-transparent rounded-xl px-3 py-3 text-xs text-center font-bold text-[var(--text-primary)] font-numbers outline-none focus:border-primary transition-all"
                                            />
                                        </div>
                                        <div className="w-32 hidden sm:flex flex-col items-center justify-center h-12 bg-primary/5 rounded-xl border border-primary/10">
                                            <span className="text-xs font-black text-primary uppercase tracking-tighter opacity-70">المجموع</span>
                                            <span className="text-sm font-black text-primary font-numbers">{formatCurrency(svc.total)}</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => removeService(idx)}
                                            aria-label="حذف الخدمة"
                                            className="p-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all active:scale-90"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-sm border border-[var(--border-subtle)]">
                    <label htmlFor="invoice-notes" className="text-xs font-black text-[var(--text-primary)] mb-3 block mr-1 uppercase tracking-widest">ملاحظات إضافية</label>
                    <textarea
                        id="invoice-notes"
                        value={form.notes}
                        onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))}
                        className="w-full min-h-[120px] bg-[var(--bg-page)]/50 border-2 border-transparent rounded-[2rem] px-6 py-5 outline-none focus:border-primary focus:bg-[var(--bg-card)] transition-all font-bold text-[var(--text-primary)]"
                        placeholder="أدخل أي ملاحظات خاصة بالفاتورة..."
                    />
                </div>
            </div>

            {/* Left Column: Summary */}
            <div className="w-full lg:w-96 space-y-8">
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-xl border-[1.5px] border-[var(--border-color)] sticky top-8">
                    <h3 className="text-sm font-black text-[var(--text-primary)] mb-8 flex items-center justify-between">
                        ملخص الفاتورة
                        <span className="p-1 px-2.5 bg-[var(--bg-page)] rounded-full text-xs text-[var(--text-secondary)] font-black">
                            {form.services.length.toLocaleString('ar-EG')} بنود
                        </span>
                    </h3>

                    <div className="space-y-6">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-[var(--text-secondary)] font-bold uppercase tracking-wider text-xs">الإجمالي قبل الضريبة</span>
                            <span className="font-black text-[var(--text-primary)] font-numbers">{formatCurrency(subtotal)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="invoice-discount" className="text-xs font-black text-[var(--text-secondary)] mb-2 block mr-1 uppercase tracking-widest">الخصم (عدد)</label>
                                <div className="relative">
                                    <input
                                        id="invoice-discount"
                                        type="number"
                                        value={form.discount}
                                        onChange={(e) => setForm(prev => ({ ...prev, discount: Number(e.target.value) }))}
                                        min={0}
                                        className="w-full bg-[var(--bg-page)] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black text-red-500 outline-none focus:border-red-500 font-numbers transition-all"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label htmlFor="invoice-discount-reason" className="text-xs font-black text-[var(--text-secondary)] mb-2 block mr-1 uppercase tracking-widest">سبب الخصم (اختياري)</label>
                                <input
                                    id="invoice-discount-reason"
                                    type="text"
                                    value={form.discountReason || ''}
                                    onChange={(e) => setForm(prev => ({ ...prev, discountReason: e.target.value || undefined }))}
                                    placeholder="مثلاً: خصم نقدي، عرض خاص..."
                                    className="w-full bg-[var(--bg-page)] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-primary)] outline-none focus:border-primary transition-all"
                                />
                            </div>
                            <div>
                                <label htmlFor="invoice-tax" className="text-xs font-black text-[var(--text-secondary)] mb-2 block mr-1 uppercase tracking-widest">الضريبة (%)</label>
                                <input
                                    id="invoice-tax"
                                    type="number"
                                    value={form.taxRate}
                                    onChange={(e) => setForm(prev => ({ ...prev, taxRate: Number(e.target.value) }))}
                                    min={0}
                                    max={100}
                                    className="w-full bg-[var(--bg-page)] border-2 border-transparent rounded-xl px-4 py-3 text-sm font-black text-primary outline-none focus:border-primary font-numbers transition-all"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 pt-2">
                            {form.taxRate > 0 && (
                                <div className="flex justify-between items-center text-xs px-1">
                                    <span className="text-[var(--text-secondary)] font-bold">الضريبة ({form.taxRate.toLocaleString('ar-EG')}%):</span>
                                    <span className="font-black text-[var(--text-primary)] font-numbers">{formatCurrency(taxAmount)}</span>
                                </div>
                            )}

                            {form.discount > 0 && (
                                <div className="flex justify-between items-center text-xs px-1">
                                    <span className="text-red-500 font-bold">الخصم المطبق:</span>
                                    <span className="font-black text-red-600 font-numbers">-{formatCurrency(form.discount)}</span>
                                </div>
                            )}
                        </div>

                        <div className="pt-6 border-t border-[var(--border-subtle)]/50">
                            <div className="flex flex-col items-center gap-2 mb-8">
                                <span className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)]">الإجمالي النهائي المستحق</span>
                                <span className="text-4xl font-black text-primary font-numbers tracking-tight">{formatCurrency(total)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            <button
                                type="submit"
                                disabled={saving || !form.patientId || form.services.length === 0}
                                className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 disabled:shadow-none"
                            >
                                {saving ? (
                                    <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Save className="w-6 h-6" />
                                )}
                                <span className="text-base">حفظ الفاتورة</span>
                            </button>
                            <button
                                type="button"
                                onClick={onCancel}
                                className="w-full py-4 bg-[var(--bg-page)] text-[var(--text-secondary)] rounded-xl font-black hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-subtle)] transition-all"
                            >
                                إلغاء
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </form>
    );
}
