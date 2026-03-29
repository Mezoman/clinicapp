import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout() {
    const [mobileOpen, setMobileOpen] = useState(false);
    const location = useLocation();

    // Close sidebar automatically when navigating between pages
    useEffect(() => {
        setMobileOpen(false);
    }, [location.pathname]);

    return (
        <div className="flex h-dvh overflow-hidden bg-[var(--bg-page)] text-[var(--text-primary)]" dir="rtl">
            <Sidebar 
                mobileOpen={mobileOpen} 
                setMobileOpen={setMobileOpen} 
            />
            <div className="flex-1 flex flex-col min-w-0 relative">
                <Header onMenuOpen={() => setMobileOpen(true)} />
                <main
                    key={location.pathname}
                    className="flex-1 overflow-y-auto page-transition p-4 md:p-6 lg:p-8 custom-scrollbar"
                >
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
