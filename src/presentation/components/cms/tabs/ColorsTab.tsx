import React, { useState } from 'react';
import { Palette, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { LandingContentDTO } from '../../../hooks/useCMSContent';
import { SectionCard, SaveButton } from '../shared';

interface ColorsTabProps {
    cmsMap: Record<string, LandingContentDTO>;
    onSave: (id: string, v: string) => Promise<void>;
}

export const ColorsTab: React.FC<ColorsTabProps> = ({ cmsMap, onSave }) => {
    const find = (key: string) => Object.values(cmsMap).find(c => c.key === key);
    const [primary, setPrimary] = useState(find('theme_primary')?.content || '#0ea5e9');
    const [secondary, setSecondary] = useState(find('theme_secondary')?.content || '#0f172a');
    const [accent, setAccent] = useState(find('theme_accent')?.content || '#10b981');
    const [saving, setSaving] = useState(false);

    const presets = [
        { name: 'أزرق سماوي (افتراضي)', p: '#0ea5e9', s: '#0f172a', a: '#10b981' },
        { name: 'أخضر طبي', p: '#10b981', s: '#1e293b', a: '#0ea5e9' },
        { name: 'بنفسجي راقي', p: '#8b5cf6', s: '#1e1b4b', a: '#ec4899' },
    ];

    const handleSave = async () => {
        setSaving(true);
        try {
            const saves = [{ key: 'theme_primary', val: primary }, { key: 'theme_secondary', val: secondary }, { key: 'theme_accent', val: accent }];
            for (const { key, val } of saves) { const item = find(key); if (item) await onSave(item.id, val); }
            toast.success('تم حفظ إعدادات الألوان');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SectionCard title="الألوان المخصصة" icon={Palette}>
                    <div className="space-y-8">
                        {[{ label: 'اللون الرئيسي', val: primary, set: setPrimary }, { label: 'اللون الثانوي', val: secondary, set: setSecondary }, { label: 'لون التأكيد', val: accent, set: setAccent }].map(({ label, val, set }) => (
                            <div key={label} className="group">
                                <p className="text-xs font-black text-slate-500 dark:text-slate-400 mb-4">{label}</p>
                                <div className="flex items-center gap-4">
                                    <input type="color" value={val} onChange={e => set(e.target.value)} className="size-14 rounded-2xl cursor-pointer" />
                                    <input type="text" value={val} onChange={e => set(e.target.value)} dir="ltr" className="flex-1 bg-slate-50 dark:bg-secondary-800 border rounded-2xl px-5 py-3 text-sm font-black outline-none focus:border-primary-500 uppercase" />
                                </div>
                            </div>
                        ))}
                    </div>
                </SectionCard>
                <SectionCard title="ثيمات جاهزة" icon={Zap}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {presets.map(preset => (
                            <button key={preset.name} onClick={() => { setPrimary(preset.p); setSecondary(preset.s); setAccent(preset.a); }} className="p-4 rounded-3xl bg-slate-50 dark:bg-secondary-800 border-[1.5px] border-[var(--border-color)] text-right group">
                                <div className="flex gap-2 mb-4">
                                    <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: preset.p }} />
                                    <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: preset.s }} />
                                    <div className="w-10 h-10 rounded-xl" style={{ backgroundColor: preset.a }} />
                                </div>
                                <p className="text-xs font-black group-hover:text-primary-500 uppercase tracking-widest leading-loose">{preset.name}</p>
                            </button>
                        ))}
                    </div>
                </SectionCard>
            </div>
            <div className="flex justify-end"><SaveButton onClick={handleSave} saving={saving} /></div>
        </div>
    );
};
