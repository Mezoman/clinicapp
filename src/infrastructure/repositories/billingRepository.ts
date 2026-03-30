import { supabase } from '../clients/supabase';
import { Invoice, type InvoiceProps, type InvoiceStatus, type Payment } from '../../domain/models';
import { AppError, ErrorCode } from '../../lib/errors';
import {
    parseInvoice,
    parseInvoices,
    parseInvoiceItems,
    parsePaymentRecords,
    parseInvoiceStatus,
    parsePaymentMethod,
    serializeInvoiceItems,
    serializePayments,
    type InvoiceDTO
} from '../contracts/billing.contract';
import type { ITransactionContext } from '../../application/ports/IUnitOfWork';

// FIXED: حد أقصى للصفحة لمنع استرجاع آلاف السجلات
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;


export class BillingRepository {
    // FIXED: إضافة pagination إلزامية
    async getInvoices(params: {
        readonly patientId?: string;
        readonly appointmentId?: string;
        readonly page?: number;
        readonly pageSize?: number;
    } = {}): Promise<{ readonly invoices: readonly Invoice[]; readonly total: number }> {
        const { patientId, appointmentId, page = 1, pageSize = DEFAULT_PAGE_SIZE } = params;
        const safePageSize = Math.min(pageSize, MAX_PAGE_SIZE);
        const from = (page - 1) * safePageSize;
        const to = from + safePageSize - 1;

        let query = supabase
            .from('invoices')
            .select('*', { count: 'estimated' })
            .order('invoice_date', { ascending: false });

        if (patientId) query = query.eq('patient_id', patientId);
        if (appointmentId) query = query.eq('appointment_id', appointmentId);

        const { data, error, count } = await query.range(from, to);
        if (error) throw error;

        try {
            const validated = parseInvoices(data);
            return {
                invoices: validated.map((row) => this.mapFromDb(row)),
                total: count ?? 0,
            };
        } catch (err) {
            throw new AppError('Data integrity violation in invoices list', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }


    async getById(id: string, _tx?: ITransactionContext): Promise<Invoice | null> {
        const { data, error } = await supabase.from('invoices').select('*').eq('id', id).maybeSingle();
        if (error) throw error;
        if (!data) return null;

        try {
            const validated = parseInvoice(data);
            return this.mapFromDb(validated);
        } catch (err) {
            throw new AppError('Data integrity violation in invoice record', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async getInvoicesByDateRange(startDate: string, endDate?: string): Promise<readonly Invoice[]> {
        // FIXED: إضافة limit 500 للنطاقات الزمنية
        let query = supabase
            .from('invoices')
            .select('*')
            .gte('invoice_date', startDate)
            .neq('status', 'cancelled');
        if (endDate) {
            query = query.lte('invoice_date', endDate);
        }
        const { data, error } = await query
            .order('invoice_date', { ascending: false })
            .limit(500); // FIXED: حد معقول للتقارير

        if (error) throw error;

        try {
            const validated = parseInvoices(data);
            return validated.map((row) => this.mapFromDb(row));
        } catch (err) {
            throw new AppError('Data integrity violation in date-range invoices', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async getAllActiveInvoices(): Promise<readonly Invoice[]> {
        // FIXED: إضافة limit للتحليلات
        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .neq('status', 'cancelled')
            .order('invoice_date', { ascending: false })
            .limit(1000); // FIXED: حد معقول للتحليلات

        if (error) throw error;

        try {
            const validated = parseInvoices(data);
            return validated.map((row) => this.mapFromDb(row));
        } catch (err) {
            throw new AppError('Data integrity violation in active invoices', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    /**
     * Persists an invoice.
     * Note: Expects raw properties, as domain logic is handled in Use Case.
     */
    async createInvoice(params: InvoiceProps, _tx?: ITransactionContext): Promise<Invoice> {
        const { data, error } = await supabase
            .from('invoices')
            .insert({
                patient_id: params.patientId,
                patient_name: params.patientName || null,
                appointment_id: params.appointmentId || null,
                invoice_number: params.invoiceNumber || '',
                invoice_date: params.invoiceDate,
                items: serializeInvoiceItems(params.services),
                subtotal: params.subtotal,
                discount: params.discount,
                discount_reason: params.discountReason || null,
                tax_amount: params.taxAmount ?? 0,
                tax_rate: params.taxRate ?? 0,
                total_amount: params.total,
                payments: serializePayments(params.payments),
                total_paid: params.totalPaid,
                balance: params.balance,
                status: params.status,
                notes: params.notes || null
            })
            .select()
            .single();

        if (error) throw error;
        if (!data) throw new AppError('Failed to create invoice', ErrorCode.INTERNAL_ERROR);

        try {
            const validated = parseInvoice(data);
            return this.mapFromDb(validated);
        } catch (err) {
            throw new AppError('Data integrity violation in created invoice', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async updatePaymentData(id: string, data: {
        readonly totalPaid: number;
        readonly balance: number;
        readonly status: InvoiceStatus;
        readonly payments: readonly Payment[];
    }, _tx?: ITransactionContext): Promise<void> {
        const { error } = await supabase
            .from('invoices')
            .update({
                total_paid: data.totalPaid,
                balance: data.balance,
                status: data.status,
                payments: serializePayments(data.payments)
            })
            .eq('id', id);
        if (error) throw error;
    }

    async updateStatus(id: string, status: InvoiceStatus, _tx?: ITransactionContext): Promise<void> {
        const { error } = await supabase
            .from('invoices')
            .update({ status })
            .eq('id', id);
        if (error) throw error;
    }

    async getNextInvoiceNumber(): Promise<string> {
        const { data, error } = await supabase
            .from('invoices')
            .select('invoice_number')
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();
        if (error) throw error;
        if (!data?.invoice_number) return 'INV-0001';
        const regex = /(\d+)$/;
        const match = regex.exec(data.invoice_number);
        const next = match?.[1]
            ? (parseInt(match[1], 10) + 1).toString().padStart(4, '0')
            : '0001';
        return `INV-${next}`;
    }

    private mapFromDb(row: InvoiceDTO): Invoice {
        try {
            const items = parseInvoiceItems(row.items);
            const payments = parsePaymentRecords(row.payments);

            return Invoice.reconstruct({
                id: row.id,
                patientId: row.patient_id,
                patientName: row.patient_name || '',
                appointmentId: row.appointment_id || undefined,
                invoiceNumber: row.invoice_number || '',
                invoiceDate: row.invoice_date,
                services: items.map(item => ({
                    serviceId: item.service_id ?? undefined,
                    name: item.name,
                    quantity: item.quantity,
                    unitPrice: item.unit_price,
                    total: item.total
                })),
                subtotal: row.subtotal || 0,
                discount: row.discount || 0,
                discountReason: row.discount_reason || undefined,
                taxAmount: row.tax_amount,
                taxRate: row.tax_rate,
                total: row.total_amount,
                payments: payments.map(p => ({
                    amount: p.amount,
                    method: parsePaymentMethod(p.method),
                    date: p.date,
                    notes: p.notes || undefined
                })),
                totalPaid: row.total_paid || 0,
                balance: row.balance || 0,
                status: parseInvoiceStatus(row.status),
                dueDate: undefined,
                notes: row.notes || undefined,
                createdAt: row.created_at,
                updatedAt: row.updated_at
            });
        } catch (err) {
            throw new AppError('JSONB data integrity violation in invoice', ErrorCode.DATA_INTEGRITY_VIOLATION, err);
        }
    }

    async createInstallmentPlan(
        invoiceId: string,
        installments: any[]
    ): Promise<void> {
        const records = installments.map((inst) => ({
            invoice_id: invoiceId,
            patient_id: inst.patientId,
            due_date: typeof inst.dueDate === 'string' ? inst.dueDate : inst.dueDate.toISOString(),
            amount: inst.amount,
            paid_amount: 0,
            status: 'pending' as const,
        }));
        const { error } = await supabase.from('installments').insert(records);
        if (error) throw new AppError(error.message, ErrorCode.INTERNAL_ERROR, 'error');
    }

    async payInstallment(installmentId: string, amount: number): Promise<void> {
        const { error } = await supabase
            .from('installments')
            .update({ paid_amount: amount, paid_date: new Date().toISOString(), status: 'paid' })
            .eq('id', installmentId);
        if (error) throw new AppError(error.message, ErrorCode.INTERNAL_ERROR, 'error');
    }
}

export const billingRepository = new BillingRepository();
