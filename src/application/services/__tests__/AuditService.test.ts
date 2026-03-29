// src/application/services/__tests__/AuditService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditService } from '../AuditService';
import { auditRepository } from '../../../infrastructure/repositories/auditRepository';

vi.mock('../../../infrastructure/repositories/auditRepository', () => ({
    auditRepository: {
        logAudit: vi.fn(),
    }
}));

describe('AuditService.logAudit()', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب تسجيل الحدث بنجاح', async () => {
        vi.mocked(auditRepository.logAudit).mockResolvedValue(undefined);
        const service = new AuditService();
        const result = await service.logAudit(
            'u1', 'test@test.com', 'admin', 'create', 'patient', 'p1'
        );

        expect(result.success).toBe(true);
        expect(auditRepository.logAudit).toHaveBeenCalledWith(
            'u1', 'test@test.com', 'admin', 'create', 'patient', 'p1',
            undefined, undefined, undefined
        );
    });

    it('يجب إرجاع failure عند فشل التسجيل', async () => {
        vi.mocked(auditRepository.logAudit).mockRejectedValue(new Error('DB error'));
        const service = new AuditService();
        const result = await service.logAudit(
            'u1', 'test@test.com', 'admin', 'create', 'patient', 'p1'
        );

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toContain('فشل');
        }
    });
});
