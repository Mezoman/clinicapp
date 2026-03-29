import { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    CalendarDays,
    FileHeart,
    Receipt,
    Settings,
    Monitor,
    LogOut,
    Sun,
    Moon,
    X,
    ChevronRight,
    ChevronLeft,
    Stethoscope
} from 'lucide-react';
import { CLINIC_INFO } from '../../../constants';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import { useDashboard } from '../../hooks/useDashboard';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const NAV_ITEMS = [
    { path: '/admin',                  label: 'لوحة التحكم',   icon: LayoutDashboard, end: true },
    { path: '/admin/patients',         label: 'المرضى',         icon: Users,           end: false },
    { path: '/admin/appointments',     label: 'المواعيد',       icon: CalendarDays,    end: false },
    { path: '/admin/medical-records',  label: 'السجلات الطبية', icon: FileHeart,       end: false },
    { path: '/admin/billing',          label: 'الفواتير',       icon: Receipt,         end: false },
    { path: '/admin/cms',              label: 'الموقع (CMS)',   icon: Monitor,         end: false },
    { path: '/admin/settings',         label: 'الإعدادات',      icon: Settings,        end: false },
];

interface SidebarProps {
    mobileOpen: boolean;
    setMobileOpen: (open: boolean) => void;
}

export default function Sidebar({ mobileOpen, setMobileOpen }: SidebarProps) {
    const [tabletExpanded, setTabletExpanded] = useState(false);
    const { signOut } = useAuth();
    const { setTheme, effectiveTheme } = useTheme();
    const { kpis } = useDashboard();
    const { isMobile, isTablet } = useBreakpoint();

    useEffect(() => {
        if (!isMobile) setMobileOpen(false);
    }, [isMobile, setMobileOpen]);

    const isCollapsed = isTablet && !tabletExpanded;
    const sidebarWidth = isCollapsed ? 'w-[72px]' : 'w-64';
    const isDark = effectiveTheme === 'dark';

    return (
        <>
            {/* Mobile backdrop */}
            {isMobile && mobileOpen && (
                <button
                    aria-label="إغلاق القائمة"
                    className="fixed inset-0 bg-[var(--bg-overlay)] z-40 w-full cursor-default backdrop-blur-sm"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={`
                    ${isMobile ? 'fixed top-0 right-0 h-full z-50' : 'sticky top-0 h-dvh shrink-0'}
                    ${sidebarWidth}
                    bg-[var(--bg-sidebar)] border-l border-[var(--border-subtle)]
                    flex flex-col transition-all duration-300 ease-in-out shadow-[var(--shadow-sm)]
                    ${isMobile ? (mobileOpen ? 'translate-x-0' : 'translate-x-full') : 'translate-x-0'}
                `}
            >
                {/* ── Brand Header ── */}
                <div className={`flex items-center h-16 px-4 border-b border-[var(--border-subtle)] shrink-0 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="sidebar-brand-icon w-9 h-9 rounded-card flex items-center justify-center shrink-0">
                        <Stethoscope className="w-4.5 h-4.5 text-white" aria-hidden="true" />
                    </div>
                    {!isCollapsed && (
                        <div className="min-w-0 flex-1">
                            <h1 className="text-sm font-bold leading-tight text-[var(--text-primary)] truncate">عيادة الأسنان</h1>
                            <p className="text-xs text-[var(--text-muted)] mt-0.5 truncate">نظام الإدارة المتكامل</p>
                        </div>
                    )}
                    {isMobile && (
                        <button
                            aria-label="إغلاق القائمة"
                            onClick={() => setMobileOpen(false)}
                            className="mr-auto text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-card focus:ring-2 focus:ring-[var(--color-primary-500)]"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* ── Navigation ── */}
                <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto custom-scrollbar mt-1">
                    {NAV_ITEMS.map((item) => {
                        const isAppointments = item.path === '/admin/appointments';
                        const badgeCount = isAppointments ? kpis?.todayPending ?? 0 : 0;
                        const showBadge = badgeCount > 0;

                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                end={item.end}
                                onClick={() => { if (isMobile) setMobileOpen(false); }}
                                title={isCollapsed ? item.label : undefined}
                                className={({ isActive }) =>
                                    `nav-item relative ${isCollapsed ? 'justify-center px-0' : ''} ${isActive ? 'active' : ''}`
                                }
                            >
                                <div className="relative shrink-0">
                                    <item.icon className="w-5 h-5" aria-hidden="true" />
                                    {showBadge && isCollapsed && (
                                        <span className="absolute -top-1.5 -left-1.5 w-4 h-4 flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full border-2 border-[var(--bg-sidebar)]">
                                            {badgeCount > 9 ? '9+' : badgeCount}
                                        </span>
                                    )}
                                </div>
                                {!isCollapsed && (
                                    <>
                                        <span className="flex-1">{item.label}</span>
                                        {showBadge && (
                                            <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-red-500 text-white text-xs font-bold rounded-full">
                                                {badgeCount > 9 ? '9+' : badgeCount}
                                            </span>
                                        )}
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </nav>

                {/* ── Divider ── */}
                <div className="mx-3 h-px bg-[var(--border-subtle)]" />

                {/* ── Footer Actions ── */}
                <div className="p-3 space-y-0.5">
                    {isTablet && (
                        <button
                            onClick={() => setTabletExpanded(!tabletExpanded)}
                            title={tabletExpanded ? 'تصغير القائمة' : 'توسيع القائمة'}
                            className={`nav-item w-full ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            {tabletExpanded
                                ? <ChevronRight className="w-5 h-5 shrink-0" />
                                : <ChevronLeft  className="w-5 h-5 shrink-0" />
                            }
                            {!isCollapsed && <span>تصغير القائمة</span>}
                        </button>
                    )}

                    <button
                        onClick={() => setTheme(isDark ? 'light' : 'dark')}
                        title={isDark ? 'الوضع المضيء' : 'الوضع الليلي'}
                        className={`nav-item w-full ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        {isDark
                            ? <Sun  className="w-5 h-5 shrink-0" />
                            : <Moon className="w-5 h-5 shrink-0" />
                        }
                        {!isCollapsed && <span>{isDark ? 'الوضع المضيء' : 'الوضع الليلي'}</span>}
                    </button>

                    <button
                        onClick={() => signOut()}
                        title={isCollapsed ? 'تسجيل الخروج' : undefined}
                        className={`nav-item w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/15 hover:text-red-600 ${isCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span>تسجيل الخروج</span>}
                    </button>

                    {!isCollapsed && (
                        <p className="text-[11px] text-[var(--text-muted)] text-center pt-2 pb-1 opacity-60 truncate select-none">
                            DCMS v1.0 · {CLINIC_INFO.doctorName}
                        </p>
                    )}
                </div>
            </aside>
        </>
    );
}
