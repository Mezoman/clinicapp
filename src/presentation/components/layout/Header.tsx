import { Search, Bell, ChevronLeft, Clock, User, Calendar, X, Menu } from 'lucide-react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useAppointments } from '../../hooks/useAppointments';
import { useBreakpoint } from '../../hooks/useBreakpoint';

const ROUTE_LABELS: Record<string, string> = {
    '/admin': 'لوحة التحكم',
    '/admin/patients': 'المرضى',
    '/admin/appointments': 'المواعيد',
    '/admin/medical-records': 'السجلات الطبية',
    '/admin/billing': 'الفواتير',
    '/admin/cms': 'الموقع (CMS)',
    '/admin/settings': 'الإعدادات',
};

interface HeaderProps {
    onMenuOpen: () => void;
}

export default function Header({ onMenuOpen }: HeaderProps) {
    const { user } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const { appointments } = useAppointments(undefined, !!user);
    const { isMobile } = useBreakpoint();
    const [query, setQuery] = useState('');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);

    // Get current page label
    const currentPath = location.pathname;
    const currentPageLabel = ROUTE_LABELS[currentPath] ||
        (currentPath.startsWith('/admin/patients/') ? 'ملف المريض' : '');

    // Get user initials
    const getInitials = () => {
        if (user?.displayName) {
            return user.displayName
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
        }
        return 'مس'; // Default for "مسؤول"
    };

    return (
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-[var(--border-color)] px-4 md:px-6 lg:px-8 py-3 md:py-4">
            <div className="flex items-center justify-between">
                <div className="flex flex-col min-w-0 pr-2 flex-1 overflow-hidden">
                    <div className="hidden xs:flex items-center gap-1 md:gap-2 text-xs md:text-sm text-slate-500 mb-0.5 md:mb-1">
                        <Link to="/" className="hover:text-primary transition-colors shrink-0">الرئيسية</Link>
                        {currentPageLabel && currentPath !== '/admin' && (
                            <>
                                <ChevronLeft aria-hidden={true} className="w-3 h-3 shrink-0" />
                                <span className="truncate max-w-[100px] sm:max-w-none">{currentPageLabel}</span>
                            </>
                        )}
                    </div>
                    <h2 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white truncate">
                        {currentPageLabel || 'نظام الإدارة'}
                    </h2>
                </div>

                <div className="flex items-center gap-2 md:gap-4 shrink-0">
                    {/* Mobile Menu Toggle — must be FIRST in the flex row */}
                    {isMobile && (
                        <button
                            aria-label="فتح القائمة"
                            onClick={onMenuOpen}
                            className="w-10 h-10 rounded-card flex items-center justify-center 
                                       text-slate-600 dark:text-slate-400 
                                       hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>
                    )}

                    {/* Desktop Search */}
                    <div className="relative hidden sm:block">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            aria-label="بحث عن مريض"
                            className="bg-slate-100 dark:bg-slate-800 border-none rounded-input pr-10 pl-4 py-2 text-sm focus:ring-2 focus:ring-primary w-48 lg:w-64 transition-all placeholder:text-slate-400 text-slate-900 dark:text-white" 
                            placeholder="بحث عن مريض... (Enter للبحث)" 
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && query.trim()) {
                                    navigate(`/admin/patients?search=${encodeURIComponent(query.trim())}`);
                                    setQuery('');
                                }
                            }}
                        />
                    </div>
                    
                    {/* Mobile Search Toggle */}
                    <button 
                        aria-label="تفعيل البحث"
                        className={`sm:hidden w-10 h-10 rounded-card flex items-center justify-center transition-colors ${showMobileSearch ? 'bg-primary/10 text-primary' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                        onClick={() => setShowMobileSearch(!showMobileSearch)}
                    >
                        {showMobileSearch ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
                    </button>
                    
                    {/* Notifications */}
                    <div className="relative">
                        <button 
                            aria-label="الإشعارات"
                            aria-expanded={showNotifications}
                            aria-haspopup="true"
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`w-10 h-10 rounded-card flex items-center justify-center transition-colors relative ${showNotifications ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-primary focus:ring-2 focus:ring-primary'}`}
                        >
                            <Bell className="w-5 h-5" />
                            {appointments.length > 0 && (
                                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center bg-red-500 text-xs font-black text-white rounded-full border-2 border-white dark:border-slate-900 animate-in zoom-in font-numbers">
                                    {appointments.length}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <>
                                <button
                                    aria-label="إغلاق الإشعارات"
                                    className="fixed inset-0 z-40 w-full cursor-default" 
                                    onClick={() => setShowNotifications(false)}
                                />
                                <div className="absolute left-0 sm:left-auto right-auto sm:-right-4 mt-3 w-[calc(100vw-2rem)] sm:w-80 max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-panel shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-4 duration-300 origin-top-left sm:origin-top-right">
                                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white">مواعيد اليوم</h3>
                                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full font-numbers">{appointments.length} مواعيد</span>
                                    </div>
                                    <div className="max-h-80 sm:max-h-96 overflow-y-auto custom-scrollbar">
                                        {appointments.length > 0 ? (
                                            <div className="divide-y divide-slate-50 dark:divide-slate-800">
                                                {appointments.map((apt) => (
                                                    <Link 
                                                        key={apt.id} 
                                                        to="/admin/appointments"
                                                        onClick={() => setShowNotifications(false)}
                                                        className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                                    >
                                                        <div className="w-10 h-10 shrink-0 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                                            <User className="w-5 h-5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-xs font-black text-slate-900 dark:text-white truncate">{apt.patientName}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Clock className="w-3 h-3 text-slate-400" />
                                                                <span className="text-[10px] font-bold text-slate-500 font-numbers">{apt.time}</span>
                                                            </div>
                                                        </div>
                                                        <ChevronLeft className="w-4 h-4 text-slate-300 group-hover:text-primary transition-colors shrink-0" />
                                                    </Link>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="p-8 text-center bg-slate-50/30">
                                                <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                                                <p className="text-xs font-bold text-slate-400">لا توجد مواعيد اليوم</p>
                                            </div>
                                        )}
                                    </div>
                                    <Link 
                                        to="/admin/appointments"
                                        onClick={() => setShowNotifications(false)}
                                        className="block p-3 md:p-4 text-center text-xs md:text-sm font-black text-primary hover:bg-primary/5 transition-colors border-t border-slate-100 dark:border-slate-800 uppercase tracking-widest"
                                    >
                                        عرض كافة المواعيد
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>

                    <div 
                        className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center text-primary font-bold text-sm cursor-pointer hover:bg-primary/20 transition-colors shrink-0"
                        title={user?.displayName || user?.email || ''}
                    >
                        {getInitials()}
                    </div>
                </div>
            </div>

            {/* Mobile Search Dropdown */}
            {showMobileSearch && (
                <div className="sm:hidden absolute top-full left-0 w-full p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 animate-in slide-in-from-top-2 z-40 shadow-xl">
                    <div className="relative">
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                        <input 
                            aria-label="بحث عن مريض"
                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-input pr-10 pl-4 py-3 text-sm focus:ring-2 focus:ring-primary transition-all placeholder:text-slate-400 text-slate-900 dark:text-white shadow-inner" 
                            placeholder="بحث عن مريض... (Enter للبحث)" 
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && query.trim()) {
                                    navigate(`/admin/patients?search=${encodeURIComponent(query.trim())}`);
                                    setQuery('');
                                    setShowMobileSearch(false);
                                }
                            }}
                            autoFocus
                        />
                    </div>
                </div>
            )}
        </header>
    );
}
