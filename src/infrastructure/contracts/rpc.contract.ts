import { z } from "zod";

// Specific schema for book_appointment_safe RPC response
const BookAppointmentResponseSchema = z.object({
    success: z.boolean(),
    appointmentId: z.string().optional(),
    dailyNumber: z.number().optional(),
    error: z.string().optional(),
});

export type BookAppointmentResponseDTO = z.infer<typeof BookAppointmentResponseSchema>;

export const parseBookAppointmentResponse = (data: unknown): BookAppointmentResponseDTO => {
    return BookAppointmentResponseSchema.parse(data);
};

// Schema for log_audit_trail
const LogAuditTrailResponseSchema = z.null().or(z.any()); // Usually returns void/null
export const parseLogAuditTrailResponse = (data: unknown) => LogAuditTrailResponseSchema.parse(data);
