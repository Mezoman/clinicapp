import React, { useState, useEffect, useRef } from 'react';
import { Star, Images, Type, Zap } from 'lucide-react';
import { toast } from 'sonner';
import type { LandingContentDTO } from '../../../hooks/useCMSContent';
import { SectionCard, FieldRow, TextInput, ImageUploader, SaveButton } from '../shared';

interface HeroTabProps {
    cmsMap: Record<string, LandingContentDTO>;
    onSave: (id: string, v: string) => Promise<void>;
    cloudName: string;
    preset: string;
}

export const HeroTab: React.FC<HeroTabProps> = ({ cmsMap, onSave, cloudName, preset }) => {
    const find = (key: string) => Object.values(cmsMap).find(c => c.key === key);

    // ─── Parse Initial Hero Image (JSON or plain URL) ─────────────────────────
    const initialHeroRaw = find('hero_image')?.content || '';
    let initialHeroUrl = initialHeroRaw;
    let initialHeroPublicId = '';
    try {
        const parsed = JSON.parse(initialHeroRaw);
        if (parsed && typeof parsed === 'object' && parsed.url) {
            initialHeroUrl = parsed.url;
            initialHeroPublicId = parsed.publicId || '';
        }
    } catch { /* treat as plain URL */ }

    // ─── State ────────────────────────────────────────────────────────────────
    const [heroImage,   setHeroImage]   = useState(initialHeroUrl);
    const [heroPublicId, setHeroPublicId] = useState(initialHeroPublicId);
    const [title,       setTitle]       = useState(find('title')?.content       || 'عيادة الدكتور محمد أسامة الرفاعي');
    const [subtitle,    setSubtitle]    = useState(find('subtitle')?.content    || 'طب وجراحة الأسنان');
    const [description, setDescription] = useState(find('description')?.content || 'نقدم أفضل خدمات طب الأسنان بأحدث الأجهزة والتقنيات العالمية');
    const [ctaBooking,  setCtaBooking]  = useState(find('cta_booking')?.content  || 'احجز موعدك الآن');
    const [ctaWhatsapp, setCtaWhatsapp] = useState(find('cta_whatsapp')?.content || 'تواصل عبر واتساب');
    const [saving, setSaving] = useState(false);

    // ─── Sync Refs ────────────────────────────────────────────────────────────
    // يحفظ كل ref آخر قيمة تمت مزامنتها من الـ backend.
    // الهدف المزدوج:
    //   1. منع Stale Closure: نقارن بـ ref.current بدلاً من متغير الحالة،
    //      فلا نحتاج إضافته للـ dependencies ونتجنب infinite re-renders.
    //   2. منع Ghost-Restore: عند حذف الصورة يدوياً (url = ''),
    //      يُحدَّث الـ ref فوراً إلى ''، فلن يُعيدها useEffect عند
    //      أي تحديث خارجي لـ cmsMap قبل الحفظ.
    const prevHeroImageRef   = useRef(initialHeroUrl);
    const prevTitleRef       = useRef(find('title')?.content       || '');
    const prevSubtitleRef    = useRef(find('subtitle')?.content    || '');
    const prevDescriptionRef = useRef(find('description')?.content || '');
    const prevCtaBookingRef  = useRef(find('cta_booking')?.content  || '');
    const prevCtaWhatsappRef = useRef(find('cta_whatsapp')?.content || '');

    // ─── Backend Sync Effect ──────────────────────────────────────────────────
    useEffect(() => {
        // ── Hero Image ──
        const raw = find('hero_image')?.content ?? '';
        let incomingUrl = '';
        let incomingPublicId = '';
        try {
            const parsed = JSON.parse(raw);
            if (parsed?.url) {
                incomingUrl      = parsed.url;
                incomingPublicId = parsed.publicId || '';
            }
        } catch {
            incomingUrl = raw; // plain URL fallback
        }
        if (incomingUrl !== prevHeroImageRef.current) {
            prevHeroImageRef.current = incomingUrl;
            setHeroImage(incomingUrl);
            setHeroPublicId(incomingPublicId);
        }

        // ── Text Fields — batch loop ──
        // كل عنصر: [مفتاح cmsMap, الـ ref, setter]
        const textFields: [string, React.MutableRefObject<string>, (v: string) => void][] = [
            ['title',        prevTitleRef,       setTitle],
            ['subtitle',     prevSubtitleRef,    setSubtitle],
            ['description',  prevDescriptionRef, setDescription],
            ['cta_booking',  prevCtaBookingRef,  setCtaBooking],
            ['cta_whatsapp', prevCtaWhatsappRef, setCtaWhatsapp],
        ];
        for (const [key, ref, setter] of textFields) {
            const incoming = find(key)?.content ?? '';
            if (incoming && incoming !== ref.current) {
                ref.current = incoming;
                setter(incoming);
            }
        }
    }, [cmsMap]); // eslint-disable-line react-hooks/exhaustive-deps

    // ─── Handlers ─────────────────────────────────────────────────────────────
    /**
     * يُستدعى عند رفع صورة جديدة أو حذف الصورة الحالية (url = '').
     * تحديث الـ ref هنا ضروري لضمان أن useEffect لن يُعيد القيمة القديمة
     * إذا تغير cmsMap قبل أن يضغط المستخدم على حفظ.
     */
    const onHeroUpload = (url: string, publicId?: string) => {
        prevHeroImageRef.current = url;
        setHeroImage(url);
        setHeroPublicId(publicId || '');
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const heroData = heroImage
                ? JSON.stringify({ url: heroImage, publicId: heroPublicId })
                : '';
            const saves = [
                { key: 'hero_image',   val: heroData },
                { key: 'title',        val: title },
                { key: 'subtitle',     val: subtitle },
                { key: 'description',  val: description },
                { key: 'cta_booking',  val: ctaBooking },
                { key: 'cta_whatsapp', val: ctaWhatsapp },
            ];
            for (const { key, val } of saves) {
                const item = find(key);
                if (item) await onSave(item.id, val);
            }
            toast.success('تم حفظ قسم البداية');
        } finally {
            setSaving(false);
        }
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Live Preview */}
            <div className="relative rounded-[3rem] overflow-hidden bg-secondary-900 p-10 text-white min-h-[300px] flex items-center border border-secondary-800 shadow-2xl">
                {heroImage && (
                    <div className="absolute inset-0">
                        <img src={heroImage} alt="Hero Preview" className="w-full h-full object-cover opacity-30" />
                        <div className="absolute inset-0 bg-gradient-to-l from-secondary-950 via-secondary-900/40 to-transparent" />
                    </div>
                )}
                <div className="relative z-10 max-w-xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full text-primary-200 text-xs font-black uppercase tracking-widest mb-6">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span>{subtitle}</span>
                    </div>
                    <h1 className="text-4xl lg:text-5xl font-black mb-6 leading-tight font-display">{title}</h1>
                    <p className="text-secondary-300 text-sm font-bold leading-loose mb-10 max-w-md">{description}</p>
                    <div className="flex gap-4 flex-wrap">
                        <button className="px-10 py-4 bg-primary rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-primary/90 transition-all">
                            {ctaBooking}
                        </button>
                    </div>
                </div>
            </div>

            {/* Edit Fields */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SectionCard title="الصورة الخلفية" icon={Images}>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
                        اختر صورة تعبر عن عيادتك أو خدماتك
                    </p>
                    <ImageUploader
                        value={heroImage}
                        publicId={heroPublicId}
                        onUpload={onHeroUpload}
                        label="ارفع صورة البانر"
                        cloudName={cloudName}
                        preset={preset}
                    />
                </SectionCard>

                <SectionCard title="نصوص العرض" icon={Type}>
                    <div className="space-y-6">
                        <FieldRow label="الشريط العلوي الصغير">
                            <TextInput value={subtitle} onChange={setSubtitle} />
                        </FieldRow>
                        <FieldRow label="العنوان الرئيسي">
                            <TextInput value={title} onChange={setTitle} />
                        </FieldRow>
                        <FieldRow label="النص الوصفي">
                            <TextInput value={description} onChange={setDescription} multiline />
                        </FieldRow>
                    </div>
                </SectionCard>

                <SectionCard title="أزرار التفاعل" icon={Zap}>
                    <div className="space-y-6">
                        <FieldRow label="نص زر الحجز الرئيسي">
                            <TextInput value={ctaBooking} onChange={setCtaBooking} />
                        </FieldRow>
                        <FieldRow label="نص زر التواصل البديل">
                            <TextInput value={ctaWhatsapp} onChange={setCtaWhatsapp} />
                        </FieldRow>
                    </div>
                </SectionCard>
            </div>

            <div className="flex justify-end">
                <SaveButton onClick={handleSave} saving={saving} />
            </div>
        </div>
    );
};
