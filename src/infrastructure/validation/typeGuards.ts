import { AppError, ErrorCode } from '../../lib/errors';
import type {
    InvoiceStatus,
    AppointmentStatus,
    AppointmentType,
    Gender,
    BloodType,
    PaymentMethod,
    BookedBy,
    ClosureReason,
    ToothChartEntry,
    ClinicShifts
} from '../../domain/models';
import type { Database } from '../../database.types';

type InvoiceItemRow = Database['public']['Tables']['invoices']['Row'] extends { invoice_items: infer I } ? I : any;
type PaymentRow = Database['public']['Tables']['invoices']['Row'] extends { payments: infer P } ? P : any;

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function assertClosureReason(reason: unknown): asserts reason is ClosureReason {
    const validReasons: ClosureReason[] = ['holiday', 'travel', 'maintenance', 'other'];
    if (typeof reason !== 'string' || !validReasons.includes(reason as ClosureReason)) {
        throw new AppError(`Invalid closure reason: ${reason}`, ErrorCode.VALIDATION_ERROR);
    }
}

export function assertBookedBy(bookedBy: unknown): asserts bookedBy is BookedBy {
    if (bookedBy === null || bookedBy === undefined) return;
    const validBookedBy: BookedBy[] = ['patient', 'admin'];
    if (typeof bookedBy !== 'string' || !validBookedBy.includes(bookedBy as BookedBy)) {
        throw new AppError(`Invalid bookedBy: ${bookedBy}`, ErrorCode.VALIDATION_ERROR);
    }
}

export function assertPaymentMethod(method: unknown): asserts method is PaymentMethod {
    const validMethods: PaymentMethod[] = ['cash', 'card', 'insurance', 'transfer'];
    if (typeof method !== 'string' || !validMethods.includes(method as PaymentMethod)) {
        throw new AppError(`Invalid payment method: ${method}`, ErrorCode.VALIDATION_ERROR);
    }
}

export function assertInvoiceStatus(status: unknown): asserts status is InvoiceStatus {
    const validStatuses: InvoiceStatus[] = ['draft', 'issued', 'partial', 'paid', 'cancelled', 'overdue'];
    if (typeof status !== 'string' || !validStatuses.includes(status as InvoiceStatus)) {
        throw new AppError(`Invalid invoice status: ${status}`, ErrorCode.VALIDATION_ERROR);
    }
}

export function assertAppointmentStatus(status: unknown): asserts status is AppointmentStatus {
    const validStatuses: AppointmentStatus[] = ['pending', 'confirmed', 'completed', 'cancelled', 'no-show'];
    if (typeof status !== 'string' || !validStatuses.includes(status as AppointmentStatus)) {
        throw new AppError(`Invalid appointment status: ${status}`, ErrorCode.VALIDATION_ERROR);
    }
}

export function assertAppointmentType(type: unknown): asserts type is AppointmentType {
    const validTypes: AppointmentType[] = ['examination', 'follow-up', 're-examination', 'procedure', 'emergency'];
    if (typeof type !== 'string' || !validTypes.includes(type as AppointmentType)) {
        throw new AppError(`Invalid appointment type: ${type}`, ErrorCode.VALIDATION_ERROR);
    }
}

export function assertGender(gender: unknown): asserts gender is Gender {
    const validGenders: Gender[] = ['male', 'female'];
    if (typeof gender !== 'string' || !validGenders.includes(gender as Gender)) {
        throw new AppError(`Invalid gender: ${gender}`, ErrorCode.VALIDATION_ERROR);
    }
}

export function assertBloodType(bloodType: unknown): asserts bloodType is BloodType {
    if (bloodType === null || bloodType === undefined) return;
    const validBloodTypes: BloodType[] = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    if (typeof bloodType !== 'string' || !validBloodTypes.includes(bloodType as BloodType)) {
        throw new AppError(`Invalid blood type: ${bloodType}`, ErrorCode.VALIDATION_ERROR);
    }
}

export function assertInvoiceItems(items: unknown): asserts items is InvoiceItemRow[] {
    if (items === null || items === undefined) return;
    if (!Array.isArray(items)) {
        throw new AppError('Invoice items must be an array', ErrorCode.VALIDATION_ERROR);
    }
    items.forEach((item, index) => {
        if (!isRecord(item)) {
            throw new AppError(`Invoice item at index ${index} must be an object`, ErrorCode.VALIDATION_ERROR);
        }
        if (typeof item.name !== 'string' || typeof item.quantity !== 'number' || typeof item.unit_price !== 'number' || typeof item.total !== 'number') {
            throw new AppError(`Invalid invoice item structure at index ${index}`, ErrorCode.VALIDATION_ERROR);
        }
    });
}

export function assertPayments(payments: unknown): asserts payments is PaymentRow[] {
    if (payments === null || payments === undefined) return;
    if (!Array.isArray(payments)) {
        throw new AppError('Payments must be an array', ErrorCode.VALIDATION_ERROR);
    }
    payments.forEach((p, index) => {
        if (!isRecord(p)) {
            throw new AppError(`Payment at index ${index} must be an object`, ErrorCode.VALIDATION_ERROR);
        }
        if (typeof p.amount !== 'number' || typeof p.method !== 'string' || typeof p.date !== 'string') {
            throw new AppError(`Invalid payment structure at index ${index}`, ErrorCode.VALIDATION_ERROR);
        }
        assertPaymentMethod(p.method);
    });
}

export function assertTeethChart(chart: unknown): asserts chart is Record<string, ToothChartEntry> {
    if (chart === null || chart === undefined) return;
    if (!isRecord(chart)) {
        throw new AppError('Teeth chart must be an object', ErrorCode.VALIDATION_ERROR);
    }
    Object.entries(chart).forEach(([key, value]) => {
        if (!isRecord(value)) {
            throw new AppError(`Teeth chart entry for ${key} must be an object`, ErrorCode.VALIDATION_ERROR);
        }
        const validStatuses: ToothChartEntry['status'][] = ['healthy', 'decayed', 'missing', 'filled', 'crowned', 'extracted'];
        if (typeof value.status !== 'string' || !validStatuses.includes(value.status as ToothChartEntry['status'])) {
            throw new AppError(`Invalid teeth chart status for ${key}: ${value.status}`, ErrorCode.VALIDATION_ERROR);
        }
    });
}

export function assertClinicShifts(shifts: unknown): asserts shifts is ClinicShifts {
    if (shifts === null || shifts === undefined) return;
    if (!isRecord(shifts)) {
        throw new AppError('Clinic shifts must be an object', ErrorCode.VALIDATION_ERROR);
    }
    Object.entries(shifts).forEach(([day, sessions]) => {
        if (!Array.isArray(sessions)) {
            throw new AppError(`Sessions for ${day} must be an array`, ErrorCode.VALIDATION_ERROR);
        }
        sessions.forEach((session, index) => {
            if (!isRecord(session)) {
                throw new AppError(`Session at index ${index} for ${day} must be an object`, ErrorCode.VALIDATION_ERROR);
            }
            if (typeof session.startTime !== 'string' || typeof session.endTime !== 'string') {
                throw new AppError(`Invalid session structure for ${day} at index ${index}`, ErrorCode.VALIDATION_ERROR);
            }
        });
    });
}
