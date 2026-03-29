export interface InvoiceServiceDTO {
    readonly serviceId: string | undefined;
    readonly name: string;
    readonly quantity: number;
    readonly unitPrice: number;
    readonly total: number;
}

export type PaymentMethodDTO = 'cash' | 'card' | 'insurance' | 'transfer';

export interface PaymentDTO {
    readonly amount: number;
    readonly method: PaymentMethodDTO;
    readonly date: string;
    readonly notes?: string;
}

export interface InvoiceDTO {
    readonly id: string;
    readonly invoiceNumber: string;
    readonly patientId: string;
    readonly patientName: string | undefined;
    readonly appointmentId?: string;
    readonly invoiceDate: string;
    readonly services: readonly InvoiceServiceDTO[];
    readonly subtotal: number;
    readonly discount: number;
    readonly taxRate?: number;
    readonly taxAmount?: number;
    readonly total: number;
    readonly totalPaid: number;
    readonly balance: number;
    readonly status: string;
    readonly dueDate: string | undefined;
    readonly notes: string | undefined;
}

export interface CreateInvoiceDTO {
    readonly patientId: string;
    readonly patientName: string;
    readonly invoiceDate: string;
    readonly services: readonly {
        readonly serviceId: string | undefined;
        readonly name: string;
        readonly quantity: number;
        readonly unitPrice: number;
    }[];
    readonly discount: number;
    readonly taxRate?: number;
    readonly taxAmount?: number;
    readonly notes: string | undefined;
}

export interface ProcessPaymentDTO {
    readonly amount: number;
    readonly method: PaymentMethodDTO;
    readonly notes: string | undefined;
}
