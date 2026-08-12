FROM node:22-alpine AS builder
WORKDIR /app/FRONTEND
COPY FRONTEND/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --prefer-offline || npm install
COPY FRONTEND/. .
RUN --mount=type=cache,target=/app/FRONTEND/.next/cache \
    npm run build


FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs
COPY --from=builder --chown=nextjs:nodejs /app/FRONTEND/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/FRONTEND/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/FRONTEND/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
