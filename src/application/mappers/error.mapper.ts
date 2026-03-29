import { DomainError } from '../../domain/errors';

/**
 * Maps Domain-specific errors to localized Arabic messages for the UI.
 * This ensures the UI never sees raw domain error keys.
 */
export function mapDomainErrorToUIMessage(error: unknown): string {
    if (error instanceof DomainError) {
        switch (error.code) {
            case 'OVERPAYMENT_NOT_ALLOWED':
                return 'عذراً، لا يمكن دفع مبلغ أكبر من الرصيد المتبقي بالفاتورة.';
            case 'INVALID_OPERATION':
                return 'هذه العملية غير مسموح بها حالياً.';
            case 'SLOT_ALREADY_LOCKED':
                return 'عذراً، هذا الموعد تم حجزه مؤخراً من قبل شخص آخر.';
            case 'LIMIT_EXCEEDED':
                return 'تم الوصول للحد الأقصى لعدد المواعيد لهذا اليوم.';
            default:
                return error.message || 'حدث خطأ غير متوقع في النظام.';
        }
    }

    if (error instanceof Error) {
        return error.message;
    }

    return 'حدث خطأ غير معروف.';
}
