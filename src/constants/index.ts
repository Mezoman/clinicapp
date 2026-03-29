import type { AppointmentStatus, AppointmentType, ClosureReason, PaymentMethod, InvoiceStatus, BloodType, ClinicSettings } from '../domain/models';

// ═══════════════════════════════════════════════
// Clinic Information
// ═══════════════════════════════════════════════


export const CLINIC_INFO = {
    doctorName: 'الدكتور محمد أسامة الرفاعي',
    clinicName: 'عيادة الدكتور محمد أسامة الرفاعي',
    specialty: 'طب وجراحة الأسنان',
    address: 'المحلة الكبرى — محافظة الغربية',
    phone: '',
    whatsapp: '',
    email: '',
    facebook: '',
    instagram: '',
} as const;

// ═══════════════════════════════════════════════
// Default Clinic Settings
// ═══════════════════════════════════════════════

export const DEFAULT_CLINIC_SETTINGS: ClinicSettings = {
    clinicName: CLINIC_INFO.clinicName,
    doctorName: CLINIC_INFO.doctorName,
    phone: CLINIC_INFO.phone,
    whatsapp: CLINIC_INFO.whatsapp,
    address: CLINIC_INFO.address,
    email: CLINIC_INFO.email,
    facebook: CLINIC_INFO.facebook,
    instagram: CLINIC_INFO.instagram,
    workingDays: [0, 1, 2, 3, 4, 5], // الأحد إلى الجمعة
    shifts: {
        morningStart: '09:00',
        morningEnd: '14:00',
        eveningStart: '17:00',
        eveningEnd: '21:00',
        isEnabled: true,
    },
    slotDuration: 30,
    isBookingEnabled: true,
    bookingAdvanceDays: 30,
    maxDailyAppointments: 20,
};

// ═══════════════════════════════════════════════
// Dental Services
// ═══════════════════════════════════════════════

// ═══════════════════════════════════════════════
// Appointment Status Labels & Colors
// ═══════════════════════════════════════════════

export const APPOINTMENT_STATUS_MAP: Record<AppointmentStatus, { label: string; color: string; bgColor: string }> = {
    pending: {
        label: 'قيد الانتظار',
        color: 'text-warning-700',
        bgColor: 'bg-warning-50',
    },
    confirmed: {
        label: 'مؤكد',
        color: 'text-primary-700',
        bgColor: 'bg-primary-50',
    },
    completed: {
        label: 'مكتمل',
        color: 'text-success-700',
        bgColor: 'bg-success-50',
    },
    cancelled: {
        label: 'ملغي',
        color: 'text-danger-700',
        bgColor: 'bg-danger-50',
    },
    'no-show': {
        label: 'لم يحضر',
        color: 'text-secondary-500',
        bgColor: 'bg-secondary-100',
    },
};

// ═══════════════════════════════════════════════
// Appointment Type Labels
// ═══════════════════════════════════════════════

export const APPOINTMENT_TYPE_MAP: Record<AppointmentType, string> = {
    examination: 'كشف',
    'follow-up': 'متابعة',
    're-examination': 'إعادة كشف',
    procedure: 'إجراء علاجي',
    emergency: 'طوارئ',
};

// ═══════════════════════════════════════════════
// Invoice Status Labels
// ═══════════════════════════════════════════════

export const INVOICE_STATUS_MAP: Record<InvoiceStatus, { label: string; color: string; bgColor: string }> = {
    draft: {
        label: 'مسودة',
        color: 'text-secondary-500',
        bgColor: 'bg-secondary-100',
    },
    issued: {
        label: 'غير مدفوعة',
        color: 'text-red-700',
        bgColor: 'bg-red-50',
    },
    partial: {
        label: 'مدفوعة جزئياً',
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
    },
    paid: {
        label: 'مدفوعة بالكامل',
        color: 'text-emerald-700',
        bgColor: 'bg-emerald-50',
    },
    overdue: {
        label: 'متأخرة',
        color: 'text-purple-700',
        bgColor: 'bg-purple-50',
    },
    cancelled: {
        label: 'ملغاة',
        color: 'text-secondary-500',
        bgColor: 'bg-secondary-100',
    },
};

// ═══════════════════════════════════════════════
// Payment Method Labels
// ═══════════════════════════════════════════════

export const PAYMENT_METHOD_MAP: Record<PaymentMethod, string> = {
    cash: 'نقداً',
    card: 'بطاقة',
    insurance: 'تأمين',
    transfer: 'تحويل بنكي',
};

// ═══════════════════════════════════════════════
// Closure Reason Labels
// ═══════════════════════════════════════════════

export const CLOSURE_REASON_MAP: Record<ClosureReason, string> = {
    holiday: 'إجازة رسمية',
    travel: 'سفر',
    maintenance: 'صيانة',
    other: 'أخرى',
};

// ═══════════════════════════════════════════════
// Blood Type Options
// ═══════════════════════════════════════════════

export const BLOOD_TYPES: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// ═══════════════════════════════════════════════
// Days of Week (Arabic)
// ═══════════════════════════════════════════════

export const DAYS_OF_WEEK: Record<number, string> = {
    0: 'الأحد',
    1: 'الإثنين',
    2: 'الثلاثاء',
    3: 'الأربعاء',
    4: 'الخميس',
    5: 'الجمعة',
    6: 'السبت',
};

// ═══════════════════════════════════════════════
// Gender Labels
// ═══════════════════════════════════════════════

export const GENDER_MAP: Record<string, string> = {
    male: 'ذكر',
    female: 'أنثى',
};

// ═══════════════════════════════════════════════
// Pagination
// ═══════════════════════════════════════════════

export const PAGE_SIZE = 20;

// ═══════════════════════════════════════════════
// Debounce
// ═══════════════════════════════════════════════

export const SEARCH_DEBOUNCE_MS = 300;

// ═══════════════════════════════════════════════
// Slot Lock Duration (minutes)
// ═══════════════════════════════════════════════

export const SLOT_LOCK_DURATION_MINUTES = 10;
