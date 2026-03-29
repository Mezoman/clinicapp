import { appointmentRepository } from '../../../infrastructure/repositories/appointmentRepository';
import { unitOfWork } from '../../../infrastructure/unit-of-work/SupabaseUnitOfWork';
import { AppResult, success, failure } from '../../result';
import { mapDomainErrorToUIMessage } from '../../mappers/error.mapper';

export class DeleteAppointmentUseCase {
    async execute(id: string): Promise<AppResult<void>> {
        return unitOfWork.run(async (tx) => {
            try {
                const appointment = await appointmentRepository.getById(id, tx);
                if (!appointment) return failure('الموعد غير موجود');

                // BL-01 FIX: Enforce status-based deletion rules
                // completed appointments are linked to medical records and invoices — must not be deleted
                if (appointment.status === 'completed') {
                    return failure('لا يمكن حذف موعد مكتمل — يحتوي على سجل طبي. استخدم الأرشفة بدلاً من الحذف.');
                }
                // confirmed appointments must be cancelled first before deletion
                if (appointment.status === 'confirmed') {
                    return failure('لا يمكن حذف موعد مؤكد — يجب إلغاؤه أولاً ثم حذفه.');
                }

                await appointmentRepository.delete(id, tx);
                return success(undefined);
            } catch (err) {
                return failure(mapDomainErrorToUIMessage(err));
            }
        });
    }
}

export const deleteAppointmentUseCase = new DeleteAppointmentUseCase();
