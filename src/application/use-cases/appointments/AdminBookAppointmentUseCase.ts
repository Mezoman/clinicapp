import { appointmentRepository } from '../../../infrastructure/repositories/appointmentRepository';
import { patientRepository } from '../../../infrastructure/repositories/patientRepository';
import { unitOfWork } from '../../../infrastructure/unit-of-work/SupabaseUnitOfWork';
import { Appointment } from '../../../domain/models/appointment';
import type { AppointmentType } from '../../../domain/models/appointment';
import { AppResult, success, failure } from '../../result';
import { AppointmentDTO, BookAppointmentDTO } from '../../dtos/appointment.dto';
import { AppointmentMapper } from '../../mappers/appointment.mapper';
import { mapDomainErrorToUIMessage } from '../../mappers/error.mapper';
import { logger } from '../../../utils/logger';
import { settingsRepository } from '../../../infrastructure/repositories/settingsRepository';

/**
 * Policy Isolation: AdminBookAppointmentUseCase handles admin-specific rules.
 * Orchestrates patient lookup/creation and appointment booking atomically.
 *
 * Uses find_or_create_patient RPC (SECURITY DEFINER) so anon public bookings
 * can create patient records without direct table access (which is RLS-blocked).
 */
export class AdminBookAppointmentUseCase {
    async execute(input: BookAppointmentDTO): Promise<AppResult<AppointmentDTO>> {
        return unitOfWork.run(async (tx) => {
            try {
                logger.info(`[AdminBookAppointmentUseCase] Admin booking for: ${input.patientName}`);

                // 1. Patient lookup/creation via repository
                // ARCH-02 FIX: Use patientRepository.findOrCreate() instead of supabase.rpc() directly.
                // patientRepository.findOrCreate() calls the same SECURITY DEFINER RPC internally,
                // keeping Infrastructure concerns inside the Infrastructure layer.
                let patientId = input.patientId;
                if (!patientId) {
                    patientId = await patientRepository.findOrCreate(
                        input.patientName,
                        input.patientPhone
                    );
                }

                // 2. Business rule validations
                // BL-02 FIX: Prevent booking in the past
                const today = new Date().toISOString().split('T')[0]!;
                if (input.date < today) {
                    return failure('لا يمكن الحجز في تاريخ ماضٍ');
                }

                // BL-04 FIX: Read slot duration from clinic settings instead of hardcoding 15
                const settings = await settingsRepository.getSettings();

                // 3. Create Appointment Domain Model
                const appointment = Appointment.create({
                    id: 'placeholder',
                    patientId: patientId,
                    patientName: input.patientName,
                    patientPhone: input.patientPhone,
                    date: input.date,
                    time: input.time,
                    duration: settings.slotDuration,
                    type: input.type as AppointmentType,
                    bookedBy: input.bookedBy || 'admin',
                    notes: input.notes
                });

                // 4. Persist
                const saved = await appointmentRepository.create(appointment.toProps(), tx);

                logger.info(`[AdminBookAppointmentUseCase] Booked successfully: ${saved.id}`);
                return success(AppointmentMapper.toAppointmentDTO(saved));
            } catch (err) {
                logger.error(`[AdminBookAppointmentUseCase] Error: ${err}`);
                return failure(mapDomainErrorToUIMessage(err));
            }
        });
    }
}

export const adminBookAppointmentUseCase = new AdminBookAppointmentUseCase();

