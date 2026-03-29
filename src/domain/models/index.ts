// ═══════════════════════════════════════════════
// Central Type Exports
// ═══════════════════════════════════════════════


export { Appointment } from './appointment';
export type {
    AppointmentProps,
    AppointmentFormData,
    AppointmentType,
    AppointmentStatus,
    BookedBy,
    SlotLock,
    AppointmentsQueryParams,
    AppointmentsResult,
} from './appointment';

export type {
    Patient,
    PatientFormData,
    Gender,
    BloodType,
    PatientsQueryParams,
    PatientsResult,
} from './patient';

export type {
    DashboardKPIs,
    WeeklyChartData,
    MonthlyRevenueData,
    VisitTypeData,
} from './analytics';

export type {
    MedicalRecord,
    MedicalRecordFormData,
    ToothChartEntry,
} from './medical';

export { Invoice } from './billing';
export type {
    InvoiceProps,
    InvoiceFormData,
    InvoiceService,
    Payment,
    PaymentMethod,
    InvoiceStatus,
    Installment,
    InstallmentFormData,
    InstallmentStatus,
} from './billing';

export type {
    AdminUser,
    AdminRole,
    ClinicSettings,
    ClinicShifts,
    Closure,
    ClosureReason,
    DailyCounter,
    AuthState,
} from './auth';
