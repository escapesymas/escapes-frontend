const ROOT = '/home/adrian/Documentos/GitHub/escapes-react';

module.exports = {
  apps: [
    {
      name: 'escapes-backend',
      cwd: ROOT + '/server',
      script: ROOT + '/server/node_modules/.bin/tsx',
      args: 'index.ts',
      exec_mode: 'fork',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        DATABASE_URL: 'postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db',
        STRIPE_SECRET_KEY: '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',
        STRIPE_TEST_SECRET_KEY: 'sk_test_51TXr6bPhkRo6LHVF8D6EulnAXr8aMCnl9lVfqZBPxQ0vTtwIJ26OaSLBFF1AtcB5AJ37G0sYNuk9CR2hQ7R5gMQP00N9kexbMD',
        WP_URL: 'https://backendescapes.com',
        WOO_KEY: 'ck_d0f72f0bf56e8e3f459dfe648a8d33cd531be4b4',
        WOO_SECRET: 'cs_131be1e4de1298cdf6c2a67bbf2e0df02c747fb8',
        BIHR_USERNAME: 'info@escapesymas.com',
        BIHR_MACKEY: '3799B392-3934-4514-ABF0-9EF7F544A117',
        BIHR_API_BASE: 'https://api.bihr.net',
        SMTP_HOST: 'smtp.buzondecorreo.com',
        SMTP_PORT: '465',
        SMTP_USER: 'web@escapesymas.com',
        SMTP_PASSWORD: 'v7Gq9mK2xR8pL4sN',
        JWT_ADMIN_SECRET: 'local-dev-jwt-secret-escapes-2026',
      }
    },
    {
      name: 'escapes-frontend',
      cwd: ROOT + '/FRONTEND',
      script: ROOT + '/FRONTEND/node_modules/next/dist/bin/next',
      args: 'start -p 3000 -H 0.0.0.0',
      exec_mode: 'fork',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db',
      }
    },
    {
      name: 'escapes-admin',
      cwd: ROOT + '/ADMIN',
      script: ROOT + '/ADMIN/node_modules/.bin/vite',
      args: 'preview --port 5174 --host 0.0.0.0',
      exec_mode: 'fork',
      interpreter: 'none',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
};
