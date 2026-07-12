FROM node:22-alpine AS builder
WORKDIR /app
# Load env vars from .env file at build time (for Vite/Next.js public vars)
COPY .env.build ./
RUN set -a && . ./.env.build && set +a
COPY .npmrc ./
COPY package.json pnpm-lock.yaml ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
