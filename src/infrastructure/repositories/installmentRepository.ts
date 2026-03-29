import { supabase } from '../clients/supabase';
import type { Installment, InstallmentFormData, InstallmentStatus } from '../../domain/models';
import { parseInstallments, type InstallmentDTO } from '../contracts/installment.contract';
import { AppError, ErrorCode } from '../../lib/errors';

export class InstallmentRepository {
    async getByInvoiceId(invoiceId: string): Promise<readonly Installment[]> {
        const { data, error } = await supabase
            .from('installments')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return parseInstallments(data).map((row) => this.mapFromDb(row));
    }

    async getByPatientId(patientId: string): Promise<readonly Installment[]> {
        const { data, error } = await supabase
            .from('installments')
            .select('*')
            .eq('patient_id', patientId)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return parseInstallments(data).map((row) => this.mapFromDb(row));
    }

    async getOverdue(): Promise<readonly Installment[]> {
        const today = new Date().toISOString().split('T')[0];
        const { data, error } = await supabase
            .from('installments')
            .select('*')
            .eq('paid', false)
            .lt('due_date', today)
            .order('due_date', { ascending: true });

        if (error) throw error;
        return parseInstallments(data).map((row) => this.mapFromDb(row));
    }

    async createInstallments(form: InstallmentFormData): Promise<readonly Installment[]> {
        // Guard: منع التكرار على مستوى الـ repository
        const existing = await this.getByInvoiceId(form.invoiceId);
        if (existing.length > 0) {
            throw new AppError(
                "توجد خطة تقسيط بالفعل لهذه الفاتورة",
                ErrorCode.VALIDATION_ERROR
            );
        }

        const amountPerInstallment = parseFloat(
            (form.totalAmount / form.numberOfInstallments).toFixed(2)
        );

        const firstDate = new Date(form.firstDueDate);
        const rows = Array.from({ length: form.numberOfInstallments }, (_, i) => {
            const dueDate = new Date(firstDate);
            dueDate.setMonth(dueDate.getMonth() + i);
            return {
                invoice_id: form.invoiceId,
                patient_id: form.patientId,
                amount: amountPerInstallment,
                due_date: dueDate.toISOString().split('T')[0]!,
                paid: false,
            };
        });

        const { data, error } = await supabase
            .from('installments')
            .insert(rows)
            .select();

        if (error) throw error;
        return parseInstallments(data).map((row) => this.mapFromDb(row));
    }

    async markAsPaid(installmentId: string, paidDate?: string): Promise<void> {
        const { error } = await supabase
            .from('installments')
            .update({
                paid: true,
                paid_date: paidDate ?? new Date().toISOString().split('T')[0]!
            })
            .eq('id', installmentId);

        if (error) throw error;
    }

    async deleteByInvoiceId(invoiceId: string): Promise<void> {
        const { error } = await supabase
            .from('installments')
            .delete()
            .eq('invoice_id', invoiceId);

        if (error) throw error;
    }

    private mapFromDb(row: InstallmentDTO): Installment {
        const today = new Date().toISOString().split('T')[0]!;
        let status: InstallmentStatus = 'pending';
        if (row.paid) {
            status = 'paid';
        } else if (row.due_date < today) {
            status = 'overdue';
        }

        return {
            id: row.id,
            invoiceId: row.invoice_id,
            patientId: row.patient_id,
            amount: row.amount,
            dueDate: row.due_date,
            paidDate: row.paid_date || undefined,
            paid: row.paid,
            notes: row.notes || undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            status,
        };
    }
}

export const installmentRepository = new InstallmentRepository();
