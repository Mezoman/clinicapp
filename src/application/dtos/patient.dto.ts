export type GenderDTO = 'male' | 'female';
export type BloodTypeDTO = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface PatientDTO {
    readonly id: string;
    readonly fullName: string;
    readonly phone: string;
    readonly gender: GenderDTO;
    readonly birthDate: string | undefined;
    readonly nationalId: string | undefined;
    readonly address: string | undefined;
    readonly email: string | undefined;
    readonly bloodType: BloodTypeDTO | undefined;
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

export interface PatientsQueryParamsDTO {
    readonly search?: string | undefined;
    readonly isActive?: boolean | undefined;
    readonly page?: number | undefined;
    readonly pageSize?: number | undefined;
}

export interface PatientsResultDTO {
    readonly patients: readonly PatientDTO[];
    readonly page: number;
    readonly totalPages: number;
    readonly totalCount: number;
    readonly hasMore: boolean;
}

export type PatientFormDataDTO = Omit<PatientDTO, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'totalPaid' | 'balance' | 'firstVisitDate' | 'lastVisitDate'>;

