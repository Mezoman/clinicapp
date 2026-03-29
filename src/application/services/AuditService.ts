import { auditRepository } from '../../infrastructure/repositories/auditRepository';
import { AppResult, success, failure } from '../result';
import type { AuditAction } from '../../infrastructure/contracts/audit.contract';
import { logger } from '../../utils/logger';

export class AuditService {
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
    ): Promise<AppResult<void>> {
        try {
            await auditRepository.logAudit(
                userId,
                userEmail,
                userRole,
                action,
                entityType,
                entityId,
                oldValues,
                newValues,
                reason
            );
            return success(undefined);
        } catch (error) {
            logger.error('[AuditService] Failed to log audit:', error as Error);
            // We follow the repo pattern of not throwing but returning success/failure
            return failure('فشل في تسجيل العملية في سجل الأحداث');
        }
    }
}
