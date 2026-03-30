import { getLandingContent, updateContent, type LandingContent } from '../../infrastructure/repositories/cmsRepository';
import { AppResult, success, failure } from '../result';
import { logger } from '../../utils/logger';

// ══════════════════════════════════════════════════════════════════
// DTOs
// ══════════════════════════════════════════════════════════════════

export interface ServiceDTO {
    readonly id: string;
    readonly title: string;
    readonly description: string;
    readonly icon: string;
    readonly visible: boolean;
}

export interface CredentialDTO {
    readonly id: string;
    readonly title: string;
    readonly institution: string;
    readonly year: string;
    readonly type: 'degree' | 'certificate' | 'award' | 'membership';
    readonly visible: boolean;
}

export interface WhyUsDTO {
    readonly title: string;
    readonly description: string;
    readonly icon: string;
}

export interface FooterDTO {
    readonly description: string;
    readonly address: string;
    readonly phone: string;
    readonly openingHours: string;
    readonly copyright: string;
    readonly facebookUrl: string;
    readonly links: string[];
}

export interface LandingPageDTO {
    readonly logo: string | null;
    readonly theme: {
        readonly primary: string;
        readonly secondary: string;
        readonly accent: string;
    };
    readonly hero: {
        readonly title: string;
        readonly subtitle: string;
        readonly description: string;
        readonly image: string;
        readonly badge: string;
        readonly cta_booking: string;
        readonly cta_whatsapp: string;
    };
    readonly navbar: {
        readonly links: string[];
        readonly cta: string;
        readonly showCta: boolean;
    };
    readonly services: {
        readonly title: string;
        readonly list: ServiceDTO[];
    };
    readonly credentials: {
        readonly show: boolean;
        readonly title: string;
        readonly list: CredentialDTO[];
    };
    readonly whyus: {
        readonly title: string;
        readonly image: string;
        readonly items: WhyUsDTO[];
    };
    readonly whatsapp: {
        readonly showFloating: boolean;
        readonly number: string;
        readonly message: string;
        readonly buttonText: string;
    };
    readonly footer: FooterDTO;
}

export type LandingContentDTO = LandingContent;

// ══════════════════════════════════════════════════════════════════
// Default Data — used when DB rows are missing (first run / new keys)
// ══════════════════════════════════════════════════════════════════

export const DEFAULT_SERVICES: ServiceDTO[] = [
    { id: 'cleaning', title: 'تنظيف وتلميع الأسنان', description: 'تنظيف احترافي للأسنان وإزالة الجير والتصبغات بأحدث الأجهزة', icon: 'Sparkles', visible: true },
    { id: 'root-canal', title: 'حشو العصب التخصصي', description: 'علاج جذور الأسنان بأحدث التقنيات لإنقاذ الأسنان المتضررة', icon: 'Syringe', visible: true },
    { id: 'whitening', title: 'تبييض الأسنان بالليزر', description: 'تبييض الأسنان بتقنية الليزر للحصول على ابتسامة مشرقة وجذابة', icon: 'Sun', visible: true },
    { id: 'implants', title: 'زراعة الأسنان الفورية', description: 'زراعة أسنان فورية بأعلى جودة وأحدث التقنيات العالمية المعتمدة', icon: 'CircleDot', visible: true },
    { id: 'orthodontics', title: 'تقويم الأسنان الشفاف', description: 'تقويم شفاف لتصحيح اعوجاج الأسنان بدون أسلاك معدنية مزعجة', icon: 'AlignCenter', visible: true },
    { id: 'pediatric', title: 'طب أسنان الأطفال', description: 'رعاية متخصصة لأسنان الأطفال في بيئة مريحة وآمنة مناسبة لهم', icon: 'Baby', visible: true },
];

export const DEFAULT_WHYUS_ITEMS: WhyUsDTO[] = [
    { title: 'تقنيات حديثة متطورة', description: 'نستخدم أحدث الأجهزة الرقمية لضمان دقة النتائج وراحة المريض في كل جلسة.', icon: 'Target' },
    { title: 'تجميل الابتسامة', description: 'سنوات من الخبرة في معالجة أصعب الحالات وتجميل الابتسامة بأعلى معايير الجودة.', icon: 'Award' },
    { title: 'تعقيم صارم ومعتمد', description: 'نتبع أعلى معايير البروتوكولات العالمية في التعقيم لضمان سلامتكم الكاملة.', icon: 'Shield' },
];

