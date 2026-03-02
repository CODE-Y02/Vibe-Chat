/**
 * VibeChat Premium Logger
 * Optimized for production silencing and developer experience.
 */

const isDev = process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_LOGS === 'true';

export const logger = {
    info: (message: string, ...args: any[]) => {
        if (isDev) console.log(`[VibeChat:INFO] ${message}`, ...args);
    },
    warn: (message: string, ...args: any[]) => {
        if (isDev) console.warn(`[VibeChat:WARN] ${message}`, ...args);
    },
    error: (message: string, ...args: any[]) => {
        // Errors are usually logged even in production for monitoring, 
        // but we can silence them if preferred.
        console.error(`[VibeChat:ERROR] ${message}`, ...args);
    },
    debug: (message: string, ...args: any[]) => {
        if (isDev && process.env.NEXT_PUBLIC_DEBUG === 'true') {
            console.debug(`[VibeChat:DEBUG] ${message}`, ...args);
        }
    }
};
