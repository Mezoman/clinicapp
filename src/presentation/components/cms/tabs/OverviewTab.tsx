import React from 'react';
import { Palette, Layout, Grid, MessageCircle, AlignLeft, Zap, Globe, ChevronRight, Monitor } from 'lucide-react';
import { TabId } from '../types';
import { SectionCard } from '../shared';

export const OverviewTab: React.FC<{ setActiveTab: (t: TabId) => void }> = ({ setActiveTab }) => {
    const quickLinks = [
        { tab: 'branding' as TabId, label: 'تغيير اللوجو', icon: Palette },
        { tab: 'hero' as TabId, label: 'تعديل البانر الرئيسي', icon: Layout },
        { tab: 'services' as TabId, label: 'إدارة الخدمات', icon: Grid },
        { tab: 'whatsapp' as TabId, label: 'إعداد واتساب', icon: MessageCircle },
        { tab: 'footer' as TabId, label: 'تعديل الفوتر', icon: AlignLeft },
        { tab: 'colors' as TabId, label: 'تغيير الثيم', icon: Zap },
    ];
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-primary-500 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-primary-500/20">
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/5 rounded-full blur-xl" />
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-right">
                    <div className="size-20 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/20">
                        <Palette className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black mb-2 font-display uppercase tracking-widest">تحكم في موقعك بذكاء ✨</h2>
                        <p className="text-white/90 font-bold uppercase tracking-widest text-xs">نظام إدارة المحتوى المتطور يمنحك السيطرة الكاملة على كل تفاصيل واجهة عيادتك</p>
                    </div>
                </div>
            </div>

            <div>
                <h3 className="text-xs font-black text-slate-500 mb-6 uppercase tracking-[0.2em] mr-4 border-r-4 border-primary pr-4">اختصارات سريعة</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {quickLinks.map(({ tab, label, icon: Icon }) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className="flex items-center gap-5 p-6 rounded-[2rem] border-[1.5px] border-[var(--border-color)] bg-[var(--bg-card)] hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all group lg:text-right"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-secondary-800 group-hover:bg-primary group-hover:text-white flex items-center justify-center text-primary transition-all shadow-sm border border-slate-200 dark:border-secondary-700">
                                <Icon className="w-6 h-6" />
                            </div>
                            <span className="text-sm font-black text-slate-900 dark:text-white flex-1 uppercase tracking-widest">{label}</span>
                            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-primary-500 group-hover:translate-x-[-4px] transition-all" />
                        </button>
                    ))}
                </div>
            </div>

            <SectionCard title="خريطة عناصر الموقع" icon={Globe}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { label: 'شريط التنقل (Navbar)', desc: 'الشعار، القائمة، زر الحجز' },
                        { label: 'قسم البطل (Hero)', desc: 'الصورة الرئيسية، العنوان، الوصف، الأزرار' },
                        { label: 'قسم الخدمات', desc: 'إدارة الخدمات والأسعار من هنا مباشرة' },
                        { label: 'الشهادات والخبرات', desc: 'استعراض إنجازاتك المهنية والشهادات' },
                        { label: 'لماذا نحن؟', desc: 'مميزات العيادة وصورة التجهيزات' },
                        { label: 'التذييل (Footer)', desc: 'معلومات التواصل والروابط وحقوق النشر' },
                    ].map(({ label, desc }) => (
                        <div key={label} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-secondary-800 rounded-[1.5rem] border border-slate-100 dark:border-secondary-700 hover:border-primary-200 transition-all group">
                            <div className="space-y-1">
                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest group-hover:text-primary transition-colors">{label}</p>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{desc}</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-black uppercase tracking-widest border border-emerald-500/20">
                                <div className="size-1.5 bg-emerald-600 rounded-full animate-pulse" />
                                متصل
                            </div>
                        </div>
                    ))}
                </div>
            </SectionCard>

            <div className="mt-8 mx-0 animate-in fade-in duration-700">
                <div className="bg-white/70 dark:bg-secondary-900/70 backdrop-blur-2xl border border-white/20 dark:border-secondary-800 p-4 px-10 rounded-[2.5rem] shadow-sm flex flex-wrap justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="size-10 bg-emerald-500/10 rounded-xl flex items-center justify-center">
                            <Monitor className="w-5 h-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">تحديثات المحتوى</p>
                            <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">جميع التغييرات تُحفظ فورياً لموقع الزوار</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
