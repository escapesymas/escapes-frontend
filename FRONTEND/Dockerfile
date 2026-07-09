FROM node:22-alpine AS builder
WORKDIR /app
COPY FRONTEND/.npmrc ./
COPY FRONTEND/package.json FRONTEND/pnpm-lock.yaml ./
RUN corepack enable && pnpm install
COPY FRONTEND/. .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME http://localhost:3000
CMD ["node", "server.js"]