export const DEFAULT_CREDENTIALS: CredentialDTO[] = [
    { id: 'cred-1', title: 'بكالوريوس طب وجراحة الأسنان', institution: 'جامعة طنطا', year: '2010', type: 'degree', visible: true },
    { id: 'cred-2', title: 'دبلوم زراعة الأسنان الفورية', institution: 'الأكاديمية الأوروبية لزراعة الأسنان', year: '2015', type: 'certificate', visible: true },
    { id: 'cred-3', title: 'دبلوم تقويم الأسنان الشفاف', institution: 'معهد Invisalign الدولي', year: '2017', type: 'certificate', visible: true },
    { id: 'cred-4', title: 'عضو الجمعية العلمية لطب الأسنان', institution: 'نقابة أطباء الأسنان المصرية', year: '2011', type: 'membership', visible: true },
    { id: 'cred-5', title: 'شهادة تميز طبي', institution: 'وزارة الصحة المصرية', year: '2020', type: 'award', visible: false },
];

// ══════════════════════════════════════════════════════════════════
// CMS Service
// ══════════════════════════════════════════════════════════════════

export class CmsService {

    async getLandingContent(): Promise<AppResult<readonly LandingContentDTO[]>> {
        try {
            const content = await getLandingContent();
            return success(content);
        } catch (error) {
            logger.error('Failed to get landing content', { error });
            return failure('فشل في جلب محتوى الصفحة الرئيسية');
        }
    }

    async updateContent(id: string, value: string): Promise<AppResult<void>> {
        try {
            await updateContent(id, value);
            return success(undefined);
        } catch (error) {
            logger.error('Failed to update CMS content', { id, error });
            return failure('فشل في تحديث المحتوى');
        }
    }

