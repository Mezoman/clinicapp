import { describe, it, expect } from 'vitest';
import { success, failure, type AppResult } from './result';

describe('success()', () => {
    it('يجب إرجاع success: true مع البيانات', () => {
        const result = success({ id: '1', name: 'محمد' });
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data).toEqual({ id: '1', name: 'محمد' });
            expect(result.error).toBeUndefined();
        }
    });

    it('يجب دعم القيم البدائية', () => {
        expect(success(42).data).toBe(42);
        expect(success('نص').data).toBe('نص');
        expect(success(true).data).toBe(true);
    });

    it('يجب دعم undefined (void)', () => {
        const result = success(undefined);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toBeUndefined();
    });

    it('يجب دعم null', () => {
        const result = success(null);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toBeNull();
    });

    it('يجب دعم المصفوفات', () => {
        const result = success([1, 2, 3]);
        expect(result.success).toBe(true);
        if (result.success) expect(result.data).toHaveLength(3);
    });
});

describe('failure()', () => {
    it('يجب إرجاع success: false مع رسالة الخطأ', () => {
        const result = failure('حدث خطأ');
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error).toBe('حدث خطأ');
            expect(result.data).toBeUndefined();
        }
    });

    it('يجب دعم رسائل خطأ عربية', () => {
        const result = failure<string>('فشل في جلب البيانات من قاعدة البيانات');
        expect(result.success).toBe(false);
        if (!result.success) expect(result.error).toBe('فشل في جلب البيانات من قاعدة البيانات');
    });

    it('يجب أن يكون data غير موجود في حالة الفشل', () => {
        const result = failure<number>('خطأ');
        expect(result.success).toBe(false);
        // TypeScript narrowing check
        expect((result as any).data).toBeUndefined();
    });
});

describe('AppResult Type Narrowing', () => {
    function processResult(result: AppResult<number>): string {
        if (result.success) {
            return `القيمة: ${result.data}`;
        }
        return `خطأ: ${result.error}`;
    }

    it('يجب التعامل مع النجاح بشكل صحيح', () => {
        expect(processResult(success(100))).toBe('القيمة: 100');
    });

    it('يجب التعامل مع الفشل بشكل صحيح', () => {
        expect(processResult(failure('فشل الاتصال'))).toBe('خطأ: فشل الاتصال');
    });
});
