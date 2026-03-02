/**
 * VibeChat Backend Logger
 * Honoring PRODUCTION deployment for silencing noise.
 */

const isDev = process.env.NODE_ENV === 'development' || process.env.ENABLE_LOGS === 'true';

export const logger = {
    info: (message: string, ...args: any[]) => {
        if (isDev) console.log(`[SYS:INFO] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        if (isDev) console.warn(`[SYS:WARN] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        // High severity errors always logged for debugging.
        console.error(`[SYS:ERROR] ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
        if (isDev && process.env.DEBUG === 'true') {
            console.debug(`[SYS:DEBUG] ${message}`, ...args);
        }
    }
};
