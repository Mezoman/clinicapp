import React from 'react';
import { TrendingUp } from 'lucide-react';

export const NotificationsTab: React.FC = React.memo(() => {
    return (
        <div className="animate-in zoom-in-95 duration-500 text-center py-20 px-10">
            <section className="bg-white dark:bg-secondary-900 rounded-[3rem] p-24 border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-xl max-w-2xl mx-auto space-y-8">
                <div className="size-32 bg-primary-50 dark:bg-primary-900/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 rotate-12 transition-transform hover:rotate-0 duration-500">
                    <TrendingUp aria-hidden={true} className="w-16 h-16 text-primary-500" />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white font-display">خدمة الإشعارات المتقدمة</h2>
                <p className="text-slate-500 dark:text-slate-400 font-bold leading-loose text-lg">
                    نحن بصدد تطوير نظام متكامل لإرسال تذكيرات المواعيد تلقائياً عبر الواتساب والرسائل القصيرة والبريد الإلكتروني، لتسهيل تواصلك مع مرضاك.
                </p>
                <div className="pt-8">
                    <span className="inline-flex items-center px-8 py-3 rounded-full bg-slate-100 dark:bg-secondary-800 text-slate-400 font-black uppercase text-xs tracking-[0.3em]">Coming Soon</span>
                </div>
            </section>
        </div>
    );
});
