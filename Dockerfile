FROM node:22-alpine AS builder
WORKDIR /app
# Vite/Next.js: these are baked at build time
ARG NEXT_PUBLIC_API_URL=https://api.escapesymas.com
ARG NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_PLACEHOLDER
ARG NEXT_PUBLIC_SITE_URL=https://escapesymas.com
ARG NEXT_PUBLIC_GTM_ID=
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_GTM_ID=$NEXT_PUBLIC_GTM_ID
COPY .npmrc ./
COPY package.json pnpm-lock.yaml ./
RUN npm install
COPY . .
RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3000
ENV HOSTNAME=0.0.0.0
# No env baked with defaults - all config from Coolify env_file
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
USER nextjs
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
