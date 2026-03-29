// ═══════════════════════════════════════════════
// Auth & Settings Types
// ═══════════════════════════════════════════════

export type AdminRole = 'super_admin' | 'admin' | 'receptionist';

export interface AdminUser {
    readonly uid: string;
    readonly email: string;
    readonly role: AdminRole;
    readonly displayName?: string;
    readonly createdAt: string; // ISO String
}

export interface ClinicShifts {
    readonly morningStart: string;
    readonly morningEnd: string;
    readonly eveningStart: string;
    readonly eveningEnd: string;
    readonly isEnabled: boolean;
}

export interface ClinicSettings {
    readonly clinicName: string;
    readonly doctorName: string;
    readonly phone: string;
    readonly whatsapp?: string | undefined;
    readonly address?: string | undefined;
    readonly email?: string | undefined;
    readonly facebook?: string;
    readonly instagram?: string;
    // ساعات العمل
    readonly workingDays: readonly number[];
    readonly shifts: ClinicShifts;
    readonly slotDuration: number;
    // التحكم في الحجز
    readonly isBookingEnabled: boolean;
    readonly bookingAdvanceDays: number;
    readonly maxDailyAppointments: number;
}

export type ClosureReason = 'holiday' | 'travel' | 'maintenance' | 'other';

export interface Closure {
    readonly id: string;
    readonly startDate: string;
    readonly endDate: string;
    readonly reason: ClosureReason;
    readonly customReason?: string;
    readonly createdAt: string; // ISO String
    readonly updatedAt: string; // ISO String
}

export interface DailyCounter {
    readonly date: string;
    readonly count: number;
}

// Auth context types
export interface AuthState {
    user: AdminUser | null;
    loading: boolean;
    error: string | null;
}
