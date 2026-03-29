import { appointmentRepository } from '../../infrastructure/repositories/appointmentRepository';
import { settingsRepository, SettingsRepository } from '../../infrastructure/repositories/settingsRepository';
import { unitOfWork } from '../../infrastructure/unit-of-work/SupabaseUnitOfWork';
import { Appointment } from '../../domain/models';
import type { AppointmentType } from '../../domain/models/appointment';
import { AppError, ErrorCode } from '../../lib/errors';
import { DomainError } from '../../domain/errors';
import { logger } from '../../utils/logger';

export class BookAppointmentUseCase {
    constructor(
        private readonly settingsRepo: SettingsRepository = settingsRepository
    ) { }

    /**
     * Orchestrates the booking of a new appointment.
     * Combines domain validation with server-side safety checks in a transaction.
     */
    async execute(input: {
        patientId: string;
        patientName: string;
        patientPhone: string;
        date: string;
        time: string;
        duration: number;
        type: AppointmentType;
        notes: string;
        sessionId: string;
        lockId: string;
    }): Promise<Appointment> {
        return unitOfWork.run(async (tx) => {
            logger.info(`[BookAppointmentUseCase] Attempting to book: ${input.date} ${input.time}`);

            try {
                // 1. Domain-level construction and validation
                // This ensures basic invariants (e.g. date not in past if we added it)
                const appointment = Appointment.create({
                    id: 'temp',
                    patientId: input.patientId,
                    patientName: input.patientName,
                    patientPhone: input.patientPhone,
                    date: input.date,
                    time: input.time,
                    duration: input.duration,
                    type: input.type,
                    bookedBy: 'patient',
                    notes: input.notes
                });

                // 2. Fetch clinic settings for business rules
                const settings = await this.settingsRepo.getSettings();

                // 3. Server-side safety check and persistence via RPC
                // We use the 'book_appointment_safe' RPC which handles:
                // - Slot locks
                // - Daily limits
                // - Conflicts
                const result = await appointmentRepository.bookSafe({
                    patientId: appointment.patientId,
                    date: appointment.date,
                    time: appointment.time || '',
                    type: appointment.type,
                    notes: appointment.notes || '',
                    sessionId: input.sessionId,
                    lockId: input.lockId,
                    maxDaily: settings.maxDailyAppointments ?? 30
                }, tx);

                if (!result.success) {
                    throw new AppError(result.error || 'Booking failed', ErrorCode.VALIDATION_ERROR);
                }

                // 3. Re-fetch or return validated domain model
                const saved = await appointmentRepository.getById(result.appointmentId!, tx);
                if (!saved) throw new AppError('Appointment created but not found', ErrorCode.INTERNAL_ERROR);

                logger.info(`[BookAppointmentUseCase] Booking successful: ${saved.id}`);
                return saved;

            } catch (err) {
                if (err instanceof DomainError) {
                    throw new AppError(err.message, ErrorCode.BUSINESS_RULE_VIOLATION, err);
                }
                throw err;
            }
        });
    }
}

export const bookAppointmentUseCase = new BookAppointmentUseCase();
