import { supabase } from '../clients/supabase';
import type { MedicalRecord, ToothChartEntry } from '../../domain/models';
import { AppError, ErrorCode } from '../../lib/errors';
import { parseMedicalRecord, parseMedicalRecords, parseTeethChart, serializeTeethChart, type MedicalRecordDTO } from '../contracts/medicalRecord.contract';

export class MedicalRecordRepository {
    async getByPatientId(patientId: string): Promise<readonly MedicalRecord[]> {
        const { data, error } = await supabase
            .from('medical_records')
            .select('*')
            .eq('patient_id', patientId)
            .order('visit_date', { ascending: false });

        if (error) throw error;

        try {
            const validated = parseMedicalRecords(data);
            return validated.map((row) => this.mapFromDb(row));
        } catch (err) {
            throw new AppError('Data integrity violation in medical records list', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async getById(id: string): Promise<MedicalRecord | null> {
        const { data, error } = await supabase
            .from('medical_records')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) throw error;
        if (!data) return null;

        try {
            const validated = parseMedicalRecord(data);
            return this.mapFromDb(validated);
        } catch (err) {
            throw new AppError('Data integrity violation in medical record', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async create(record: Partial<MedicalRecord>): Promise<MedicalRecord> {
        const visitDate = record.visitDate || new Date().toISOString().split('T')[0];
        const teethChart = record.teethChart || {};

        const { data, error } = await supabase
            .from('medical_records')
            .insert({
                patient_id: record.patientId!,
                visit_date: visitDate || null,
                chief_complaint: record.chiefComplaint || '',
                diagnosis: record.diagnosis || '',
                treatment_done: record.treatmentDone || '',
                teeth_chart: serializeTeethChart(teethChart),
                appointment_id: record.appointmentId || null,
                treatment_plan: record.treatmentPlan || null,
                prescription: record.prescription || null,
                xray_report: record.xrayReport || null,
                lab_report: record.labReport || null,
                doctor_notes: record.doctorNotes || null,
                follow_up_date: record.followUpDate || null,
            })
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new AppError('Failed to create medical record', ErrorCode.INTERNAL_ERROR);

        try {
            const validated = parseMedicalRecord(data);
            return this.mapFromDb(validated);
        } catch (err) {
            throw new AppError('Data integrity violation in created medical record', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async update(id: string, record: Partial<MedicalRecord>): Promise<void> {
        const updateData: Record<string, unknown> = {};
        if (record.chiefComplaint !== undefined) updateData.chief_complaint = record.chiefComplaint;
        if (record.diagnosis !== undefined) updateData.diagnosis = record.diagnosis;
        if (record.treatmentDone !== undefined) updateData.treatment_done = record.treatmentDone;
        if (record.treatmentPlan !== undefined) updateData.treatment_plan = record.treatmentPlan;
        if (record.teethChart !== undefined) {
            updateData.teeth_chart = serializeTeethChart(record.teethChart);
        }
        if (record.prescription !== undefined) updateData.prescription = record.prescription;
        if (record.xrayReport !== undefined) updateData.xray_report = record.xrayReport;
        if (record.labReport !== undefined) updateData.lab_report = record.labReport;
        if (record.doctorNotes !== undefined) updateData.doctor_notes = record.doctorNotes;
        if (record.followUpDate !== undefined) updateData.follow_up_date = record.followUpDate;

        const { error } = await supabase
            .from('medical_records')
            .update(updateData)
            .eq('id', id);

        if (error) throw error;
    }

    async delete(id: string): Promise<void> {
        const { error } = await supabase.from('medical_records').delete().eq('id', id);
        if (error) throw error;
    }

    private mapFromDb(row: MedicalRecordDTO): MedicalRecord {
        const rawChart = row.teeth_chart;
        // Safe: narrowed from Database Json to specific ToothChartEntry domain record
        const teethChartDto = parseTeethChart(rawChart);
        const teethChart: Record<string, ToothChartEntry> = {};

        Object.entries(teethChartDto).forEach(([key, value]) => {
            const entry: ToothChartEntry = {
                status: value.status,
                ...(value.notes ? { notes: value.notes } : {})
            };
            teethChart[key] = entry;
        });

        return {
            id: row.id,
            patientId: row.patient_id,
            appointmentId: row.appointment_id ?? undefined,
            visitDate: row.visit_date || '',
            chiefComplaint: row.chief_complaint || '',
            diagnosis: row.diagnosis || '',
            treatmentDone: row.treatment_done || '',
            treatmentPlan: row.treatment_plan ?? undefined,
            teethChart: teethChart ?? undefined,
            prescription: row.prescription ?? undefined,
            xrayReport: row.xray_report ?? undefined,
            labReport: row.lab_report ?? undefined,
            doctorNotes: row.doctor_notes ?? undefined,
            followUpDate: row.follow_up_date ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    }
}

export const medicalRecordRepository = new MedicalRecordRepository();
