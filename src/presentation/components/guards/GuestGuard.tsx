import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { ReactNode } from 'react';

// ═══════════════════════════════════════════════
// Guest Guard — Redirects authenticated users
// ═══════════════════════════════════════════════

interface GuestGuardProps {
    children: ReactNode;
}

export function GuestGuard({ children }: GuestGuardProps) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-secondary-50">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-secondary-500 text-sm">جاري التحميل...</p>
                </div>
            </div>
        );
    }

    if (user) {
        return <Navigate to="/admin" replace />;
    }

    return <>{children}</>;
}
