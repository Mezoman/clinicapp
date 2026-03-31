import { supabase } from '../clients/supabase';
import { Appointment, type AppointmentProps, type AppointmentStatus } from '../../domain/models';
import { AppError, ErrorCode } from '../../lib/errors';
import {
    parseAppointment,
    parseAppointments,
    parseAppointmentType,
    parseAppointmentStatus,
    parseBookedBy,
    type AppointmentDTO
} from '../contracts/appointment.contract';
import { parseBookAppointmentResponse } from '../contracts/rpc.contract';
import type { ITransactionContext } from '../../application/ports/IUnitOfWork';
import { logger } from '../../utils/logger';

export class AppointmentRepository {
    async getAppointments(params: {
        readonly startDate?: string;
        readonly endDate?: string;
        readonly patientId?: string;
        readonly page?: number;
        readonly pageSize?: number;
        readonly activeOnly?: boolean;
    } = {}): Promise<{ readonly appointments: readonly Appointment[]; readonly total: number }> {
        const { page = 1, pageSize = 50, startDate, endDate, patientId, activeOnly } = params;
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = supabase.from('appointments').select('*, patients(name, phone)', { count: 'exact' });

        if (startDate) query = query.gte('appointment_date', startDate);
        if (endDate) query = query.lte('appointment_date', endDate);
        if (patientId) query = query.eq('patient_id', patientId);

        if (activeOnly) {
            query = query.in('status', ['pending', 'confirmed']);
        }

        const { data, error, count } = await query
            .order('appointment_date', { ascending: true })
            .order('appointment_time', { ascending: true })
            .range(from, to);

        if (error) throw error;

        try {
            const validated = parseAppointments(data);
            return {
                appointments: validated.map((row) => this.mapFromDb(row)),
                total: count || 0
            };
        } catch (err) {
            logger.error('[AppointmentRepository] Data Integrity Violation:', err as Error);
            throw new AppError('Data integrity violation in appointments list', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async getByDate(date: string, page: number = 1, pageSize: number = 50): Promise<{ readonly appointments: readonly Appointment[]; readonly total: number }> {
        return this.getAppointments({ startDate: date, endDate: date, page, pageSize });
    }

    subscribeToDay(date: string, callback: (data: readonly Appointment[]) => void): () => void {
        const channel = supabase
            .channel(`appointments-day-${date}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'appointments',
                    filter: `appointment_date=eq.${date}`
                },
                async () => {
                    const result = await this.getByDate(date);
                    callback(result.appointments);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }

    async getById(id: string, _tx?: ITransactionContext): Promise<Appointment | null> {
        const { data, error } = await supabase.from('appointments').select('*, patients(name, phone)').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!data) return null;

        try {
            const validated = parseAppointment(data);
            return this.mapFromDb(validated);
        } catch (err) {
            throw new AppError('Data integrity violation in appointment record', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async getPendingAppointments(): Promise<readonly Appointment[]> {
        // PERF-04 FIX: Only future pending appointments, capped at 100 records
        const today = new Date().toISOString().split('T')[0]!;
        const { data, error } = await supabase
            .from('appointments')
            .select('*, patients(name, phone)')
            .eq('status', 'pending')
            .gte('appointment_date', today)
            .order('appointment_date', { ascending: true })
            .limit(100);
        if (error) throw error;

        try {
            const validated = parseAppointments(data);
            return validated.map((row) => this.mapFromDb(row));
        } catch (err) {
            throw new AppError('Data integrity violation in pending appointments', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    /**
     * Persists an appointment.
     * Note: Business logic handled in Use Case.
     */
    async create(appointment: AppointmentProps, _tx?: ITransactionContext): Promise<Appointment> {
        const { data, error } = await supabase
            .from('appointments')
            .insert({
                patient_id: appointment.patientId!,
                appointment_date: appointment.date,
                appointment_time: appointment.time!,
                duration: appointment.duration,
                type: appointment.type,
                status: appointment.status,
                notes: appointment.notes || null,
                booked_by: appointment.bookedBy
            })
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new AppError('Failed to create appointment', ErrorCode.INTERNAL_ERROR);

        try {
            const validated = parseAppointment(data);
            return this.mapFromDb(validated);
        } catch (err) {
            throw new AppError('Data integrity violation in created appointment', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async update(id: string, appointment: Partial<AppointmentProps>, _tx?: ITransactionContext): Promise<void> {
        const updateData = {
            ...(appointment.date && { appointment_date: appointment.date }),
            ...(appointment.time !== undefined && { appointment_time: appointment.time ?? '' }),
            ...(appointment.duration && { duration: appointment.duration }),
            ...(appointment.type && { type: appointment.type }),
            ...(appointment.status && { status: appointment.status }),
            ...(appointment.notes !== undefined && { notes: appointment.notes }),
            ...(appointment.medicalRecordId !== undefined && { medical_record_id: appointment.medicalRecordId }),
        };

        const { error } = await supabase.from('appointments').update(updateData).eq('id', id);
        if (error) throw error;
    }

    async updateStatus(id: string, status: AppointmentStatus, _tx?: ITransactionContext): Promise<void> {
        const { error } = await supabase
            .from('appointments')
            .update({ status })
            .eq('id', id);

        if (error) throw error;
    }

    async delete(id: string, _tx?: ITransactionContext): Promise<void> {
        const client = _tx?.transaction || supabase;
        const { error } = await client.from('appointments').delete().eq('id', id);
        if (error) throw error;
    }

    async countTodayAppointments(): Promise<number> {
        const today = new Date().toISOString().split('T')[0];
        const { count, error } = await supabase
            .from('appointments')
            .select('*', { count: 'exact', head: true })
            .eq('appointment_date', today!);

        if (error) throw error;
        return count || 0;
    }

    async checkAvailability(date: string, time: string): Promise<boolean> {
        const { data, error } = await supabase
            .from('appointments')
            .select('id')
            .eq('appointment_date', date)
            .eq('appointment_time', time)
            .neq('status', 'cancelled')
            .maybeSingle();

        if (error) throw error;
        return !data;
    }

    async bookSafe(params: {
        readonly patientId: string;
        readonly date: string;
        readonly time: string;
        readonly type: string;
        readonly notes: string;
        readonly sessionId: string;
        readonly lockId: string;
        readonly maxDaily: number;
    }, _tx?: ITransactionContext): Promise<{
        readonly success: boolean;
        readonly appointmentId?: string;
        readonly dailyNumber?: number;
        readonly error?: string;
    }> {
        const { data, error } = await supabase.rpc('book_appointment_safe', {
            p_patient_id: params.patientId,
            p_date: params.date,
            p_time: params.time,
            p_type: params.type,
            p_notes: params.notes,
            p_session_id: params.sessionId,
            p_lock_id: params.lockId,
            p_max_daily: params.maxDaily
        });

        if (error) throw error;

        try {
            const resultData = parseBookAppointmentResponse(data);
            return {
                success: resultData.success,
                ...(resultData.appointmentId !== undefined && { appointmentId: resultData.appointmentId }),
                ...(resultData.dailyNumber !== undefined && { dailyNumber: resultData.dailyNumber }),
                ...(resultData.error !== undefined && { error: resultData.error }),
            };
        } catch (err) {
            throw new AppError('Data integrity violation in RPC response', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    private mapFromDb(row: AppointmentDTO): Appointment {
        return Appointment.reconstruct({
            id: row.id,
            patientId: row.patient_id,
            patientName: row.patient_name || '',
            patientPhone: row.patient_phone || '',
            date: row.appointment_date,
            time: row.appointment_time || null,
            duration: row.duration || 30,
            dailyNumber: row.daily_number ?? 0,
            type: parseAppointmentType(row.type),
            status: parseAppointmentStatus(row.status),
            notes: row.notes || undefined,
            reason: undefined,
            treatmentType: undefined,
            medicalRecordId: undefined,
            bookedBy: parseBookedBy(row.booked_by),
            createdAt: row.created_at,
            updatedAt: row.updated_at
        });
    }
}

export const appointmentRepository = new AppointmentRepository();
