import { DomainError } from '../errors';

export type PaymentMethod = 'cash' | 'card' | 'insurance' | 'transfer';
export type InvoiceStatus = 'draft' | 'issued' | 'partial' | 'paid' | 'cancelled' | 'overdue';

export interface InvoiceService {
    readonly serviceId: string | undefined;
    readonly name: string;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly total: number;
}

export interface Payment {
    readonly amount: number;
    readonly method: PaymentMethod;
    readonly date: string;
    readonly notes: string | undefined;
}

export interface InvoiceProps {
    readonly id: string;
    readonly patientId: string;
    readonly patientName: string | undefined;
    readonly appointmentId: string | undefined;
    readonly invoiceNumber: string;
    readonly invoiceDate: string;
    readonly services: readonly InvoiceService[];
    readonly subtotal: number;
    readonly discount: number;
    readonly discountReason: string | undefined;
    readonly taxAmount: number;
    readonly taxRate: number;
    readonly total: number;
    readonly payments: readonly Payment[];
    readonly totalPaid: number;
    readonly balance: number;
    readonly status: InvoiceStatus;
    readonly dueDate: string | undefined; // ISO date string
    readonly notes: string | undefined;
    readonly createdAt: string;
    readonly updatedAt: string;
}

export class Invoice {
    private constructor(private readonly props: InvoiceProps) { }

    // Getters for properties
    get id() { return this.props.id; }
    get patientId() { return this.props.patientId; }
    get patientName() { return this.props.patientName; }
    get appointmentId() { return this.props.appointmentId; }
    get invoiceNumber() { return this.props.invoiceNumber; }
    get invoiceDate() { return this.props.invoiceDate; }
    get services() { return this.props.services; }
    get subtotal() { return this.props.subtotal; }
    get discount() { return this.props.discount; }
    get discountReason() { return this.props.discountReason; }
    get taxAmount() { return this.props.taxAmount; }
    get taxRate() { return this.props.taxRate; }
    get total() { return this.props.total; }
    get payments() { return this.props.payments; }
    get totalPaid() { return this.props.totalPaid; }
    get balance() { return this.props.balance; }
    get status() { return this.props.status; }
    get dueDate() { return this.props.dueDate; }
    get notes() { return this.props.notes; }
    get createdAt() { return this.props.createdAt; }
    get updatedAt() { return this.props.updatedAt; }

    /**
     * Reconstruct an Invoice from persistence data.
     */
    static reconstruct(props: InvoiceProps): Invoice {
        return new Invoice(props);
    }

    /**
     * Create a new Invoice with business rules enforcement.
     */
    static create(input: {
        id: string;
        patientId: string;
        patientName?: string;
        appointmentId?: string;
        invoiceNumber: string;
        invoiceDate: string;
        services: readonly InvoiceService[];
        discount?: number;
        discountReason?: string | undefined;
        taxAmount?: number;
        taxRate?: number;
        dueDate?: string;
        notes?: string;
        createdAt?: string;
        updatedAt?: string;
    }): Invoice {
        // Guard: لا فاتورة بدون خدمات
        if (!input.services || input.services.length === 0) {
            throw new DomainError(
                "INVALID_INVOICE",
                "الفاتورة يجب أن تحتوي على خدمة واحدة على الأقل"
            );
        }

        // Guard: جميع الخدمات يجب أن تكون بكميات وأسعار صحيحة
        const invalid = input.services.find(s => s.quantity <= 0 || s.unitPrice <= 0);
        if (invalid) {
            throw new DomainError(
                "INVALID_SERVICE",
                "الكمية والسعر يجب أن يكونا أكبر من صفر"
            );
        }

        const subtotal = input.services.reduce((sum, s) => sum + s.total, 0);
        const discount = input.discount ?? 0;
        const taxAmount = input.taxAmount ?? 0;
        const taxRate = input.taxRate ?? 0;

        // BL-03 FIX: Validate discount boundaries
        if (discount < 0) {
            throw new DomainError('INVALID_DISCOUNT', 'الخصم لا يمكن أن يكون قيمة سالبة');
        }
        if (discount > subtotal) {
            throw new DomainError(
                'INVALID_DISCOUNT',
                `الخصم (${discount}) يتجاوز إجمالي الخدمات (${subtotal}) — يُسمح بالخصم الكامل 100% كحد أقصى`
            );
        }

        const total = Math.max(0, (subtotal - discount) + taxAmount);
        const totalPaid = 0;
        const balance = total;
        const status: InvoiceStatus = 'issued';

        return new Invoice({
            id: input.id,
            patientId: input.patientId,
            patientName: input.patientName,
            appointmentId: input.appointmentId,
            invoiceNumber: input.invoiceNumber,
            invoiceDate: input.invoiceDate,
            services: input.services,
            subtotal,
            discount,
            discountReason: input.discountReason,
            taxAmount,
            taxRate,
            total,
            payments: [],
            totalPaid,
            balance,
            status,
            dueDate: input.dueDate,
            notes: input.notes,
            createdAt: input.createdAt ?? new Date().toISOString(),
            updatedAt: input.updatedAt ?? new Date().toISOString()
        });
    }

    applyPayment(payment: Payment): Invoice {
        if (this.status === 'cancelled') {
            throw new DomainError('INVALID_OPERATION', 'Cannot add payment to a cancelled invoice');
        }

        const newTotalPaid = this.props.totalPaid + payment.amount;
        const newBalance = this.props.total - newTotalPaid;

        if (newBalance < -0.01) { // Floating point safety
            throw new DomainError('OVERPAYMENT_NOT_ALLOWED', `Overpayment detected. Remaining balance is ${this.balance}`);
        }

        let newStatus: InvoiceStatus = 'issued';
        if (Math.abs(newBalance) < 0.01) {
            newStatus = 'paid';
        } else if (newTotalPaid > 0) {
            newStatus = 'partial';
        }

        return new Invoice({
            ...this.props,
            payments: [...this.props.payments, payment],
            totalPaid: newTotalPaid,
            balance: Math.max(0, newBalance),
            status: newStatus,
            updatedAt: new Date().toISOString()
        });
    }

    cancel(): Invoice {
        if (this.status === 'paid') {
            throw new DomainError('INVALID_OPERATION', 'Cannot cancel a fully paid invoice');
        }
        return new Invoice({
            ...this.props,
            status: 'cancelled',
            updatedAt: new Date().toISOString()
        });
    }

    // Helper for persistence DTO conversion
    toProps(): InvoiceProps {
        return { ...this.props };
    }
}

export type InvoiceFormData = Omit<InvoiceProps, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber' | 'totalPaid' | 'balance' | 'status'>;

// ─── Installment Model ───
export type InstallmentStatus = 'pending' | 'paid' | 'overdue';

export interface Installment {
    readonly id: string;
    readonly invoiceId: string;
    readonly patientId: string;
    readonly amount: number;
    readonly dueDate: string;       // ISO date string
    readonly paidDate?: string | undefined;     // ISO date string — null إذا لم يُدفع
    readonly paid: boolean;
    readonly notes?: string | undefined;
    readonly createdAt: string;
    readonly updatedAt: string;
    // Computed
    readonly status?: InstallmentStatus;
}

export interface InstallmentFormData {
    invoiceId: string;
    patientId: string;
    numberOfInstallments: number;   // عدد الأقساط
    firstDueDate: string;           // تاريخ أول قسط
    totalAmount: number;            // يُحسب تلقائياً من الفاتورة
}
