// src/application/services/__tests__/SettingsService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SettingsService } from '../SettingsService';
import { settingsRepository } from '../../../infrastructure/repositories/settingsRepository';
import { closureRepository } from '../../../infrastructure/repositories/closureRepository';
import { DomainError } from '../../../domain/errors';

vi.mock('../../../infrastructure/repositories/settingsRepository', () => ({
    settingsRepository: {
        getSettings: vi.fn(),
        updateSettings: vi.fn(),
    }
}));
vi.mock('../../../infrastructure/repositories/closureRepository', () => ({
    closureRepository: {
        getClosures: vi.fn(),
        addClosure: vi.fn(),
        deleteClosure: vi.fn(),
    }
}));
vi.mock('../../../utils/logger', () => ({
    logger: { error: vi.fn() }
}));

describe('SettingsService', () => {
    let service: SettingsService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new SettingsService();
    });

    it('getSettings() يجب أن يُرجع الإعدادات', async () => {
        vi.mocked(settingsRepository.getSettings).mockResolvedValue({ clinicName: 'Test' } as any);
        const result = await service.getSettings();
        expect(result.success).toBe(true);
    });

    it('updateSettings() يجب أن يُنادي الـ repo', async () => {
        vi.mocked(settingsRepository.updateSettings).mockResolvedValue(undefined as any);
        const result = await service.updateSettings({ clinicName: 'New' });
        expect(result.success).toBe(true);
        expect(settingsRepository.updateSettings).toHaveBeenCalled();
    });

    it('getClosures() يجب أن يُرجع قائمة الإغلاقات', async () => {
        vi.mocked(closureRepository.getClosures).mockResolvedValue([]);
        const result = await service.getClosures();
        expect(result.success).toBe(true);
    });

    it('addClosure() يجب أن ينادي repo ويحول البيانات', async () => {
        const dto: any = { startDate: '2026-01-01', endDate: '2026-01-02', reason: 'holiday' };
        vi.mocked(closureRepository.addClosure).mockResolvedValue({ id: 'c1', ...dto });
        const result = await service.addClosure(dto);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.id).toBe('c1');
    });

    it('deleteClosure() يجب أن ينادي الـ repo', async () => {
        vi.mocked(closureRepository.deleteClosure).mockResolvedValue(undefined);
        const result = await service.deleteClosure('c1');
        expect(result.success).toBe(true);
    });

    describe('Error Handling', () => {
        it('getSettings() يجب أن يتعامل مع DomainError', async () => {
            vi.mocked(settingsRepository.getSettings).mockRejectedValue(new DomainError('INVALID_OPERATION', 'err'));
            const result = await service.getSettings();
            expect(result.success).toBe(false);
        });

        it('updateSettings() يجب أن يتعامل مع Error عادي', async () => {
            vi.mocked(settingsRepository.updateSettings).mockRejectedValue(new Error('fail'));
            const result = await service.updateSettings({});
            expect(result.success).toBe(false);
        });

        it('getClosures() يجب أن يتعامل مع DomainError', async () => {
            vi.mocked(closureRepository.getClosures).mockRejectedValue(new DomainError('INVALID_OPERATION', 'err'));
            const result = await service.getClosures();
            expect(result.success).toBe(false);
        });

        it('addClosure() يجب أن يتعامل مع Error عادي', async () => {
            vi.mocked(closureRepository.addClosure).mockRejectedValue(new Error('fail'));
            const result = await service.addClosure({} as any);
            expect(result.success).toBe(false);
        });

        it('deleteClosure() يجب أن يتعامل مع DomainError', async () => {
            vi.mocked(closureRepository.deleteClosure).mockRejectedValue(new DomainError('INVALID_OPERATION', 'err'));
            const result = await service.deleteClosure('c1');
            expect(result.success).toBe(false);
        });
    });
});
