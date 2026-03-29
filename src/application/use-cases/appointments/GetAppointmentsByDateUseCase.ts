import { appointmentRepository } from '../../../infrastructure/repositories/appointmentRepository';
import { AppointmentMapper } from '../../mappers/appointment.mapper';
import { AppointmentsResultDTO } from '../../dtos/appointment.dto';
import { AppResult, success, failure } from '../../result';

export class GetAppointmentsByDateUseCase {
    async execute(date: string, page: number = 1, pageSize: number = 50): Promise<AppResult<AppointmentsResultDTO>> {
        try {
            const result = await appointmentRepository.getByDate(date, page, pageSize);
            const dtos = result.appointments.map(AppointmentMapper.toAppointmentDTO);
            return success({
                appointments: dtos,
                page,
                totalPages: Math.ceil(result.total / pageSize),
                hasMore: page * pageSize < result.total,
                total: result.total
            });
        } catch (err) {
            return failure('فشل في تحميل المواعيد لهذا التاريخ');
        }
    }
}

export const getAppointmentsByDateUseCase = new GetAppointmentsByDateUseCase();
