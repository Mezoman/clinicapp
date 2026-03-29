

export const DashboardSkeleton = () => (
    <div className="animate-pulse p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex justify-between items-center">
            <div className="space-y-2">
                <div className="h-8 bg-gray-200 rounded-lg w-48" />
                <div className="h-4 bg-gray-100 rounded-lg w-32" />
            </div>
            <div className="flex gap-3">
                <div className="h-10 bg-gray-200 rounded-xl w-32" />
                <div className="h-10 bg-gray-200 rounded-xl w-32" />
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
                    <div className="flex justify-between items-start">
                        <div className="h-12 w-12 bg-gray-100 rounded-xl" />
                        <div className="h-6 w-16 bg-gray-50 rounded-full" />
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-50 rounded w-24" />
                        <div className="h-8 bg-gray-100 rounded w-32" />
                    </div>
                </div>
            ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm h-80">
                <div className="h-6 bg-gray-100 rounded w-32 mb-6" />
                <div className="h-56 bg-gray-50 rounded-xl" />
            </div>
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm h-80">
                <div className="h-6 bg-gray-100 rounded w-32 mb-6" />
                <div className="h-56 bg-gray-50 rounded-xl" />
            </div>
        </div>

        {/* Table/List Skeleton */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50">
                <div className="h-6 bg-gray-100 rounded w-48" />
            </div>
            <div className="p-6 space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0" style={{ opacity: 1 - i * 0.15 }}>
                        <div className="h-10 w-10 bg-gray-100 rounded-full shrink-0" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-100 rounded w-1/4" />
                            <div className="h-3 bg-gray-50 rounded w-1/6" />
                        </div>
                        <div className="h-8 w-20 bg-gray-50 rounded-lg" />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const TableSkeleton = ({ rows = 8 }: { rows?: number }) => (
    <div className="animate-pulse bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden" dir="rtl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <div className="h-8 bg-gray-200 rounded-lg w-48" />
            <div className="h-10 bg-gray-200 rounded-xl w-64" />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                        {[...Array(5)].map((_, i) => (
                            <th key={i} className="p-4"><div className="h-4 bg-gray-200 rounded w-20" /></th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(rows)].map((_, i) => (
                        <tr key={i} className="border-b border-gray-50 last:border-0" style={{ opacity: 1 - (i / rows) * 0.7 }}>
                            {[...Array(5)].map((_, j) => (
                                <td key={j} className="p-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const ProfileSkeleton = () => (
    <div className="animate-pulse p-6 space-y-8" dir="rtl">
        <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="h-32 w-32 bg-gray-200 rounded-3xl shrink-0" />
            <div className="flex-1 space-y-4 w-full">
                <div className="h-10 bg-gray-200 rounded-lg w-1/2" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-12 bg-gray-100 rounded-xl" />
                    ))}
                </div>
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
                <div className="h-64 bg-gray-50 border border-gray-100 rounded-2xl" />
                <div className="h-96 bg-gray-50 border border-gray-100 rounded-2xl" />
            </div>
            <div className="space-y-6">
                <div className="h-80 bg-gray-50 border border-gray-100 rounded-2xl" />
                <div className="h-64 bg-gray-50 border border-gray-100 rounded-2xl" />
            </div>
        </div>
    </div>
);

export const PageLoader = () => (
    <div className="min-h-[400px] flex items-center justify-center bg-white/50 dark:bg-slate-900/50 rounded-[2.5rem] p-12">
        <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-primary-100 dark:border-primary-900/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary-600 rounded-full border-t-transparent animate-spin" />
            </div>
            <p className="text-sm font-black text-gray-400 dark:text-slate-500 animate-pulse">جاري التحميل...</p>
        </div>
    </div>
);
