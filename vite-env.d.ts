/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    readonly VITE_CLOUDINARY_CLOUD_NAME: string;
    readonly VITE_CLOUDINARY_UPLOAD_PRESET: string;
    readonly VITE_CLINIC_PHONE: string;
    readonly VITE_CLINIC_WHATSAPP: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}

import 'react';

declare module 'react' {
    interface ImgHTMLAttributes<T> {
        fetchPriority?: 'high' | 'low' | 'auto';
    }
}

export {};
