import React, { useState, useEffect, useRef } from 'react';
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

    // ─── Parse Initial Equipment Image (JSON or plain URL) ────────────────────
    const initialEquipRaw = find('equipment_image')?.content || '';
    let initialEquipUrl = initialEquipRaw;
    let initialEquipPublicId = '';
    try {
        const parsed = JSON.parse(initialEquipRaw);
        if (parsed && typeof parsed === 'object' && parsed.url) {
            initialEquipUrl      = parsed.url;
            initialEquipPublicId = parsed.publicId || '';
        }
    } catch { /* treat as plain URL */ }

    // ─── State ────────────────────────────────────────────────────────────────
    const [sectionTitle,     setSectionTitle]     = useState(find('whyus_title')?.content || 'لماذا عيادة الدكتور محمد أسامة الرفاعي؟');
    const [equipmentImage,   setEquipmentImage]   = useState(initialEquipUrl);
    const [equipmentPublicId, setEquipmentPublicId] = useState(initialEquipPublicId);
    const [items, setItems] = useState<WhyUsItem[]>(() => {
        try { return JSON.parse(find('whyus_items')?.content || '[]'); }
        catch { return []; }
    });
    const [saving, setSaving] = useState(false);

    // ─── Sync Refs ────────────────────────────────────────────────────────────
    // يحفظ كل ref آخر قيمة تمت مزامنتها من الـ backend.
    // الهدف المزدوج:
    //   1. منع Stale Closure: نقارن بـ ref.current بدلاً من متغير الحالة،
    //      فلا نحتاج إضافته للـ dependencies ونتجنب infinite re-renders.
    //   2. منع Ghost-Restore: عند حذف الصورة يدوياً (url = ''),
    //      يُحدَّث الـ ref فوراً إلى ''، فلن يُعيدها useEffect عند
    //      أي تحديث خارجي لـ cmsMap قبل الحفظ.
    const prevEquipImageRef  = useRef(initialEquipUrl);
    const prevSectionTitleRef = useRef(find('whyus_title')?.content || '');
    // للـ items نستخدم JSON.stringify للمقارنة — لا نحتاج ref هنا لأن
    // المقارنة لا تعتمد على reference identity بل على محتوى البيانات.
    const prevItemsJsonRef = useRef(find('whyus_items')?.content || '[]');

    // ─── Backend Sync Effect ──────────────────────────────────────────────────
    useEffect(() => {
        // ── Equipment Image ──
        const raw = find('equipment_image')?.content ?? '';
        let incomingUrl = '';
        let incomingPublicId = '';
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.url) {
                incomingUrl       = parsed.url;
                incomingPublicId  = parsed.publicId || '';
            }
        } catch {
            incomingUrl = raw; // plain URL fallback
        }
        if (incomingUrl !== prevEquipImageRef.current) {
            prevEquipImageRef.current = incomingUrl;
            setEquipmentImage(incomingUrl);
            setEquipmentPublicId(incomingPublicId);
        }

        // ── Section Title ──
        const incomingTitle = find('whyus_title')?.content ?? '';
        if (incomingTitle && incomingTitle !== prevSectionTitleRef.current) {
            prevSectionTitleRef.current = incomingTitle;
            setSectionTitle(incomingTitle);
        }

        // ── Items (JSON array) ──
        // نستخدم ref للقيمة الخام من cmsMap (وليس من الحالة) لتجنب stale closure.
        const rawItems = find('whyus_items')?.content || '[]';
        if (rawItems !== prevItemsJsonRef.current) {
            prevItemsJsonRef.current = rawItems;
            try {
                const parsedItems = JSON.parse(rawItems);
                setItems(parsedItems);
            } catch { /* ignore malformed JSON */ }
        }
    }, [cmsMap]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Handlers ─────────────────────────────────────────────────────────────
    /**
     * يُستدعى عند رفع صورة جديدة أو حذف الصورة الحالية (url = '').
     * تحديث الـ ref هنا ضروري لضمان أن useEffect لن يُعيد القيمة القديمة
     * إذا تغير cmsMap قبل أن يضغط المستخدم على حفظ.
     */
    const onEquipmentUpload = (url: string, publicId?: string) => {
        prevEquipImageRef.current = url;
        setEquipmentImage(url);
        setEquipmentPublicId(publicId || '');
    };

    const updateItem = (i: number, field: keyof WhyUsItem, val: string) =>
        setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

    const handleSave = async () => {
        setSaving(true);
        try {
            const equipData = equipmentImage
                ? JSON.stringify({ url: equipmentImage, publicId: equipmentPublicId })
                : '';
            const saves = [
                { key: 'whyus_title',      val: sectionTitle },
                { key: 'equipment_image',  val: equipData },
                { key: 'whyus_items',      val: JSON.stringify(items) },
            ];
            for (const { key, val } of saves) {
                const item = find(key);
                if (item) await onSave(item.id, val);
            }
            toast.success('تم حفظ قسم لماذا نحن');
        } finally {
            setSaving(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SectionCard title="هوية قسم لماذا نحن" icon={Layout}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <FieldRow label="عنوان القسم">
                        <TextInput value={sectionTitle} onChange={setSectionTitle} multiline />
                    </FieldRow>
                    <ImageUploader
                        value={equipmentImage}
                        publicId={equipmentPublicId}
                        onUpload={onEquipmentUpload}
                        label="ارفع صورة العيادة"
                        cloudName={cloudName}
                        preset={preset}
                    />
                </div>
            </SectionCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {items.map((item, i) => (
                    <div
                        key={`whyus-${i}-${item.title}`}
                        className="p-8 bg-[var(--bg-card)] rounded-[2.5rem] border-[1.5px] border-[var(--border-color)] shadow-sm group hover:border-primary/50 transition-all"
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-sm shadow-primary/10">
                                <Star className="size-6" />
                            </div>
                            <div className="flex-1">
                                <FieldRow label="عنوان الميزة">
                                    <TextInput value={item.title} onChange={v => updateItem(i, 'title', v)} />
                                </FieldRow>
                            </div>
                            <button
                                onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}
                                className="p-2 text-slate-300 hover:text-red-500 transition-all"
                            >
                                <X className="size-4" />
                            </button>
                        </div>
                        <FieldRow label="الوصف">
                            <TextInput value={item.desc} onChange={v => updateItem(i, 'desc', v)} multiline />
                        </FieldRow>
                    </div>
                ))}
            </div>

            <div className="flex justify-end">
                <SaveButton onClick={handleSave} saving={saving} />
            </div>
        </div>
    );
};
