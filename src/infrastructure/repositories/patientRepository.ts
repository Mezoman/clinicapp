import { supabase } from '../clients/supabase';
import { logger } from '../../utils/logger';
import type { Patient } from '../../domain/models';
import { AppError, ErrorCode } from '../../lib/errors';
import { parsePatient, parsePatients, parseGender, type PatientDTO } from '../contracts/patient.contract';
import { sanitize as sanitizeSearchTerm } from '../../lib/validation';
import type { ITransactionContext } from '../../application/ports/IUnitOfWork';

// FIXED: Type آمن بدلاً من Record<string, any>
interface PatientFinancialSummary {
    totalVisits: number;
    totalPaid: number;
    balance: number;
}

function isPatientFinancialSummary(data: unknown): data is PatientFinancialSummary {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
        typeof d['totalVisits'] === 'number' &&
        typeof d['totalPaid'] === 'number' &&
        typeof d['balance'] === 'number'
    );
}

export class PatientRepository {
    async getPatients(params: {
        readonly page?: number;
        readonly pageSize?: number;
        readonly query?: string;
        readonly isActive?: boolean | undefined;
    } = {}): Promise<{ readonly patients: readonly Patient[]; readonly total: number }> {
        const { page = 1, pageSize = 20, query, isActive } = params;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        // FIXED: استخدام count: 'estimated' — أسرع من 'exact' وآمن للـ authenticated users
        // 'exact' يمكن أن يسبب مشاكل مع بعض RLS configurations
        let supabaseQuery = supabase.from('patients').select('*', { count: 'estimated' });

        if (isActive !== undefined) supabaseQuery = supabaseQuery.eq('is_active', isActive);
        if (query) {
            const safeQuery = sanitizeSearchTerm(query);
            if (safeQuery) {
                supabaseQuery = supabaseQuery.or(`name.ilike.%${safeQuery}%,phone.ilike.%${safeQuery}%`);
            }
        }

        const { data, error, count } = await supabaseQuery
            .order('name', { ascending: true })
            .range(from, to);

        if (error) throw error;

        try {
            const patients = parsePatients(data).map((row) => this.mapFromDb(row));
            return {
                patients,
                total: count ?? 0  // FIXED: إرجاع count الحقيقي بدلاً من 0 دائماً
            };
        } catch (err) {
            throw new AppError('Data integrity violation in patients list', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async getById(id: string): Promise<Patient | null> {
        const { data, error } = await supabase.from('patients').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!data) return null;

        try {
            const validated = parsePatient(data);
            const patient = this.mapFromDb(validated);

            // FIXED: Fetch stats + patient في استعلام واحد عبر RPC
            const { data: statsData, error: statsError } = await supabase.rpc('get_patient_financial_summary', {
                p_patient_id: id
            });

            // FIXED: Type guard بدلاً من 'any'
            if (!statsError && isPatientFinancialSummary(statsData)) {
                return {
                    ...patient,
                    totalVisits: statsData.totalVisits,
                    totalPaid: statsData.totalPaid,
                    balance: statsData.balance,
                };
            }

            return patient;
        } catch (err) {
            throw new AppError('Data integrity violation in patient record', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async create(patient: Partial<Patient>, _tx?: ITransactionContext): Promise<Patient> {
        const client = _tx?.transaction || supabase;
        const { data, error } = await client
            .from('patients')
            .insert({
                name: patient.fullName!,
                phone: patient.phone || null,
                email: patient.email || null,
                date_of_birth: patient.birthDate || null,
                gender: patient.gender || 'male',
                address: patient.address || null,
                is_active: true,
                national_id: patient.nationalId || null,
                blood_type: patient.bloodType || null,
                allergies: patient.allergies || null,
                chronic_diseases: patient.chronicDiseases || null,
                current_medications: patient.currentMedications || null,
                notes: patient.notes || null,
            })
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new AppError('Failed to create patient', ErrorCode.INTERNAL_ERROR);

        try {
            const validated = parsePatient(data);
            return this.mapFromDb(validated);
        } catch (err) {
            throw new AppError('Data integrity violation in created patient', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async update(id: string, patient: Partial<Patient>, _tx?: ITransactionContext): Promise<void> {
        const client = _tx?.transaction || supabase;
        const updateData: Record<string, unknown> = {};

        // Helper: convert empty string to null for nullable DB columns
        const nullIfEmpty = (v: string | undefined | null) => (v === '' ? null : v);

        if (patient.fullName !== undefined) updateData['name'] = patient.fullName || null;
        if (patient.phone !== undefined)    updateData['phone'] = nullIfEmpty(patient.phone);
        // CRITICAL: date column rejects empty string — must be null or valid date
        if (patient.birthDate !== undefined) updateData['date_of_birth'] = nullIfEmpty(patient.birthDate) ?? null;
        if (patient.gender !== undefined)   updateData['gender'] = patient.gender;
        if (patient.address !== undefined)  updateData['address'] = nullIfEmpty(patient.address);
        if (patient.email !== undefined)    updateData['email'] = nullIfEmpty(patient.email);
        if (patient.isActive !== undefined) updateData['is_active'] = patient.isActive;

        // Guard: Supabase returns 400 on empty PATCH body
        if (Object.keys(updateData).length === 0) {
            logger.warn('[PatientRepository] PATCH skipped — no fields to update', { id });
            return;
        }

        logger.debug('[PatientRepository] PATCH patients', { id, fields: Object.keys(updateData) });
        const { error } = await client.from('patients').update(updateData).eq('id', id);
        if (error) throw error;
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('patients').delete().eq('id', id);
        if (error) throw error;
    }

    // FIXED: استخدام RPC الجديد find_patient_by_phone بدلاً من SELECT مباشر
    // هذا يمنع الـ anon من قراءة كل بيانات المريض
    async findByPhone(phone: string, _tx?: ITransactionContext): Promise<Patient | null> {
        const client = _tx?.transaction || supabase;

        // للمستخدمين المعتمدين (admin/staff): استخدام SELECT المباشر كما كان
        const { data, error } = await client
            .from('patients')
            .select('*')
            .eq('phone', phone)
            .eq('is_active', true)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        try {
            const validated = parsePatient(data);
            return this.mapFromDb(validated);
        } catch (err) {
            throw new AppError('Data integrity violation in patient found by phone', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    // FIXED: دالة منفصلة للـ anon (تستخدم RPC الآمن)
    async findByPhonePublic(phone: string): Promise<{ id: string; name: string } | null> {
        const { data, error } = await supabase.rpc('find_patient_by_phone', {
            p_phone: phone
        });

        if (error || !data || !Array.isArray(data) || data.length === 0) return null;

        const row = data[0] as { patient_id: string; patient_name: string };
        return { id: row.patient_id, name: row.patient_name };
    }

    /**
     * Finds or creates a patient using RPC (Security Definer).
     * Used mainly by public booking where RLS would otherwise block insert/select.
     */
    async findOrCreate(name: string, phone: string): Promise<string> {
        const { data, error } = await supabase.rpc('find_or_create_patient', {
            p_name: name,
            p_phone: phone
        });

        if (error || !data) {
            throw new AppError(
                error?.message || 'Failed to find or create patient',
                ErrorCode.INTERNAL_ERROR,
                error
            );
        }

        return data;
    }

    private mapFromDb(row: PatientDTO): Patient {
        return {
            id: row.id,
            fullName: row.name,
            phone: row.phone || '',
            nationalId: (row as any).national_id || undefined,
            birthDate: row.date_of_birth || undefined,
            gender: parseGender(row.gender),
            address: row.address || undefined,
            email: row.email || undefined,
            bloodType: (row as any).blood_type || undefined,
            allergies: (row as any).allergies || undefined,
            chronicDiseases: (row as any).chronic_diseases || undefined,
            currentMedications: (row as any).current_medications || undefined,
            notes: (row as any).notes || undefined,
            firstVisitDate: undefined,
            lastVisitDate: undefined,
            totalVisits: 0,
            totalPaid: 0,
            balance: 0,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

export const patientRepository = new PatientRepository();
