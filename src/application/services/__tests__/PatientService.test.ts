import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PatientService } from '../PatientService';
import { patientRepository } from '../../../infrastructure/repositories/patientRepository';
import { DomainError } from '../../../domain/errors';
import type { Patient } from '../../../domain/models';

vi.mock('../../../infrastructure/repositories/patientRepository', () => ({
    patientRepository: {
        getById: vi.fn(),
        getPatients: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    }
}));
vi.mock('../../../utils/logger', () => ({
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
}));

const mockPatient: Patient = {
    id: 'p1', fullName: 'محمد أحمد', phone: '01012345678', gender: 'male',
    nationalId: undefined, birthDate: '1990-05-15', address: 'القاهرة',
    email: 'mo@test.com', bloodType: 'O+', allergies: undefined,
    chronicDiseases: undefined, currentMedications: undefined, notes: undefined,
    firstVisitDate: undefined, lastVisitDate: undefined,
    totalVisits: 3, totalPaid: 900, balance: 100,
    isActive: true, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z'
};

describe('PatientService.getById()', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب إرجاع مريض موجود كـ DTO', async () => {
        vi.mocked(patientRepository.getById).mockResolvedValue(mockPatient);
        const service = new PatientService();
        const result = await service.getById('p1');

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data?.id).toBe('p1');
            expect(result.data?.fullName).toBe('محمد أحمد');
        }
    });

    it('يجب إرجاع null إذا لم يوجد المريض', async () => {
        vi.mocked(patientRepository.getById).mockResolvedValue(null);
        const service = new PatientService();
        const result = await service.getById('non-existent');

        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toBeNull();
    });

    it('يجب إرجاع failure عند خطأ DB', async () => {
        vi.mocked(patientRepository.getById).mockRejectedValue(new Error('DB error'));
        const service = new PatientService();
        const result = await service.getById('p1');

        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain('فشل');
    });

    it('يجب إرجاع رسالة DomainError عربية', async () => {
        vi.mocked(patientRepository.getById).mockRejectedValue(
            new DomainError('INVALID_OPERATION', 'Invalid')
        );
        const service = new PatientService();
        const result = await service.getById('p1');
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain('غير مسموح');
    });
});

describe('PatientService.getPatients()', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب إرجاع قائمة مرضى مع pagination صحيح', async () => {
        vi.mocked(patientRepository.getPatients).mockResolvedValue({
            patients: [mockPatient, { ...mockPatient, id: 'p2' }],
            total: 15
        });
        const service = new PatientService();
        const result = await service.getPatients({ page: 1, pageSize: 10 });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.patients).toHaveLength(2);
            expect(result.data.totalCount).toBe(15);
            expect(result.data.totalPages).toBe(2); // Math.ceil(15/10) = 2
            expect(result.data.hasMore).toBe(true);  // 1*10 < 15
        }
    });

    it('يجب حساب hasMore = false للصفحة الأخيرة', async () => {
        vi.mocked(patientRepository.getPatients).mockResolvedValue({
            patients: [mockPatient],
            total: 5
        });
        const service = new PatientService();
        const result = await service.getPatients({ page: 1, pageSize: 10 });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.hasMore).toBe(false); // 1*10 > 5
        }
    });

    it('يجب تمرير معاملات البحث والتصفية للـ repository', async () => {
        vi.mocked(patientRepository.getPatients).mockResolvedValue({ patients: [], total: 0 });
        const service = new PatientService();
        await service.getPatients({ search: 'محمد', isActive: true, page: 2, pageSize: 5 });

        expect(patientRepository.getPatients).toHaveBeenCalledWith({
            query: 'محمد', isActive: true, page: 2, pageSize: 5
        });
    });

    it('يجب إرجاع failure عند خطأ DB', async () => {
        vi.mocked(patientRepository.getPatients).mockRejectedValue(new Error('timeout'));
        const service = new PatientService();
        const result = await service.getPatients();
        expect(result.success).toBe(false);
    });
});

describe('PatientService.create()', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب إنشاء مريض جديد بنجاح', async () => {
        vi.mocked(patientRepository.create).mockResolvedValue(mockPatient);
        const service = new PatientService();
        const result = await service.create({
            fullName: 'محمد أحمد',
            phone: '01012345678',
            gender: 'male',
            isActive: true
        });

        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.fullName).toBe('محمد أحمد');
        }
    });

    it('يجب إرجاع failure عند خطأ إنشاء المريض', async () => {
        vi.mocked(patientRepository.create).mockRejectedValue(new Error('unique constraint'));
        const service = new PatientService();
        const result = await service.create({ fullName: 'محمد', phone: '01012345678', gender: 'male' });
        expect(result.success).toBe(false);
    });
});

describe('PatientService.update()', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب تحديث بيانات مريض بنجاح', async () => {
        vi.mocked(patientRepository.update).mockResolvedValue(undefined);
        const service = new PatientService();
        const result = await service.update('p1', { fullName: 'محمد محدّث', phone: '01098765432' });

        expect(result.success).toBe(true);
        expect(patientRepository.update).toHaveBeenCalledWith('p1', {
            fullName: 'محمد محدّث',
            phone: '01098765432'
        });
    });

    it('يجب إرجاع failure عند خطأ التحديث', async () => {
        vi.mocked(patientRepository.update).mockRejectedValue(new Error('not found'));
        const service = new PatientService();
        const result = await service.update('p1', { fullName: 'محمد' });
        expect(result.success).toBe(false);
    });

    it('يجب تجاهل الحقول غير المُرسَلة (undefined)', async () => {
        vi.mocked(patientRepository.update).mockResolvedValue(undefined);
        const service = new PatientService();
        await service.update('p1', { fullName: 'محمد' }); // phone غير موجود

        // يجب أن لا يتضمن phone في الكائن المُمرَّر
        expect(patientRepository.update).toHaveBeenCalledWith('p1', { fullName: 'محمد' });
    });
});

describe('PatientService.delete()', () => {
    beforeEach(() => vi.clearAllMocks());

    it('يجب حذف مريض بنجاح', async () => {
        vi.mocked(patientRepository.delete).mockResolvedValue(undefined);
        const service = new PatientService();
        const result = await service.delete('p1');

        expect(result.success).toBe(true);
        expect(patientRepository.delete).toHaveBeenCalledWith('p1');
    });

    it('يجب إرجاع failure عند خطأ الحذف', async () => {
        vi.mocked(patientRepository.delete).mockRejectedValue(new Error('foreign key constraint'));
        const service = new PatientService();
        const result = await service.delete('p1');

        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toContain('فشل');
    });
});
