// ═══════════════════════════════════════════════
// Patient Domain Model
// ═══════════════════════════════════════════════

export type Gender = 'male' | 'female';
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface Patient {
    readonly id: string;
    readonly fullName: string;
    readonly phone: string;
    readonly nationalId: string | undefined;
    readonly birthDate: string | undefined;
    readonly gender: Gender;
    readonly address: string | undefined;
    readonly email: string | undefined;
    readonly bloodType: BloodType | undefined;
    readonly allergies: string | undefined;
    readonly chronicDiseases: string | undefined;
    readonly currentMedications: string | undefined;
    readonly notes: string | undefined;
    readonly firstVisitDate: string | undefined;
    readonly lastVisitDate: string | undefined;
    readonly totalVisits: number;
    readonly totalPaid: number;
    readonly balance: number;
    readonly isActive: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export interface PatientsQueryParams {
    readonly search?: string | undefined;
    readonly isActive?: boolean | undefined;
    readonly page?: number | undefined;
    readonly pageSize?: number | undefined;
}

export interface PatientsResult {
    patients: Patient[];
    page: number;
    hasMore: boolean;
}
export type PatientFormData = Omit<Patient, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'totalPaid' | 'balance' | 'firstVisitDate' | 'lastVisitDate'>;
