import React, { useState } from 'react';
import { Layout, Sparkles, Trash2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import type { LandingContentDTO } from '../../../hooks/useCMSContent';
import { ServiceItem } from '../types';
import { SectionCard, FieldRow, TextInput, Toggle, SaveButton } from '../shared';

interface ServicesTabProps {
    cmsMap: Record<string, LandingContentDTO>;
    onSave: (id: string, v: string) => Promise<void>;
}

export const ServicesTab: React.FC<ServicesTabProps> = ({ cmsMap, onSave }) => {
    const find = (key: string) => Object.values(cmsMap).find(c => c.key === key);
    const [services, setServices] = useState<ServiceItem[]>(() => { try { const raw = JSON.parse(find('services_list')?.content || '[]'); return raw.map((s: any) => ({ ...s, visible: s.visible !== false })); } catch { return []; } });
    const [sectionTitle, setSectionTitle] = useState(find('services_title')?.content || 'خدماتنا المتميزة');
    const [saving, setSaving] = useState(false);
    const [editIdx, setEditIdx] = useState<number | null>(null);

    const updateService = <K extends keyof ServiceItem>(i: number, field: K, val: ServiceItem[K]) => setServices(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));

    const handleSave = async () => {
        setSaving(true);
        try {
            const item = find('services_list');
            const titleItem = find('services_title');
            if (item) await onSave(item.id, JSON.stringify(services));
            if (titleItem) await onSave(titleItem.id, sectionTitle);
            toast.success('تم حفظ الخدمات المتميزة');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionCard title="رأس قسم الخدمات" icon={Layout}>
                <FieldRow label="عنوان قسم الخدمات للمرضى"><TextInput value={sectionTitle} onChange={setSectionTitle} /></FieldRow>
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((s, i) => (
                    <div 
                        key={`service-${i}-${s.name}`} 
                        onClick={() => setEditIdx(i)} 
                        className={`group relative p-6 rounded-3xl border-[1.5px] transition-all cursor-pointer ${editIdx === i ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-primary/50'}`}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="size-12 rounded-2xl bg-secondary-50 dark:bg-secondary-800 border-[1.5px] border-[var(--border-subtle)] flex items-center justify-center text-primary transition-transform">
                                <Sparkles className="size-6" />
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); setServices(prev => prev.filter((_, idx) => idx !== i)); if (editIdx === i) setEditIdx(null); }} className="size-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 transition-all"><Trash2 className="size-4" /></button>
                        </div>
                        <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 line-clamp-1">{s.name}</h3>
                        <p className="text-sm text-slate-500 dark:text-secondary-400 leading-relaxed line-clamp-2">{s.description}</p>
                    </div>
                ))}
            </div>
            {editIdx !== null && services[editIdx] && (
                <SectionCard title={`تعديل: ${services[editIdx].name}`} icon={ArrowLeft} onBack={() => setEditIdx(null)}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FieldRow label="اسم الخدمة"><TextInput value={services[editIdx].name} onChange={v => updateService(editIdx, 'name', v)} /></FieldRow>
                        <FieldRow label="السعر التقديري"><TextInput value={services[editIdx].price.toString()} onChange={v => updateService(editIdx, 'price', parseInt(v) || 0)} /></FieldRow>
                        <Toggle checked={services[editIdx].visible} onChange={v => updateService(editIdx, 'visible', v)} label="تفعيل الخدمة" />
                        <FieldRow label="الوصف"><TextInput value={services[editIdx].description} onChange={v => updateService(editIdx, 'description', v)} multiline /></FieldRow>
                    </div>
                </SectionCard>
            )}
            <div className="flex justify-end"><SaveButton onClick={handleSave} saving={saving} /></div>
        </div>
    );
};
