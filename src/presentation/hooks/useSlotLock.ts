import { useState, useRef, useCallback, useEffect } from 'react';
import { app } from '../../application/container';

const RENEW_INTERVAL_MS = 8 * 60 * 1000;   // تجديد كل 8 دقائق

interface SlotLockResult {
    lockId: string | null;
    isLocking: boolean;
    error: string | null;
    acquireLock: (date: string, time: string) => Promise<boolean>;
    releaseLock: () => Promise<void>;
}

export function useSlotLock(sessionId: string): SlotLockResult {
    const [lockId, setLockId] = useState<string | null>(null);
    const [isLocking, setIsLocking] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const currentLockKey = useRef<string | null>(null);
    const renewTimer = useRef<ReturnType<typeof setInterval> | null>(null);

    // تنظيف المؤقت عند unmount أو عند تغيره
    useEffect(() => {
        return () => {
            if (renewTimer.current) {
                clearInterval(renewTimer.current);
                renewTimer.current = null;
            }
        };
    }, []);

    // دالة لتجديد الـ lock تلقائياً قبل انتهائه
    const startRenewTimer = useCallback((lockKey: string) => {
        if (renewTimer.current) {
            clearInterval(renewTimer.current);
            renewTimer.current = null;
        }

        renewTimer.current = setInterval(async () => {
            try {
                await app.slotLockService.renewLock(lockKey, sessionId);
            } catch {
                // الـ lock ربما انتهى أو حُذف
            }
        }, RENEW_INTERVAL_MS);
    }, [sessionId]);

    const acquireLock = useCallback(async (date: string, time: string): Promise<boolean> => {
        setIsLocking(true);
        setError(null);

        const lockKey = `${date}_${time}`;

        try {
            const result = await app.slotLockService.acquireLock(lockKey, sessionId);

            if (!result.success) {
                // الـ slot محجوز من شخص آخر
                setError(result.error);
                return false;
            }

            setLockId(result.data.id);
            currentLockKey.current = lockKey;
            startRenewTimer(lockKey);
            return true;

        } catch {
            setError('حدث خطأ في حجز الوقت، يرجى المحاولة مرة أخرى');
            return false;
        } finally {
            setIsLocking(false);
        }
    }, [sessionId, startRenewTimer]);

    const releaseLock = useCallback(async () => {
        if (renewTimer.current) {
            clearInterval(renewTimer.current);
            renewTimer.current = null;
        }
        if (!currentLockKey.current) return;

        try {
            await app.slotLockService.releaseLock(currentLockKey.current, sessionId);
        } finally {
            setLockId(null);
            currentLockKey.current = null;
        }
    }, [sessionId]);

    return { lockId, isLocking, error, acquireLock, releaseLock };
}
