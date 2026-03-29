import React, { useState } from 'react';
import { Star, X, Layout } from 'lucide-react';
import { toast } from 'sonner';
import type { LandingContentDTO } from '../../../hooks/useCMSContent';
import { WhyUsItem } from '../types';
import { SectionCard, FieldRow, TextInput, SaveButton, ImageUploader } from '../shared';

interface WhyUsTabProps {
    cmsMap: Record<string, LandingContentDTO>;
    onSave: (id: string, v: string) => Promise<void>;
    cloudName: string;
    preset: string;
}

export const WhyUsTab: React.FC<WhyUsTabProps> = ({ cmsMap, onSave, cloudName, preset }) => {
    const find = (key: string) => Object.values(cmsMap).find(c => c.key === key);
    const [sectionTitle, setSectionTitle] = useState(find('whyus_title')?.content || 'لماذا عيادة الدكتور محمد أسامة الرفاعي؟');
    const [equipmentImage, setEquipmentImage] = useState(find('equipment_image')?.content || '');
    const [items, setItems] = useState<WhyUsItem[]>(() => { try { return JSON.parse(find('whyus_items')?.content || '[]'); } catch { return []; } });
    const [saving, setSaving] = useState(false);

    const updateItem = (i: number, field: keyof WhyUsItem, val: string) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const handleSave = async () => {
        setSaving(true);
        try {
            const saves = [{ key: 'whyus_title', val: sectionTitle }, { key: 'equipment_image', val: equipmentImage }, { key: 'whyus_items', val: JSON.stringify(items) }];
            for (const { key, val } of saves) {
                const item = find(key);
                if (item) await onSave(item.id, val);
            }
            toast.success('تم حفظ قسم لماذا نحن');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionCard title="هوية قسم لماذا نحن" icon={Layout}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <FieldRow label="عنوان القسم"><TextInput value={sectionTitle} onChange={setSectionTitle} multiline /></FieldRow>
                    <ImageUploader value={equipmentImage} onUpload={setEquipmentImage} label="ارفع صورة العيادة" cloudName={cloudName} preset={preset} />
                </div>
            </SectionCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map((item, i) => (
                    <div key={`whyus-${i}-${item.title}`} className="p-8 bg-[var(--bg-card)] rounded-[2.5rem] border-[1.5px] border-[var(--border-color)] shadow-sm group hover:border-primary/50 transition-all">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-primary/10"><Star className="size-6" /></div>
                            <div className="flex-1"><FieldRow label="عنوان الميزة"><TextInput value={item.title} onChange={v => updateItem(i, 'title', v)} /></FieldRow></div>
                            <button onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))} className="p-2 text-slate-300 hover:text-red-500 transition-all"><X className="size-4" /></button>
                        </div>
                        <FieldRow label="الوصف"><TextInput value={item.desc} onChange={v => updateItem(i, 'desc', v)} multiline /></FieldRow>
                    </div>
                ))}
            </div>
            <div className="flex justify-end"><SaveButton onClick={handleSave} saving={saving} /></div>
        </div>
    );
};
