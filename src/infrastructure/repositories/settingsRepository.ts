import { supabase, supabasePublic } from '../clients/supabase';
import { ClinicSettings, ClinicShifts } from '../../domain/models';
import { parseSettings, type SettingsDTO } from '../contracts/settings.contract';
import { AppError, ErrorCode } from '../../lib/errors';

export class SettingsRepository {
    async getSettings(): Promise<ClinicSettings> {
        const { data, error } = await supabasePublic
            .from('settings')
            .select('*')
            .single();

        if (error) throw error;
        if (!data) throw new AppError('Settings not found', ErrorCode.NOT_FOUND);

        try {
            const validated = parseSettings(data);
            return this.mapFromDb(validated);
        } catch (err) {
            throw new AppError('Data integrity violation in settings', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async updateSettings(data: Partial<ClinicSettings>): Promise<void> {
        const updateData: Record<string, any> = {
            ...(data.clinicName && { clinic_name: data.clinicName }),
            ...(data.doctorName && { doctor_name: data.doctorName }),
            ...(data.phone && { phone: data.phone }),
            ...(data.whatsapp !== undefined && { whatsapp: data.whatsapp }),
            ...(data.address !== undefined && { address: data.address }),
            ...(data.workingDays && { working_days: data.workingDays }),
            ...(data.shifts && { shifts: data.shifts }),
            ...(data.slotDuration && { slot_duration: data.slotDuration }),
            ...(data.isBookingEnabled !== undefined && { is_booking_enabled: data.isBookingEnabled }),
            ...(data.bookingAdvanceDays !== undefined && { booking_advance_days: data.bookingAdvanceDays }),
            ...(data.maxDailyAppointments !== undefined && { max_daily_appointments: data.maxDailyAppointments }),
        };

        const { error } = await supabase
            .from('settings')
            .update(updateData)
            .eq('id', 1);

        if (error) throw error;
    }

    private mapFromDb(row: SettingsDTO): ClinicSettings {
        return {
            clinicName: row.clinic_name || '',
            doctorName: row.doctor_name || '',
            phone: row.phone || '',
            whatsapp: row.whatsapp || undefined,
            address: row.address || undefined,
            workingDays: row.working_days || [],
            shifts: row.shifts as unknown as ClinicShifts,
            slotDuration: row.slot_duration || 30,
            isBookingEnabled: row.is_booking_enabled || false,
            bookingAdvanceDays: row.booking_advance_days || 30,
            maxDailyAppointments: row.max_daily_appointments || 20,
        };
    }
}

export const settingsRepository = new SettingsRepository();