# Sprint 4 — Conversión avanzada + Red de seguridad

**Fecha:** 28 Jun 2026
**Estado:** En progreso
**Objetivo:** Cerrar las palancas de conversión con mayor ROI pendientes y blindar el ecommerce contra regresiones futuras.

---

## Tareas

### Fase 1: Tests E2E Playwright (12h)

**Por qué primero:** los features nuevos pueden romper el happy path. Tener 28 tests verdes antes de tocar nada da red de seguridad.

**Archivos a crear:**
- `FRONTEND/playwright.config.ts`
- `FRONTEND/e2e/helpers/seed.ts` — sembrar BD con 5 productos + 1 usuario test
- `FRONTEND/e2e/helpers/auth.ts` — login helpers
- `FRONTEND/e2e/helpers/cart.ts` — cart helpers
- `FRONTEND/e2e/01-home.spec.ts` — Home carga + catálogo
- `FRONTEND/e2e/02-search.spec.ts` — Búsqueda + fuzzy
- `FRONTEND/e2e/03-auth.spec.ts` — Login + logout + cookie httpOnly
- `FRONTEND/e2e/04-cart.spec.ts` — Add/remove + cookie cart
- `FRONTEND/e2e/05-checkout.spec.ts` — Email guest + billing B2B
- `FRONTEND/e2e/06-stock.spec.ts` — Stock insuficiente
- `FRONTEND/e2e/07-security.spec.ts` — Orders finalize sin auth, CORS, rate limit
- `FRONTEND/e2e/08-legal.spec.ts` — /devoluciones, /terminos, /politica-cookies, cookie banner AEPD
- `FRONTEND/e2e/09-tracking.spec.ts` — generateMetadata OG tags
- `.github/workflows/e2e.yml` — CI workflow

**Comando:** `cd FRONTEND && pnpm exec playwright test`

---

### Fase 2: Carrito abandonado (4h)

**Por qué:** recuperar el 10-20% del 70% de carritos abandonados = +30-40% ingresos.

**Migración BD** (`server/db-cart-abandoned.sql`):
```sql
CREATE TABLE cart_abandoned_emails (
  id SERIAL PRIMARY KEY,
  user_email VARCHAR(255) NOT NULL,
  cart_snapshot JSONB NOT NULL,
  cart_total_cents INTEGER NOT NULL,
  first_added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  emails_sent INT NOT NULL DEFAULT 0,
  last_emailed_at TIMESTAMPTZ,
  recovered_at TIMESTAMPTZ,
  recovery_token UUID NOT NULL DEFAULT gen_random_uuid(),
  discount_cents INTEGER NOT NULL DEFAULT 0,
  UNIQUE (recovery_token),
  UNIQUE (user_email, recovered_at)
);
```

**Endpoints:**
- Hook en `POST /api/cart` y `PUT /api/cart` — upsert en `cart_abandoned_emails`
- `GET /api/cart/recover/[token]` — decodifica JWT, devuelve cart_snapshot, marca `recovered_at=NULL` para empezar de nuevo
- `POST /api/cart/track-recovery/[token]` — marca `recovered_at=NOW()` cuando el usuario completa checkout

**Cron (cada 30 min):**
```js
// Bloque 1h: email recordatorio sin descuento
// Bloque 24h: email con cupón 5%
// Bloque 72h: email con cupón 10%
SELECT * FROM cart_abandoned_emails
WHERE recovered_at IS NULL
  AND last_activity_at < NOW() - INTERVAL '1 hour'
  AND (
    (emails_sent = 0 AND last_activity_at < NOW() - INTERVAL '1 hour')
    OR (emails_sent = 1 AND last_activity_at < NOW() - INTERVAL '24 hours')
    OR (emails_sent = 2 AND last_activity_at < NOW() - INTERVAL '72 hours')
  )
FOR UPDATE SKIP LOCKED
```

**Plantilla email** (`server/templates/abandoned-cart.html`):
- Responsive, dark mode
- Productos con foto + nombre + precio
- Total + CTA `Recuperar mi carrito`
- Disclaimer: cupón aplicable (24h: -5%, 72h: -10%)

**Frontend:**
- `/carrito?recover=TOKEN` — auto-añade productos del snapshot, muestra mensaje "Carrito recuperado"

---

### Fase 3: Server-side tracking Meta + GA4 (6-8h)

**Por qué:** con iOS 14.5+ ITP y ad-blockers, el pixel del frontend solo captura 60-70% de conversiones. Stripe webhooks tienen el evento real → enviar server-side a Meta/GA4 sube a 95-100%.

**Helper** (`server/lib/server-tracking.ts`):
```ts
async function sendServerSideEvent({ platform, eventName, eventId, userEmail, payload }) {
  if (platform === 'meta' && !META_PIXEL_ID) return;
  if (platform === 'ga4' && !GA4_MEASUREMENT_ID) return;
  // reintento con backoff exponencial
}
```

**Hooks:**
- Webhook Stripe `payment_intent.succeeded` → `sendServerSideEvent('meta', 'Purchase', event_id, ...)` + GA4
- `POST /api/cart` (cada add_to_cart) → igual
- Idempotencia: el cliente envía `event_id` (UUID), el backend lo propaga a Meta/GA4 idéntico. Meta deduplica si ve el mismo event_id en 48h.

**Cliente (FRONTEND/src/lib/analytics.tsx):**
- Cada evento del navegador lleva `event_id = crypto.randomUUID()`
- En checkout completo, el event_id del purchase se guarda en `metadata.event_id` del PaymentIntent

**Variables .env:**
```
META_PIXEL_ID=1234567890
META_ACCESS_TOKEN=EAAxxxxxxx
GA4_MEASUREMENT_ID=G-XXXXXXXX
GA4_API_SECRET=xxxxxxxxxx
```

Si están vacías, los hooks son no-op. Sin coste ni riesgo hasta que las configures.

---

## Estimación

| Fase | Tarea | Tiempo |
|---|---|---|
| 1 | Tests E2E | 12h |
| 2 | Carrito abandonado | 4h |
| 3 | Server-side tracking | 6-8h |
| **Total** | | **22-24h** |

---

## Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| Tests flakean por timing | `waitFor` + retry + timeout generoso |
| Cron se ejecuta 2x si PM2 reinicia | Lock atómico: `FOR UPDATE SKIP LOCKED` en BD |
| Meta/GA4 rechazan por event_id duplicado | Idempotencia por event_id compartido |
| Carrito abandonado molesta a usuarios comparando precios | Solo email si >1h con productos reales |
| Tracking rompe si Meta API down | Try/catch con logging, no afecta al checkout |
