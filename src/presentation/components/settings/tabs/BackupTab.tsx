import React from 'react';
import { AlertTriangle, Download, Loader2, RefreshCw, UploadCloud } from 'lucide-react';
import { BackupTabProps } from '../types';

export const BackupTab: React.FC<BackupTabProps> = React.memo(({ isSuperAdmin, isExporting, isImporting, onExport, onImport, onShowReset }) => {
    if (!isSuperAdmin) {
        return (
            <div className="bg-white dark:bg-secondary-900 rounded-[3rem] p-24 border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-xl flex flex-col items-center text-center space-y-8 animate-in zoom-in-95">
                <div className="size-24 bg-red-500/10 rounded-[2rem] flex items-center justify-center">
                    <AlertTriangle aria-hidden={true} className="w-12 h-12 text-red-500" />
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white font-display">وصول مقيد</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md leading-loose">
                    هذا القسم مخصص للمدير العام للنظام فقط. يرجى تسجيل الدخول بحساب المدير العام للوصول لهذه الإعدادات.
                </p>
            </div>
        );
    }

    return (
        <section className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border-2 border-red-500/10 dark:border-red-900/20 shadow-sm p-10 animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="text-xl font-black mb-8 text-red-600 dark:text-red-400 flex items-center gap-4 font-display">
                <div className="size-10 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <AlertTriangle aria-hidden={true} className="w-5 h-5" />
                </div>
                منطقة الخطر - إدارة البيانات
            </h3>
            <p className="text-slate-500 dark:text-slate-400 font-bold mb-10 text-sm leading-loose">
                هذه الخيارات مخصصة لاسترجاع البيانات أو مسح النظام بالكامل. هذه الإجراءات نهائية وحساسة جداً، يرجى استشارة فريق الدعم التقني قبل المتابعة في حال الشك.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-10 bg-slate-50 dark:bg-secondary-800/50 rounded-[2rem] border border-slate-100 dark:border-secondary-700 space-y-6 text-center group active:scale-[0.98] transition-all">
                    <div className="size-16 bg-white dark:bg-secondary-900 rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:bg-primary-500 group-hover:text-white transition-all">
                        <Download aria-hidden={true} className="w-8 h-8 text-primary-500 group-hover:text-white" />
                    </div>
                    <div className="space-y-2">
                        <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">تصدير قاعدة البيانات</h5>
                        <p className="text-xs font-bold text-slate-400 uppercase leading-relaxed">رفع ملف نسخة احتياطية سابقة لاستعادة حالة النظام أو نقل البيانات.</p>
                    </div>
                    <button onClick={onExport} disabled={isExporting} className="w-full h-14 bg-white dark:bg-secondary-900 border-[1.5px] border-slate-300 dark:border-secondary-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3">
                        {isExporting ? <Loader2 role="status" aria-label="جاري التصدير..." className="w-4 h-4 animate-spin" /> : <Download aria-hidden={true} className="w-4 h-4" />}
                        ابدأ التصدير
                    </button>
                </div>

                <div className="p-10 bg-slate-50 dark:bg-secondary-800/50 rounded-[2rem] border border-slate-100 dark:border-secondary-700 space-y-6 text-center group active:scale-[0.98] transition-all">
                    <div className="size-16 bg-white dark:bg-secondary-900 rounded-2xl flex items-center justify-center mx-auto shadow-sm group-hover:bg-indigo-500 group-hover:text-white transition-all">
                        <RefreshCw aria-hidden={true} className="w-8 h-8 text-indigo-500 group-hover:text-white" />
                    </div>
                    <div className="space-y-2">
                        <h5 className="font-black text-slate-900 dark:text-white uppercase tracking-widest text-xs">استيراد بيانات خارجية</h5>
                        <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">رفع ملف نسخة احتياطية سابقة لاستعادة حالة النظام أو نقل البيانات.</p>
                    </div>
                    <label className={`w-full h-14 bg-white dark:bg-secondary-900 border-[1.5px] border-slate-300 dark:border-secondary-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-3 cursor-pointer focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 dark:focus-within:ring-offset-secondary-900 ${isImporting && 'opacity-50 pointer-events-none'}`}>
                        {isImporting ? <Loader2 role="status" aria-label="جاري الاستيراد..." className="w-4 h-4 animate-spin" /> : <UploadCloud aria-hidden={true} className="w-4 h-4" />}
                        اختر الملف
                        <input type="file" accept=".json" onChange={onImport} className="sr-only" />
                    </label>
                </div>

                <div className="md:col-span-2 p-10 bg-red-500/5 border-[1.5px] border-red-500/30 rounded-[2rem] flex flex-col items-center text-center gap-6">
                    <AlertTriangle aria-hidden={true} className="w-16 h-16 text-red-500" />
                    <div className="space-y-2">
                        <h5 className="font-black text-red-600 dark:text-red-400 uppercase tracking-[0.2em] text-sm">إعادة ضبط المصنع الشامل</h5>
                        <p className="text-xs font-bold text-red-500/70 max-w-lg leading-relaxed uppercase tracking-widest">تحذير: سيتم مسح جميع البيانات نهائياً ولن تتمكن من استعادتها أبداً. سيتم حذف جميع المرضى، الصور، الديون، السجلات، وكل شيء.</p>
                    </div>
                    <button onClick={onShowReset} className="px-12 h-14 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-red-600/30 hover:bg-red-700 hover:scale-105 active:scale-95 transition-all">
                        تدمير كافة البيانات
                    </button>
                </div>
            </div>
        </section>
    );
});
