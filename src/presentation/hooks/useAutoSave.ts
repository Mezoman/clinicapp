import { useCallback, useEffect, useRef, useState } from 'react';

export function useAutoSave<T>(
    key: string,
    data: T,
    onSave?: (data: T) => Promise<void>,
    delay: number = 2000
) {
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const timeoutRef = useRef<number | null>(null);

    // حفظ في localStorage فورًا لأي تغيير مع إزالة الـ PHI
    useEffect(() => {
        try {
            const replacer = (key: string, value: any) => {
                const phiKeys = ['patientName', 'phone', 'nationalId', 'patientPhone', 'chiefComplaint', 'diagnosis', 'treatmentDone', 'prescription', 'doctorNotes'];
                if (phiKeys.includes(key)) return undefined;
                return value;
            };
            localStorage.setItem(key, JSON.stringify(data, replacer));
        } catch {
            // تجاهل أخطاء التخزين
        }
    }, [key, data]);

    // حفظ على السيرفر بشكل مؤجل (اختياري)
    useEffect(() => {
        if (!onSave) return;
        if (timeoutRef.current) {
            window.clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = window.setTimeout(async () => {
            setIsSaving(true);
            try {
                await onSave(data);
                setLastSaved(new Date());
            } catch {
                // يمكن لاحقًا إضافة toast هنا
            } finally {
                setIsSaving(false);
            }
        }, delay);

        return () => {
            if (timeoutRef.current) {
                window.clearTimeout(timeoutRef.current);
            }
        };
    }, [data, delay, onSave]);

    const restore = useCallback((): T | null => {
        try {
            const stored = localStorage.getItem(key);
            if (!stored) return null;
            return JSON.parse(stored) as T;
        } catch {
            return null;
        }
    }, [key]);

    const clear = useCallback(() => {
        localStorage.removeItem(key);
        setLastSaved(null);
    }, [key]);

    return { lastSaved, isSaving, restore, clear };
}

