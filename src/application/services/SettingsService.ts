import { settingsRepository } from '../../infrastructure/repositories/settingsRepository';
import { closureRepository } from '../../infrastructure/repositories/closureRepository';
import { ClinicSettingsDTO, ClosureDTO, ClosureFormDataDTO } from '../dtos/settings.dto';
import { AppResult, success, failure } from '../result';
import { DomainError } from '../../domain/errors';
import { mapDomainErrorToUIMessage } from '../mappers/error.mapper';
import { logger } from '../../utils/logger';
import type { ClinicSettings, Closure } from '../../domain/models';

export class SettingsService {
    async getSettings(): Promise<AppResult<ClinicSettingsDTO>> {
        try {
            const settings = await settingsRepository.getSettings();
            return success(settings as ClinicSettingsDTO);
        } catch (error) {
            logger.error('Failed to get settings', { error });
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في جلب الإعدادات');
        }
    }

    async updateSettings(dto: Partial<ClinicSettingsDTO>): Promise<AppResult<void>> {
        try {
            const domainData: Partial<ClinicSettings> = {
                ...(dto.clinicName !== undefined && { clinicName: dto.clinicName }),
                ...(dto.doctorName !== undefined && { doctorName: dto.doctorName }),
                ...(dto.phone !== undefined && { phone: dto.phone }),
                ...(dto.whatsapp !== undefined && { whatsapp: dto.whatsapp }),
                ...(dto.address !== undefined && { address: dto.address }),
                ...(dto.workingDays !== undefined && { workingDays: dto.workingDays }),
                ...(dto.shifts !== undefined && { shifts: dto.shifts }),
                ...(dto.slotDuration !== undefined && { slotDuration: dto.slotDuration }),
                ...(dto.isBookingEnabled !== undefined && { isBookingEnabled: dto.isBookingEnabled }),
                ...(dto.bookingAdvanceDays !== undefined && { bookingAdvanceDays: dto.bookingAdvanceDays }),
                ...(dto.maxDailyAppointments !== undefined && { maxDailyAppointments: dto.maxDailyAppointments }),
            };
            await settingsRepository.updateSettings(domainData);
            return success<void>(undefined as void);
        } catch (error) {
            logger.error('Failed to update settings', { error });
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في تحديث الإعدادات');
        }
    }

    async getClosures(): Promise<AppResult<readonly ClosureDTO[]>> {
        try {
            const closures = await closureRepository.getClosures();
            return success(closures as readonly ClosureDTO[]);
        } catch (error) {
            logger.error('Failed to get closures', { error });
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في جلب فترات الإغلاق');
        }
    }

    async addClosure(dto: ClosureFormDataDTO): Promise<AppResult<ClosureDTO>> {
        try {
            const closureData: Omit<Closure, 'id' | 'createdAt' | 'updatedAt'> = {
                startDate: dto.startDate,
                endDate: dto.endDate,
                reason: dto.reason
            };
            const closure = await closureRepository.addClosure(closureData);
            return success(closure as ClosureDTO);
        } catch (error) {
            logger.error('Failed to add closure', { error });
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في إضافة فترة الإغلاق');
        }
    }

    async deleteClosure(id: string): Promise<AppResult<void>> {
        try {
            await closureRepository.deleteClosure(id);
            return success<void>(undefined as void);
        } catch (error) {
            logger.error('Failed to delete closure', { id, error });
            if (error instanceof DomainError) return failure(mapDomainErrorToUIMessage(error));
            return failure('فشل في حذف فترة الإغلاق');
        }
    }
}
