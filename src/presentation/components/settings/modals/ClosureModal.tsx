import React from 'react';
import { X, Plus } from 'lucide-react';
import { ClosureFormState } from '../types';
import { ClosureReasonDTO } from '../../../../application/dtos/settings.dto';

interface ClosureModalProps {
    isOpen: boolean;
    onClose: () => void;
    form: ClosureFormState;
    setForm: React.Dispatch<React.SetStateAction<ClosureFormState>>;
    onAdd: () => Promise<void>;
    modalRef: React.RefObject<HTMLDivElement | null>;
}

export const ClosureModal: React.FC<ClosureModalProps> = ({ isOpen, onClose, form, setForm, onAdd, modalRef }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="closure-modal-title" className="bg-white dark:bg-secondary-900 rounded-[3rem] w-full max-w-md shadow-2xl border border-slate-200 dark:border-secondary-800 overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-50 dark:border-secondary-800 flex items-center justify-between">
                    <h2 id="closure-modal-title" className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 font-display uppercase tracking-widest">إضافة فترة إغلاق</h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 dark:hover:bg-secondary-800 rounded-full transition-colors"><X className="w-8 h-8" /></button>
                </div>
                <div className="p-10 space-y-8">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تاريخ البداية</label>
                        <input type="date" value={form.startDate} onChange={(e) => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl h-14 px-6 text-sm font-black focus:ring-2 focus:ring-primary-500/50 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">تاريخ النهاية</label>
                        <input type="date" value={form.endDate} onChange={(e) => setForm(p => ({ ...p, endDate: e.target.value }))} className="w-full bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl h-14 px-6 text-sm font-black focus:ring-2 focus:ring-primary-500/50 outline-none transition-all" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">السبب</label>
                        <select value={form.reason} onChange={(e) => setForm(p => ({ ...p, reason: e.target.value as ClosureReasonDTO }))} className="w-full bg-slate-50 dark:bg-secondary-800 border-none rounded-2xl h-14 px-6 text-sm font-black focus:ring-2 focus:ring-primary-500/50 outline-none transition-all appearance-none cursor-pointer">
                            <option value="holiday">إجازة رسمية</option>
                            <option value="travel">سفر</option>
                            <option value="maintenance">صيانة</option>
                            <option value="other">أخرى</option>
                        </select>
                    </div>
                </div>
                <div className="p-10 bg-slate-50/50 dark:bg-secondary-800/30 border-t border-slate-50 dark:border-secondary-800 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-white dark:bg-secondary-800 border border-slate-200 dark:border-secondary-700 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest">إلغاء</button>
                    <button onClick={onAdd} className="flex-[2] py-4 bg-primary-500 text-white rounded-2xl font-black shadow-xl shadow-primary-500/20 hover:bg-primary-600 transition-all uppercase text-[10px] tracking-widest flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" /> تأكيد الإضافة
                    </button>
                </div>
            </div>
        </div>
    );
};
