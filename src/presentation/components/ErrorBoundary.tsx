import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { logger } from '../../utils/logger';
import * as Sentry from '@sentry/react';

interface Props { children: ReactNode; fallback?: ReactNode; pageName?: string; }
interface State { hasError: boolean; error?: Error; }

export default class ErrorBoundary extends Component<Props, State> {
    override state: State = { hasError: false };

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    override componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        logger.error(`[ErrorBoundary${this.props.pageName ? `:${this.props.pageName}` : ''}]`, error);
        if (import.meta.env.PROD) {
            Sentry.captureException(error, {
                extra: {
                    pageName: this.props.pageName,
                    componentStack: errorInfo.componentStack,
                },
            });
        }
    }

    override render() {
        if (this.state.hasError) {
            return this.props.fallback ?? (
                <div className="flex flex-col items-center justify-center min-h-[300px] gap-4 text-center p-8">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <div>
                        <p className="font-bold text-secondary-900 text-lg">حدث خطأ غير متوقع</p>
                        <p className="text-secondary-500 text-sm mt-1">يرجى تحديث الصفحة أو المحاولة مرة أخرى</p>
                    </div>
                    <button
                        onClick={() => this.setState({ hasError: false })}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:opacity-90 text-white rounded-xl text-sm font-medium"
                    >
                        <RefreshCw className="w-4 h-4" />
                        إعادة المحاولة
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}
