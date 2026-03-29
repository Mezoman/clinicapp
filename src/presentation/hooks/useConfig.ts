import { configService } from '../../infrastructure/config/ConfigService';

export function useConfig() {
    return {
        supabaseUrl: configService.supabaseUrl,
        supabaseAnonKey: configService.supabaseAnonKey,
        cloudinaryCloudName: configService.cloudinaryCloudName,
        cloudinaryUploadPreset: configService.cloudinaryUploadPreset,
    };
}
