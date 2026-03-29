import { slotLockRepository } from '../../infrastructure/repositories/slotLockRepository';
import { AppResult, success, failure } from '../result';
import type { SlotLockDTO } from '../dtos/slotLock.dto';

export class SlotLockService {
    async acquireLock(lockKey: string, sessionId: string): Promise<AppResult<SlotLockDTO>> {
        try {
            const { id, error } = await slotLockRepository.acquireLock(lockKey, sessionId);
            if (error) return failure(error.message);

            return success({
                id,
                lockKey,
                sessionId,
                expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString() // Matching repo logic
            });
        } catch (error) {
            return failure('فشل في حجز الموعد');
        }
    }

    async renewLock(lockKey: string, sessionId: string): Promise<AppResult<void>> {
        try {
            await slotLockRepository.renewLock(lockKey, sessionId);
            return success(undefined);
        } catch (error) {
            return failure('فشل في تجديد الحجز');
        }
    }

    async releaseLock(lockKey: string, sessionId: string): Promise<AppResult<void>> {
        try {
            await slotLockRepository.releaseLock(lockKey, sessionId);
            return success(undefined);
        } catch (error) {
            return failure('فشل في إلغاء الحجز');
        }
    }
}
