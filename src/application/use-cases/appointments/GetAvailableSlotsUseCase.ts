import { appointmentRepository } from '../../../infrastructure/repositories/appointmentRepository';
import { closureRepository } from '../../../infrastructure/repositories/closureRepository';
import { settingsRepository } from '../../../infrastructure/repositories/settingsRepository';
import { BookingRules } from '../../../domain/logic/bookingRules';
import { AppResult, success, failure } from '../../result';

import { ClinicSettingsDTO } from '../../dtos/settings.dto';

export interface AvailableSlotsDTO {
    readonly available: boolean;
    readonly reason?: 'off_day' | 'closed';
    readonly bookedSlots?: readonly string[];
    readonly settings?: ClinicSettingsDTO;
}

export class GetAvailableSlotsUseCase {
    async execute(date: Date): Promise<AppResult<AvailableSlotsDTO>> {
        try {
            const settings = await settingsRepository.getSettings();
            const closures = await closureRepository.getClosures();

            if (!BookingRules.isWorkingDay(date, settings)) {
                return success({ available: false, reason: 'off_day' });
            }

            if (BookingRules.isDateClosed(date, [...closures])) {
                return success({ available: false, reason: 'closed' });
            }

            const dateStr = date.toISOString().split('T')[0] || '';
            const result = await appointmentRepository.getByDate(dateStr);

            return success({
                available: true,
                bookedSlots: result.appointments.map(b => b.time).filter((t): t is string => !!t),
                settings
            });
        } catch (err) {
            return failure('فشل في التحقق من المواعيد المتاحة');
        }
    }
}

export const getAvailableSlotsUseCase = new GetAvailableSlotsUseCase();
