import { AuditAction } from '../../infrastructure/contracts/audit.contract';

export interface AuditLogDTO {
    id: string;
    userId: string;
    userEmail: string;
    userRole: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    oldValues?: any;
    newValues?: any;
    reason?: string;
    createdAt: string;
}
