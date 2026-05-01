import { Redis } from "ioredis";
import RedisMock from "ioredis-mock";
import dotenv from "dotenv";

dotenv.config();

const USE_REDIS = process.env.USE_REDIS === "true";

// ─────────────────────────────────────────────────────────────────────────────
// SINGLETON: One primary client per process, period.
// globalThis ensures hot-reload (tsx watch) doesn't create duplicate clients.
// In PM2 cluster mode, each worker process gets exactly ONE client — which is
// correct and expected. The Redis adapter handles cross-worker messaging.
// ─────────────────────────────────────────────────────────────────────────────
const GLOBAL_REDIS_KEY = Symbol.for("vibe-chat.redis.primary");
const GLOBAL_SUB_KEY = Symbol.for("vibe-chat.redis.sub");

function createRedisClient(name = "primary"): Redis {
    if (!USE_REDIS) {
        return new (RedisMock as any)();
    }

    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    const isTLS = redisUrl.startsWith("rediss://");

    const client = new Redis(redisUrl, {
        // null = no limit on retries (ioredis will keep retrying indefinitely
        // with exponential backoff). This is what you want for production.
        maxRetriesPerRequest: null,
        retryStrategy(times) {
            // Exponential backoff: 500ms, 1s, 2s, 4s … capped at 30s
            const delay = Math.min(500 * Math.pow(2, times - 1), 30000);
            return delay;
        },
        // reconnectOnError handles READONLY errors in Redis Cluster
        // and network-level ECONNRESET/ETIMEDOUT errors.
        reconnectOnError(err) {
            const reconnectCodes = ["ECONNRESET", "ETIMEDOUT", "ENOTFOUND", "ECONNREFUSED"];
            return reconnectCodes.some((code) => err.message.includes(code));
        },
        // Keep-alive: sends TCP keep-alive packets every 15s to prevent idle
        // connection drops from Upstash's 30s idle timeout.
        keepAlive: 15000,
        connectTimeout: 20000,
        lazyConnect: false,
        enableOfflineQueue: true,
        // Explicitly enable TLS when using rediss:// — some Node.js versions
        // require this even when the URL scheme is already rediss://
        ...(isTLS ? { tls: { rejectUnauthorized: false } } : {}),
    });

    client.on("connect", () =>
        console.log(`[Redis:${name}] ✅ Connected to ${USE_REDIS ? "Upstash" : "Mock"}`)
    );
    client.on("ready", () =>
        console.log(`[Redis:${name}] 🚀 Ready`)
    );
    client.on("error", (err: Error) =>
        console.error(`[Redis:${name}] ❌ Error: ${err.message}`)
    );
    client.on("reconnecting", (delay: number) =>
        console.warn(`[Redis:${name}] 🔄 Reconnecting in ${delay}ms...`)
    );
    client.on("close", () =>
        console.warn(`[Redis:${name}] 🔌 Connection closed`)
    );

    return client;
}

// Primary client — used for all data operations
if (!(globalThis as any)[GLOBAL_REDIS_KEY]) {
    (globalThis as any)[GLOBAL_REDIS_KEY] = createRedisClient("primary");
}

const redis: Redis = (globalThis as any)[GLOBAL_REDIS_KEY];

// ─────────────────────────────────────────────────────────────────────────────
// Sub client — ONLY created for the Socket.IO Redis adapter when running in
// cluster mode. It's a separate ioredis instance because the sub client enters
// subscribe mode and can't be used for regular commands.
// Created lazily on first call to getSubClient().
// ─────────────────────────────────────────────────────────────────────────────
export function getSubClient(): Redis {
    if (!(globalThis as any)[GLOBAL_SUB_KEY]) {
        const sub = createRedisClient("sub");
        (globalThis as any)[GLOBAL_SUB_KEY] = sub;
    }
    return (globalThis as any)[GLOBAL_SUB_KEY];
}

// ─────────────────────────────────────────────────────────────────────────────
// Graceful shutdown helper — called from index.ts SIGTERM handler
// ─────────────────────────────────────────────────────────────────────────────
export async function quitRedis(): Promise<void> {
    const primary = (globalThis as any)[GLOBAL_REDIS_KEY] as Redis | undefined;
    const sub = (globalThis as any)[GLOBAL_SUB_KEY] as Redis | undefined;
    const promises: Promise<unknown>[] = [];
    if (primary) promises.push(primary.quit().catch(() => primary.disconnect()));
    if (sub) promises.push(sub.quit().catch(() => sub.disconnect()));
    await Promise.allSettled(promises);
}

// ─────────────────────────────────────────────────────────────────────────────
// Key prefix constants — single source of truth
// ─────────────────────────────────────────────────────────────────────────────
export const MATCHMAKING_QUEUE     = "mm:queue";
export const SHADOWBAN_QUEUE       = "mm:shadowban_queue";
export const USER_SOCKET_PREFIX    = "mm:socket:";
export const USER_HEARTBEAT_PREFIX = "mm:heartbeat:";
export const SESSION_PREFIX        = "mm:session:";
export const RATE_LIMIT_PREFIX     = "rl:";
export const USER_SHADOWBANNED_PREFIX = "mod:shadowban:";
export const AUTH_CACHE_PREFIX     = "auth:";

export default redis;
