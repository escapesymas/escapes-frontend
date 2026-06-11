# Escapes y Más — Contexto del proyecto

## Skills instaladas (gstack)

52 skills de [gstack](https://github.com/garrytan/gstack) disponibles en `~/.config/opencode/skills/gstack-*/`. Sprint workflow: Think → Plan → Build → Review → Test → Ship → Reflect.

- **Think/Plan**: `gstack-office-hours`, `gstack-plan-ceo-review`, `gstack-plan-eng-review`, `gstack-plan-design-review`, `gstack-plan-devex-review`, `gstack-autoplan`, `gstack-spec`
- **Build/Design**: `gstack-design-consultation`, `gstack-design-shotgun`, `gstack-design-html`, `gstack-design-review`
- **Review/Test**: `gstack-review`, `gstack-cso`, `gstack-codex`, `gstack-browse`, `gstack-qa`, `gstack-qa-only`
- **Ship**: `gstack-ship`, `gstack-land-and-deploy`, `gstack-canary`, `gstack-benchmark`
- **Docs/Reflect**: `gstack-document-release`, `gstack-document-generate`, `gstack-retro`
- **Debug/Memory**: `gstack-investigate`, `gstack-learn`, `gstack-context-save`, `gstack-context-restore`
- **Safety**: `gstack-careful`, `gstack-freeze`, `gstack-guard`, `gstack-unfreeze`

Para web browsing/QA usar siempre `gstack-browse` (no `playwright_*` ni `webfetch`).

## Stack
- **Frontend**: Next.js 16.2.6 (Turbopack) en `FRONTEND/`, TailwindCSS
- **Backend**: Express/Node.js en `server/`, PostgreSQL
- **Admin**: Vite/React en `admin/`
- **DB**: PostgreSQL local + remoto en VPS, `escapes_db`
- **VPS**: `212.227.134.161`, PM2 gestiona `escapes-frontend` (3000), `escapes-backend` (3001), `escapes-admin` (5174)
- **CDN**: `api.mybihr.com` — no soporta redimensionado de imágenes

## Estado actual (7 Jun 2026)

### Completado
- Backend funcional con puerto 3001, frontend en puerto 3000
- Filtros dinámicos en `/universales` por categoría (brand, price, stock, attributes)
- Galería multi-imagen en `ProductCard.tsx` (dots 12px visibles con `w-3 h-3`)
- Galería con thumbnails en página detalle `producto/[id]/page.tsx`:
  - Mobile: thumbnails superpuestos (absolute bottom, gradiente bg) con `max-h-[50vh]`
  - Desktop: columna vertical de thumbnails a la izquierda
- Cache key de filtros corregido (incluye brand, price range, stock, attrs)
- MCPs configurados en `.opencode/opencode.json`: PostgreSQL, Git, Filesystem + comandos deploy

### Pendiente
- Sync periódico de Bihr (actualmente manual con `ts-node bihrService.ts`)
- Manejo de imágenes: CDN no soporta thumbnails — todas las imágenes son 800×800
- Atributos solo en 8.302 productos (helmets + RiderGear); HardPart tiene `{}`

### Servicios locales
- Puerto 3000: Frontend Next.js
- Puerto 3001: Backend Express
- Puerto 5174: Admin Dashboard
- PostgreSQL: localhost:5432

### Comandos opencode disponibles
- `deploy-backend` / `deploy-frontend` / `deploy-admin`: despliegue al VPS
- `versions`: lista tags de deploy
- `rollback`: revierte a un tag anterior
- `git-push-vps`: backup git al VPS

## Notas clave
- El cache de Next.js (`.next/cache`) debe limpiarse si hay errores de chunk stale
- `NODE_OPTIONS="--max-old-space-size=2048"` para builds grandes
- MCPs requieren reinicio de opencode tras cambios en config
- La BD tiene 156,862 productos totales; 107,917 en stock
