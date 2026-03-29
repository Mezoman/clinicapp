import { describe, it, expect } from 'vitest';
import { uploadToCloudinary } from './cloudinary';

describe('Cloudinary Service Validation', () => {
    it('should throw an error if file size exceeds 5MB', async () => {
        // إنشاء ملف بحجم 6 ميجابايت (نجتاز الحد الأقصى)
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large_image.jpg', { type: 'image/jpeg' });

        await expect(uploadToCloudinary(largeFile)).rejects.toThrow('حجم الملف يتجاوز الحد الأقصى (5 ميجابايت).');
    });

    it('should throw an error if file type is not supported', async () => {
        // إنشاء ملف بنوع غير مقول (مثلاً PDF)
        const invalidFile = new File(['dummy content'], 'document.pdf', { type: 'application/pdf' });

        await expect(uploadToCloudinary(invalidFile)).rejects.toThrow('نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG أو PNG أو WEBP.');
    });
});
