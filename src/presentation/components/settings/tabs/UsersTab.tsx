import React from 'react';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const UsersTab: React.FC<{ isSuperAdmin: boolean }> = React.memo(({ isSuperAdmin }) => {
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
        <section className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-sm p-10 text-center py-32 opacity-40 animate-in slide-in-from-bottom-4 duration-500">
            <div className="size-20 bg-slate-50 dark:bg-secondary-800 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck aria-hidden={true} className="w-10 h-10 text-slate-300" />
            </div>
            <h5 className="text-lg font-black text-slate-400 uppercase tracking-widest">إدارة المستخدمين والأدوار</h5>
            <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-widest">هذه الخاصية ستتاح في التحديث القادم لإدارة المساعدين والأطباء</p>
        </section>
    );
});
