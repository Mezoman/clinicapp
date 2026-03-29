import { useSyncExternalStore } from 'react';

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

const getBreakpoint = (): Breakpoint => {
    if (typeof window === 'undefined') return 'desktop';
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
};

const subscribe = (cb: () => void) => {
    if (typeof window === 'undefined') return () => {};
    const mql768 = window.matchMedia('(min-width: 768px)');
    const mql1024 = window.matchMedia('(min-width: 1024px)');
    
    // Fallback for older browsers
    if (mql768.addEventListener) {
        mql768.addEventListener('change', cb);
        mql1024.addEventListener('change', cb);
        return () => {
            mql768.removeEventListener('change', cb);
            mql1024.removeEventListener('change', cb);
        };
    } else {
        // Deprecated but needed for some older browsers
        mql768.addListener(cb);
        mql1024.addListener(cb);
        return () => {
            mql768.removeListener(cb);
            mql1024.removeListener(cb);
        };
    }
};

export function useBreakpoint() {
    const breakpoint = useSyncExternalStore(subscribe, getBreakpoint, () => 'desktop' as Breakpoint);
    return {
        breakpoint,
        isMobile: breakpoint === 'mobile',
        isTablet: breakpoint === 'tablet',
        isDesktop: breakpoint === 'desktop',
    };
}
