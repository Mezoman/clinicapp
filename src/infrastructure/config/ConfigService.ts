import { validateEnv, type ValidatedEnv } from './env';

class ConfigService {
    private readonly env: ValidatedEnv;

    constructor() {
        this.env = validateEnv();
    }

    get supabaseUrl(): string {
        return this.env.VITE_SUPABASE_URL;
    }

    get supabaseAnonKey(): string {
        return this.env.VITE_SUPABASE_ANON_KEY;
    }

    get cloudinaryCloudName(): string {
        return this.env.VITE_CLOUDINARY_CLOUD_NAME;
    }

    get cloudinaryUploadPreset(): string {
        return this.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    }

}

export const configService = new ConfigService();
