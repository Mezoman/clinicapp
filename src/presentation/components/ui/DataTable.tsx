import React from 'react';
import { ChevronRight, ChevronLeft, ArrowUpDown } from 'lucide-react';

export interface ColumnDef<T> {
    header: string;
    accessor: keyof T | ((row: T) => React.ReactNode);
    className?: string;
    sortable?: boolean;
}

interface DataTableProps<T> {
    readonly columns: ColumnDef<T>[];
    readonly data: T[] | ReadonlyArray<T>;
    readonly loading?: boolean;
    readonly emptyMessage?: string;
    readonly emptyState?: React.ReactNode;
    readonly onRowClick?: (row: T) => void;
    readonly rowClassName?: (row: T) => string;
    readonly pagination?: {
        readonly page: number;
        readonly pageSize: number;
        readonly total: number;
        readonly onChange: (page: number) => void;
    };
}

function DataTableInner<T extends { id?: string | number }>({
    columns,
    data,
    loading = false,
    emptyMessage = 'لا توجد بيانات متاحة حالياً',
    onRowClick,
    rowClassName,
    pagination,
    emptyState
}: DataTableProps<T>) {

    if (loading) {
        return (
            <div className="w-full bg-[var(--bg-card)] border-[1.5px] border-[var(--border-color)] rounded-2xl overflow-hidden shimmer shadow-sm" role="status" aria-label="جاري التحميل...">
                <div className="h-14 bg-[var(--bg-page)]/50 border-b-[1.5px] border-[var(--border-color)]" />
                {new Array(5).fill(0).map((_, i) => (
                    <div key={`skeleton-row-${i}`} className="h-16 border-b border-[var(--border-subtle)]/30 last:border-0" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return emptyState ? <>{emptyState}</> : (
            <div className="w-full bg-[var(--bg-card)] border-[1.5px] border-[var(--border-color)] rounded-2xl p-12 text-center shadow-sm">
                <p className="text-[var(--text-muted)] font-bold text-sm">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="w-full bg-[var(--bg-card)] border-[1.5px] border-[var(--border-color)] rounded-2xl overflow-hidden shadow-sm">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="dcms-table">
                    <thead>
                        <tr>
                            {columns.map((column, idx) => (
                                <th 
                                    key={column.header || idx} 
                                    className={column.className || ''}
                                    aria-sort={column.sortable ? 'none' : undefined}
                                >
                                    <div className="flex items-center gap-2">
                                        {column.header}
                                        {column.sortable && <ArrowUpDown className="w-3 h-3 text-slate-400 dark:text-slate-500" />}
                                    </div>
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIdx) => (
                            <tr
                                key={row.id || rowIdx}
                                onClick={() => onRowClick?.(row)}
                                onKeyDown={(e) => {
                                    if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                                        e.preventDefault();
                                        onRowClick(row);
                                    }
                                }}
                                tabIndex={onRowClick ? 0 : -1}
                                role={onRowClick ? "button" : undefined}
                                className={`
                                  transition-colors duration-150 outline-none focus-visible:bg-primary/5
                                  ${onRowClick ? 'cursor-pointer hover:bg-primary/5' : 'hover:bg-[var(--bg-page)]/30'}
                                  ${rowClassName ? rowClassName(row) : ''}
                                `}
                            >
                                {columns.map((column, colIdx) => (
                                    <td key={`${row.id || rowIdx}-${colIdx}`} className={column.className || ''}>
                                        {typeof column.accessor === 'function'
                                            ? column.accessor(row)
                                            : (row[column.accessor] as React.ReactNode)}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-[var(--border-subtle)]">
                {data.map((row, rowIdx) => (
                    <div
                        key={row.id || rowIdx}
                        onClick={() => onRowClick?.(row)}
                        onKeyDown={(e) => {
                            if (onRowClick && (e.key === 'Enter' || e.key === ' ')) {
                                e.preventDefault();
                                onRowClick(row);
                            }
                        }}
                        tabIndex={onRowClick ? 0 : -1}
                        role={onRowClick ? "button" : undefined}
                        className={`
                            p-6 space-y-4 outline-none active:bg-[var(--bg-page)]/50 focus-visible:bg-[var(--bg-page)]/50
                            ${onRowClick ? 'cursor-pointer transition-colors' : ''}
                            ${rowClassName ? rowClassName(row) : ''}
                        `}
                    >
                        <div className="grid grid-cols-1 gap-4">
                            {columns.map((column, colIdx) => {
                                const value = typeof column.accessor === 'function'
                                    ? column.accessor(row)
                                    : (row[column.accessor] as React.ReactNode);

                                if (value === null || value === undefined) return null;

                                return (
                                    <div key={`${row.id || rowIdx}-${colIdx}`} className="flex items-center justify-between gap-4">
                                        <span className="text-xs font-bold text-[var(--text-label)] uppercase tracking-wide shrink-0">
                                            {column.header}
                                        </span>
                                        <div className={`text-sm font-bold text-[var(--text-primary)] text-right font-numbers ${column.className || ''}`}>
                                            {value}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {pagination && (
                <div className="p-4 border-t-[1.5px] border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4 bg-[var(--bg-table-header)]">
                    <div className="text-sm text-[var(--text-muted)] font-semibold">
                        عرض {((pagination.page - 1) * pagination.pageSize) + 1} إلى {Math.min(pagination.page * pagination.pageSize, pagination.total)} من {pagination.total}
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => pagination.onChange(pagination.page - 1)}
                            aria-label="الصفحة السابقة"
                            className="p-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-slate-400 hover:text-primary hover:border-primary/20 disabled:opacity-30 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
                        >
                            <ChevronRight className="w-5 h-5 rotate-rtl" />
                        </button>
                        <div className="flex items-center gap-1">
                            {new Array(Math.min(5, Math.ceil(pagination.total / pagination.pageSize))).fill(0).map((_, i) => (
                                <button
                                    key={`pagination-page-${i}`}
                                    onClick={() => pagination.onChange(i + 1)}
                                    aria-label={`صفحة ${i + 1}`}
                                    className={`
                                      w-[44px] h-[44px] min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl text-xs font-black transition-all font-numbers
                                      ${pagination.page === i + 1
                                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                            : 'hover:bg-[var(--bg-card)] border border-transparent hover:border-[var(--border-subtle)] text-slate-400 hover:text-primary shadow-sm'}
                                    `}
                                >
                                    {(i + 1).toLocaleString('ar-EG')}
                                </button>
                            ))}
                        </div>
                        <button
                            disabled={pagination.page >= Math.ceil(pagination.total / pagination.pageSize)}
                            onClick={() => pagination.onChange(pagination.page + 1)}
                            aria-label="الصفحة التالية"
                            className="p-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-slate-400 hover:text-primary hover:border-primary/20 disabled:opacity-30 transition-all min-h-[44px] min-w-[44px] flex items-center justify-center shadow-sm"
                        >
                            <ChevronLeft className="w-5 h-5 rotate-rtl" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export const DataTable = React.memo(DataTableInner) as typeof DataTableInner;
