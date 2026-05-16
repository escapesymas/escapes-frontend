module.exports = {
  apps: [{
    name: 'escapes-backend',
    script: 'dist/index.js',
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
      WOO_KEY: 'ck_1525ca6e68eadc50cd7b69ae408ebb05b93c78e9',
      WOO_SECRET: 'cs_42b5d60e45d4f6e710fa0fa0b35f1ae21964981a'
    }
  }]
};
