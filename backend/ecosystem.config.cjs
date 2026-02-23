require('dotenv').config();

module.exports = {
    apps: [
        {
            name: 'express-route-cache-backend',
            script: './node_modules/tsx/dist/cli.mjs',
            args: 'src/index.ts',
            instances: process.env.USE_CLUSTER === 'true' ? 'max' : 1, // run single instance locally, max in prod
            exec_mode: process.env.USE_CLUSTER === 'true' ? 'cluster' : 'fork',
            watch: process.env.NODE_ENV !== 'production', // Watch true only in dev
            max_memory_restart: '1G',
            env: {
                NODE_ENV: 'development'
            },
            env_production: {
                NODE_ENV: 'production'
            }
        }
    ]
};
