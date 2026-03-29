import { InstallmentRepository, installmentRepository } from '../../../infrastructure/repositories/installmentRepository';
import { Installment } from '../../../domain/models';
import { AppResult, success, failure } from '../../result';

export class GetInstallmentsUseCase {
    constructor(
        private readonly installmentRepo: InstallmentRepository = installmentRepository
    ) { }

    async execute(invoiceId: string): Promise<AppResult<readonly Installment[]>> {
        try {
            const data = await this.installmentRepo.getByInvoiceId(invoiceId);
            return success(data);
        } catch (error: any) {
            return failure(error.message || 'فشل في جلب الأقساط');
        }
    }
}

export const getInstallmentsUseCase = new GetInstallmentsUseCase();