    async getLandingPageContent(): Promise<AppResult<LandingPageDTO>> {
        try {
            const rawContent = await getLandingContent();

            // Build TWO maps: by key and by id — to support both old and new DB schemas
            const cmsMap: Record<string, string> = {};
            rawContent.forEach(item => {
                // Map by key (new schema: 'hero_title', 'services_list', etc.)
                cmsMap[item.key] = item.content;
                // Also map by section+key shorthand for old schema (section='hero', key='title')
                cmsMap[`${item.section}_${item.key}`] = item.content;
            });

            // ── safe JSON parser ──────────────────────────────────
            const safeJson = <T>(val: string | undefined | null, fallback: T): T => {
                if (!val || val.trim() === '' || val.trim() === 'null') return fallback;
                try { return JSON.parse(val); } catch { return fallback; }
            };

            // ── helper: handle Cloudinary images (JSON or string) ─
            const parseImageUrl = (key: string, alias?: string): { url: string; publicId?: string } => {
                const raw = get(key, alias || '');
                if (!raw) return { url: '' };
                try {
                    const parsed = JSON.parse(raw);
                    if (parsed && typeof parsed === 'object' && parsed.url) {
                        return { url: parsed.url, publicId: parsed.publicId };
                    }
                } catch { /* ignore and treat as plain URL */ }
                return { url: raw };
            };

            // ── helper: get value trying multiple key aliases ─────
            const get = (...keys: string[]): string => {
                for (const k of keys) {
                    const v = cmsMap[k];
                    if (v !== undefined && v !== null && v !== '') return v;
                }
                return '';
            };

            // ── Services ─────────────────────────────────────────
            // Try new key first ('services_list'), fallback to defaults
            const rawServices = safeJson<any[] | null>(get('services_list'), null);
            const services: ServiceDTO[] = rawServices
                ? rawServices.map((s: any, i: number) => ({
                    id: s.id || `svc-${i}`,
                    title: s.title || s.name || '',
                    description: s.description || '',
                    icon: s.icon || 'Sparkles',
                    visible: s.visible !== false,
                }))
                : DEFAULT_SERVICES;  // ← DB empty → use rich defaults

            // ── Credentials ───────────────────────────────────────
            const rawCreds = safeJson<any[] | null>(get('credentials_list'), null);
            const credentials: CredentialDTO[] = rawCreds
                ? rawCreds.map((c: any) => ({
                    id: c.id || `cred-${Math.random()}`,
                    title: c.title || '',
                    institution: c.institution || '',
                    year: c.year || '',
                    type: c.type || 'certificate',
                    visible: c.visible !== false,
                }))
                : DEFAULT_CREDENTIALS;

            // ── WhyUs items ───────────────────────────────────────
            const rawWhyUs = safeJson<any[] | null>(get('whyus_items'), null);
            const whyUsItems: WhyUsDTO[] = rawWhyUs && rawWhyUs.length > 0
                ? rawWhyUs.map((item: any) => ({
                    title: item.title || '',
                    description: item.desc || item.description || '',
                    icon: item.icon || 'Star',
                }))
                : DEFAULT_WHYUS_ITEMS;

            const brandingLogo = parseImageUrl('logo', 'brand_logo');
            const heroData = parseImageUrl('hero_image', 'hero_bg');
            const equipmentData = parseImageUrl('equipment_image');

            // ── Assemble DTO ──────────────────────────────────────
            const data: LandingPageDTO = {
                logo: brandingLogo.url || null,
                // We don't expose public_id in the DTO yet as it's not needed by the Home page
                // But we could if we wanted the Home page to do something with it.

                theme: {
                    primary: get('theme_primary') || '#0ea5e9',
                    secondary: get('theme_secondary') || '#0f172a',
                    accent: get('theme_accent') || '#10b981',
                },

                hero: {
                    // Support both old schema (key=title) and new (key=hero_title)
                    title: get('hero_title', 'title') || 'عيادة الدكتور محمد أسامة الرفاعي',
                    subtitle: get('hero_badge', 'subtitle') || 'طب وجراحة الأسنان',
                    description: get('hero_description', 'description') || 'نقدم أفضل خدمات طب الأسنان بأحدث الأجهزة والتقنيات العالمية',
                    // 'bg' is the old DB key for hero image
                    image: heroData.url || get('bg') || '/hero-main.webp',
                    badge: get('hero_badge', 'subtitle') || 'خبرة أكثر من 10 سنوات',
                    cta_booking: get('hero_cta_booking', 'cta_booking') || 'احجز موعدك الآن',
                    cta_whatsapp: get('hero_cta_whatsapp', 'cta_whatsapp') || 'تواصل عبر واتساب',
                },

                navbar: {
                    links: safeJson(get('nav_links'), ['الرئيسية', 'خدماتنا', 'لماذا نحن؟', 'تواصل معنا']),
                    cta: get('nav_cta') || 'احجز موعداً',
                    showCta: get('nav_show_cta') !== 'false',
                },

                services: {
                    title: get('services_title') || 'خدماتنا المتميزة',
                    list: services,
                },

                credentials: {
                    show: get('credentials_show') !== 'false',
                    title: get('credentials_title') || 'شهاداتنا وخبراتنا',
                    list: credentials,
                },

                whyus: {
                    title: get('whyus_title') || 'لماذا عيادة الدكتور محمد أسامة الرفاعي؟',
                    image: equipmentData.url || '/hero-equipment.webp',
                    items: whyUsItems,
                },

                whatsapp: {
                    showFloating: get('whatsapp_show_float') !== 'false',
                    number: get('whatsapp_number') || '',
                    message: get('whatsapp_message') || 'مرحباً دكتور محمد، أود الاستفسار عن...',
                    buttonText: get('whatsapp_button_text') || 'تواصل معنا عبر واتساب',
                },

                footer: {
                    description: get('footer_description') || 'نسعى دائماً لتقديم خدمات طبية متميزة تليق بكم.',
                    address: get('footer_address') || 'المحلة الكبرى — محافظة الغربية',
                    phone: get('footer_phone') || '',
                    openingHours: get('footer_hours') || '09:00 - 21:00',
                    copyright: get('footer_copyright') || 'جميع الحقوق محفوظة',
                    facebookUrl: get('footer_facebook') || '',
                    links: safeJson(get('footer_links'), ['الرئيسية', 'خدماتنا', 'لماذا نحن؟', 'سياسة الخصوصية']),
                },
            };

            return success(data);

        } catch (error) {
            logger.error('Aggregated CMS Load Error:', { error });
            return failure('فشل في جلب وتجهيز محتوى الصفحة');
        }
    }
}
