// Medical Record Types
// ═══════════════════════════════════════════════

export interface ToothChartEntry {
    readonly status: 'healthy' | 'decayed' | 'missing' | 'filled' | 'crowned' | 'extracted';
    readonly notes?: string;
}

export interface MedicalRecord {
    readonly id: string;
    readonly patientId: string;
    readonly appointmentId: string | undefined;
    readonly visitDate: string;
    // المعلومات الطبية للزيارة
    readonly chiefComplaint: string;
    readonly diagnosis: string;
    // العلاج
    readonly treatmentDone: string;
    readonly treatmentPlan: string | undefined;
    // الأسنان
    readonly teethChart: Record<string, ToothChartEntry> | undefined;
    // الوصفة والتقارير
    readonly prescription: string | undefined;
    readonly xrayReport: string | undefined;
    readonly labReport: string | undefined;
    // ملاحظات
    readonly doctorNotes: string | undefined;
    readonly followUpDate: string | undefined;
    readonly createdAt: string; // ISO String
    readonly updatedAt: string; // ISO String
}

export type MedicalRecordFormData = Omit<MedicalRecord, 'id' | 'createdAt' | 'updatedAt'>;
