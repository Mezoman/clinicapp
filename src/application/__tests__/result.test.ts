// src/application/__tests__/result.test.ts
import { describe, it, expect } from 'vitest';
import { success, failure } from '../result';

describe('success()', () => {
    it('يجب إرجاع success: true مع البيانات', () => {
        const result = success({ id: '1', name: 'محمد' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual({ id: '1', name: 'محمد' });
        }
    });
});

describe('failure()', () => {
    it('يجب إرجاع success: false مع رسالة الخطأ', () => {
        const result = failure('حدث خطأ');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe('حدث خطأ');
        }
    });
});
