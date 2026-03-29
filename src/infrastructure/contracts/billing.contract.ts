import { z } from "zod";
import { databaseSchema } from "./generated.schemas";
import type { InvoiceStatus, PaymentMethod, InvoiceService, Payment } from "../../domain/models";
import type { Json } from "../../database.types";

const InvoiceSchema = databaseSchema.shape.public.shape.Tables.shape.invoices.shape.Row;

// Strict Enum Schemas
export const InvoiceStatusSchema = z.enum(['draft', 'issued', 'partial', 'paid', 'cancelled', 'overdue']);
export const PaymentMethodSchema = z.enum(['cash', 'card', 'insurance', 'transfer']);

export const InvoiceItemSchema = z.object({
    service_id: z.string().optional().nullable(),
    name: z.string(),
    quantity: z.number(),
    unit_price: z.number(),
    total: z.number()
});

export const PaymentRecordSchema = z.object({
    amount: z.number(),
    method: PaymentMethodSchema,
    date: z.string(),
    notes: z.string().optional().nullable()
});

export type InvoiceDTO = z.infer<typeof InvoiceSchema>;
export type InvoiceItemDTO = z.infer<typeof InvoiceItemSchema>;
export type PaymentRecordDTO = z.infer<typeof PaymentRecordSchema>;

// Parsing Functions
export const parseInvoice = (data: unknown): InvoiceDTO => {
    return InvoiceSchema.parse(data);
};

export const parseInvoices = (data: unknown): InvoiceDTO[] => {
    return z.array(InvoiceSchema).parse(data);
};

export const parseInvoiceStatus = (status: unknown): InvoiceStatus => {
    return InvoiceStatusSchema.parse(status) as InvoiceStatus;
};

export const parsePaymentMethod = (method: unknown): PaymentMethod => {
    return PaymentMethodSchema.parse(method) as PaymentMethod;
};

export const parseInvoiceItems = (data: unknown): InvoiceItemDTO[] => {
    return z.array(InvoiceItemSchema).parse(data || []);
};

export const parsePaymentRecords = (data: unknown): PaymentRecordDTO[] => {
    return z.array(PaymentRecordSchema).parse(data || []);
};

// Serialization Functions (Domain -> Database)
export const serializeInvoiceItems = (services: readonly InvoiceService[]): Json => {
    return services.map(s => ({
        service_id: s.serviceId || null,
        name: s.name,
        quantity: s.quantity,
        unit_price: s.unitPrice,
        total: s.total
    })) as unknown as Json;
};

export const serializePayments = (payments: readonly Payment[]): Json => {
    return payments.map(p => ({
        amount: p.amount,
        method: p.method,
        date: p.date,
        notes: p.notes || null
    })) as unknown as Json;
};
