import React, { useState } from 'react';
import { Link, Trash2, Plus, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { LandingContentDTO } from '../../../hooks/useCMSContent';
import { SectionCard, FieldRow, TextInput, Toggle, SaveButton } from '../shared';

interface NavbarTabProps {
    cmsMap: Record<string, LandingContentDTO>;
    onSave: (id: string, v: string) => Promise<void>;
}

export const NavbarTab: React.FC<NavbarTabProps> = ({ cmsMap, onSave }) => {
    const find = (key: string) => Object.values(cmsMap).find(c => c.key === key);
    const [navLinks, setNavLinks] = useState<string[]>(() => { try { return JSON.parse(find('nav_links')?.content || '[]'); } catch { return ['الرئيسية', 'خدماتنا', 'لماذا نحن؟', 'تواصل معنا']; } });
    const [ctaText, setCtaText] = useState(find('nav_cta')?.content || 'احجز موعداً');
    const [showCta, setShowCta] = useState(find('nav_show_cta')?.content !== 'false');
    const [saving, setSaving] = useState(false);
    const [newLink, setNewLink] = useState('');

    const addLink = () => { if (newLink.trim()) { setNavLinks(prev => [...prev, newLink.trim()]); setNewLink(''); } };

    const handleSave = async () => {
        setSaving(true);
        try {
            const navLinksItem = find('nav_links');
            const navCtaItem = find('nav_cta');
            const navShowCtaItem = find('nav_show_cta');
            if (navLinksItem) await onSave(navLinksItem.id, JSON.stringify(navLinks));
            if (navCtaItem) await onSave(navCtaItem.id, ctaText);
            if (navShowCtaItem) await onSave(navShowCtaItem.id, showCta ? 'true' : 'false');
            toast.success('تم حفظ إعدادات شريط التنقل');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionCard title="روابط التنقل الرئيسية" icon={Link}>
                <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6 border-b-[1.5px] border-[var(--border-subtle)] pb-4">تظهر هذه الروابط في الهيدر والفوتر لتوجيه الزوار</p>
                <div className="space-y-4">
                    {navLinks.map((link, i) => (
                        <div key={`nav-${i}-${link}`} className="group flex items-center gap-3">
                            <div className="flex-1 relative">
                                <input 
                                    value={link} 
                                    onChange={e => setNavLinks(prev => prev.map((l, idx) => idx === i ? e.target.value : l))} 
                                    className="w-full bg-slate-50 dark:bg-secondary-800 border-[1.5px] border-slate-200 dark:border-secondary-700 rounded-2xl pr-10 pl-4 py-3 text-sm font-bold text-slate-900 dark:text-white focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-slate-400" 
                                />
                            </div>
                            <button onClick={() => setNavLinks(prev => prev.filter((_, idx) => idx !== i))} className="p-3 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl border-[1.5px] border-[var(--border-color)] transition-all"><Trash2 className="w-5 h-5" /></button>
                        </div>
                    ))}
                    <div className="flex gap-3 pt-4 border-t-[1.5px] border-[var(--border-subtle)] mt-6">
                        <input value={newLink} onChange={e => setNewLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLink()} placeholder="أضف رابطاً جديداً..." className="flex-1 bg-white dark:bg-secondary-900 border-[1.5px] border-slate-200 dark:border-secondary-700 rounded-2xl px-5 py-3 text-sm font-bold outline-none focus:border-primary transition-all placeholder:text-slate-400" />
                        <button onClick={addLink} className="p-3 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 active:scale-95 transition-all"><Plus className="w-5 h-5" /></button>
                    </div>
                </div>
            </SectionCard>
            <SectionCard title="إعدادات التفاعل السريع" icon={Zap}>
                <div className="space-y-6">
                    <Toggle checked={showCta} onChange={setShowCta} label="إظهار زر حجز موعد في الهيدر" />
                    {showCta && (
                        <div className="animate-in slide-in-from-top-2 duration-300">
                            <FieldRow label="نص زر الحجز"><TextInput value={ctaText} onChange={setCtaText} /></FieldRow>
                        </div>
                    )}
                </div>
            </SectionCard>
            <div className="flex justify-end"><SaveButton onClick={handleSave} saving={saving} /></div>
        </div>
    );
};
