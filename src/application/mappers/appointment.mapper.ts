import { Appointment } from '../../domain/models/appointment';
import { AppointmentDTO } from '../dtos/appointment.dto';

export class AppointmentMapper {
    static toAppointmentDTO(appointment: Appointment): AppointmentDTO {
        return {
            id: appointment.id,
            patientId: appointment.patientId,
            patientName: appointment.patientName,
            patientPhone: appointment.patientPhone,
            date: appointment.date,
            time: appointment.time || '',
            duration: appointment.duration,
            type: appointment.type,
            status: appointment.status,
            notes: appointment.notes,
            dailyNumber: appointment.dailyNumber,
            bookedBy: appointment.bookedBy
        };
    }

    static toDTOList(appointments: readonly Appointment[]): AppointmentDTO[] {
        return appointments.map(a => this.toAppointmentDTO(a));
    }
}
