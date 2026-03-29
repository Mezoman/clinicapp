/**
 * Application Logger
 * Centralized logging utility to replace standard console calls
 */
type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private isProd = import.meta.env.PROD;
    private formatMessage(level: LogLevel, message: any, ...args: any[]): [string, ...any[]] {
        const timestamp = new Date().toISOString();
        const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

        if (typeof message === 'string') {
            return [`${prefix} ${message}`, ...args];
        }

        return [prefix, message, ...args];
    }

    info(message: any, ...args: any[]) {
        if (!this.isProd) {
            console.info(...this.formatMessage('info', message, ...args));
        }
    }

    warn(message: any, ...args: any[]) {
        console.warn(...this.formatMessage('warn', message, ...args));
    }

    error(message: any, ...args: any[]) {
        console.error(...this.formatMessage('error', message, ...args));
    }

    debug(message: any, ...args: any[]) {
        if (!this.isProd) {
            console.debug(...this.formatMessage('debug', message, ...args));
        }
    }
}

export const logger = new Logger();
