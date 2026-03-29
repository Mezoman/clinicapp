import { BillingService } from './services/BillingService';
import { AppointmentService } from './services/AppointmentService';
import { PatientService } from './services/PatientService';
import { MedicalRecordService } from './services/MedicalRecordService';
import { SettingsService } from './services/SettingsService';
import { CmsService } from './services/CmsService';
import { DashboardService } from './services/DashboardService';
import { AuditService } from './services/AuditService';
import { SlotLockService } from './services/SlotLockService';
import { ClinicServiceService } from './services/ClinicServiceService';

/**
 * Application Container with Lazy Initialization.
 * Centralizes the instantiation of application services and use cases.
 * Services are only created when first accessed, improving startup performance.
 */

let _billingService: BillingService | null = null;
let _appointmentService: AppointmentService | null = null;
let _patientService: PatientService | null = null;
let _medicalRecordService: MedicalRecordService | null = null;
let _settingsService: SettingsService | null = null;
let _cmsService: CmsService | null = null;
let _dashboardService: DashboardService | null = null;
let _auditService: AuditService | null = null;
let _slotLockService: SlotLockService | null = null;
let _clinicServiceService: ClinicServiceService | null = null;

export const app = {
    get billingService() {
        if (!_billingService) _billingService = new BillingService();
        return _billingService;
    },
    get appointmentService() {
        if (!_appointmentService) _appointmentService = new AppointmentService();
        return _appointmentService;
    },
    get patientService() {
        if (!_patientService) _patientService = new PatientService();
        return _patientService;
    },
    get medicalRecordService() {
        if (!_medicalRecordService) _medicalRecordService = new MedicalRecordService();
        return _medicalRecordService;
    },
    get settingsService() {
        if (!_settingsService) _settingsService = new SettingsService();
        return _settingsService;
    },
    get cmsService() {
        if (!_cmsService) _cmsService = new CmsService();
        return _cmsService;
    },
    get dashboardService() {
        if (!_dashboardService) _dashboardService = new DashboardService();
        return _dashboardService;
    },
    get auditService() {
        if (!_auditService) _auditService = new AuditService();
        return _auditService;
    },
    get slotLockService() {
        if (!_slotLockService) _slotLockService = new SlotLockService();
        return _slotLockService;
    },
    get clinicServiceService() {
        if (!_clinicServiceService) _clinicServiceService = new ClinicServiceService();
        return _clinicServiceService;
    }
};

// Deprecated: Use the 'app' singleton directly
export function createApplicationContainer() {
    return app;
}
