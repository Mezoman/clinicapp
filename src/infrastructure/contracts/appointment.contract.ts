import { z } from "zod";
import { databaseSchema } from "./generated.schemas";
import type { AppointmentType, AppointmentStatus, BookedBy } from "../../domain/models";

const AppointmentSchema = databaseSchema.shape.public.shape.Tables.shape.appointments.shape.Row;

// Strict Enum Schemas
export const AppointmentTypeSchema = z.enum(['examination', 'follow-up', 're-examination', 'procedure', 'emergency']);
export const AppointmentStatusSchema = z.enum(['pending', 'confirmed', 'completed', 'cancelled', 'no-show']);
export const BookedBySchema = z.enum(['patient', 'admin']);

export type AppointmentDTO = z.infer<typeof AppointmentSchema>;

export const parseAppointment = (data: unknown): AppointmentDTO => {
    return AppointmentSchema.parse(data);
};

export const parseAppointments = (data: unknown): AppointmentDTO[] => {
    return z.array(AppointmentSchema).parse(data);
};

export const parseAppointmentType = (type: unknown): AppointmentType => {
    return AppointmentTypeSchema.parse(type);
};

export const parseAppointmentStatus = (status: unknown): AppointmentStatus => {
    return AppointmentStatusSchema.parse(status);
};

export const parseBookedBy = (bookedBy: unknown): BookedBy => {
    return BookedBySchema.parse(bookedBy || 'admin');
};
