import React from 'react';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';

interface ResetModalProps {
    isOpen: boolean;
    onClose: () => void;
    confirmText: string;
    setConfirmText: (v: string) => void;
    onReset: () => Promise<void>;
    isResetting: boolean;
    modalRef: React.RefObject<HTMLDivElement | null>;
}

export const ResetModal: React.FC<ResetModalProps> = ({ isOpen, onClose, confirmText, setConfirmText, onReset, isResetting, modalRef }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-in fade-in duration-300">
            <div ref={modalRef} role="dialog" aria-modal="true" aria-labelledby="reset-modal-title" className="bg-white dark:bg-secondary-900 rounded-[3rem] w-full max-w-md shadow-2xl border-2 border-red-500/20 overflow-hidden animate-in zoom-in-95 duration-300 p-12 text-center">
                <div className="space-y-8">
                    <div className="size-24 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
                        <AlertTriangle className="w-12 h-12" />
                    </div>
                    <div className="space-y-4">
                        <h2 id="reset-modal-title" className="text-2xl font-black text-slate-900 dark:text-white font-display">تحذير أمني خطير!</h2>
                        <p className="text-slate-500 font-bold leading-relaxed uppercase tracking-widest text-xs">هذا الإجراء سيمسح بيانات المرضى والمواعيد والسجلات الطبية والفواتير نهائياً. لا يمكن التراجع.</p>
                    </div>

                    {/* توضيح ما سيُحذف وما سيبقى */}
                    <div className="bg-red-50 dark:bg-red-900/10 rounded-2xl p-6 text-right space-y-3">
                        <p className="text-xs font-black text-red-600 uppercase tracking-widest mb-3">
                            ما الذي سيُحذف؟
                        </p>
                        <div className="space-y-2 text-xs font-bold">
                            <div className="flex items-center gap-2 text-red-500">
                                <span>✗</span><span>جميع بيانات المرضى</span>
                            </div>
                            <div className="flex items-center gap-2 text-red-500">
                                <span>✗</span><span>جميع المواعيد</span>
                            </div>
                            <div className="flex items-center gap-2 text-red-500">
                                <span>✗</span><span>جميع السجلات الطبية</span>
                            </div>
                            <div className="flex items-center gap-2 text-red-500">
                                <span>✗</span><span>جميع الفواتير</span>
                            </div>
                        </div>
                        <hr className="border-red-200 dark:border-red-800 my-3" />
                        <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-2">
                            ما الذي سيبقى؟
                        </p>
                        <div className="space-y-2 text-xs font-bold">
                            <div className="flex items-center gap-2 text-emerald-600">
                                <span>✓</span><span>إعدادات العيادة وساعات العمل</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600">
                                <span>✓</span><span>حسابات المستخدمين والأدوار</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600">
                                <span>✓</span><span>محتوى الموقع الإلكتروني (CMS)</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em]">اكتب RESET أدناه لتأكيد الكارثة</p>
                        <input type="text" placeholder="RESET" value={confirmText} onChange={(e) => setConfirmText(e.target.value.toUpperCase())} className="w-full px-6 py-5 bg-slate-50 dark:bg-secondary-800 border-2 border-red-500/20 rounded-2xl text-center font-black tracking-[0.5em] text-xl focus:border-red-500 outline-none transition-all placeholder:tracking-normal placeholder:font-bold" />
                    </div>
                    <div className="flex gap-4 pt-8">
                        <button onClick={onClose} className="flex-1 py-4 bg-slate-100 dark:bg-secondary-800 text-slate-500 font-black rounded-2xl uppercase text-[10px] tracking-widest transition-all hover:bg-slate-200">تراجع، أنا لست جاهزاً</button>
                        <button onClick={onReset} disabled={confirmText !== 'RESET' || isResetting} className="flex-[2] py-4 bg-red-600 text-white font-black rounded-2xl flex items-center justify-center gap-3 shadow-2xl shadow-red-600/30 hover:bg-red-700 disabled:opacity-50 transition-all uppercase text-[10px] tracking-widest">
                            {isResetting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />} امسح كل شيء الآن
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
