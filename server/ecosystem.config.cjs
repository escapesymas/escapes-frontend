module.exports = {
  apps: [{
    name: 'escapes-backend',
    script: 'index.js',
    cwd: '/var/www/vhosts/backendescapes.com/server',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001,
      DATABASE_URL: 'postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db',
      WP_URL: 'https://backendescapes.com',
      BIHR_USERNAME: 'info@escapesymas.com',
      BIHR_MACKEY: '3799B392-3934-4514-ABF0-9EF7F544A117',
      BIHR_API_BASE: 'https://api.bihr.net'
    }
  }]
};
