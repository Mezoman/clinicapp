import { Clock, FileText, Receipt, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useState, memo } from 'react';
import type { AppointmentDTO } from '../../application/dtos/appointment.dto';
import type { MedicalRecordDTO } from '../../application/dtos/medical.dto';
import type { InvoiceDTO } from '../../application/dtos/billing.dto';

type TimelineEvent =
    | { type: 'appointment'; date: string; data: AppointmentDTO }
    | { type: 'medical'; date: string; data: MedicalRecordDTO }
    | { type: 'invoice'; date: string; data: InvoiceDTO };

interface Props {
    appointments: readonly AppointmentDTO[];
    medicalRecords: readonly MedicalRecordDTO[];
    invoices: readonly InvoiceDTO[];
}

const EVENT_CONFIG = {
    appointment: {
        icon: Calendar,
        color: 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800/50',
        iconColor: 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30',
        label: 'موعد',
    },
    medical: {
        icon: FileText,
        color: 'bg-emerald-50/50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50',
        iconColor: 'text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30',
        label: 'سجل طبي',
    },
    invoice: {
        icon: Receipt,
        color: 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800/50',
        iconColor: 'text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30',
        label: 'فاتورة',
    },
};

const PatientTimeline = memo(function PatientTimeline({ appointments, medicalRecords, invoices }: Props) {
    const [expanded, setExpanded] = useState<string | null>(null);

    // دمج كل الأحداث في قائمة واحدة مرتبة زمنياً
    const events: TimelineEvent[] = [
        ...appointments.map(a => ({ type: 'appointment' as const, date: a.date, data: a })),
        ...medicalRecords.map(r => ({ type: 'medical' as const, date: r.visitDate || r.createdAt || '', data: r })),
        ...invoices.map(i => ({ type: 'invoice' as const, date: i.invoiceDate, data: i })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    if (events.length === 0) {
        return (
            <div className="text-center py-10 text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-black uppercase tracking-widest">لا توجد سجلات بعد</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* الخط العمودي */}
            <div className="absolute right-5 top-0 bottom-0 w-[2px] bg-[var(--border-subtle)]/50" />

            <div className="space-y-4">
                {events.map((event, idx) => {
                    const cfg = EVENT_CONFIG[event.type];
                    const Icon = cfg.icon;
                    const key = `${event.type}-${idx}`;
                    const isOpen = expanded === key;

                    return (
                        <div key={key} className="relative flex gap-4 pr-12">
                            {/* أيقونة الحدث */}
                            <div className={`absolute right-2 top-0.5 w-[26px] h-[26px] rounded-full flex items-center justify-center ${cfg.iconColor} border-[2px] border-[var(--bg-card)] shadow-sm z-10`}>
                                <Icon className="w-3.5 h-3.5" />
                            </div>

                            {/* بطاقة الحدث */}
                            <div className={`flex-1 rounded-2xl border-[1.5px] p-4 ${cfg.color} transition-all hover:bg-white dark:hover:bg-slate-800/50 shadow-sm`}>
                                <button
                                    type="button"
                                    onClick={() => setExpanded(isOpen ? null : key)}
                                    className="w-full flex items-center justify-between text-right outline-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${cfg.iconColor} border border-current/10 shadow-sm`}>
                                            {cfg.label}
                                        </span>
                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest font-numbers">
                                            {new Date(event.date).toLocaleDateString('ar-EG', {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })}
                                        </span>
                                    </div>
                                    <div className="p-1 bg-white/50 dark:bg-black/20 rounded-lg">
                                        {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                                    </div>
                                </button>

                                {/* تفاصيل الحدث */}
                                {isOpen && (
                                    <div className="mt-4 pt-4 border-t border-[var(--border-subtle)]/30 text-xs space-y-3 animate-in fade-in duration-300">
                                        {event.type === 'appointment' && (
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">الوقت</p><p className="font-bold text-slate-700 dark:text-slate-200 font-numbers">{event.data.time}</p></div>
                                                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">النوع</p><p className="font-bold text-slate-700 dark:text-slate-200">{event.data.type}</p></div>
                                                <div className="col-span-2"><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">الحالة</p><p className="font-bold text-slate-700 dark:text-slate-200">{event.data.status}</p></div>
                                                {event.data.notes && <div className="col-span-2"><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">ملاحظات</p><p className="text-sm font-medium text-slate-600 dark:text-slate-400 bg-white/30 dark:bg-black/10 p-3 rounded-xl">{event.data.notes}</p></div>}
                                            </div>
                                        )}
                                        {event.type === 'medical' && (
                                            <div className="space-y-4">
                                                {event.data.chiefComplaint && <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">الشكوى</p><p className="font-bold text-slate-700 dark:text-slate-200">{event.data.chiefComplaint}</p></div>}
                                                {event.data.diagnosis && <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">التشخيص</p><p className="font-bold text-slate-700 dark:text-slate-200">{event.data.diagnosis}</p></div>}
                                                {event.data.treatmentDone && <div><p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">العلاج المنفذ</p><p className="font-black text-slate-800 dark:text-slate-100 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">{event.data.treatmentDone}</p></div>}
                                            </div>
                                        )}
                                        {event.type === 'invoice' && (
                                            <div className="grid grid-cols-2 gap-4 bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--border-subtle)]/50 shadow-inner">
                                                <div className="col-span-2"><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">رقم الفاتورة</p><p className="font-black text-slate-800 dark:text-white font-numbers">{event.data.invoiceNumber}</p></div>
                                                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">الإجمالي</p><p className="text-sm font-black text-slate-900 dark:text-white font-numbers">{event.data.total} <span className="text-[10px]">ج.م</span></p></div>
                                                <div><p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1">المدفوع</p><p className="text-sm font-black text-emerald-600 font-numbers">{event.data.totalPaid} <span className="text-[10px]">ج.م</span></p></div>
                                                {event.data.balance > 0 && (
                                                    <div className="col-span-2 pt-2 border-t border-[var(--border-subtle)]/30"><p className="text-[10px] text-red-500 font-black uppercase tracking-widest mb-1">المتبقي</p><p className="text-base font-black text-red-600 font-numbers">{event.data.balance} <span className="text-[10px]">ج.م</span></p></div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

export default PatientTimeline;
