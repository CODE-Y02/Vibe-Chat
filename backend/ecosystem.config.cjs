require('dotenv').config();

module.exports = {
    apps: [
        {
            name: 'vibe-chat-backend',
            script: './node_modules/tsx/dist/cli.mjs',
            args: 'src/index.ts',
            // IMPORTANT: Use single instance in dev/staging. Only use cluster in
            // production after verifying the Redis adapter is fully functional.
            // PM2 cluster = multiple OS processes, each with their own Redis
            // connection. The Redis adapter is REQUIRED for cross-worker socket
            // delivery to work correctly.
            instances: process.env.USE_CLUSTER === 'true' ? 'max' : 1,
            exec_mode: process.env.USE_CLUSTER === 'true' ? 'cluster' : 'fork',
            // Never watch in production — causes unnecessary restarts
            watch: false,
            max_memory_restart: '1G',
            // Pass env vars through dotenv — don't rely on pm2 env blocks
            // because the .env file already has the correct values.
            env: {
                NODE_ENV: 'development',
            },
            env_production: {
                NODE_ENV: 'production',
            },
            // Graceful shutdown: wait up to 15s for the app's SIGTERM handler
            kill_timeout: 15000,
            listen_timeout: 10000,
        },
    ],
};
