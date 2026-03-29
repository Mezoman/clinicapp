import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
    CheckCircle,
    User,
    Phone,
    CreditCard,
    Calendar as CalendarIcon,
    Clock,
    MessageCircle,
    ArrowRight,
    ArrowLeft,
    Loader2
} from 'lucide-react';

import {
    generateTimeSlots,
    formatDate,
    formatTime,
    toISODateString
} from '../../../utils/dateUtils';
import { validatePatientForm } from '../../../utils/validators';
import { sanitize } from '../../../lib/validation';
import { logger } from '../../../utils/logger';
import { app } from '../../../application/container';
import { CLINIC_INFO } from '../../../constants';

import { VisualDatePicker } from '../../components/calendar/VisualDatePicker';
import { useSlotLock } from '../../hooks/useSlotLock';
import { useRateLimit } from '../../hooks/useRateLimit';
import { bookAppointmentUseCase } from '../../../application/use-cases/BookAppointmentUseCase';

import type { AppointmentTypeDTO } from '../../../application/dtos/appointment.dto';
import type { ClinicSettingsDTO } from '../../../application/dtos/settings.dto';

interface BookingFormData {
    patientName: string;
    patientPhone: string;
    nationalId: string;
    type: AppointmentTypeDTO;
    reason: string;
    date: string;
    time: string;
}

const STEPS = [
    { id: 1, label: 'بيانات المريض' },
    { id: 2, label: 'اختر التاريخ' },
    { id: 3, label: 'اختر الوقت' },
    { id: 4, label: 'تأكيد الحجز' }
];

