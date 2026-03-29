import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
    Calendar, Phone, MapPin, Star, ChevronLeft,
    Menu, X, MessageCircle, ShieldCheck, Sparkles,
    Syringe, Sun, CircleDot, AlignCenter, Baby, Clock,
    Heart, Award, GraduationCap, BadgeCheck, Users, Target, Shield,
    Facebook,
} from 'lucide-react';
import { useCMS } from '../../context/CMSContext';
import HomeSkeleton from './HomeSkeleton';
import { formatWhatsAppUrl } from '../../../utils/formatters';
import { logger } from '../../../utils/logger';
import type { CredentialDTO, ServiceDTO } from '../../../application/services/CmsService';

// ══════════════════════════════════════════════════════════════════
// Icon Map
// ══════════════════════════════════════════════════════════════════

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
    Sparkles, Syringe, Sun, CircleDot, AlignCenter, Baby,
    Heart, Shield, Star, Award, Clock, Phone, Target,
    GraduationCap, BadgeCheck, Users,
};

// ══════════════════════════════════════════════════════════════════
// Credential type config
// ══════════════════════════════════════════════════════════════════

const CRED_CONFIG: Record<CredentialDTO['type'], { label: string; icon: React.ComponentType<any>; color: string; bg: string }> = {
    degree: { label: 'شهادة علمية', icon: GraduationCap, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/50' },
    certificate: { label: 'دبلوم / شهادة', icon: BadgeCheck, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/50' },
    award: { label: 'جائزة / تكريم', icon: Award, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/50' },
    membership: { label: 'عضوية مهنية', icon: Users, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950/50' },
};

// ══════════════════════════════════════════════════════════════════
// Scroll-reveal hook (no external lib)
// ══════════════════════════════════════════════════════════════════

function useReveal(threshold = 0.1) {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) { setVisible(true); return; }

        // Fallback: always show after 400ms even if IntersectionObserver doesn't fire
        const timer = setTimeout(() => setVisible(true), 400);

        const observer = new IntersectionObserver(
            ([entry]) => { if (entry?.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { threshold }
        );
        observer.observe(el);
        return () => { observer.disconnect(); clearTimeout(timer); };
    }, []);

    return { ref, visible };
}

// ══════════════════════════════════════════════════════════════════
// Service Card
// ══════════════════════════════════════════════════════════════════

function ServiceCard({ service, index }: { service: ServiceDTO; index: number }) {
    const Icon = ICON_MAP[service.icon] || Sparkles;
    const name = service.title;
    return (
        <div
            className="group p-8 bg-secondary-50 dark:bg-secondary-800/50 rounded-3xl border border-secondary-100 dark:border-secondary-700 hover:bg-white dark:hover:bg-secondary-800 hover:shadow-2xl hover:shadow-primary-100 dark:hover:shadow-primary-900/20 hover:-translate-y-2 transition-all duration-300"
            style={{ transitionDelay: `${index * 60}ms` }}
        >
            <div className="w-14 h-14 bg-white dark:bg-secondary-700 rounded-2xl flex items-center justify-center text-primary-500 shadow-sm mb-6 group-hover:scale-110 group-hover:bg-primary-500 group-hover:text-white transition-all duration-300">
                <Icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-secondary-900 dark:text-white mb-3">{name}</h3>
            <p className="text-secondary-500 dark:text-secondary-400 text-sm leading-relaxed mb-6">{service.description}</p>
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 font-bold text-sm">
                <span>تعرف على المزيد</span>
                <ChevronLeft className="w-4 h-4" />
            </div>
        </div>
    );
}

// ══════════════════════════════════════════════════════════════════
// Credentials Section
// ══════════════════════════════════════════════════════════════════

function CredentialsSection({ title, list }: { title: string; list: CredentialDTO[] }) {
    const { ref, visible } = useReveal();
    const visibleList = list.filter(c => c.visible);
    if (visibleList.length === 0) return null;

    const TYPE_ORDER: CredentialDTO['type'][] = ['degree', 'certificate', 'award', 'membership'];
    const grouped = visibleList.reduce<Partial<Record<CredentialDTO['type'], CredentialDTO[]>>>((acc, c) => {
        if (!acc[c.type]) acc[c.type] = [];
        acc[c.type]!.push(c);
        return acc;
    }, {});

    return (
        <section id="شهاداتنا" className="py-24 bg-gradient-to-b from-white to-slate-50 dark:from-secondary-900 dark:to-secondary-950">
            <div className="container mx-auto px-4">
                <div
                    ref={ref}
                    className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                >
                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-50 dark:bg-primary-950/50 border border-primary-100 dark:border-primary-800 rounded-full text-primary-600 dark:text-primary-400 text-xs font-bold mb-5">
                            <GraduationCap className="w-4 h-4" />
                            <span>مؤهلات معتمدة دولياً</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white mb-4">{title}</h2>
                        <div className="w-20 h-1.5 gradient-primary mx-auto rounded-full" />
                        <p className="text-secondary-500 dark:text-secondary-400 mt-4 text-sm max-w-lg mx-auto leading-relaxed">
                            سنوات من التدريب والتأهيل المستمر في أرقى المؤسسات العلمية المصرية والدولية
                        </p>
                    </div>

                    {/* Groups */}
                    <div className="space-y-10">
                        {TYPE_ORDER.map(type => {
                            const items = grouped[type];
                            if (!items?.length) return null;
                            const cfg = CRED_CONFIG[type];
                            const TypeIcon = cfg.icon;
                            return (
                                <div key={type}>
                                    {/* Type divider */}
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className={`flex items-center gap-2 px-3 py-1.5 ${cfg.bg} rounded-full`}>
                                            <TypeIcon className={`w-4 h-4 ${cfg.color}`} />
                                            <span className={`text-xs font-black ${cfg.color}`}>{cfg.label}</span>
                                        </div>
                                        <div className="flex-1 h-px bg-secondary-100 dark:bg-secondary-700" />
                                    </div>
                                    {/* Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                        {items.map((cred, idx) => (
                                            <div
                                                key={cred.id}
                                                className="bg-white dark:bg-secondary-800 border border-secondary-100 dark:border-secondary-700 rounded-2xl p-5 hover:shadow-lg hover:shadow-primary-100/40 dark:hover:shadow-primary-900/20 hover:-translate-y-0.5 transition-all duration-300"
                                                style={{ transitionDelay: `${idx * 60}ms` }}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                                        <TypeIcon className={`w-5 h-5 ${cfg.color}`} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="text-sm font-black text-secondary-900 dark:text-white leading-snug mb-1">{cred.title}</h3>
                                                        <p className="text-xs text-secondary-500 dark:text-secondary-400">{cred.institution}</p>
                                                        <div className="mt-2 flex items-center gap-1.5">
                                                            <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.color.replace('text-', 'bg-')}`} />
                                                            <span className={`text-[11px] font-bold ${cfg.color}`}>{cred.year}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}

// ══════════════════════════════════════════════════════════════════
// Main Home Page
// ══════════════════════════════════════════════════════════════════

export default function Home() {
    const { data: cms, loading, error, refresh: cmsRefresh } = useCMS();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    // Defer WhatsApp floater to reduce main-thread blocking during hydration
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setShowWhatsApp(true), 3000);
        return () => clearTimeout(timer);
    }, []);

    const servicesReveal = useReveal();
    const whyUsReveal = useReveal();

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', fn, { passive: true });

        const handleVisibility = () => {
            if (document.visibilityState === 'visible') {
                cmsRefresh();
            }
        };
        document.addEventListener('visibilitychange', handleVisibility);

        return () => {
            window.removeEventListener('scroll', fn);
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [cmsRefresh]);

    if (loading || !cms) return <HomeSkeleton />;
    if (error) logger.error('Home CMS Error:', error);

    const whatsappUrl = cms.whatsapp.number
        ? formatWhatsAppUrl(cms.whatsapp.number, cms.whatsapp.message)
        : '#';

    const visibleServices = (cms.services.list || []).filter(s => s.visible !== false);
    const whyUsItems = (cms.whyus.items || []);
    const heroImg = cms.hero.image || '/hero-main.webp';
    const equipImg = cms.whyus.image || '/hero-equipment.webp';

    return (
        <div className="min-h-screen bg-white dark:bg-secondary-950 font-noto" dir="rtl">

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HEADER */}
            <header className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled ? 'bg-white/90 dark:bg-secondary-900/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'
                }`}>
                <div className="container mx-auto px-4 flex items-center justify-between">

                    {/* Brand */}
                    <div className="flex items-center gap-3">
                        {cms.logo
                            ? <img src={cms.logo} alt="شعار العيادة" className="h-10 w-auto object-contain" loading="eager" fetchPriority="high" onError={(e) => (e.currentTarget.style.display = 'none')} />
                            : (
                                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center text-white shadow-lg">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                            )
                        }
                        <span className={`text-xl font-black tracking-tight ${scrolled ? 'text-secondary-900 dark:text-white' : 'text-white'}`}>
                            {cms.hero.title.split(' ').slice(0, 2).join(' ')}
                        </span>
                    </div>

                    {/* Desktop nav */}
                    <nav className="hidden lg:flex items-center gap-8" role="navigation" aria-label="القائمة الرئيسية">
                        {cms.navbar.links.map((item: string) => (
                            <a
                                key={item}
                                href={`#${item}`}
                                className={`text-sm font-bold transition-colors hover:text-primary-500 ${scrolled ? 'text-secondary-700 dark:text-secondary-300' : 'text-white/90'
                                    }`}
                            >
                                {item}
                            </a>
                        ))}
                    </nav>

                    {/* CTA + mobile toggle */}
                    <div className="flex items-center gap-3">
                        {cms.navbar.showCta && (
                            <Link
                                to="/booking"
                                className="hidden lg:flex items-center gap-2 px-5 py-2.5 gradient-primary text-white rounded-full text-sm font-bold shadow-md hover:scale-105 transition-transform"
                            >
                                {cms.navbar.cta}
                            </Link>
                        )}
                        <button
                            className={`lg:hidden p-2 rounded-xl transition-colors ${scrolled ? 'text-secondary-900 dark:text-white' : 'text-white'}`}
                            onClick={() => setIsMenuOpen(v => !v)}
                            aria-label={isMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
                            aria-expanded={isMenuOpen}
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile menu */}
                {isMenuOpen && (
                    <div className="lg:hidden absolute top-full inset-x-0 bg-white dark:bg-secondary-900 shadow-xl border-t border-secondary-100 dark:border-secondary-700 p-4">
                        <nav className="flex flex-col gap-1">
                            {cms.navbar.links.map((item: string) => (
                                <a
                                    key={item}
                                    href={`#${item}`}
                                    onClick={() => setIsMenuOpen(false)}
                                    className="text-secondary-700 dark:text-secondary-300 font-bold px-4 py-3 hover:bg-secondary-50 dark:hover:bg-secondary-800 rounded-xl transition-colors"
                                >
                                    {item}
                                </a>
                            ))}
                            {cms.navbar.showCta && (
                                <Link
                                    to="/booking"
                                    onClick={() => setIsMenuOpen(false)}
                                    className="flex items-center justify-center gap-2 px-6 py-4 gradient-primary text-white rounded-xl font-bold mt-2"
                                >
                                    {cms.navbar.cta}
                                </Link>
                            )}
                        </nav>
                    </div>
                )}
            </header>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ HERO */}
            <section
                id="الرئيسية"
                className="relative min-h-[90vh] flex items-center pt-24 pb-16 overflow-hidden bg-secondary-950"
            >
                {/* Background image */}
                <div className="absolute inset-0 z-0">
                    <img
                        src={heroImg}
                        alt="عيادة الدكتور محمد أسامة الرفاعي"
                        width={1200} height={800}
                        loading="eager"
                        fetchPriority="high"
                        decoding="sync"
                        className="w-full h-full object-cover brightness-[0.35]"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-white/10" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div className="max-w-3xl">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary-500/20 backdrop-blur-md border border-primary-400/30 rounded-full text-primary-200 text-xs font-bold mb-6">
                            <Star className="w-3.5 h-3.5 fill-current" />
                            <span>{cms.hero.badge || cms.hero.subtitle}</span>
                        </div>

                        {/* Heading */}
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.1] mb-6">
                            {cms.hero.title}
                        </h1>

                        {/* Description */}
                        <p className="text-lg md:text-xl text-secondary-300 leading-relaxed mb-10 max-w-2xl">
                            {cms.hero.description}
                        </p>

                        {/* CTA buttons */}
                        <div className="flex flex-col sm:flex-row gap-4">
                            <Link
                                to="/booking"
                                className="inline-flex items-center justify-center gap-3 px-8 py-4 gradient-primary text-white rounded-2xl font-bold text-lg shadow-xl shadow-primary-500/20 hover:scale-105 transition-transform"
                            >
                                <Calendar className="w-5 h-5 flex-shrink-0" />
                                {cms.hero.cta_booking}
                            </Link>
                            {cms.whatsapp.number && (
                                <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="تواصل معنا عبر واتساب"
                                    className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-2xl font-bold text-lg hover:bg-white/20 transition-colors"
                                >
                                    <MessageCircle className="w-5 h-5 flex-shrink-0" />
                                    {cms.hero.cta_whatsapp}
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Trust badge */}
                <div className="absolute bottom-8 left-8 hidden xl:block">
                    <div className="bg-white/10 backdrop-blur-xl p-5 rounded-2xl border border-white/20 shadow-2xl flex items-center gap-4">
                        <div className="w-11 h-11 bg-emerald-500 rounded-xl flex items-center justify-center text-white flex-shrink-0">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-sm">معايير تعقيم عالمية</p>
                            <p className="text-secondary-300 text-xs">أمانك هو أولويتنا القصوى</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ SERVICES */}
            {visibleServices.length > 0 && (
                <section id="خدماتنا" className="py-24 bg-white dark:bg-secondary-950">
                    <div className="container mx-auto px-4">
                        <div
                            ref={servicesReveal.ref}
                            className={`transition-all duration-700 ${servicesReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                        >
                            {/* Header */}
                            <div className="text-center mb-16">
                                <h2 className="text-3xl md:text-5xl font-black text-secondary-900 dark:text-white mb-4">
                                    {cms.services.title}
                                </h2>
                                <div className="w-20 h-1.5 gradient-primary mx-auto rounded-full" />
                            </div>

                            {/* Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
                                {visibleServices.map((service, index) => (
                                    <ServiceCard key={service.id} service={service} index={index} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ CREDENTIALS */}
            {cms.credentials?.show !== false && (cms.credentials?.list?.length ?? 0) > 0 && (
                <CredentialsSection
                    title={cms.credentials.title}
                    list={cms.credentials.list}
                />
            )}

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ WHY US */}
            <section id="لماذا نحن؟" className="py-24 bg-secondary-900 text-white relative overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl" />
                </div>

                <div className="container mx-auto px-4 relative z-10">
                    <div
                        ref={whyUsReveal.ref}
                        className={`grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-700 ${whyUsReveal.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
                            }`}
                    >
                        {/* Text column */}
                        <div>
                            <h2 className="text-3xl md:text-5xl font-black mb-10 leading-tight">
                                {cms.whyus.title}
                            </h2>
                            <div className="space-y-4">
                                {whyUsItems.map((item, i) => {
                                    const Icon = ICON_MAP[item.icon] || Sparkles;
                                    return (
                                        <div
                                            key={i}
                                            className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                                        >
                                            <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center flex-shrink-0">
                                                <Icon className="w-6 h-6 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                                                <p className="text-secondary-400 text-sm leading-relaxed">{item.description}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Image column */}
                        <div className="relative">
                            <div className="absolute -inset-4 bg-primary-500/20 rounded-[3rem] blur-2xl" />
                            <img
                                src={equipImg}
                                alt="معدات طب الأسنان الحديثة في عيادة الدكتور محمد أسامة"
                                width="800" height="533"
                                loading="lazy"
                                decoding="async"
                                className="relative rounded-[2rem] shadow-2xl border border-white/10 w-full object-cover aspect-video"
                                onError={(e) => (e.currentTarget.style.display = 'none')}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FOOTER */}
            <footer id="تواصل معنا" className="bg-white dark:bg-secondary-900 pt-20 pb-10 border-t border-secondary-100 dark:border-secondary-700">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-14">

                        {/* Brand col */}
                        <div className="lg:col-span-2">
                            <div className="flex items-center gap-3 mb-5">
                                <div className="w-11 h-11 gradient-primary rounded-2xl flex items-center justify-center text-white">
                                    <Sparkles className="w-6 h-6" />
                                </div>
                                <h3 className="text-xl font-black text-secondary-900 dark:text-white">{cms.hero.title}</h3>
                            </div>
                            <p className="text-secondary-500 dark:text-secondary-400 text-sm leading-relaxed max-w-sm mb-7">
                                {cms.footer.description}
                            </p>
                            <div className="flex gap-3">

                                {cms.footer.facebookUrl && (
                                    <a
                                        href={cms.footer.facebookUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        aria-label="صفحتنا على فيسبوك"
                                        className="w-10 h-10 bg-secondary-50 dark:bg-secondary-800 rounded-xl flex items-center justify-center text-secondary-400 hover:bg-blue-600 hover:text-white transition-all"
                                    >
                                        <Facebook className="w-5 h-5" />
                                    </a>
                                )}
                            </div>
                        </div>

                        {/* Contact col */}
                        <div>
                            <h4 className="font-black text-secondary-900 dark:text-white mb-5 text-sm uppercase tracking-wide">تواصل معنا</h4>
                            <ul className="space-y-4">
                                {cms.footer.address && (
                                    <li className="flex items-start gap-3">
                                        <MapPin className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                                        <p className="text-secondary-600 dark:text-secondary-400 text-sm leading-relaxed">{cms.footer.address}</p>
                                    </li>
                                )}
                                {cms.footer.phone && (
                                    <li className="flex items-center gap-3">
                                        <Phone className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                        <p dir="ltr" className="text-secondary-600 dark:text-secondary-400 text-sm font-bold">{cms.footer.phone}</p>
                                    </li>
                                )}
                                {cms.footer.openingHours && (
                                    <li className="flex items-center gap-3">
                                        <Clock className="w-4 h-4 text-primary-500 flex-shrink-0" />
                                        <p className="text-secondary-600 dark:text-secondary-400 text-sm">
                                            مواعيد العمل: <span className="font-bold">{cms.footer.openingHours}</span>
                                        </p>
                                    </li>
                                )}
                            </ul>
                        </div>

                        {/* Links col */}
                        <div>
                            <h4 className="font-black text-secondary-900 dark:text-white mb-5 text-sm uppercase tracking-wide">روابط سريعة</h4>
                            <ul className="space-y-3">
                                {cms.navbar.links.map((link: string) => (
                                    <li key={link}>
                                        <a href={`#${link}`} aria-label={link === 'تواصل معنا' ? 'انتقل لقسم تواصل معنا' : undefined} className="text-secondary-500 dark:text-secondary-400 text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                                            {link}
                                        </a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Bottom bar */}
                    <div className="pt-6 border-t border-secondary-100 dark:border-secondary-700 flex flex-col sm:flex-row justify-between items-center gap-3">
                        <p className="text-secondary-300 text-xs">
                            © {new Date().getFullYear()} {cms.hero.title}. جميع الحقوق محفوظة.
                        </p>
                        <p className="text-secondary-300 text-xs flex items-center gap-1">
                            تم التطوير بكل <Heart className="w-3 h-3 text-red-400 fill-current mx-0.5" /> لابتسامتكم
                        </p>
                    </div>
                </div>
            </footer>

            {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ FLOATING WHATSAPP */}
            {showWhatsApp && cms.whatsapp.showFloating && cms.whatsapp.number && (
                <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="تواصل معنا عبر واتساب"
                    className="fixed bottom-6 left-6 z-50 group"
                >
                    <div 
                        className="relative w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-300"
                        style={{ backgroundColor: '#25D366' }}
                    >
                        <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
                        <MessageCircle className="relative w-7 h-7 group-hover:rotate-12 transition-transform" />
                    </div>
                    <span className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white dark:bg-secondary-800 text-secondary-900 dark:text-white text-xs font-bold rounded-xl shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-secondary-100 dark:border-secondary-700">
                        {cms.whatsapp.buttonText}
                    </span>
                </a>
            )}

        </div>
    );
}
