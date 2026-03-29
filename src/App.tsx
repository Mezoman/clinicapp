import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './presentation/hooks/useAuth';
import { ThemeProvider } from './presentation/hooks/useTheme';
import { CMSProvider } from './presentation/context/CMSContext';
import { AuthGuard } from './presentation/components/guards/AuthGuard';
import { GuestGuard } from './presentation/components/guards/GuestGuard';
import ErrorBoundary from './presentation/components/ErrorBoundary';
import HomeSkeleton from './presentation/pages/public/HomeSkeleton';

// ═══════════════════════════════════════════════
// Lazy-loaded Pages
// ═══════════════════════════════════════════════

// Public
const Home = lazy(() => import('./presentation/pages/public/Home'));
const Booking = lazy(() => import('./presentation/pages/public/Booking'));

// Auth
const AdminLogin = lazy(() => import('./presentation/pages/auth/AdminLogin'));

// Admin
const AdminLayout = lazy(() => import('./presentation/components/layout/AdminLayout'));
const Dashboard = lazy(() => import('./presentation/pages/admin/Dashboard'));
const Patients = lazy(() => import('./presentation/pages/admin/Patients'));
const PatientProfile = lazy(() => import('./presentation/pages/admin/PatientProfile'));
const Appointments = lazy(() => import('./presentation/pages/admin/Appointments'));
const MedicalRecords = lazy(() => import('./presentation/pages/admin/MedicalRecords'));
const Billing = lazy(() => import('./presentation/pages/admin/Billing'));
const CMSManager = lazy(() => import('./presentation/pages/admin/CMSManager'));
const Settings = lazy(() => import('./presentation/pages/admin/Settings'));

// ═══════════════════════════════════════════════
// Loading Fallback
// ═══════════════════════════════════════════════

// Unused import removed for performance/TS compliance
// ═══════════════════════════════════════════════
// AppRoutes — resets ErrorBoundary on navigation
// ═══════════════════════════════════════════════

function AppRoutes() {
    const location = useLocation();
    return (
        <Routes>
            {/* ── Public Routes ── */}
            <Route path="/" element={<ErrorBoundary key="home" pageName="Home"><Home /></ErrorBoundary>} />
            <Route path="/booking" element={<ErrorBoundary key="booking" pageName="Booking"><Booking /></ErrorBoundary>} />

            {/* ── Auth Routes ── */}
            <Route
                path="/admin/login"
                element={
                    <GuestGuard>
                        <ErrorBoundary key="admin-login" pageName="AdminLogin">
                            <AdminLogin />
                        </ErrorBoundary>
                    </GuestGuard>
                }
            />

            {/* ── Admin Routes ── */}
            <Route
                path="/admin"
                element={
                    <AuthGuard>
                        <ErrorBoundary pageName="AdminLayout">
                            <Suspense fallback={
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    minHeight: '200px', background: 'transparent'
                                }}>
                                    <div style={{
                                        width: '1.5rem', height: '1.5rem',
                                        border: '2px solid var(--border-color)',
                                        borderTopColor: 'var(--color-primary-500)',
                                        borderRadius: '50%',
                                        animation: 'spin 0.6s linear infinite'
                                    }} />
                                </div>
                            }>
                                <AdminLayout />
                            </Suspense>
                        </ErrorBoundary>
                    </AuthGuard>
                }
            >
                <Route
                    index
                    element={
                        <ErrorBoundary key="dashboard" pageName="Dashboard">
                            <Dashboard />
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="patients"
                    element={
                        <AuthGuard requiredRole="admin">
                            <ErrorBoundary key="patients" pageName="Patients">
                                <Patients />
                            </ErrorBoundary>
                        </AuthGuard>
                    }
                />
                <Route
                    path="patients/:id"
                    element={
                        <AuthGuard requiredRole="admin">
                            <ErrorBoundary key={location.pathname} pageName="PatientProfile">
                                <PatientProfile />
                            </ErrorBoundary>
                        </AuthGuard>
                    }
                />
                <Route
                    path="appointments"
                    element={
                        <ErrorBoundary key="appointments" pageName="Appointments">
                            <Appointments />
                        </ErrorBoundary>
                    }
                />
                <Route
                    path="medical-records"
                    element={
                        <AuthGuard requiredRole="admin">
                            <ErrorBoundary key="medical-records" pageName="MedicalRecords">
                                <MedicalRecords />
                            </ErrorBoundary>
                        </AuthGuard>
                    }
                />
                <Route
                    path="billing"
                    element={
                        <AuthGuard requiredRole="admin">
                            <ErrorBoundary key="billing" pageName="Billing">
                                <Billing />
                            </ErrorBoundary>
                        </AuthGuard>
                    }
                />
                <Route
                    path="cms"
                    element={
                        <AuthGuard requiredRole="admin">
                            <ErrorBoundary key="cms" pageName="CMSManager">
                                <CMSManager />
                            </ErrorBoundary>
                        </AuthGuard>
                    }
                />
                <Route
                    path="settings"
                    element={
                        <AuthGuard requiredRole="super_admin">
                            <ErrorBoundary key="settings" pageName="Settings">
                                <Settings />
                            </ErrorBoundary>
                        </AuthGuard>
                    }
                />
            </Route>

            {/* ── Catch All ── */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}

// ═══════════════════════════════════════════════
// App
// ═══════════════════════════════════════════════

export default function App() {
    return (
        <BrowserRouter>
            <ThemeProvider>
                <AuthProvider>
                    <Toaster
                        position="top-center"
                        dir="rtl"
                        aria-live="polite"
                        toastOptions={{
                            style: {
                                fontFamily: 'Noto Sans Arabic, sans-serif',
                            },
                        }}
                        richColors
                        closeButton
                    />

                    <CMSProvider>
                        <Suspense fallback={<HomeSkeleton />}>
                            <AppRoutes />
                        </Suspense>
                    </CMSProvider>
                </AuthProvider>
            </ThemeProvider>
        </BrowserRouter>
    );
}
