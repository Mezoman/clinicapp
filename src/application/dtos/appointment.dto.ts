export type AppointmentStatusDTO = 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
export type AppointmentTypeDTO = 'examination' | 'follow-up' | 're-examination' | 'procedure' | 'emergency';

export interface AppointmentDTO {
    readonly id: string;
    readonly patientId: string;
    readonly patientName: string;
    readonly patientPhone: string;
    readonly date: string;
    readonly time: string;
    readonly duration: number;
    readonly type: AppointmentTypeDTO | string;
    readonly status: AppointmentStatusDTO | string;
    readonly notes: string | undefined;
    readonly dailyNumber: number;
    readonly bookedBy: 'patient' | 'admin';
}

export interface BookAppointmentDTO {
    readonly patientId: string | undefined;
    readonly patientName: string;
    readonly patientPhone: string;
    readonly date: string;
    readonly time: string;
    readonly type: AppointmentTypeDTO | string;
    readonly notes: string | undefined;
    readonly bookedBy?: 'patient' | 'admin';
}

export interface AppointmentsQueryParamsDTO {
    readonly date?: string | undefined;
    readonly patientId?: string | undefined;
    readonly status?: AppointmentStatusDTO | undefined;
    readonly page?: number;
    readonly pageSize?: number;
}

export interface AppointmentsResultDTO {
    readonly appointments: readonly AppointmentDTO[];
    readonly page: number;
    readonly totalPages: number;
    readonly hasMore: boolean;
    readonly total: number;
}
