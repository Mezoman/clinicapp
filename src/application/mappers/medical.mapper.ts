import { MedicalRecord, ToothChartEntry } from '../../domain/models';
import { MedicalRecordDTO, ToothChartEntryDTO } from '../dtos/medical.dto';

export class MedicalRecordMapper {
    static toToothChartEntryDTO(domain: ToothChartEntry): ToothChartEntryDTO {
        return {
            status: domain.status,
            notes: domain.notes
        };
    }

    static toDTO(domain: MedicalRecord): MedicalRecordDTO {
        const teethChartDTO: Record<string, ToothChartEntryDTO> = {};
        if (domain.teethChart) {
            for (const [key, value] of Object.entries(domain.teethChart)) {
                teethChartDTO[key] = this.toToothChartEntryDTO(value);
            }
        }

        return {
            id: domain.id,
            patientId: domain.patientId,
            appointmentId: domain.appointmentId,
            visitDate: domain.visitDate,
            chiefComplaint: domain.chiefComplaint,
            diagnosis: domain.diagnosis,
            treatmentDone: domain.treatmentDone,
            treatmentPlan: domain.treatmentPlan,
            teethChart: domain.teethChart ? teethChartDTO : undefined,
            prescription: domain.prescription,
            xrayReport: domain.xrayReport,
            labReport: domain.labReport,
            doctorNotes: domain.doctorNotes,
            followUpDate: domain.followUpDate,
            createdAt: domain.createdAt,
            updatedAt: domain.updatedAt
        };
    }

    static toDTOList(domains: readonly MedicalRecord[]): MedicalRecordDTO[] {
        return domains.map(domain => this.toDTO(domain));
    }
}
