import { DomainError } from '../errors';

export type AppointmentType =
    | 'examination'
    | 'follow-up'
    | 're-examination'
    | 'procedure'
    | 'emergency';

export type AppointmentStatus =
    | 'pending'
    | 'confirmed'
    | 'completed'
    | 'cancelled'
    | 'no-show';

export type BookedBy = 'patient' | 'admin';

export interface AppointmentProps {
    readonly id: string;
    readonly patientId: string;
    readonly patientName: string;
    readonly patientPhone: string;
    readonly date: string;
    readonly time: string | null;
    readonly duration: number;
    readonly dailyNumber: number;
    readonly type: AppointmentType;
    readonly reason: string | undefined;
    readonly treatmentType: string | undefined;
    readonly status: AppointmentStatus;
    readonly notes: string | undefined;
    readonly medicalRecordId: string | undefined;
    readonly bookedBy: BookedBy;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export class Appointment {
    private constructor(private readonly props: AppointmentProps) { }

    // Getters
    get id() { return this.props.id; }
    get patientId() { return this.props.patientId; }
    get patientName() { return this.props.patientName; }
    get patientPhone() { return this.props.patientPhone; }
    get date() { return this.props.date; }
    get time() { return this.props.time; }
    get duration() { return this.props.duration; }
    get dailyNumber() { return this.props.dailyNumber; }
    get type() { return this.props.type; }
    get reason() { return this.props.reason; }
    get treatmentType() { return this.props.treatmentType; }
    get status() { return this.props.status; }
    get notes() { return this.props.notes; }
    get medicalRecordId() { return this.props.medicalRecordId; }
    get bookedBy() { return this.props.bookedBy; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    static reconstruct(props: AppointmentProps): Appointment {
        return new Appointment(props);
    }

    static create(input: {
        id: string;
        patientId: string;
        patientName: string;
        patientPhone: string;
        date: string;
        time: string | null;
        duration: number;
        type: AppointmentType;
        bookedBy: BookedBy;
        reason?: string | undefined;
        treatmentType?: string | undefined;
        notes?: string | undefined;
        dailyNumber?: number | undefined;
    }): Appointment {
        return new Appointment({
            ...input,
            dailyNumber: input.dailyNumber ?? 0,
            status: 'pending',
            reason: input.reason,
            treatmentType: input.treatmentType,
            notes: input.notes,
            medicalRecordId: undefined,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });
    }

    // State Machine Transitions
    confirm(): Appointment {
        if (this.status === 'confirmed') {
            throw new DomainError('INVALID_TRANSITION', 'Cannot confirm appointment from confirmed status');
        }
        if (this.status === 'completed' || this.status === 'cancelled' || this.status === 'no-show') {
            throw new DomainError('INVALID_TRANSITION', `Cannot confirm appointment from ${this.status} status`);
        }
        return this.updateStatus('confirmed');
    }

    complete(medicalRecordId?: string): Appointment {
        if (this.status === 'pending') {
            throw new DomainError('INVALID_TRANSITION', 'Only confirmed appointments can be completed');
        }
        if (this.status === 'cancelled' || this.status === 'no-show') {
            throw new DomainError('INVALID_TRANSITION', `Cannot complete a ${this.status} appointment`);
        }
        return new Appointment({
            ...this.props,
            status: 'completed',
            medicalRecordId: medicalRecordId ?? this.props.medicalRecordId,
            updatedAt: new Date().toISOString()
        });
    }

    cancel(): Appointment {
        if (this.status === 'completed' || this.status === 'no-show') {
            throw new DomainError('INVALID_TRANSITION', `Cannot cancel a ${this.status} appointment`);
        }
        return this.updateStatus('cancelled');
    }

    markNoShow(): Appointment {
        if (this.status !== 'confirmed' && this.status !== 'pending') {
            throw new DomainError('INVALID_TRANSITION', `Cannot mark as no-show from ${this.status} status`);
        }
        return this.updateStatus('no-show');
    }

    private updateStatus(status: AppointmentStatus): Appointment {
        return new Appointment({
            ...this.props,
            status,
            updatedAt: new Date().toISOString()
        });
    }

    toProps(): AppointmentProps {
        return { ...this.props };
    }
}

export interface AppointmentFormData {
    patientId: string;
    patientName: string;
    patientPhone: string;
    date: string;
    time: string | null;
    duration: number;
    type: AppointmentType;
    reason?: string;
    treatmentType?: string;
    notes?: string;
    bookedBy: BookedBy;
}

export interface SlotLock {
    readonly id: string;
    readonly lockKey: string;
    readonly sessionId?: string;
    readonly date: string;
    readonly time: string;
    readonly lockedAt: string;
    readonly expiresAt: string;
}

export interface AppointmentsQueryParams {
    readonly date?: string | undefined;
    readonly status?: AppointmentStatus | undefined;
    readonly patientId?: string | undefined;
    readonly pageSize?: number | undefined;
    readonly page?: number | undefined;
}

export interface AppointmentsResult {
    appointments: Appointment[];
    page: number;
    hasMore: boolean;
}
