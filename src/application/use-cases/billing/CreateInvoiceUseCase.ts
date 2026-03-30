import { Invoice } from '../../../domain/models';
import { billingRepository } from '../../../infrastructure/repositories/billingRepository';
import { unitOfWork } from '../../../infrastructure/unit-of-work/SupabaseUnitOfWork';
import { logger } from '../../../utils/logger';
import { AppResult, success, failure } from '../../result';
import { InvoiceDTO, CreateInvoiceDTO } from '../../dtos/billing.dto';
import { BillingMapper } from '../../mappers/billing.mapper';
import { mapDomainErrorToUIMessage } from '../../mappers/error.mapper';


export class CreateInvoiceUseCase {
    /**
     * Orchestrates the creation of a new invoice.
     * Enforces domain invariants and coordinates persistence within a transaction.
     */
    async execute(input: CreateInvoiceDTO): Promise<AppResult<InvoiceDTO>> {
        return unitOfWork.run(async (tx) => {
            logger.info(`[CreateInvoiceUseCase] Initiating invoice creation for patient: ${input.patientId}`);

            try {
                const { notes, ...rest } = input;
                const invoice = Invoice.create({
                    id: 'draft',
                    patientId: rest.patientId,
                    patientName: rest.patientName,
                    invoiceNumber: 'AUTO',
                    invoiceDate: rest.invoiceDate,
                    services: rest.services.map(s => ({
                        serviceId: s.serviceId,
                        name: s.name,
                        quantity: s.quantity,
                        unitPrice: s.unitPrice,
                        total: s.unitPrice * s.quantity
                    })),
                    discount: rest.discount ?? 0, // Added default for discount
                    taxAmount: rest.taxAmount,
                    taxRate: rest.taxRate,
                    discountReason: rest.discountReason,
                    ...(notes === undefined ? {} : { notes })
                });

                // 2. Persist via repository
                const savedInvoice = await billingRepository.createInvoice(invoice.toProps(), tx);

                logger.info(`[CreateInvoiceUseCase] Invoice created successfully: ${savedInvoice.invoiceNumber}`);

                return success(BillingMapper.toInvoiceDTO(savedInvoice));
            } catch (err) {
                logger.error(`[CreateInvoiceUseCase] Error: ${err}`);
                return failure(mapDomainErrorToUIMessage(err));
            }
        });
    }
}

export const createInvoiceUseCase = new CreateInvoiceUseCase();
