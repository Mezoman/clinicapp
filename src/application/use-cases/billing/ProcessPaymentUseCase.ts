import { billingRepository } from '../../../infrastructure/repositories/billingRepository';
import { unitOfWork } from '../../../infrastructure/unit-of-work/SupabaseUnitOfWork';
import { logger } from '../../../utils/logger';
import { AppResult, success, failure } from '../../result';
import { InvoiceDTO, ProcessPaymentDTO } from '../../dtos/billing.dto';
import { BillingMapper } from '../../mappers/billing.mapper';
import { mapDomainErrorToUIMessage } from '../../mappers/error.mapper';

export class ProcessPaymentUseCase {
    /**
     * Orchestrates the registration of a new payment.
     * Delegates business rules to the Invoice domain model.
     */
    async execute(invoiceId: string, paymentDto: ProcessPaymentDTO): Promise<AppResult<InvoiceDTO>> {
        return unitOfWork.run(async (tx) => {
            try {
                // 1. Fetch current domain model
                const invoice = await billingRepository.getById(invoiceId, tx);
                if (!invoice) return failure('الفاتورة غير موجودة');

                // 2. Perform business logic
                const updatedInvoice = invoice.applyPayment({
                    amount: paymentDto.amount,
                    method: paymentDto.method,
                    date: new Date().toISOString(),
                    notes: paymentDto.notes
                });

                // 3. Persist updated state
                const props = updatedInvoice.toProps();
                await billingRepository.updatePaymentData(invoiceId, {
                    totalPaid: props.totalPaid,
                    balance: props.balance,
                    status: props.status,
                    payments: props.payments
                }, tx);

                // 4. Return updated DTO
                const finalSaved = await billingRepository.getById(invoiceId, tx);
                if (!finalSaved) return failure('فشل في استرجاع الفاتورة المحدثة');

                return success(BillingMapper.toInvoiceDTO(finalSaved));
            } catch (err) {
                logger.error(`[ProcessPaymentUseCase] Error: ${err}`);
                return failure(mapDomainErrorToUIMessage(err));
            }
        });
    }
}

export const processPaymentUseCase = new ProcessPaymentUseCase();
