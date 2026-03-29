import { Calendar, X, Search } from 'lucide-react';
import { INVOICE_STATUS_MAP } from '../../../constants';
import { formatCurrency } from '../../../utils/formatters';

interface BillingFiltersState {
    status: string;
    dateFrom: string;
    dateTo: string;
    search: string;
}

interface BillingFiltersProps {
    filters: BillingFiltersState;
    onFilterChange: (newFilters: BillingFiltersState) => void;
    stats: Record<string, { count: number; total: number }>;
}

export default function BillingFilters({ filters, onFilterChange, stats }: BillingFiltersProps) {
    const statusEntries = [
        { id: 'all', label: 'الكل' },
        { id: 'overdue', label: 'المتأخرون', color: 'text-red-600', bgColor: 'bg-red-50' },
        ...Object.entries(INVOICE_STATUS_MAP).map(([id, info]) => ({
            id,
            label: info.label,
            color: info.color,
            bgColor: info.bgColor
        }))
    ];

    return (
        <div className="bg-white dark:bg-secondary-900 rounded-3xl p-6 shadow-sm border border-secondary-100 dark:border-secondary-800 space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-secondary-400" />
                    <input
                        type="text"
                        placeholder="ابحث باسم المريض أو رقم الفاتورة..."
                        value={filters.search}
                        onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
                        className="w-full bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-50 dark:border-secondary-700 rounded-2xl px-12 py-3.5 outline-none focus:border-primary-500 focus:bg-white transition-all font-bold text-secondary-900 dark:text-white"
                    />
                    {filters.search && (
                        <button
                            onClick={() => onFilterChange({ ...filters, search: '' })}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary-200 dark:hover:bg-secondary-700 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4 text-secondary-500" />
                        </button>
                    )}
                </div>

                {/* Date Range */}
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                            type="date"
                            value={filters.dateFrom}
                            onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
                            className="bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-50 dark:border-secondary-700 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-secondary-900 dark:text-white focus:border-primary-500 transition-all"
                        />
                    </div>
                    <span className="text-secondary-400 text-xs">إلى</span>
                    <div className="relative">
                        <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary-400" />
                        <input
                            type="date"
                            value={filters.dateTo}
                            onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
                            className="bg-secondary-50 dark:bg-secondary-800 border-2 border-secondary-50 dark:border-secondary-700 rounded-xl pr-9 pl-3 py-2 text-xs font-bold text-secondary-900 dark:text-white focus:border-primary-500 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="flex flex-nowrap overflow-x-auto gap-2 pb-2 custom-scrollbar">
                {statusEntries.map((status) => (
                    <button
                        key={status.id}
                        onClick={() => onFilterChange({ ...filters, status: status.id })}
                        className={`
                            px-4 py-3 rounded-2xl text-xs font-black transition-all flex flex-col items-center gap-1 border-2 min-w-[100px]
                            ${filters.status === status.id
                                ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-200 dark:shadow-none'
                                : 'bg-white dark:bg-secondary-900 border-secondary-50 dark:border-secondary-800 text-secondary-500 hover:border-primary-200'}
                        `}
                    >
                        <div className="flex items-center gap-2">
                            {status.label}
                            <span className={`
                                px-2 py-0.5 rounded-full text-[10px]
                                ${filters.status === status.id ? 'bg-white/20 text-white' : 'bg-secondary-100 dark:bg-secondary-800 text-secondary-600 dark:text-secondary-400'}
                            `}>
                                {stats[status.id]?.count || 0}
                            </span>
                        </div>
                        <span className={`font-mono text-xs ${filters.status === status.id ? 'text-white/80' : 'text-primary-500'}`}>
                            <span className="font-numbers">{formatCurrency(stats[status.id]?.total || 0)}</span>
                        </span>
                    </button>
                ))}
            </div>
        </div>
    );
}
