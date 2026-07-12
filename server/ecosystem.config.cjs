// LEGACY PM2 CONFIG — No longer used in production (Coolify manages the backend container)
// KEYS BELOW ARE STALE — real values are in Coolify environment variables
module.exports = {
  apps: [{
    name: 'escapes-backend',
    script: 'index.js',
    cwd: '/var/www/vhosts/backendescapes.com/server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      // DATABASE_URL, STRIPE_*, BIHR_*, etc. — set in Coolify dashboard
    }
  }]
};
