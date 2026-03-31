import { supabase } from './supabase';
import type { User } from '@supabase/supabase-js';
import type { AdminUser, AdminRole } from '../../domain/models';

// ═══════════════════════════════════════════════
// Authentication Service (Supabase)
// ═══════════════════════════════════════════════

export async function signIn(email: string, password: string): Promise<AdminUser> {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) throw error;
    if (!data.user) throw new Error('فشل تسجيل الدخول');

    const adminUser = await getAdminUser(data.user.id);
    if (!adminUser) {
        await supabase.auth.signOut();
        throw new Error('ليس لديك صلاحية للوصول إلى لوحة التحكم');
    }
    return adminUser;
}

export async function signOut(): Promise<void> {
    await supabase.auth.signOut();
}

export async function getAdminUser(uid: string): Promise<AdminUser | null> {
    const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', uid)
        .maybeSingle();

    if (error || !data) return null;

    return {
        uid: data.id,
        email: data.email,
        role: data.role as AdminRole,
        createdAt: data.created_at,
        ...(data.display_name ? { displayName: data.display_name } : {})
    };
}

export function subscribeToAuthState(
    callback: (user: User | null) => void
): () => void {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session?.user ?? null);
    });

    return () => {
        subscription.unsubscribe();
    };
}

// FIXED: نُقل من AdminLogin.tsx لاحترام Clean Architecture
// ويسهّل الاختبار الوحدوي لهذه العملية
export async function resetPasswordForEmail(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/admin/login`
    });
    if (error) throw error;
}
