import { billingRepository } from '../../../infrastructure/repositories/billingRepository';
import { BillingMapper } from '../../mappers/billing.mapper';
import { InvoiceDTO } from '../../dtos/billing.dto';
import { AppResult, success, failure } from '../../result';

export class GetInvoicesUseCase {
    async execute(params?: { patientId?: string }): Promise<AppResult<readonly InvoiceDTO[]>> {
        try {
            const { invoices } = await billingRepository.getInvoices(params);
            const dtos = invoices.map(BillingMapper.toInvoiceDTO);
            return success(dtos);
        } catch (err) {

            return failure('فشل في تحميل الفواتير');
        }
    }
}

export const getInvoicesUseCase = new GetInvoicesUseCase();
