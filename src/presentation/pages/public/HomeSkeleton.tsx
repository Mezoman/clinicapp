
export default function HomeSkeleton() {
    return (
        <div className="min-h-screen bg-white">
            {/* Header Skeleton */}
            <div className="fixed top-0 left-0 right-0 z-50 py-5 px-4 bg-white/80 backdrop-blur-md border-b border-secondary-100">
                <div className="container mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 skeleton rounded-xl" />
                        <div className="w-32 h-6 skeleton rounded-md" />
                    </div>
                    <div className="hidden lg:flex gap-8">
                        {[1, 2, 3, 4].map(i => <div key={i} className="w-16 h-4 skeleton rounded" />)}
                    </div>
                    <div className="w-28 h-10 skeleton rounded-full" />
                </div>
            </div>

            {/* Hero Skeleton */}
            <div className="relative min-h-[90vh] bg-secondary-950 overflow-hidden">
                <img
                    src="/hero-main.webp"
                    alt=""
                    aria-hidden="true"
                    fetchPriority="high"
                    decoding="sync"
                    loading="eager"
                    className="absolute inset-0 w-full h-full object-cover brightness-[0.35]"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-white/10" />
                <div className="relative z-10 pt-32 pb-20 px-4 container mx-auto">
                    <div className="max-w-3xl">
                        <div className="w-32 h-6 rounded-full mb-6 opacity-20 bg-white/20" />
                        <div className="w-full h-16 rounded-xl mb-6 opacity-20 bg-white/20" />
                        <div className="w-3/4 h-16 rounded-xl mb-6 opacity-20 bg-white/20" />
                        <div className="w-2/3 h-8 rounded-lg mb-10 opacity-20 bg-white/20" />
                        <div className="flex gap-4">
                            <div className="w-40 h-14 rounded-2xl opacity-20 bg-white/20" />
                            <div className="w-40 h-14 rounded-2xl opacity-20 bg-white/20" />
                        </div>
                    </div>
                </div>
            </div>


            {/* Services Skeleton */}
            <div className="py-24 container mx-auto px-4">
                <div className="w-48 h-10 skeleton mx-auto mb-16 rounded-lg" />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-64 skeleton rounded-3xl" />
                    ))}
                </div>
            </div>
        </div>
    );
}
