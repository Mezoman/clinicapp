import { serviceRepository } from '../../infrastructure/repositories/serviceRepository';
import { ClinicServiceDTO, CreateClinicServiceDTO, UpdateClinicServiceDTO } from '../dtos/service.dto';
import { AppResult, success, failure } from '../result';
import { AppError } from '../../lib/errors';

export class ClinicServiceService {
    async getServices(): Promise<AppResult<readonly ClinicServiceDTO[]>> {
        try {
            const services = await serviceRepository.getAll();
            return success(services.map(s => ({
                id: s.id,
                name: s.name,
                nameEn: s.nameEn,
                icon: s.icon,
                description: s.description,
                defaultPrice: s.defaultPrice,
                isActive: s.isActive
            })));
        } catch (error) {
            const msg = error instanceof AppError ? error.message : 'فشل في جلب الخدمات';
            return failure(msg);
        }
    }

    async createService(dto: CreateClinicServiceDTO): Promise<AppResult<ClinicServiceDTO>> {
        try {
            const service = await serviceRepository.create(dto);
            return success({
                id: service.id,
                name: service.name,
                nameEn: service.nameEn,
                icon: service.icon,
                description: service.description,
                defaultPrice: service.defaultPrice,
                isActive: service.isActive
            });
        } catch (error) {
            const msg = error instanceof AppError ? error.message : 'فشل في إنشاء الخدمة';
            return failure(msg);
        }
    }

    async updateService(id: string, dto: UpdateClinicServiceDTO): Promise<AppResult<ClinicServiceDTO>> {
        try {
            const service = await serviceRepository.update(id, dto);
            return success({
                id: service.id,
                name: service.name,
                nameEn: service.nameEn,
                icon: service.icon,
                description: service.description,
                defaultPrice: service.defaultPrice,
                isActive: service.isActive
            });
        } catch (error) {
            const msg = error instanceof AppError ? error.message : 'فشل في تحديث الخدمة';
            return failure(msg);
        }
    }

    async deleteService(id: string): Promise<AppResult<void>> {
        try {
            await serviceRepository.delete(id);
            return success(undefined);
        } catch (error) {
            const msg = error instanceof AppError ? error.message : 'فشل في حذف الخدمة';
            return failure(msg);
        }
    }
}
