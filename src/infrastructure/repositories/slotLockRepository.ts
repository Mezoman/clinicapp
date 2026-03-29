import { supabase } from '../clients/supabase';
import { parseSlotLock } from '../contracts/slotLock.contract';

const LOCK_DURATION_MS = 10 * 60 * 1000;   // 10 دقائق

export const slotLockRepository = {
    async renewLock(lockKey: string, sessionId: string): Promise<void> {
        await supabase
            .from('slot_locks')
            .update({
                expires_at: new Date(Date.now() + LOCK_DURATION_MS).toISOString(),
            })
            .eq('lock_key', lockKey)
            .eq('session_id', sessionId);
    },

    async acquireLock(lockKey: string, sessionId: string): Promise<{ id: string; error: Error | null }> {
        // حاول أولاً حذف أي lock منتهي لنفس الـ key
        await supabase
            .from('slot_locks')
            .delete()
            .eq('lock_key', lockKey)
            .lt('expires_at', new Date().toISOString());

        // أنشئ Lock جديد
        const { data, error: insertError } = await supabase
            .from('slot_locks')
            .insert({
                lock_key: lockKey,
                session_id: sessionId,
                expires_at: new Date(Date.now() + LOCK_DURATION_MS).toISOString(),
            })
            .select()
            .single();

        if (insertError) {
            return { id: '', error: new Error('هذا الموعد محجوز من مريض آخر حالياً') };
        }

        try {
            const validated = parseSlotLock(data);
            return { id: validated.id, error: null };
        } catch (err) {
            return { id: '', error: err instanceof Error ? err : new Error(String(err)) };
        }
    },

    async releaseLock(lockKey: string, sessionId: string): Promise<void> {
        await supabase
            .from('slot_locks')
            .delete()
            .eq('lock_key', lockKey)
            .eq('session_id', sessionId);
    }
};
