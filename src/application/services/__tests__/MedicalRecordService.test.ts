// src/application/services/__tests__/MedicalRecordService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MedicalRecordService } from '../MedicalRecordService';
import { medicalRecordRepository } from '../../../infrastructure/repositories/medicalRecordRepository';
import { DomainError } from '../../../domain/errors';

vi.mock('../../../infrastructure/repositories/medicalRecordRepository', () => ({
    medicalRecordRepository: {
        getByPatientId: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    }
}));

vi.mock('../../../utils/logger', () => ({
    logger: { error: vi.fn() }
}));

describe('MedicalRecordService', () => {
    let service: MedicalRecordService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new MedicalRecordService();
    });

    it('getByPatientId() يجب أن يعيد قائمة السجلات', async () => {
        vi.mocked(medicalRecordRepository.getByPatientId).mockResolvedValue([]);
        const result = await service.getByPatientId('p1');
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toEqual([]);
    });

    it('create() يجب أن ينفذ repo ويحول البيانات بنجاح', async () => {
        const dto = { patientId: 'p1', chiefComplaint: 'Pain' } as any;
        vi.mocked(medicalRecordRepository.create).mockResolvedValue({ id: 'm1', ...dto });
        const result = await service.create(dto);
        expect(result.success).toBe(true);
        expect(medicalRecordRepository.create).toHaveBeenCalled();
    });

    it('create() يجب أن يتعامل مع teethChart فارغ أو بسيط', async () => {
        const dto = { patientId: 'p1', teethChart: { '11': { status: 'healthy' } } } as any;
        vi.mocked(medicalRecordRepository.create).mockResolvedValue({ id: 'm1' } as any);
        await service.create(dto);
        expect(medicalRecordRepository.create).toHaveBeenCalledWith(expect.objectContaining({
            teethChart: { '11': { status: 'healthy' } }
        }));
    });

    it('update() يجب أن ينادي repo', async () => {
        vi.mocked(medicalRecordRepository.update).mockResolvedValue({ id: 'm1' } as any);
        const result = await service.update('m1', { chiefComplaint: 'New' });
        expect(result.success).toBe(true);
    });

    it('delete() يجب أن ينادي repo', async () => {
        vi.mocked(medicalRecordRepository.delete).mockResolvedValue(undefined);
        const result = await service.delete('m1');
        expect(result.success).toBe(true);
    });

    describe('Error Handling', () => {
        it('getByPatientId() يجب أن يمسك أخطاء DomainError', async () => {
            vi.mocked(medicalRecordRepository.getByPatientId).mockRejectedValue(new DomainError('INVALID_OPERATION', 'err'));
            const result = await service.getByPatientId('p1');
            expect(result.success).toBe(false);
        });

        it('create() يجب أن يمسك الأخطاء العادية', async () => {
            vi.mocked(medicalRecordRepository.create).mockRejectedValue(new Error('fail'));
            const result = await service.create({} as any);
            expect(result.success).toBe(false);
        });

        it('update() يجب أن يمسك الأخطاء', async () => {
            vi.mocked(medicalRecordRepository.update).mockRejectedValue(new Error('fail'));
            const result = await service.update('m1', {});
            expect(result.success).toBe(false);
        });

        it('delete() يجب أن يمسك الأخطاء', async () => {
            vi.mocked(medicalRecordRepository.delete).mockRejectedValue(new Error('fail'));
            const result = await service.delete('m1');
            expect(result.success).toBe(false);
        });
    });
});
