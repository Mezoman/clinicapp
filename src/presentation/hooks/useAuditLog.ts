import { useCallback } from 'react';
import { app } from '../../application/container';
import type { AuditAction } from '../../infrastructure/contracts/audit.contract';
import { useAuth } from './useAuth';

export function useAuditLog() {
    const { user } = useAuth();

    const logAudit = useCallback(
        async (
            action: AuditAction,
            entityType: string,
            entityId: string,
            oldValues?: unknown,
            newValues?: unknown,
            reason?: string
        ) => {
            if (!user) return;

            try {
                await app.auditService.logAudit(
                    user.uid,
                    user.email,
                    user.role,
                    action,
                    entityType,
                    entityId,
                    oldValues,
                    newValues,
                    reason
                );
            } catch {
                // لا نرمي الخطأ حتى لا يكسر التطبيق؛ الـAudit مساعد فقط
            }
        },
        [user]
    );

    return { logAudit };
}

