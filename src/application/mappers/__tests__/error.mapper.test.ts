// src/application/mappers/__tests__/error.mapper.test.ts
import { describe, it, expect } from 'vitest';
import { mapDomainErrorToUIMessage } from '../error.mapper';
import { DomainError } from '../../../domain/errors';

describe('mapDomainErrorToUIMessage()', () => {
    describe('DomainError codes المعروفة', () => {
        it('OVERPAYMENT_NOT_ALLOWED → رسالة عربية واضحة', () => {
            const err = new DomainError('OVERPAYMENT_NOT_ALLOWED', 'Overpayment');
            expect(mapDomainErrorToUIMessage(err)).toContain('لا يمكن دفع مبلغ أكبر');
        });

        it('INVALID_OPERATION → رسالة عربية واضحة', () => {
            const err = new DomainError('INVALID_OPERATION', 'Invalid');
            expect(mapDomainErrorToUIMessage(err)).toContain('غير مسموح');
        });

        it('كود غير معروف بدون message → رسالة افتراضية', () => {
            const err = new DomainError('UNKNOWN_CODE', '');
            expect(mapDomainErrorToUIMessage(err)).toBe('حدث خطأ غير متوقع في النظام.');
        });
    });

    describe('Error عادي (غير DomainError)', () => {
        it('Error عادي → يُرجع message الخطأ', () => {
            const err = new Error('connection timeout');
            expect(mapDomainErrorToUIMessage(err)).toBe('connection timeout');
        });
    });
});
