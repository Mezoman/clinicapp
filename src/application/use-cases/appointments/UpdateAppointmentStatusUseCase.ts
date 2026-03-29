import { appointmentRepository } from '../../../infrastructure/repositories/appointmentRepository';
import { unitOfWork } from '../../../infrastructure/unit-of-work/SupabaseUnitOfWork';
import { AppResult, success, failure } from '../../result';
import { AppointmentDTO, AppointmentStatusDTO } from '../../dtos/appointment.dto';
import { AppointmentMapper } from '../../mappers/appointment.mapper';
import { mapDomainErrorToUIMessage } from '../../mappers/error.mapper';
import { Appointment } from '../../../domain/models/appointment';

export class UpdateAppointmentStatusUseCase {
    async execute(id: string, status: AppointmentStatusDTO, medicalRecordId?: string): Promise<AppResult<AppointmentDTO>> {
        return unitOfWork.run(async (tx) => {
            try {
                const appointment = await appointmentRepository.getById(id, tx);
                if (!appointment) return failure('الموعد غير موجود');

                // CQ-03 FIX: typed as Appointment — prevents silent undefined if switch is incomplete
                let updated: Appointment | undefined;
                switch (status) {
                    case 'confirmed': updated = appointment.confirm(); break;
                    case 'completed': updated = appointment.complete(medicalRecordId); break;
                    case 'cancelled': updated = appointment.cancel(); break;
                    case 'no-show': updated = appointment.markNoShow(); break;
                }

                if (!updated) return failure('حالة الموعد غير معروفة');

                await appointmentRepository.updateStatus(id, status, tx);
                return success(AppointmentMapper.toAppointmentDTO(updated));
            } catch (err) {
                return failure(mapDomainErrorToUIMessage(err));
            }
        });
    }
}

export const updateAppointmentStatusUseCase = new UpdateAppointmentStatusUseCase();
