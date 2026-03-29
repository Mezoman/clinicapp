export interface ToothChartEntryDTO {
    readonly status: 'healthy' | 'decayed' | 'missing' | 'filled' | 'crowned' | 'extracted';
    readonly notes?: string | undefined;
}

export interface MedicalRecordDTO {
    readonly id: string;
    readonly patientId: string;
    readonly appointmentId: string | undefined;
    readonly visitDate: string;
    readonly chiefComplaint: string;
    readonly diagnosis: string;
    readonly treatmentDone: string;
    readonly treatmentPlan: string | undefined;
    readonly teethChart: Record<string, ToothChartEntryDTO> | undefined;
    readonly prescription: string | undefined;
    readonly xrayReport: string | undefined;
    readonly labReport: string | undefined;
    readonly doctorNotes: string | undefined;
    readonly followUpDate: string | undefined;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly doctorName?: string;
}

export type MedicalRecordFormDataDTO = Omit<MedicalRecordDTO, 'id' | 'createdAt' | 'updatedAt'>;
