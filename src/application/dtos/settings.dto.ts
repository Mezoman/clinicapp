export interface ClinicShiftsDTO {
    readonly morningStart: string;
    readonly morningEnd: string;
    readonly eveningStart: string;
    readonly eveningEnd: string;
    readonly isEnabled: boolean;
}

export interface ClinicSettingsDTO {
    readonly clinicName: string;
    readonly doctorName?: string | undefined;
    readonly phone?: string | undefined;
    readonly whatsapp?: string | undefined;
    readonly address?: string | undefined;
    readonly slotDuration: number;
    readonly workingDays: readonly number[];
    readonly shifts: ClinicShiftsDTO;
    readonly bookingAdvanceDays: number;
    readonly maxDailyAppointments: number;
    readonly isBookingEnabled?: boolean | undefined;
}

export type ClosureReasonDTO = 'holiday' | 'travel' | 'maintenance' | 'other';

export interface ClosureDTO {
    readonly id: string;
    readonly startDate: string;
    readonly endDate: string;
    readonly reason: ClosureReasonDTO;
    readonly createdAt: string;
}

export type ClosureFormDataDTO = Omit<ClosureDTO, 'id' | 'createdAt'>;
