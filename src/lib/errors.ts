import * as Sentry from "@sentry/react";
import { logger } from '../utils/logger';

export enum ErrorCode {
    NETWORK_ERROR = 'NETWORK_ERROR',
    AUTH_ERROR = 'AUTH_ERROR',
    PERMISSION_DENIED = 'PERMISSION_DENIED',
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    DATA_INTEGRITY_VIOLATION = 'DATA_INTEGRITY_VIOLATION',
    NOT_FOUND = 'NOT_FOUND',
    CONFLICT = 'CONFLICT',
    BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
    INTERNAL_ERROR = 'INTERNAL_ERROR',
    UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export class AppError extends Error {
    constructor(
        message: string,
        public code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
        public originalError?: any,
        public isOperational: boolean = true
    ) {
        super(message);
        this.name = 'AppError';
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export function parseSupabaseError(error: any): AppError {
    if (!error) return new AppError('Unknown error', ErrorCode.UNKNOWN_ERROR);

    const message = error.message || 'An unexpected error occurred';
    let code = ErrorCode.INTERNAL_ERROR;

    if (error.code) {
        switch (error.code) {
            case '42501': // RLS violation
                code = ErrorCode.PERMISSION_DENIED;
                break;
            case '23505': // Unique constraint violation
                code = ErrorCode.CONFLICT;
                break;
            case 'PGRST116': // Not found
                code = ErrorCode.NOT_FOUND;
                break;
            case 'auth/invalid-email':
            case 'auth/user-not-found':
                code = ErrorCode.AUTH_ERROR;
                break;
            default:
                if (error.message?.includes('network')) code = ErrorCode.NETWORK_ERROR;
        }
    }

    return new AppError(message, code, error);
}

export async function retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
): Promise<T> {
    let lastError: any;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (err) {
            lastError = err;
            if (i < maxRetries - 1) {
                await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i))); // Exponential backoff
            }
        }
    }
    throw lastError;
}

export const ErrorLogger = {
    log: (error: any, context?: string) => {
        const appError = error instanceof AppError ? error : parseSupabaseError(error);
        logger.error(`[${context || 'ERROR'}] ${appError.code}: ${appError.message}`, {
            original: appError.originalError,
            stack: appError.stack
        });

        // In production, we send this to Sentry
        if (import.meta.env.PROD) {
            Sentry.captureException(error);
        }
    }
};
