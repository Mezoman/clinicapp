import { supabase } from '../clients/supabase';
import { serializeAuditValues, type AuditAction } from '../contracts/audit.contract';
import { parseLogAuditTrailResponse } from '../contracts/rpc.contract';
import { logger } from '../../utils/logger';

export const auditRepository = {
    async logAudit(
        userId: string,
        userEmail: string,
        userRole: string,
        action: AuditAction,
        entityType: string,
        entityId: string,
        oldValues?: unknown,
        newValues?: unknown,
        reason?: string
    ): Promise<void> {
        try {
            const result = await supabase.rpc('log_audit_trail', {
                p_user_id: userId,
                p_user_email: userEmail,
                p_user_role: userRole,
                p_action: action,
                p_entity_type: entityType,
                p_entity_id: entityId,
                p_old_values: serializeAuditValues(oldValues),
                p_new_values: serializeAuditValues(newValues),
                ...(reason ? { p_reason: reason } : {})
            });

            const { error, data } = result;

            if (!error) {
                parseLogAuditTrailResponse(data);
            }

            if (error) {
                logger.error('[AuditRepository] Failed to log audit:', error as Error);
                // We don't throw here to avoid breaking the UI flow, as per useAuditLog design
            }
        } catch (err: any) {
            // Silently log a warning for RPC 404 or other network errors and return early
            logger.warn('[AuditRepository] Could not execute log_audit_trail RPC. It may not be deployed. Skipping.', err);
        }
    }
};
