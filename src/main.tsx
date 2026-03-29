import { StrictMode, Suspense, lazy } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';
import { queryClient } from './lib/queryClient';

// ═══════════════════════════════════════════════
// Console Cleanup (Professional Suppression)
// ═══════════════════════════════════════════════

/**
 * Suppresses common browser extension errors that clutter the console
 * but are outside the application's control.
 */
if (typeof window !== 'undefined') {
    const originalError = console.error;
    console.error = function (...args: any[]) {
        const msg = args[0];
        if (
            typeof msg === 'string' && 
            (msg.includes('Unchecked runtime.lastError') || 
             msg.includes('Could not establish connection'))
        ) {
            return;
        }
        originalError.apply(console, args);
    };
}

// Sentry: lazy load in production only — no impact on initial render
if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
    import('@sentry/react').then(({ init, browserTracingIntegration }) => {
        init({
            dsn: import.meta.env.VITE_SENTRY_DSN,
            integrations: [browserTracingIntegration()],
            tracesSampleRate: 0.1,
        });
    });
}

// ReactQueryDevtools: dev-only, no top-level await
const ReactQueryDevtools = import.meta.env.DEV
    ? lazy(() =>
        import('@tanstack/react-query-devtools').then((m) => ({
            default: m.ReactQueryDevtools,
        }))
      )
    : null;

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(
    <StrictMode>
        <QueryClientProvider client={queryClient}>
            <App />
            {import.meta.env.DEV && ReactQueryDevtools && (
                <Suspense fallback={null}>
                    <ReactQueryDevtools />
                </Suspense>
            )}
        </QueryClientProvider>
    </StrictMode>
);
