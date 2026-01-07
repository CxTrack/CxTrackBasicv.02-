/**
 * Production-safe Logger Utility
 * 
 * In development: All logs are displayed
 * In production: Only errors are logged, others are suppressed
 * 
 * Usage:
 *   import { logger } from '@/utils/logger';
 *   logger.log('Debug info');
 *   logger.error('Critical error', error);
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
    /**
     * Standard log - only shows in development
     */
    log: (...args: unknown[]): void => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    /**
     * Debug log - only shows in development
     */
    debug: (...args: unknown[]): void => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },

    /**
     * Info log - only shows in development
     */
    info: (...args: unknown[]): void => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    /**
     * Warning log - only shows in development
     */
    warn: (...args: unknown[]): void => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    /**
     * Error log - ALWAYS shows (production & development)
     * TODO: Connect to error tracking service (Sentry, LogRocket, etc.)
     */
    error: (...args: unknown[]): void => {
        console.error(...args);
        // TODO: Send to error tracking service
        // if (!isDevelopment) {
        //   Sentry.captureException(args[0]);
        // }
    },

    /**
     * Table log - only shows in development
     */
    table: (data: unknown): void => {
        if (isDevelopment) {
            console.table(data);
        }
    },

    /**
     * Group logs - only shows in development
     */
    group: (label: string): void => {
        if (isDevelopment) {
            console.group(label);
        }
    },

    groupEnd: (): void => {
        if (isDevelopment) {
            console.groupEnd();
        }
    },

    /**
     * Time tracking - only shows in development
     */
    time: (label: string): void => {
        if (isDevelopment) {
            console.time(label);
        }
    },

    timeEnd: (label: string): void => {
        if (isDevelopment) {
            console.timeEnd(label);
        }
    },
};

export default logger;
