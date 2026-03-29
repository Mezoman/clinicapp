import { medicalRecordRepository } from '../../infrastructure/repositories/medicalRecordRepository';
import { MedicalRecordMapper } from '../mappers/medical.mapper';
import { MedicalRecordDTO } from '../dtos/medical.dto';
import { AppResult, success, failure } from '../result';
import { DomainError } from '../../domain/errors';
import { AppError } from '../../lib/errors';
import { mapDomainErrorToUIMessage } from '../mappers/error.mapper';
import { logger } from '../../utils/logger';
import type { MedicalRecord, ToothChartEntry } from '../../domain/models';

export class MedicalRecordService {
    async getByPatientId(patientId: string): Promise<AppResult<readonly MedicalRecordDTO[]>> {
        if (!patientId) return success([]);
        try {
            const records = await medicalRecordRepository.getByPatientId(patientId);
            return success(MedicalRecordMapper.toDTOList(records));
        } catch (error) {
            logger.error('Failed to get medical records by patient id', { patientId, error });
            if (error instanceof DomainError) {
                return failure(mapDomainErrorToUIMessage(error));
            }
            return failure('فشل في جلب السجلات الطبية');
        }
    }

    async create(dto: Partial<MedicalRecordDTO>): Promise<AppResult<MedicalRecordDTO>> {
        try {
            const chart: Record<string, ToothChartEntry> = {};
            if (dto.teethChart !== undefined) {
                const chartData = dto.teethChart;
                for (const key of Object.keys(chartData)) {
                    const tooth = chartData[key];
                    if (tooth) {
                        chart[key] = {
                            status: tooth.status,
                            ...(tooth.notes !== undefined && { notes: tooth.notes })
                        };
                    }
                }
            }

            const domainData: Partial<MedicalRecord> = {
                ...(dto.patientId !== undefined && { patientId: dto.patientId }),
                ...(dto.appointmentId !== undefined && { appointmentId: dto.appointmentId }),
                ...(dto.visitDate !== undefined && { visitDate: dto.visitDate }),
                ...(dto.chiefComplaint !== undefined && { chiefComplaint: dto.chiefComplaint }),
                ...(dto.diagnosis !== undefined && { diagnosis: dto.diagnosis }),
                ...(dto.treatmentDone !== undefined && { treatmentDone: dto.treatmentDone }),
                ...(dto.treatmentPlan !== undefined && { treatmentPlan: dto.treatmentPlan }),
                ...(dto.prescription !== undefined && { prescription: dto.prescription }),
                ...(dto.doctorNotes !== undefined && { doctorNotes: dto.doctorNotes }),
                ...(dto.followUpDate !== undefined && { followUpDate: dto.followUpDate }),
                ...(dto.teethChart !== undefined && { teethChart: chart }),
            };

            const record = await medicalRecordRepository.create(domainData);
            return success(MedicalRecordMapper.toDTO(record));
        } catch (error) {
            logger.error('Failed to create medical record', { error });
            if (error instanceof AppError) return failure(error.message);
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في إضافة السجل الطبي');
        }
    }

    async update(id: string, dto: Partial<MedicalRecordDTO>): Promise<AppResult<void>> {
        try {
            const chart: Record<string, ToothChartEntry> = {};
            if (dto.teethChart !== undefined) {
                const chartData = dto.teethChart;
                for (const key of Object.keys(chartData)) {
                    const tooth = chartData[key];
                    if (tooth) {
                        chart[key] = {
                            status: tooth.status,
                            ...(tooth.notes !== undefined && { notes: tooth.notes })
                        };
                    }
                }
            }

            const domainData: Partial<MedicalRecord> = {
                ...(dto.patientId !== undefined && { patientId: dto.patientId }),
                ...(dto.appointmentId !== undefined && { appointmentId: dto.appointmentId }),
                ...(dto.visitDate !== undefined && { visitDate: dto.visitDate }),
                ...(dto.chiefComplaint !== undefined && { chiefComplaint: dto.chiefComplaint }),
                ...(dto.diagnosis !== undefined && { diagnosis: dto.diagnosis }),
                ...(dto.treatmentDone !== undefined && { treatmentDone: dto.treatmentDone }),
                ...(dto.treatmentPlan !== undefined && { treatmentPlan: dto.treatmentPlan }),
                ...(dto.prescription !== undefined && { prescription: dto.prescription }),
                ...(dto.doctorNotes !== undefined && { doctorNotes: dto.doctorNotes }),
                ...(dto.followUpDate !== undefined && { followUpDate: dto.followUpDate }),
                ...(dto.teethChart !== undefined && { teethChart: chart }),
            };

            await medicalRecordRepository.update(id, domainData);
            return success<void>(undefined as void);
        } catch (error) {
            logger.error('Failed to update medical record', { id, error });
            if (error instanceof AppError) return failure(error.message);
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في تحديث السجل الطبي');
        }
    }

    async delete(id: string): Promise<AppResult<void>> {
        try {
            await medicalRecordRepository.delete(id);
            return success<void>(undefined as void);
        } catch (error) {
            logger.error('Failed to delete medical record', { id, error });
            if (error instanceof AppError) return failure(error.message);
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في حذف السجل الطبي');
        }
    }
}
