import { Link, useLocation } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

const routeLabels: Record<string, string> = {
    '/admin': 'لوحة التحكم',
    '/admin/patients': 'المرضى',
    '/admin/appointments': 'المواعيد',
    '/admin/billing': 'الفواتير',
    '/admin/cms': 'الموقع (CMS)',
    '/admin/medical-records': 'السجلات الطبية',
    '/admin/settings': 'الإعدادات',
};

export function Breadcrumbs() {
    const location = useLocation();
    const segments = location.pathname.split('/').filter(Boolean);

    const crumbs = segments.reduce<{ to: string; label: string }[]>((acc: { to: string; label: string }[], seg: string, idx: number) => {
        const to = '/' + segments.slice(0, idx + 1).join('/');
        const label = routeLabels[to] ?? seg;
        acc.push({ to, label });
        return acc;
    }, []);

    if (!crumbs.length || !location.pathname.startsWith('/admin')) return null;

    return (
        <nav className="flex items-center gap-2 text-xs font-bold text-secondary-500 mb-4">
            {crumbs.map((crumb: { to: string; label: string }, index: number) => (
                <span key={crumb.to} className="flex items-center gap-2">
                    <ChevronLeft className="w-3 h-3 rotate-rtl" />
                    {index === crumbs.length - 1 ? (
                        <span className="text-primary-600">{crumb.label}</span>
                    ) : (
                        <Link to={crumb.to} className="hover:text-primary-600 transition-colors">
                            {crumb.label}
                        </Link>
                    )}
                </span>
            ))}
        </nav>
    );
}

