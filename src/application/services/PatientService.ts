import { patientRepository } from '../../infrastructure/repositories/patientRepository';
import { PatientMapper } from '../mappers/patient.mapper';
import { PatientDTO, PatientsQueryParamsDTO, PatientsResultDTO, PatientFormDataDTO } from '../dtos/patient.dto';
import { AppResult, success, failure } from '../result';
import { DomainError } from '../../domain/errors';
import { mapDomainErrorToUIMessage } from '../mappers/error.mapper';
import { logger } from '../../utils/logger';
import type { Patient } from '../../domain/models';

export class PatientService {
    async getById(id: string): Promise<AppResult<PatientDTO | null>> {
        try {
            const patient = await patientRepository.getById(id);
            if (!patient) return success(null);
            return success(PatientMapper.toDTO(patient));
        } catch (error) {
            logger.error('Failed to get patient by id', { id, error });
            if (error instanceof DomainError) {
                return failure(mapDomainErrorToUIMessage(error));
            }
            return failure('فشل في جلب بيانات المريض');
        }
    }

    async getPatients(params?: PatientsQueryParamsDTO): Promise<AppResult<PatientsResultDTO>> {
        try {
            const repoParams: { page?: number; pageSize?: number; query?: string; isActive?: boolean } = {};
            if (params?.page !== undefined) repoParams.page = params.page;
            if (params?.pageSize !== undefined) repoParams.pageSize = params.pageSize;
            if (params?.search !== undefined) repoParams.query = params.search;
            if (params?.isActive !== undefined) repoParams.isActive = params.isActive;
            const result = await patientRepository.getPatients(repoParams);
            const pageSize = params?.pageSize || 10;
            return success({
                patients: PatientMapper.toDTOList(result.patients),
                page: params?.page || 1,
                totalPages: Math.ceil(result.total / pageSize),
                totalCount: result.total,
                hasMore: (params?.page || 1) * pageSize < result.total
            });
        } catch (error) {
            logger.error('Failed to get patients list', { error });
            if (error instanceof DomainError) {
                return failure(mapDomainErrorToUIMessage(error));
            }
            return failure('فشل في جلب قائمة المرضى');
        }
    }

    async create(dto: Partial<PatientFormDataDTO>): Promise<AppResult<PatientDTO>> {
        try {
            const domainData: Partial<Patient> = {
                ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.nationalId !== undefined && { nationalId: dto.nationalId }),
                ...(dto.birthDate !== undefined && { birthDate: dto.birthDate }),
                ...(dto.gender !== undefined && { gender: dto.gender }),
                ...(dto.address !== undefined && { address: dto.address }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.bloodType !== undefined && { bloodType: dto.bloodType }),
                ...(dto.allergies !== undefined && { allergies: dto.allergies }),
                ...(dto.chronicDiseases !== undefined && { chronicDiseases: dto.chronicDiseases }),
                ...(dto.currentMedications !== undefined && { currentMedications: dto.currentMedications }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            };

            const patient = await patientRepository.create(domainData);
            return success(PatientMapper.toDTO(patient));
        } catch (error) {
            logger.error('Failed to create patient', { error });
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في إضافة المريض');
        }
    }

    async update(id: string, dto: Partial<PatientFormDataDTO>): Promise<AppResult<void>> {
        try {
            const domainData: Partial<Patient> = {
                ...(dto.fullName !== undefined && { fullName: dto.fullName }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.nationalId !== undefined && { nationalId: dto.nationalId }),
                ...(dto.birthDate !== undefined && { birthDate: dto.birthDate }),
                ...(dto.gender !== undefined && { gender: dto.gender }),
                ...(dto.address !== undefined && { address: dto.address }),
                ...(dto.email !== undefined && { email: dto.email }),
                ...(dto.bloodType !== undefined && { bloodType: dto.bloodType }),
                ...(dto.allergies !== undefined && { allergies: dto.allergies }),
                ...(dto.chronicDiseases !== undefined && { chronicDiseases: dto.chronicDiseases }),
                ...(dto.currentMedications !== undefined && { currentMedications: dto.currentMedications }),
                ...(dto.notes !== undefined && { notes: dto.notes }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            };

            await patientRepository.update(id, domainData);
            return success<void>(undefined as void);
        } catch (error) {
            logger.error('Failed to update patient', { id, error });
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في تحديث المريض');
        }
    }

    async delete(id: string): Promise<AppResult<void>> {
        try {
            await patientRepository.delete(id);
            return success<void>(undefined as void);
        } catch (error) {
            logger.error('Failed to delete patient', { id, error });
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في حذف المريض');
        }
    }

    async findOrCreate(name: string, phone: string): Promise<AppResult<string>> {
        // ARCH-01 FIX: Expose findOrCreate through service layer so Booking.tsx
        // doesn't need to import patientRepository directly
        try {
            const patientId = await patientRepository.findOrCreate(name, phone);
            return success(patientId);
        } catch (error) {
            logger.error('Failed to findOrCreate patient', { error });
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في معالجة بيانات المريض');
        }
    }
}
