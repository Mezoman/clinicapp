import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ClinicServiceService } from '../ClinicServiceService';
import { serviceRepository } from '../../../infrastructure/repositories/serviceRepository';
import { AppError, ErrorCode } from '../../../lib/errors';

vi.mock('../../../infrastructure/repositories/serviceRepository');

describe('ClinicServiceService', () => {
    let service: ClinicServiceService;

    beforeEach(() => {
        service = new ClinicServiceService();
        vi.clearAllMocks();
    });

    it('should get all services successfully', async () => {
        const mockDbService = {
            id: '1',
            name: 'Test Service',
            nameEn: 'Test Service En',
            icon: 'Activity',
            description: 'desc',
            defaultPrice: 100,
            isActive: true,
            createdAt: '2026-03-24T00:00:00Z',
            updatedAt: '2026-03-24T00:00:00Z'
        };
        vi.mocked(serviceRepository.getAll).mockResolvedValue([mockDbService]);

        const result = await service.getServices();
        expect(result.success).toBe(true);
        if (result.success && result.data) {
            expect(result.data).toHaveLength(1);
            expect(result.data[0]?.id).toBe('1');
            expect(result.data[0]?.name).toBe('Test Service');
        }
    });

    it('should return failure if repository throws on getAll', async () => {
        vi.mocked(serviceRepository.getAll).mockRejectedValue(new AppError('DB Error', ErrorCode.INTERNAL_ERROR));
        const result = await service.getServices();
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe('DB Error');
        }
    });

    it('should create a service successfully', async () => {
        const dto = {
            name: 'New Service',
            nameEn: 'New Service En',
            icon: 'Activity',
            description: 'New desc',
            defaultPrice: 150,
            isActive: true
        };
        const mockDbService = {
            id: '2',
            ...dto,
            createdAt: '2026-03-24T00:00:00Z',
            updatedAt: '2026-03-24T00:00:00Z'
        };
        vi.mocked(serviceRepository.create).mockResolvedValue(mockDbService);

        const result = await service.createService(dto);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.id).toBe('2');
            expect(result.data.name).toBe('New Service');
        }
    });
});
