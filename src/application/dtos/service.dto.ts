export interface ClinicServiceDTO {
    id: string;
    name: string;
    nameEn: string;
    icon: string;
    description: string;
    defaultPrice: number;
    isActive: boolean;
}

export type CreateClinicServiceDTO = Omit<ClinicServiceDTO, 'id'>;
export type UpdateClinicServiceDTO = Partial<CreateClinicServiceDTO>;
