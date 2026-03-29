export function SkeletonRow() {
    return (
        <div className="flex items-center gap-4 p-4 animate-pulse">
            <div className="w-10 h-10 bg-secondary-200 rounded-xl" />
            <div className="flex-1 space-y-2">
                <div className="h-3 bg-secondary-200 rounded w-1/3" />
                <div className="h-2 bg-secondary-100 rounded w-1/2" />
            </div>
            <div className="h-6 w-16 bg-secondary-200 rounded-full" />
        </div>
    );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
    return (
        <div className="divide-y divide-secondary-100">
            {Array.from({ length: rows }).map((_, i) => (
                <SkeletonRow key={i} />
            ))}
        </div>
    );
}

export function SkeletonCard() {
    return (
        <div className="bg-white rounded-2xl p-5 shadow-card animate-pulse space-y-3">
            <div className="h-4 bg-secondary-200 rounded w-1/4" />
            <div className="h-8 bg-secondary-100 rounded w-1/2" />
            <div className="h-3 bg-secondary-100 rounded w-1/3" />
        </div>
    );
}
