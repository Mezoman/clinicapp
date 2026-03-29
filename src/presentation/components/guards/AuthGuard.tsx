import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ReactNode } from 'react';

// ═══════════════════════════════════════════════
// Auth Guard — Protects admin routes
// ═══════════════════════════════════════════════

interface AuthGuardProps {
    children: ReactNode;
    requiredRole?: 'admin' | 'super_admin' | 'receptionist';
}

export function AuthGuard({ children, requiredRole }: AuthGuardProps) {
    const { user, loading } = useAuth();
    const location = useLocation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-secondary-500 text-sm">جاري التحقق...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/admin/login" state={{ from: location }} replace />;
    }

    if (requiredRole) {
        const hasAccess =
            requiredRole === 'receptionist'
                ? true // all roles can access receptionist pages
                : requiredRole === 'admin'
                    ? user.role === 'admin' || user.role === 'super_admin'
                    : user.role === 'super_admin';

        if (!hasAccess) {
            return <Navigate to="/admin" replace />;
        }
    }

    return <>{children}</>;
}