export default function Booking() {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [settingsError, setSettingsError] = useState(false);
    const [settings, setSettings] = useState<ClinicSettingsDTO | null>(null);
    const [bookedSlots, setBookedSlots] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [appointmentInfo, setAppointmentInfo] = useState<{ id: string; dailyNumber: number } | null>(null);
    const [dayAvailability, setDayAvailability] = useState<{
        available: boolean;
        reason?: 'off_day' | 'closed';
    } | null>(null);
    // ── Honeypot: حماية من البوتات (Phase 1.3) ──
    const [honeypot, setHoneypot] = useState('');

    const sessionId = useRef(crypto.randomUUID());
    const { lockId, acquireLock } = useSlotLock(sessionId.current);
    const { checkLimit, registerAction, isLimited, timeLeft } = useRateLimit('booking', 60000, 3);

    const [form, setForm] = useState<BookingFormData>({
        patientName: '',
        patientPhone: '',
        nationalId: '',
        type: 'examination',
        reason: '',
        date: toISODateString(new Date()),
        time: '',
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    useEffect(() => {
        async function loadInitialData() {
            try {
                // ── جلب الإعدادات مستقلاً عن availability
                const settingsResult = await app.settingsService.getSettings();
                if (settingsResult.success) {
                    setSettings(settingsResult.data);
                    setSettingsError(false);
                } else {
                    logger.error('Failed to load settings', settingsResult.error);
                    setSettingsError(true);
                }
            } catch (err) {
                logger.error('Failed to load clinic settings', err);
                setSettingsError(true);
            } finally {
                setLoading(false);
            }
        }
        loadInitialData();
    }, []);

    const checkAvailability = useCallback(async (dateStr: string) => {
        try {
            const date = new Date(dateStr + 'T00:00:00');
            const result = await app.appointmentService.getAvailableSlots(date);
            if (result.success) {
                setDayAvailability({
                    available: result.data.available,
                    ...(result.data.reason ? { reason: result.data.reason } : {})
                });
            }
        } catch (err) {
            logger.error('Availability check failed', err);
        }
    }, []);

    useEffect(() => {
        if (form.date) {
            checkAvailability(form.date);
        }
    }, [form.date, checkAvailability]);

    // ══════════════════════════════════════════════════════════
    // BUG FIX: تطبيع صيغة الوقت
    // Supabase يُرجع TIME كـ "09:00:00" (HH:MM:SS)
    // generateTimeSlots تُنتج "09:00" (HH:MM)
    // بدون التطبيع يفشل .includes() ولا تختفي المواعيد المحجوزة
    // ══════════════════════════════════════════════════════════
    const normalizeTime = useCallback((t: string | null | undefined): string => {
        if (!t) return '';
        return t.length >= 5 ? t.substring(0, 5) : t;
    }, []);

    const fetchBookedSlots = useCallback(async (date: string) => {
        const result = await app.appointmentService.getAppointmentsByDate(date, 1, 100);
        if (result.success) {
            setBookedSlots(
                result.data.appointments
                    .map(a => normalizeTime(a.time))
                    .filter(Boolean)
            );
        }
    }, [normalizeTime]);

    useEffect(() => {
        if (step !== 3 || !form.date) return;

        // جلب أولي
        fetchBookedSlots(form.date);

        // الاشتراك في التغييرات اللحظية
        // ARCH-01 FIX: Use app.appointmentService instead of repository directly
        // subscribeByDate delivers AppointmentDTO[] (already mapped) — same fields available
        const unsubscribe = app.appointmentService.subscribeByDate(
            form.date,
            (appointments) => {
                setBookedSlots(
                    appointments
                        .filter(a => a.status === 'pending' || a.status === 'confirmed')
                        .map(a => normalizeTime(a.time as string))
                        .filter(Boolean)
                );
            }
        );

        return () => unsubscribe();
    }, [form.date, step, fetchBookedSlots]);

    const actualTimeSlots = useMemo(() => {
        if (!settings) return [];
        const morning = (settings.shifts.morningStart && settings.shifts.morningEnd)
            ? generateTimeSlots(settings.shifts.morningStart, settings.shifts.morningEnd, settings.slotDuration)
            : [];
        const evening = (settings.shifts.isEnabled && settings.shifts.eveningStart && settings.shifts.eveningEnd)
            ? generateTimeSlots(settings.shifts.eveningStart, settings.shifts.eveningEnd, settings.slotDuration)
            : [];
        return [...morning, ...evening];
    }, [settings]);

    const availableSlots = useMemo(() =>
        actualTimeSlots.filter(t => !bookedSlots.includes(t)),
        [actualTimeSlots, bookedSlots]
    );

    const handleNextStep = async () => {
        if (step === 1) {
            const validationResult = validatePatientForm({
                fullName: form.patientName,
                phone: form.patientPhone,
                ...(form.nationalId ? { nationalId: form.nationalId } : {})
            });
            if (!validationResult.isValid) {
                const newErrors: Record<string, string> = {};
                validationResult.errors.forEach(err => {
                    newErrors[err.field] = err.message;
                });
                setErrors(newErrors);
                toast.error('يرجى التأكد من البيانات المدخلة');
                return;
            }
            setErrors({});
        }

        if (step === 2 && !form.date) {
            toast.error('يرجى اختيار التاريخ');
            return;
        }

        if (step === 3 && !form.time) {
            toast.error('يرجى اختيار الوقت');
            return;
        }

        // ── عند الانتقال من الخطوة 3 إلى 4، احجز الـ slot مسبقاً ──
        if (step === 3 && form.time) {
            await acquireLock(form.date, form.time);
            // نكمل بغض النظر عن نتيجة الـ lock —
            // الـ RPC server-side سيتحقق من التعارض بشكل نهائي
        }

        setStep(prev => prev + 1);
    };

    const handleBackStep = () => {
        setStep(prev => prev - 1);
    };

    const handleSubmit = async () => {
        // ── Honeypot Check: رفض صامت — البوت لا يعرف أنه اكتشف ──
        if (honeypot !== '') {
            logger.warn('Honeypot triggered — bot submission blocked');
            setStep(4); // وهم النجاح
            setAppointmentInfo({ id: 'bot', dailyNumber: 0 });
            return;
        }

        if (checkLimit()) {
            toast.error(`الرجاء الانتظار ${timeLeft} ثانية قبل المحاولة مرة أخرى`);
            return;
        }

        setSubmitting(true);
        try {
            // ARCH-01 FIX: Use app.patientService instead of repository directly
            const patientResult = await app.patientService.findOrCreate(
                sanitize(form.patientName),
                sanitize(form.patientPhone)
            );

            if (!patientResult.success || !patientResult.data) {
                logger.error('Failed to find/create patient', patientResult.error);
                toast.error(patientResult.error || 'فشل في معالجة بيانات المريض');
                setSubmitting(false);
                return;
            }

            const patientId = patientResult.data;

            // 2. Use BookAppointmentUseCase
            const result = await bookAppointmentUseCase.execute({
                patientId: patientId,
                patientName: sanitize(form.patientName),
                patientPhone: sanitize(form.patientPhone),
                date: form.date,
                time: form.time,
                duration: settings?.slotDuration || 30,
                type: form.type as any,
                notes: sanitize(form.reason) || '',
                sessionId: sessionId.current,
                // ── lockId يجب أن يكون UUID صحيح — نولّد واحداً إذا لم يكن محجوزاً بعد ──
                lockId: lockId ?? crypto.randomUUID()
            });

            setAppointmentInfo({
                id: result.id,
                dailyNumber: result.dailyNumber
            });
            setStep(4);
            toast.success('تم حجز الموعد بنجاح! ✨');
            registerAction();
        } catch (err: any) {
            logger.error('Booking error', err);
            toast.error(err.message || 'فشل في تأكيد الحجز');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-secondary-50 dark:bg-secondary-950">
                <Loader2 className="w-12 h-12 text-primary-500 animate-spin mb-4" />
                <p className="text-secondary-500 font-bold">جاري تحميل العيادة...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-secondary-50 dark:bg-secondary-950 font-arabic rtl" dir="rtl">
            {/* Clinic Header */}
            <header className="bg-white dark:bg-secondary-900 border-b border-secondary-100 dark:border-secondary-800 py-6 px-4 sticky top-0 z-30 shadow-sm">
                <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-right">
                        <h1 className="text-xl sm:text-2xl font-black text-secondary-900 dark:text-white">
                            {CLINIC_INFO.clinicName}
                        </h1>
                        <p className="text-secondary-500 text-sm font-medium mt-1">
                            {CLINIC_INFO.specialty} — {CLINIC_INFO.doctorName}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Link
                            to="/"
                            className="px-4 py-2 bg-secondary-50 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 rounded-xl text-sm font-bold hover:bg-secondary-100 transition-all min-h-[44px] flex items-center"
                        >
                            الرئيسية
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8 md:py-12">
                {/* Progress Bar */}
                {step < 4 && (
                    <div className="mb-12">
                        <div className="flex items-center justify-between relative mb-4">
                            {STEPS.map((s) => (
                                <div key={s.id} className="flex flex-col items-center relative z-10 w-1/4">
                                    <div className={`
                                        w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-black text-lg transition-all duration-500
                                        ${step >= s.id ? 'bg-primary-500 text-white shadow-lg shadow-primary-200 ring-4 ring-primary-50' : 'bg-white text-secondary-300 border-2 border-secondary-100'}
                                    `}>
                                        {step > s.id ? <CheckCircle className="w-6 h-6" /> : s.id}
                                    </div>
                                    <span className={`text-[10px] md:text-sm font-bold mt-2 transition-colors duration-500 ${step >= s.id ? 'text-primary-600' : 'text-secondary-400'}`}>
                                        {s.label}
                                    </span>
                                </div>
                            ))}
                            <div className="absolute top-5 md:top-6 left-[12.5%] right-[12.5%] h-1 bg-secondary-100 -z-10 overflow-hidden">
                                <div
                                    className="h-full bg-primary-500 transition-all duration-500"
                                    style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Step Content Container */}
                <div className="relative overflow-hidden min-h-[400px]">
                    {/* Step 1: Patient Info */}
                    {step === 1 && (
                        <div className="bg-white dark:bg-secondary-900 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 shadow-xl shadow-secondary-100/50 dark:shadow-none border border-secondary-100 dark:border-secondary-800">
                            <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-8 flex items-center gap-3">
                                <span className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-2xl">
                                    <User className="w-6 h-6" />
                                </span>
                                البيانات الشخصية
                            </h2>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-black text-secondary-900 dark:text-secondary-200 mb-2 mr-2">الاسم الكامل</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={form.patientName}
                                            onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                                            placeholder="ادخل اسمك الرباعي..."
                                            className={`w-full bg-secondary-50 dark:bg-secondary-800/50 border-2 ${errors.patientName ? 'border-danger-500' : 'border-secondary-50 dark:border-secondary-800'} rounded-[1.5rem] px-6 py-4 outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-secondary-800 transition-all font-bold text-secondary-900 dark:text-white form-input min-h-[44px]`}
                                        />
                                        {errors.patientName && <p className="text-danger-500 text-xs mt-2 mr-2 font-bold">{errors.patientName}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-secondary-900 dark:text-secondary-200 mb-2 mr-2">نوع الزيارة</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                        {[
                                            { id: 'examination', label: 'كشف' },
                                            { id: 'procedure', label: 'علاج' },
                                            { id: 'follow-up', label: 'متابعة' },
                                            { id: 'emergency', label: 'طوارئ' }
                                        ].map((t) => (
                                            <button
                                                key={t.id}
                                                type="button"
                                                onClick={() => setForm(f => ({ ...f, type: t.id as any }))}
                                                className={`
                                                    py-3 px-2 rounded-xl text-[10px] font-bold transition-all border-2
                                                    ${form.type === t.id
                                                        ? 'bg-primary-500 border-primary-500 text-white shadow-md shadow-primary-100'
                                                        : 'bg-secondary-50 dark:bg-secondary-800/50 border-transparent text-secondary-600 dark:text-secondary-400 hover:border-primary-200'}
                                                `}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-secondary-900 dark:text-secondary-200 mb-2 mr-2">سبب الزيارة (اختياري)</label>
                                    <textarea
                                        value={form.reason}
                                        onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                                        placeholder="مثلاً: آلام في الأسنان، متابعة دورية..."
                                        className="w-full bg-secondary-50 dark:bg-secondary-800/50 border-2 border-secondary-50 dark:border-secondary-800 rounded-[1.5rem] px-6 py-4 outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-secondary-800 transition-all font-bold text-secondary-900 dark:text-white h-24 resize-none form-input"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-secondary-900 dark:text-secondary-200 mb-2 mr-2">رقم الهاتف</label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            value={form.patientPhone}
                                            onChange={e => setForm(f => ({ ...f, patientPhone: e.target.value }))}
                                            placeholder="01xxxxxxxxx"
                                            dir="ltr"
                                            className={`w-full bg-secondary-50 dark:bg-secondary-800/50 border-2 ${errors.patientPhone ? 'border-danger-500' : 'border-secondary-50 dark:border-secondary-800'} rounded-[1.5rem] px-6 py-4 outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-secondary-800 transition-all font-bold text-secondary-900 dark:text-white text-left form-input min-h-[44px] ltr-text`}
                                        />
                                        <Phone className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                        {errors.patientPhone && <p className="text-danger-500 text-xs mt-2 mr-2 font-bold">{errors.patientPhone}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-black text-secondary-900 dark:text-secondary-200 mb-2 mr-2">الرقم القومي (اختياري)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={form.nationalId}
                                            onChange={e => setForm(f => ({ ...f, nationalId: e.target.value }))}
                                            placeholder="14 رقم"
                                            dir="ltr"
                                            className={`w-full bg-secondary-50 dark:bg-secondary-800/50 border-2 ${errors.nationalId ? 'border-danger-500' : 'border-secondary-50 dark:border-secondary-800'} rounded-[1.5rem] px-6 py-4 outline-none focus:border-primary-500 focus:bg-white dark:focus:bg-secondary-800 transition-all font-bold text-secondary-900 dark:text-white text-left form-input min-h-[44px] ltr-text`}
                                        />
                                        <CreditCard className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                                        {errors.nationalId && <p className="text-danger-500 text-xs mt-2 mr-2 font-bold">{errors.nationalId}</p>}
                                    </div>
                                </div>
                            </div>

                            {/* ── Honeypot Field: مخفي من البشر، البوتات تملأه ── */}
                            <div
                                style={{ position: 'absolute', left: '-9999px', opacity: 0, height: 0, overflow: 'hidden' }}
                                aria-hidden="true"
                            >
                                <label htmlFor="booking-website">Website</label>
                                <input
                                    id="booking-website"
                                    type="text"
                                    name="website"
                                    value={honeypot}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHoneypot(e.target.value)}
                                    tabIndex={-1}
                                    autoComplete="off"
                                />
                            </div>

                            <button
                                onClick={handleNextStep}
                                className="w-full mt-10 py-5 bg-primary-500 text-white rounded-[1.5rem] font-black text-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-3 min-h-[44px]"
                            >
                                التالي
                                <ArrowLeft className="w-6 h-6 rotate-rtl" />
                            </button>
                        </div>
                    )}

                    {/* Step 2: Date Selection */}
                    {step === 2 && (
                        <div className="bg-white dark:bg-secondary-900 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 shadow-xl border border-secondary-100 dark:border-secondary-800">
                            <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-8 flex items-center gap-3">
                                <span className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-2xl">
                                    <CalendarIcon className="w-6 h-6" />
                                </span>
                                موعد الزيارة
                            </h2>

                            <VisualDatePicker
                                selectedDate={form.date}
                                onSelect={(d) => setForm(f => ({ ...f, date: d }))}
                            />

                            {settings && (
                                <div className="mt-4 p-3 bg-secondary-50 dark:bg-secondary-800 rounded-2xl">
                                    <p className="text-xs text-secondary-500 text-center font-bold">
                                        📅 أيام العمل: {
                                            settings.workingDays
                                                .map(d => ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][d])
                                                .join(' · ')
                                        }
                                    </p>
                                </div>
                            )}

                            <div className="mt-8 p-4 bg-primary-50 dark:bg-primary-900/10 rounded-2xl border border-primary-100 dark:border-primary-800/30">
                                <p className="text-primary-700 dark:text-primary-300 font-bold text-center">
                                    الموعد المختار: {formatDate(form.date)}
                                </p>
                            </div>

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={handleBackStep}
                                    className="flex-1 py-5 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 rounded-[1.5rem] font-black text-xl hover:bg-secondary-200 transition-all flex items-center justify-center gap-3"
                                >
                                    <ArrowRight className="w-6 h-6 rotate-rtl" />
                                    رجوع
                                </button>
                                <button
                                    onClick={handleNextStep}
                                    className="flex-[2] py-5 bg-primary-500 text-white rounded-[1.5rem] font-black text-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-3"
                                >
                                    التالي
                                    <ArrowLeft className="w-6 h-6" />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Time Selection */}
                    {step === 3 && (
                        <div className="bg-white dark:bg-secondary-900 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 shadow-xl border border-secondary-100 dark:border-secondary-800">
                            <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-8 flex items-center gap-3">
                                <span className="p-3 bg-primary-50 dark:bg-primary-900/20 text-primary-500 rounded-2xl">
                                    <Clock className="w-6 h-6" />
                                </span>
                                الوقت المتاح
                            </h2>

                            {/* ── حالة: اليوم غير متاح ── */}
                            {dayAvailability && !dayAvailability.available && (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/20 rounded-full flex items-center justify-center mb-6">
                                        <CalendarIcon className="w-10 h-10 text-amber-500" />
                                    </div>
                                    <h3 className="text-xl font-black text-secondary-900 dark:text-white mb-3">
                                        {dayAvailability.reason === 'off_day'
                                            ? 'هذا اليوم خارج أوقات العمل'
                                            : 'العيادة مغلقة في هذا اليوم'}
                                    </h3>
                                    <p className="text-secondary-500 text-sm mb-6 max-w-xs">
                                        {dayAvailability.reason === 'off_day'
                                            ? `يُرجى اختيار يوم عمل: ${settings?.workingDays.map(d => ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'][d]).join('، ')}`
                                            : 'العيادة في إجازة هذا اليوم، يُرجى اختيار يوم آخر'}
                                    </p>
                                    <button
                                        onClick={handleBackStep}
                                        className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition-all"
                                    >
                                        ← اختر تاريخاً آخر
                                    </button>
                                </div>
                            )}

                            {/* ── حالة: خطأ في تحميل الإعدادات ── */}
                            {settingsError && (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <div className="w-20 h-20 bg-danger-50 dark:bg-danger-900/20 rounded-full flex items-center justify-center mb-6">
                                        <Clock className="w-10 h-10 text-danger-400" />
                                    </div>
                                    <h3 className="text-xl font-black text-secondary-900 dark:text-white mb-3">
                                        تعذّر تحميل المواعيد
                                    </h3>
                                    <p className="text-secondary-500 text-sm mb-6 max-w-xs">
                                        حدث خطأ أثناء الاتصال بالخادم. يُرجى تحديث الصفحة أو المحاولة لاحقاً.
                                    </p>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition-all"
                                    >
                                        ↻ تحديث الصفحة
                                    </button>
                                </div>
                            )}

                            {/* ── حالة: لا توجد إعدادات بعد (جاري التحميل) ── */}
                            {!settings && !settingsError && (
                                <div className="flex flex-col items-center justify-center py-16 text-center">
                                    <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
                                    <p className="text-secondary-500 font-bold text-sm">جاري تحميل المواعيد المتاحة...</p>
                                </div>
                            )}

                            {/* ── حالة: المواعيد متاحة ── */}
                            {settings && dayAvailability?.available && (
                                <>
                                    {settings && dayAvailability?.available && availableSlots.length > 0 && (
                                        <div className="mb-6 p-3 bg-success-50 dark:bg-success-900/10 border border-success-100 dark:border-success-800/30 rounded-2xl">
                                            <p className="text-success-700 dark:text-success-300 font-bold text-sm text-center">
                                                ✅ يتوفر {availableSlots.length} موعد متاح في {formatDate(form.date)}
                                            </p>
                                        </div>
                                    )}
                                    {availableSlots.length === 0 ? (
                                        <div className="flex flex-col items-center justify-center py-16 text-center">
                                            <div className="w-20 h-20 bg-secondary-50 dark:bg-secondary-800 rounded-full flex items-center justify-center mb-6">
                                                <Clock className="w-10 h-10 text-secondary-300" />
                                            </div>
                                            <h3 className="text-xl font-black text-secondary-900 dark:text-white mb-3">
                                                لا تتوفر مواعيد
                                            </h3>
                                            <p className="text-secondary-500 text-sm mb-6 max-w-xs">
                                                جميع المواعيد محجوزة لهذا اليوم، يُرجى اختيار يوم آخر
                                            </p>
                                            <button
                                                onClick={handleBackStep}
                                                className="px-6 py-3 bg-primary-500 text-white rounded-xl font-bold text-sm hover:bg-primary-600 transition-all"
                                            >
                                                ← اختر تاريخاً آخر
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Morning slots */}
                                            {settings.shifts.morningStart && settings.shifts.morningEnd && (
                                                <div className="mb-6">
                                                    <p className="text-xs font-black text-secondary-400 mb-3 flex items-center gap-2">
                                                        <span className="text-lg">☀️</span> فترة الصباح
                                                        ({settings.shifts.morningStart} – {settings.shifts.morningEnd})
                                                    </p>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                        {generateTimeSlots(settings.shifts.morningStart, settings.shifts.morningEnd, settings.slotDuration)
                                                            .filter(time => !bookedSlots.includes(time))
                                                            .map(time => {
                                                                const isSelected = form.time === time;
                                                                return (
                                                                    <button
                                                                        key={time}
                                                                        onClick={() => setForm(f => ({ ...f, time }))}
                                                                        className={`
                                                                            p-4 rounded-2xl text-sm font-black transition-all border-2 min-h-[44px]
                                                                            ${isSelected
                                                                                ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-200 scale-105'
                                                                                : 'bg-white dark:bg-secondary-800 border-secondary-50 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:border-primary-200 hover:scale-[1.02]'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {formatTime(time)}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Evening slots */}
                                            {settings.shifts.isEnabled && settings.shifts.eveningStart && settings.shifts.eveningEnd && (
                                                <div>
                                                    <p className="text-xs font-black text-secondary-400 mb-3 flex items-center gap-2">
                                                        <span className="text-lg">🌙</span> فترة المساء
                                                        ({settings.shifts.eveningStart} – {settings.shifts.eveningEnd})
                                                    </p>
                                                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                                                        {generateTimeSlots(settings.shifts.eveningStart, settings.shifts.eveningEnd, settings.slotDuration)
                                                            .filter(time => !bookedSlots.includes(time))
                                                            .map(time => {
                                                                const isSelected = form.time === time;
                                                                return (
                                                                    <button
                                                                        key={time}
                                                                        onClick={() => setForm(f => ({ ...f, time }))}
                                                                        className={`
                                                                            p-4 rounded-2xl text-sm font-black transition-all border-2 min-h-[44px]
                                                                            ${isSelected
                                                                                ? 'bg-primary-500 border-primary-500 text-white shadow-lg shadow-primary-200 scale-105'
                                                                                : 'bg-white dark:bg-secondary-800 border-secondary-50 dark:border-secondary-800 text-secondary-700 dark:text-secondary-300 hover:border-primary-200 hover:scale-[1.02]'
                                                                            }
                                                                        `}
                                                                    >
                                                                        {formatTime(time)}
                                                                    </button>
                                                                );
                                                            })}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </>
                            )}

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={handleBackStep}
                                    className="flex-1 py-5 bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-300 rounded-[1.5rem] font-black text-xl hover:bg-secondary-200 transition-all flex items-center justify-center gap-3"
                                >
                                    <ArrowRight className="w-6 h-6 rotate-rtl" />
                                    رجوع
                                </button>
                                {(dayAvailability?.available && form.time) && (
                                    <button
                                        onClick={handleNextStep}
                                        className="flex-[2] py-5 bg-primary-500 text-white rounded-[1.5rem] font-black text-xl hover:bg-primary-600 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-3"
                                    >
                                        المراجعة
                                        <ArrowLeft className="w-6 h-6" />
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Final Confirmation */}
                    {step === 4 && !appointmentInfo && (
                        <div className="bg-white dark:bg-secondary-900 rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-6 md:p-10 shadow-xl border border-secondary-100 dark:border-secondary-800">
                            <h2 className="text-2xl font-black text-secondary-900 dark:text-white mb-8 border-b border-secondary-50 dark:border-secondary-800 pb-4">
                                مراجعة تفاصيل الحجز
                            </h2>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-xl">
                                        <User className="w-5 h-5 text-secondary-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-secondary-400 font-black mb-1">الاسم</p>
                                        <p className="font-bold text-secondary-900 dark:text-white uppercase">{form.patientName}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-xl">
                                        <CalendarIcon className="w-5 h-5 text-secondary-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-secondary-400 font-black mb-1">موعد الزيارة</p>
                                        <p className="font-bold text-secondary-900 dark:text-white">{formatDate(form.date)}</p>
                                        <p className="text-primary-500 font-black text-sm mt-1">{formatTime(form.time)}</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4">
                                    <div className="p-3 bg-secondary-50 dark:bg-secondary-800 rounded-xl">
                                        <Phone className="w-5 h-5 text-secondary-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-secondary-400 font-black mb-1">رقم التواصل</p>
                                        <p className="font-bold text-secondary-900 dark:text-white" dir="ltr">{form.patientPhone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-secondary-50 dark:border-secondary-800">
                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting || isLimited}
                                    className="w-full py-6 bg-primary-500 text-white rounded-[2rem] font-black text-2xl hover:bg-primary-600 transition-all shadow-2xl shadow-primary-300 flex items-center justify-center gap-4 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <Loader2 className="w-8 h-8 animate-spin" />
                                    ) : (
                                        <>
                                            تأكيد الحجز الآن
                                            <CheckCircle className="w-8 h-8" />
                                        </>
                                    )}
                                </button>
                                {isLimited && <p className="text-danger-500 text-center mt-2 font-bold text-sm">رجاء الانتظار {timeLeft} ثانية</p>}
                                <button
                                    onClick={handleBackStep}
                                    disabled={submitting}
                                    className="w-full mt-4 py-3 text-secondary-400 font-bold hover:text-secondary-600 transition-colors"
                                >
                                    تعديل البيانات
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success State */}
                    {step === 4 && appointmentInfo && (
                        <div className="bg-white dark:bg-secondary-900 rounded-[2.5rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-16 shadow-2xl text-center border-4 border-success-100 dark:border-success-900/20">
                            <div className="w-24 h-24 bg-success-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-success-200">
                                <CheckCircle className="w-14 h-14" />
                            </div>

                            <h2 className="text-4xl font-black text-secondary-900 dark:text-white mb-4">تم الحجز بنجاح!</h2>
                            <p className="text-secondary-500 dark:text-secondary-400 text-lg mb-8 max-w-sm mx-auto">
                                شكراً لك {form.patientName.split(' ')[0]}. تم تسجيل موعدك في النظام وتأكيده.
                            </p>

                            <div className="bg-secondary-50 dark:bg-secondary-800 rounded-[2rem] p-8 mb-10 inline-block min-w-[280px]">
                                <p className="text-secondary-400 font-black text-sm mb-2">رقم الحجز اليومي</p>
                                <p className="text-6xl font-black text-primary-500">#{appointmentInfo.dailyNumber}</p>
                                <p className="text-secondary-400 font-bold mt-4">
                                    {formatTime(form.time)} — {formatDate(form.date)}
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <a
                                    href={`https://wa.me/${CLINIC_INFO.whatsapp}?text=${encodeURIComponent(
                                        `مرحباً، أود الاستفسار عن حجزي باسم: ${form.patientName}\nالتاريخ: ${formatDate(form.date)}\nالوقت: ${formatTime(form.time)}\nرقم الحجز: ${appointmentInfo.dailyNumber}`
                                    )}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-5 bg-[#25D366] text-white rounded-2xl font-black text-xl hover:opacity-90 transition-all flex items-center justify-center gap-3 shadow-lg shadow-success-100"
                                >
                                    <MessageCircle className="w-6 h-6" />
                                    تواصل عبر واتساب
                                </a>
                                <Link
                                    to="/"
                                    className="w-full py-4 text-secondary-500 font-bold hover:bg-secondary-100 dark:hover:bg-secondary-800 rounded-2xl transition-all"
                                >
                                    عد للموقع الرئيسي
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
