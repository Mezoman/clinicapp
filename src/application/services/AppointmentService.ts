import { GetAppointmentsByDateUseCase, getAppointmentsByDateUseCase } from '../use-cases/appointments/GetAppointmentsByDateUseCase';
import { AdminBookAppointmentUseCase, adminBookAppointmentUseCase } from '../use-cases/appointments/AdminBookAppointmentUseCase';
import { UpdateAppointmentStatusUseCase, updateAppointmentStatusUseCase } from '../use-cases/appointments/UpdateAppointmentStatusUseCase';
import { DeleteAppointmentUseCase, deleteAppointmentUseCase } from '../use-cases/appointments/DeleteAppointmentUseCase';
import { GetAvailableSlotsUseCase, getAvailableSlotsUseCase, AvailableSlotsDTO } from '../use-cases/appointments/GetAvailableSlotsUseCase';
import { AppointmentMapper } from '../mappers/appointment.mapper';
import { AppResult } from '../result';
import type {
    AppointmentDTO,
    AppointmentsResultDTO,
    BookAppointmentDTO,
    AppointmentStatusDTO,
    AppointmentsQueryParamsDTO
} from '../dtos/appointment.dto';

import { appointmentRepository } from '../../infrastructure/repositories/appointmentRepository';
import { DomainError } from '../../domain/errors';
import { mapDomainErrorToUIMessage } from '../mappers/error.mapper';
import { logger } from '../../utils/logger';

/**
 * AppointmentService acts as a facade for the UI to interact with appointment use cases.
 */
export class AppointmentService {
    constructor(
        private readonly getAppointmentsUC: GetAppointmentsByDateUseCase = getAppointmentsByDateUseCase,
        private readonly adminBookUC: AdminBookAppointmentUseCase = adminBookAppointmentUseCase,
        private readonly updateStatusUC: UpdateAppointmentStatusUseCase = updateAppointmentStatusUseCase,
        private readonly deleteUC: DeleteAppointmentUseCase = deleteAppointmentUseCase,
        private readonly getSlotsUC: GetAvailableSlotsUseCase = getAvailableSlotsUseCase
    ) { }

    subscribeByDate(date: string, callback: (data: readonly AppointmentDTO[]) => void): () => void {
        return appointmentRepository.subscribeToDay(date, (domainAppointments) => {
            const dtos = domainAppointments.map(a => AppointmentMapper.toAppointmentDTO(a));
            callback(dtos);
        });
    }

    async getAppointmentsByDate(date: string, page: number = 1, pageSize: number = 50): Promise<AppResult<AppointmentsResultDTO>> {
        return this.getAppointmentsUC.execute(date, page, pageSize);
    }

    async bookByAdmin(dto: BookAppointmentDTO): Promise<AppResult<AppointmentDTO>> {
        return this.adminBookUC.execute(dto);
    }

    async updateStatus(id: string, status: AppointmentStatusDTO, medicalRecordId?: string): Promise<AppResult<AppointmentDTO>> {
        return this.updateStatusUC.execute(id, status, medicalRecordId);
    }

    async deleteAppointment(id: string): Promise<AppResult<void>> {
        return this.deleteUC.execute(id);
    }

    async getAppointments(params: AppointmentsQueryParamsDTO): Promise<AppResult<readonly AppointmentDTO[]>> {
        try {
            const repoParams: { startDate?: string; endDate?: string; patientId?: string } = {
                ...(params?.date !== undefined && { startDate: params.date, endDate: params.date }),
                ...(params?.patientId !== undefined && { patientId: params.patientId }),
            };
            const result = await appointmentRepository.getAppointments(repoParams);
            return { success: true, data: AppointmentMapper.toDTOList(result.appointments) };
        } catch (error) {
            logger.error('Failed to get appointments', { error });
            if (error instanceof DomainError) {
                return { success: false, error: mapDomainErrorToUIMessage(error) };
            }
            return { success: false, error: 'فشل في جلب المواعيد' };
        }
    }

    async getAvailableSlots(date: Date): Promise<AppResult<AvailableSlotsDTO>> {
        return this.getSlotsUC.execute(date);
    }
}
