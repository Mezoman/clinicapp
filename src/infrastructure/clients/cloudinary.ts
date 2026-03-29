import { configService } from '../config/ConfigService';

const cloudinaryCloudName = configService.cloudinaryCloudName;
const uploadPreset = configService.cloudinaryUploadPreset;

export interface CloudinaryResponse {
    secure_url: string;
    public_id: string;
    format: string;
    resource_type: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadToCloudinary(file: File): Promise<CloudinaryResponse> {
    if (!cloudinaryCloudName || !uploadPreset) {
        throw new Error('Cloudinary configuration missing');
    }

    // فحص حجم الملف (أقصى حد 5MB)
    if (file.size > MAX_FILE_SIZE) {
        throw new Error('حجم الملف يتجاوز الحد الأقصى (5 ميجابايت).');
    }

    // فحص نوع الملف
    if (!ACCEPTED_TYPES.includes(file.type)) {
        throw new Error('نوع الملف غير مدعوم. يرجى رفع صورة بصيغة JPEG أو PNG أو WEBP.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', uploadPreset);

    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudinaryCloudName}/upload`,
        {
            method: 'POST',
            body: formData,
        }
    );

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
    }

    return response.json();
}
