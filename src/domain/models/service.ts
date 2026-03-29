export interface ClinicService {
    readonly id: string;
    readonly name: string;
    readonly nameEn: string;
    readonly icon: string;
    readonly description: string;
    readonly defaultPrice: number;
    readonly isActive: boolean;
    readonly createdAt: string;
    readonly updatedAt: string;
}
