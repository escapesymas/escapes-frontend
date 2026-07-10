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
- **DB**: PostgreSQL en Coolify, `escapes_db` (UUID: `hk6mt4abfh8ijg2vak6utvz2`)
- **VPS**: `212.227.134.161`, Coolify 4.1.2 con Docker, Traefik v3.6
- **CDN**: `api.mybihr.com` — no soporta redimensionado de imágenes

## Estado actual (10 Jul 2026) — Migración a Coolify COMPLETADA

### Producción (VPS 212.227.134.161)
- **3 contenedores Docker** en red `coolify`: backend, frontend, admin
- **Traefik** recibe en puertos 80/443, routing dinámico via `/data/coolify/proxy/dynamic/http.yaml`
- **Let's Encrypt** SSL activo para todos los dominios
- PM2 detenido y eliminado

### Dominios y routing
| Dominio | Servicio | HTTPS |
|---------|----------|-------|
| escapesymas.com | Frontend (3000) | ✅ Let's Encrypt |
| www.escapesymas.com | Frontend (3000) | ✅ Let's Encrypt |
| api.escapesymas.com | Backend (3001) | ✅ Let's Encrypt |
| backendescapes.com | Backend (3001) | ✅ Let's Encrypt |
| admin.escapesymas.com | Admin (80) | ✅ Let's Encrypt |

### Dockerfiles (VPS)
- `/root/escapes-react/FRONTEND/Dockerfile` — Next.js standalone, `HOSTNAME=0.0.0.0`
- `/root/escapes-react/server/Dockerfile` — Node 22, `--user root` para uploads
- `/root/escapes-react/ADMIN/Dockerfile` — Vite→nginx:alpine

### Pendiente
- Sync periódico de Bihr (manual con `ts-node bihrService.ts`)
- Admin muestra `(unhealthy)` — healthcheck de nginx requiere `/` path
- `restart=always` no configurado en contenedores (no survive a reboot de Docker)

### Comandos VPS útiles
- `docker ps --filter 'name=escapes'` — estado contenedores
- `docker exec coolify-proxy cat /traefik/dynamic/http.yaml` — ver routing
- `ssh root@212.227.134.161` — acceso SSH

## Notas clave
- El cache de Next.js (`.next/cache`) debe limpiarse si hay errores de chunk stale
- `NODE_OPTIONS="--max-old-space-size=2048"` para builds grandes
- MCPs requieren reinicio de opencode tras cambios en config
- La BD tiene 156,862 productos totales; 107,917 en stock
