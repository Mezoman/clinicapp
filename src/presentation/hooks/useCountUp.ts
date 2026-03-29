import { useState, useEffect } from 'react';

export function useCountUp(endValue: number, duration: number = 1000) {
    const [count, setCount] = useState(0);

    useEffect(() => {
        let startTimestamp: number | null = null;
        let rafId: number;
        const startValue = 0;

        const step = (timestamp: number) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            setCount(Math.floor(progress * (endValue - startValue) + startValue));
            if (progress < 1) {
                rafId = window.requestAnimationFrame(step);
            }
        };

        rafId = window.requestAnimationFrame(step);
        return () => window.cancelAnimationFrame(rafId);
    }, [endValue, duration]);

    return count;
}
