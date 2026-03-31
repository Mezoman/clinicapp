import { createClient } from '@supabase/supabase-js';
import { configService } from '../config/ConfigService';
import type { Database } from '../../database.types';

const supabaseUrl = configService.supabaseUrl;
const supabaseAnonKey = configService.supabaseAnonKey;

// Supports both Legacy JWT keys (eyJ...) and new Publishable keys (sb_publishable_...)
const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        storageKey: 'dcms-auth-token',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    },
    realtime: {
        params: { eventsPerSecond: 10 },
    },
    global: {
        headers: { 'x-app-name': 'dcms' },
    },
});

export { supabase };

// ══════════════════════════════════════════════════════════════════
// Dedicated PUBLIC Client (0 events/sec)
// Optimized for anonymous landing/booking pages
// ══════════════════════════════════════════════════════════════════
export const supabasePublic = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 0 } },
    global: { headers: { 'x-app-name': 'dcms-public' } },
});