// src/application/__tests__/container.test.ts
import { describe, it, expect } from 'vitest';
import { createApplicationContainer, app } from '../container';

describe('Application Container', () => {
    it('should create all services', () => {
        const container = createApplicationContainer();
        expect(container.billingService).toBeDefined();
        expect(container.appointmentService).toBeDefined();
        expect(container.patientService).toBeDefined();
        expect(container.medicalRecordService).toBeDefined();
        expect(container.settingsService).toBeDefined();
        expect(container.cmsService).toBeDefined();
        expect(container.dashboardService).toBeDefined();
        expect(container.auditService).toBeDefined();
        expect(container.slotLockService).toBeDefined();
    });

    it('should have a default app instance', () => {
        expect(app).toBeDefined();
        expect(app.billingService).toBeDefined();
    });
});
