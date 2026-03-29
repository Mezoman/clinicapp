import { createContext, useContext, useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import type { AuthStateDTO } from '../../application/dtos/auth.dto';
import { signIn as authSignIn, signOut as authSignOut, getAdminUser, subscribeToAuthState } from '../../infrastructure/clients/auth';
import type { AppResult } from '../../application/result';

// ═══════════════════════════════════════════════
// Auth Context
// ═══════════════════════════════════════════════

interface AuthContextType extends AuthStateDTO {
    signIn: (email: string, password: string) => Promise<AppResult<void>>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ═══════════════════════════════════════════════
// Auth Provider
// ═══════════════════════════════════════════════

export function AuthProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<AuthStateDTO>({
        user: null,
        loading: true,
        error: null,
    });
    const location = useLocation();
    
    // Define public routes
    const isPublicRoute = useMemo(() => {
        return ['/', '/booking'].includes(location.pathname);
    }, [location.pathname]);

    useEffect(() => {
        const unsubscribe = subscribeToAuthState(async (user) => {
            if (user) {
                // Optimization: Skip full admin data fetch on public routes if we don't have it yet
                // We provide a minimal user object to satisfy the UI without hitting the DB
                if (isPublicRoute && !state.user) {
                    setState({ 
                        user: { uid: user.id, email: user.email!, role: 'admin', createdAt: user.created_at }, 
                        loading: false, 
                        error: null 
                    });
                    return;
                }
                
                try {
                    const adminUser = await getAdminUser(user.id);
                    setState({ user: adminUser, loading: false, error: null });
                } catch {
                    setState({ user: null, loading: false, error: 'فشل في تحميل بيانات المستخدم' });
                }
            } else {
                setState({ user: null, loading: false, error: null });
            }
        });

        return unsubscribe;
    }, [isPublicRoute]); // Re-subscribe or re-evaluate when route type changes

    const signIn = useCallback(async (email: string, password: string): Promise<AppResult<void>> => {
        setState((prev: AuthStateDTO) => ({ ...prev, loading: true, error: null }));
        try {
            const adminUser = await authSignIn(email, password);
            setState({ user: adminUser, loading: false, error: null });
            return { success: true, data: undefined as void } as const;
        } catch (err) {
            const message = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
            let arabicMessage = message;

            if (message.includes('Invalid login credentials')) {
                arabicMessage = 'البريد الإلكتروني أو كلمة المرور غير صحيحة';
            } else if (message.includes('Too many requests')) {
                arabicMessage = 'تم تجاوز عدد المحاولات المسموحة. يرجى المحاولة لاحقاً';
            } else if (message.includes('Email not confirmed')) {
                arabicMessage = 'البريد الإلكتروني غير مؤكد';
            }

            setState((prev: AuthStateDTO) => ({ ...prev, loading: false, error: arabicMessage }));
            return { success: false, error: arabicMessage } as const;
        }
    }, []);

    const signOut = useCallback(async () => {
        setState((prev: AuthStateDTO) => ({ ...prev, loading: true }));
        await authSignOut();
        setState({ user: null, loading: false, error: null });
    }, []);

    return (
        <AuthContext.Provider value={{ ...state, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

// ═══════════════════════════════════════════════
// Hook
// ═══════════════════════════════════════════════

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}

// Helper to check roles
export function useIsAdmin(): boolean {
    const { user } = useAuth();
    return user?.role === 'admin' || user?.role === 'super_admin';
}

export function useIsSuperAdmin(): boolean {
    const { user } = useAuth();
    return user?.role === 'super_admin';
}
