import { Patient } from '../../domain/models';
import { PatientDTO } from '../dtos/patient.dto';

export class PatientMapper {
    static toDTO(domain: Patient): PatientDTO {
        return {
            id: domain.id,
            fullName: domain.fullName,
            phone: domain.phone,
            gender: domain.gender,
            birthDate: domain.birthDate,
            nationalId: domain.nationalId,
            address: domain.address,
            email: domain.email,
            bloodType: domain.bloodType,
            allergies: domain.allergies,
            chronicDiseases: domain.chronicDiseases,
            currentMedications: domain.currentMedications,
            notes: domain.notes,
            firstVisitDate: domain.firstVisitDate,
            lastVisitDate: domain.lastVisitDate,
            totalVisits: domain.totalVisits,
            totalPaid: domain.totalPaid,
            balance: domain.balance,
            isActive: domain.isActive,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt
        };
    }

    static toDTOList(domains: readonly Patient[]): PatientDTO[] {
        return domains.map(domain => this.toDTO(domain));
    }
}
