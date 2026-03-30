import React, { useState } from 'react';
import { MessageCircle, Clock, Bell, Smartphone, Mail, ChevronDown } from 'lucide-react';

export const NotificationsTab: React.FC = React.memo(() => {
    const [whatsappEnabled, setWhatsappEnabled] = useState(false);
    const [smsEnabled, setSmsEnabled] = useState(false);
    const [emailEnabled, setEmailEnabled] = useState(false);
    const [reminderHours, setReminderHours] = useState(24);

    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500 space-y-8">
            {/* WhatsApp Notifications */}
            <section className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-sm p-8 sm:p-10">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-[#25D366]/10 rounded-2xl flex items-center justify-center shadow-inner">
                            <MessageCircle className="size-6 text-[#25D366]" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">إشعارات الواتساب</h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">إرسال تذكيرات آلية للمرضى</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setWhatsappEnabled(!whatsappEnabled)}
                        disabled
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 cursor-not-allowed opacity-50 ${whatsappEnabled ? 'bg-[#25D366]' : 'bg-slate-200 dark:bg-secondary-700'}`}
                        aria-label="تفعيل إشعارات الواتساب"
                        title="سيتم تفعيله عند إعداد WhatsApp Business API"
                    >
                        <div className={`absolute top-1 size-6 rounded-full bg-white shadow-md transition-all duration-300 ${whatsappEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
                <div className="space-y-6 opacity-50">
                    <div className="relative">
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2 px-1">وقت التذكير قبل الموعد</label>
                        <div className="relative group/sel">
                            <Clock className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 size-5" aria-hidden="true" />
                            <select
                                value={reminderHours}
                                onChange={(e) => setReminderHours(Number(e.target.value))}
                                disabled
                                className="w-full pr-12 pl-10 py-4 bg-slate-50 dark:bg-secondary-800 border border-transparent rounded-2xl text-sm font-black text-slate-900 dark:text-white appearance-none cursor-not-allowed outline-none"
                            >
                                <option value={1}>قبل ساعة واحدة</option>
                                <option value={2}>قبل ساعتين</option>
                                <option value={6}>قبل 6 ساعات</option>
                                <option value={12}>قبل 12 ساعة</option>
                                <option value={24}>قبل 24 ساعة</option>
                                <option value={48}>قبل 48 ساعة</option>
                            </select>
                            <ChevronDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 size-4 pointer-events-none" />
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-secondary-800/50 rounded-2xl p-6 border border-slate-100 dark:border-secondary-700">
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">نموذج الرسالة</p>
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed" dir="rtl">
                            مرحباً [اسم المريض]، هذا تذكير بموعدك في عيادة الدكتور محمد أسامة الرفاعي يوم [التاريخ] الساعة [الوقت]. نتطلع لرؤيتك!
                        </p>
                    </div>
                </div>
            </section>

            {/* SMS Notifications */}
            <section className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-sm p-8 sm:p-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-blue-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                            <Smartphone className="size-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">الرسائل القصيرة (SMS)</h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">إرسال رسائل نصية للمرضى</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSmsEnabled(!smsEnabled)}
                        disabled
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 cursor-not-allowed opacity-50 ${smsEnabled ? 'bg-blue-500' : 'bg-slate-200 dark:bg-secondary-700'}`}
                        aria-label="تفعيل الرسائل القصيرة"
                        title="سيتم تفعيله عند إعداد Twilio"
                    >
                        <div className={`absolute top-1 size-6 rounded-full bg-white shadow-md transition-all duration-300 ${smsEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </section>

            {/* Email Notifications */}
            <section className="bg-white dark:bg-secondary-900 rounded-[2.5rem] border-[1.5px] border-slate-300 dark:border-secondary-800 shadow-sm p-8 sm:p-10">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="size-12 bg-violet-500/10 rounded-2xl flex items-center justify-center shadow-inner">
                            <Mail className="size-6 text-violet-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900 dark:text-white">البريد الإلكتروني</h3>
                            <p className="text-xs font-bold text-slate-400 mt-0.5 uppercase tracking-widest">إرسال إشعارات عبر البريد</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setEmailEnabled(!emailEnabled)}
                        disabled
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 cursor-not-allowed opacity-50 ${emailEnabled ? 'bg-violet-500' : 'bg-slate-200 dark:bg-secondary-700'}`}
                        aria-label="تفعيل إشعارات البريد"
                        title="سيتم تفعيله عند إعداد خدمة البريد"
                    >
                        <div className={`absolute top-1 size-6 rounded-full bg-white shadow-md transition-all duration-300 ${emailEnabled ? 'left-7' : 'left-1'}`} />
                    </button>
                </div>
            </section>

            {/* Development Roadmap */}
            <div className="bg-primary/5 border border-primary/10 rounded-[2rem] p-8 text-right">
                <div className="flex items-start gap-4">
                    <div className="size-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0 mt-1">
                        <Bell className="size-5 text-primary" />
                    </div>
                    <div>
                        <h4 className="font-black text-sm text-primary mb-2">خطة التطوير</h4>
                        <div className="space-y-3 text-xs font-bold text-slate-500 leading-relaxed">
                            <div className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">●</span>
                                <span><strong className="text-slate-700 dark:text-slate-300">المرحلة الأولى:</strong> إرسال تذكيرات واتساب عبر WhatsApp Business API + Supabase Edge Function عند تأكيد الموعد وقبل 24 ساعة منه.</span>
                            </div>
                            <div className="flex items-start gap-2">
                                <span className="text-slate-300 mt-0.5">○</span>
                                <span><strong className="text-slate-700 dark:text-slate-300">المرحلة الثانية:</strong> جدولة تلقائية عبر Supabase pg_cron لإرسال الإشعارات بدون تدخل يدوي.</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});
