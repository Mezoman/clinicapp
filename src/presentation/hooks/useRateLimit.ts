import { useState, useEffect, useCallback } from 'react';

interface RateLimitEntry {
    attempts: number[];
    lockUntil?: number | undefined;
    totalViolations: number;
}


// بصمة بسيطة للجهاز تصعّب التحايل بالـ incognito
function getDeviceFingerprint(): string {
    const nav = window.navigator;
    const screen = window.screen;
    const raw = [
        nav.language,
        nav.hardwareConcurrency,
        screen.colorDepth,
        screen.width,
        screen.height,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
    ].join('|');

    // Hash بسيط (djb2)
    let hash = 5381;
    for (let i = 0; i < raw.length; i++) {
        hash = ((hash << 5) + hash) ^ raw.charCodeAt(i);
    }
    return Math.abs(hash).toString(36);
}

function getStorageKey(action: string): string {
    // ربط الـ key ببصمة الجهاز يصعّب التحايل
    const fp = getDeviceFingerprint();
    return `rl_${action}_${fp}`;
}

function getEntry(key: string): RateLimitEntry {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return { attempts: [], totalViolations: 0 };
        return JSON.parse(raw) as RateLimitEntry;
    } catch {
        return { attempts: [], totalViolations: 0 };
    }
}

function saveEntry(key: string, entry: RateLimitEntry): void {
    try {
        localStorage.setItem(key, JSON.stringify(entry));
    } catch {
        // localStorage ممتلئ أو محجوب — نستمر بدون حفظ
    }
}

// Exponential backoff: كلما زادت المخالفات، زاد وقت الحظر
function getLockDuration(totalViolations: number, baseLimitMs: number): number {
    const multiplier = Math.pow(2, Math.min(totalViolations - 1, 6)); // max 64×
    return Math.min(baseLimitMs * multiplier, 60 * 60 * 1000); // حد أقصى ساعة
}

export function useRateLimit(
    action: string,
    limitMs: number = 60000,
    maxAttempts: number = 3
) {
    const [isLimited, setIsLimited] = useState<boolean>(false);
    const [timeLeft, setTimeLeft] = useState<number>(0);
    const storageKey = getStorageKey(action);

    const checkLimit = useCallback((): boolean => {
        const entry = getEntry(storageKey);
        const now = Date.now();

        // تحقق من Hard Lock (بسبب تجاوزات متعددة)
        if (entry.lockUntil && now < entry.lockUntil) {
            setIsLimited(true);
            setTimeLeft(Math.ceil((entry.lockUntil - now) / 1000));
            return true;
        }

        // تنظيف المحاولات القديمة
        const validAttempts = entry.attempts.filter(t => now - t < limitMs);

        if (validAttempts.length >= maxAttempts) {
            setIsLimited(true);
            const oldest = validAttempts[0] ?? now;
            setTimeLeft(Math.ceil((limitMs - (now - oldest)) / 1000));
            return true;
        }

        setIsLimited(false);
        setTimeLeft(0);
        return false;
    }, [storageKey, limitMs, maxAttempts]);

    const registerAction = useCallback(() => {
        const entry = getEntry(storageKey);
        const now = Date.now();

        const validAttempts = entry.attempts.filter(t => now - t < limitMs);
        validAttempts.push(now);

        // إذا تجاوز الـ maxAttempts، نطبق Exponential backoff
        let newLockUntil = entry.lockUntil;
        let newViolations = entry.totalViolations;

        if (validAttempts.length >= maxAttempts) {
            newViolations = (entry.totalViolations || 0) + 1;
            const lockDuration = getLockDuration(newViolations, limitMs);
            newLockUntil = now + lockDuration;
        }

        saveEntry(storageKey, {
            attempts: validAttempts,
            lockUntil: newLockUntil,
            totalViolations: newViolations,
        });

        checkLimit();
    }, [storageKey, limitMs, maxAttempts, checkLimit]);

    // إعادة تعيين الـ limit (للاستخدام بعد نجاح تسجيل الدخول)
    const resetLimit = useCallback(() => {
        try {
            localStorage.removeItem(storageKey);
        } catch { /* تجاهل */ }
        setIsLimited(false);
        setTimeLeft(0);
    }, [storageKey]);

    useEffect(() => {
        checkLimit();
        if (!isLimited) return;

        const interval = setInterval(() => {
            const isStillLimited = checkLimit();
            if (!isStillLimited) clearInterval(interval);
        }, 1000);

        return () => clearInterval(interval);
    }, [isLimited, checkLimit]);

    return { checkLimit, registerAction, resetLimit, isLimited, timeLeft };
}
