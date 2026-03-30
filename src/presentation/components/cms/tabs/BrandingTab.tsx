import React, { useState, useEffect, useRef } from 'react';
import { ImageIcon, Type, Palette } from 'lucide-react';
import { toast } from 'sonner';
import type { LandingContentDTO } from '../../../hooks/useCMSContent';
import { SectionCard, FieldRow, TextInput, ImageUploader, SaveButton } from '../shared';

interface BrandingTabProps {
    cmsMap: Record<string, LandingContentDTO>;
    onSave: (id: string, v: string) => Promise<void>;
    cloudName: string;
    preset: string;
}

export const BrandingTab: React.FC<BrandingTabProps> = ({ cmsMap, onSave, cloudName, preset }) => {
    const find = (key: string) => Object.values(cmsMap).find(c => c.key === key);

    // ─── Parse Initial Logo (JSON or plain URL) ───────────────────────────────
    const initialLogoRaw = find('logo')?.content || '';
    let initialLogoUrl = initialLogoRaw;
    let initialLogoPublicId = '';
    try {
        const parsed = JSON.parse(initialLogoRaw);
        if (parsed && typeof parsed === 'object' && parsed.url) {
            initialLogoUrl = parsed.url;
            initialLogoPublicId = parsed.publicId || '';
        }
    } catch { /* treat as plain URL */ }

    // ─── State ────────────────────────────────────────────────────────────────
    const [logoUrl, setLogoUrl] = useState(initialLogoUrl);
    const [logoPublicId, setLogoPublicId] = useState(initialLogoPublicId);
    const [clinicTitle, setClinicTitle] = useState(find('title')?.content || 'عيادة الدكتور محمد أسامة الرفاعي');
    const [saving, setSaving] = useState(false);

    // ─── Sync Refs ────────────────────────────────────────────────────────────
    // يحفظ كل ref آخر قيمة تمت مزامنتها من الـ backend.
    // الهدف المزدوج:
    //   1. منع Stale Closure: نقارن بـ ref.current بدلاً من متغير الحالة،
    //      فلا نحتاج إضافته للـ dependencies ونتجنب infinite re-renders.
    //   2. منع Ghost-Restore: عند حذف الصورة يدوياً (url = ''),
    //      يُحدَّث الـ ref فوراً إلى '' بدلاً من القيمة القديمة.
    //      هذا يمنع useEffect من إعادة الصورة القديمة إذا تغير cmsMap
    //      قبل أن يحفظ المستخدم.
    const prevLogoUrlRef    = useRef(initialLogoUrl);
    const prevClinicTitleRef = useRef(find('title')?.content || '');

    // ─── Backend Sync Effect ──────────────────────────────────────────────────
    useEffect(() => {
        // ── Logo ──
        const raw = find('logo')?.content ?? '';
        let incomingUrl = '';
        let incomingPublicId = '';
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.url) {
                incomingUrl = parsed.url;
                incomingPublicId = parsed.publicId || '';
            }
        } catch {
            incomingUrl = raw; // plain URL fallback
        }
        // نُحدّث فقط إذا اختلفت القيمة القادمة عن آخر قيمة مزامَنة
        if (incomingUrl !== prevLogoUrlRef.current) {
            prevLogoUrlRef.current = incomingUrl;
            setLogoUrl(incomingUrl);
            setLogoPublicId(incomingPublicId);
        }

        // ── Clinic Title ──
        const incomingTitle = find('title')?.content ?? '';
        if (incomingTitle && incomingTitle !== prevClinicTitleRef.current) {
            prevClinicTitleRef.current = incomingTitle;
            setClinicTitle(incomingTitle);
        }
    }, [cmsMap]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Handlers ─────────────────────────────────────────────────────────────
    /**
     * يُستدعى عند رفع صورة جديدة أو حذف الصورة الحالية (url = '').
     * تحديث الـ ref هنا ضروري لضمان أن useEffect لن يُعيد القيمة القديمة
     * إذا تغير cmsMap قبل أن يضغط المستخدم على حفظ.
     */
    const onLogoUpload = (url: string, publicId?: string) => {
        prevLogoUrlRef.current = url;
        setLogoUrl(url);
        setLogoPublicId(publicId || '');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const logoItem  = find('logo');
            const titleItem = find('title');
            if (logoItem) {
                const logoData = logoUrl
                    ? JSON.stringify({ url: logoUrl, publicId: logoPublicId })
                    : '';
                await onSave(logoItem.id, logoData);
            }
            if (titleItem) await onSave(titleItem.id, clinicTitle);
            toast.success('تم حفظ الهوية البصرية');
        } finally {
            setSaving(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SectionCard title="شعار العيادة (Logo)" icon={ImageIcon}>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                        يظهر الشعار في الهيدر والفوتر والتقارير
                    </p>
                    <ImageUploader
                        value={logoUrl}
                        publicId={logoPublicId}
                        onUpload={onLogoUpload}
                        label="رفع لوجو العيادة"
                        aspect="logo"
                        cloudName={cloudName}
                        preset={preset}
                    />
                </SectionCard>

                <SectionCard title="اسم العيادة" icon={Type}>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                        يُستخدم في العناوين والرسائل التلقائية
                    </p>
                    <FieldRow label="اسم العيادة الكامل">
                        <TextInput value={clinicTitle} onChange={setClinicTitle} />
                    </FieldRow>
                    <div className="mt-8 space-y-4">
                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">معاينة الظهور</p>
                        <div className="p-6 bg-slate-50 dark:bg-secondary-800 rounded-2xl border-[1.5px] border-[var(--border-color)] flex items-center justify-center min-h-[100px]">
                            {logoUrl ? (
                                <div className="flex flex-col items-center gap-2">
                                    <img src={logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                                    <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                        {clinicTitle}
                                    </span>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="size-10 bg-primary-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary-500/20">
                                        <Palette className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                                        {clinicTitle}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                </SectionCard>
            </div>
            <div className="flex justify-end">
                <SaveButton onClick={handleSave} saving={saving} />
            </div>
        </div>
    );
};
