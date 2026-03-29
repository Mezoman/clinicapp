// src/application/services/__tests__/SlotLockService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlotLockService } from '../SlotLockService';
import { slotLockRepository } from '../../../infrastructure/repositories/slotLockRepository';

vi.mock('../../../infrastructure/repositories/slotLockRepository', () => ({
    slotLockRepository: {
        acquireLock: vi.fn(),
        renewLock: vi.fn(),
        releaseLock: vi.fn(),
    }
}));

describe('SlotLockService', () => {
    let service: SlotLockService;

    beforeEach(() => {
        vi.clearAllMocks();
        service = new SlotLockService();
    });

    describe('acquireLock()', () => {
        it('يجب أن يحجز الموعد بنجاح', async () => {
            vi.mocked(slotLockRepository.acquireLock).mockResolvedValue({ id: 'l1', error: null });
            const result = await service.acquireLock('k1', 's1');
            expect(result.success).toBe(true);
        });

        it('يجب أن يعيد failure إذا وجد خطأ في الـ repo', async () => {
            vi.mocked(slotLockRepository.acquireLock).mockResolvedValue({ id: '', error: { message: 'taken' } } as any);
            const result = await service.acquireLock('k1', 's1');
            expect(result.success).toBe(false);
        });

        it('يجب أن يمسك الاستثناءات', async () => {
            vi.mocked(slotLockRepository.acquireLock).mockRejectedValue(new Error('fatal'));
            const result = await service.acquireLock('k1', 's1');
            expect(result.success).toBe(false);
        });
    });

    describe('renewLock()', () => {
        it('يجب أن يجدد الحجز', async () => {
            vi.mocked(slotLockRepository.renewLock).mockResolvedValue(undefined);
            const result = await service.renewLock('k1', 's1');
            expect(result.success).toBe(true);
        });

        it('يجب أن يمسك الاستثناءات', async () => {
            vi.mocked(slotLockRepository.renewLock).mockRejectedValue(new Error('fatal'));
            const result = await service.renewLock('k1', 's1');
            expect(result.success).toBe(false);
        });
    });

    describe('releaseLock()', () => {
        it('يجب أن يلغي الحجز', async () => {
            vi.mocked(slotLockRepository.releaseLock).mockResolvedValue(undefined);
            const result = await service.releaseLock('k1', 's1');
            expect(result.success).toBe(true);
        });

        it('يجب أن يمسك الاستثناءات', async () => {
            vi.mocked(slotLockRepository.releaseLock).mockRejectedValue(new Error('fatal'));
            const result = await service.releaseLock('k1', 's1');
            expect(result.success).toBe(false);
        });
    });
});
