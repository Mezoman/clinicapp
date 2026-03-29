import { InstallmentRepository, installmentRepository } from '../../../infrastructure/repositories/installmentRepository';
import { InstallmentFormData, Installment } from '../../../domain/models';
import { AppResult, success, failure } from '../../result';

export class CreateInstallmentsUseCase {
    constructor(
        private readonly installmentRepo: InstallmentRepository = installmentRepository
    ) { }

    async execute(form: InstallmentFormData): Promise<AppResult<readonly Installment[]>> {
        try {
            const data = await this.installmentRepo.createInstallments(form);
            return success(data);
        } catch (error: any) {
            return failure(error.message || 'فشل في إنشاء الأقساط');
        }
    }
}

export const createInstallmentsUseCase = new CreateInstallmentsUseCase();
