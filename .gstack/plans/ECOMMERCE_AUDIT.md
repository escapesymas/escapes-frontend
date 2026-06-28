# Ecommerce Infalible — Plan de remediación

**Auditoría:** gstack design-review + qa-only + explore code audit
**Fecha:** 28 Jun 2026
**Total hallazgos:** 42 (11 críticos, 16 altos, 11 medios, 4 bajos)
**Estimación:** ~6 semanas senior + QA + legal

---

## Lo que está BIEN (no tocar)

- Multi-imagen con dots 12px en `ProductCard.tsx`
- BikeSelectorModal con persistencia local + sync a BD
- Cart persistente guest + user (merge localStorage + Postgres)
- Stripe Elements correctamente usado con `paymentElement`
- SWR cache en backend (evita hammering a BD)
- Schema JSON-LD (Organization, WebSite, Product, BreadcrumbList)
- CSP + HSTS + Permissions-Policy
- Sanitización HTML en constants.ts
- Multi-imagen thumbnails desktop sidebar + mobile overlay

---

## SPRINT 1 — CRÍTICOS (semana 1)

### #1 — `/api/orders/finalize` sin auth (FRAUDE MASIVO)
- **Archivo:** `server/index.ts:4771-4828`
- **Impacto:** cualquiera puede llamar POST /orders/finalize con cualquier orderId y descuento stock + marcar como pagado.
- **Fix:** Validar que viene del webhook Stripe firmado, o exigir JWT de dueño + verificación obligatoria de paymentId.

### #2 — JWT en localStorage (XSS)
- **Archivo:** `FRONTEND/src/lib/api.ts:135`, `server/index.ts:1902-1912`
- **Impacto:** robo de sesión admin con un XSS = tienda comprometida.
- **Fix:** mover sesión a cookie httpOnly + SameSite=Lax + CSRF token en mutaciones.

### #3 — `info@escapesymas.com` hardcodeado como admin
- **Archivo:** `server/index.ts:4058`
- **Impacto:** escalada de privilegios trivial.
- **Fix:** eliminar rama hardcoded. Asignar admin solo vía SQL o tabla `admin_users`.

### #4 — `/api/orders/create` no valida stock atómicamente
- **Archivo:** `server/index.ts:4520-4713`, `CartContext.tsx:152-160`
- **Impacto:** sobreventa silenciosa. Dos clientes compran las últimas 3 unidades.
- **Fix:** transacción SQL con `SELECT … FOR UPDATE` sobre products.stock. Si stock insuficiente, 409.

### #5 — CORS abierto en producción
- **Archivo:** `server/index.ts:355-359`
- **Impacto:** localhost whitelist siempre activa en prod.
- **Fix:** condicionar con NODE_ENV o mover a .env.

### #6 — Guest checkout con email hardcodeado `guest@escapesymas.com`
- **Archivo:** `FRONTEND/src/components/CartView.tsx:320`, `server/index.ts:4527-4530`
- **Impacto:** clientes invitados sin email real → imposible enviar confirmación.
- **Fix:** añadir campo email al formulario de envío. Eliminar fallback.

### #9 — Trust signals mínimos en checkout
- **Archivo:** `FRONTEND/src/components/CartView.tsx:694-722`
- **Impacto:** -17% conversión por falta de confianza.
- **Fix:** logos de pago visibles, "Devoluciones gratuitas 14 días", "Pago seguro SSL".

### #27 — Sin email confirmación al cliente
- **Archivo:** `server/index.ts:5452-5510`
- **Impacto:** 67% espera email inmediato. Sin él = tickets "no me llegó nada".
- **Fix:** en webhook payment_intent.succeeded, sendMail con plantilla resumen + tracking.

### #29 — Factura PDF sin enviar al cliente
- **Archivo:** `server/index.ts:1814-1819`
- **Impacto:** cliente particular no recibe factura para garantía.
- **Fix:** adjuntar PDF al email de confirmación.

### #30 — Página /devoluciones NO EXISTE
- **Archivo:** crear `FRONTEND/src/app/devoluciones/page.tsx`
- **Impacto:** multa AEPD/Consumo. Derecho desistimiento 14 días no comunicado.
- **Fix:** página con texto legal + formulario desistimiento + plazos + dirección.

### #31 — /terminos: link roto (404)
- **Archivo:** `FRONTEND/src/app/login/page.tsx:380`, crear `app/terminos/page.tsx`
- **Impacto:** link roto en registro. Aceptación de términos no demostrable.
- **Fix:** crear página condiciones generales LSSI/LGC.

### #32 — Banner cookies AEPD NO EXISTE
- **Archivo:** crear `components/CookieBanner.tsx` + `app/politica-cookies/page.tsx`
- **Impacto:** multa 5.000€-100.000€.
- **Fix:** banner con opt-in localStorage + bloquea scripts no esenciales.

### #33 — Aviso legal sin CIF/domicilio/registro mercantil
- **Archivo:** `FRONTEND/src/app/aviso-legal/page.tsx:27-29`
- **Impacto:** incumplimiento formal LSSI art. 10.
- **Fix:** añadir datos reales empresa.

---

## SPRINT 2 — CONVERSIÓN ALTA (semana 2)

### #7 — Reviews/ratings en cards
- **Archivo:** `ProductCard.tsx`, `mapProductToFrontend` en `server/index.ts:5164`
- **Fix:** calcular avg_rating y review_count, mostrar 5 estrellitas en grid.

### #8 — Sin urgencia/escasez
- **Archivo:** `ProductCard.tsx:51-57`, `ProductDetailClient.tsx:218-228`
- **Fix:** "quedan N unidades" si stock<5. Badge "¡Último!" si stock<3.

### #10 — Sin cross-sell/upsell
- **Archivo:** crear `/api/catalog/frequently-bought-together/:id`
- **Fix:** sección horizontal "¿Comprado junto con…?"

### #11 — Apple Pay/Google Pay prometido pero no activo
- **Archivo:** `CartView.tsx:857`, `server/index.ts:4946`
- **Fix:** reemplazar payment_method_types por automatic_payment_methods + configurar wallets en Stripe dashboard.

### #12 — Costes envío no visibles pre-checkout
- **Archivo:** `CartView.tsx:752-763`
- **Fix:** banner sticky "Envío GRATIS > 150€" + tabla zonas.

### #13 — Sin re-check stock al pagar
- **Fix:** crear GET /api/catalog/stock-check antes de paymentIntent.

### #14 — Sin dirección facturación ≠ envío
- **Fix:** toggle "¿Facturar a otra dirección?" + bloque condicional.

### #34 — CERO analytics
- **Fix:** añadir GTM en layout + eventos view_item, add_to_cart, begin_checkout, purchase.

### #36 — Sin CAPTCHA en formularios públicos
- **Fix:** Cloudflare Turnstile en /contact, /stock-notify, /auth/register, /auth/login.

---

## SPRINT 3 — MEDIOS (semanas 3-4)

### Performance / UX
- #15 Búsqueda por VIN/matrícula (6h)
- #16 "Envío 24h" vs "3-5 días" (1h)
- #17 Ordenación catálogo (3h)
- #18 Imágenes responsive 400px (4h + batch)
- #19 Paginación homepage (1h)
- #20 eslint-disable → next/image (3h)
- #21 PWA icons rotas (15m)
- #22 prefers-reduced-motion (10m)
- #23 Tipografía <12px (6h)
- #28 Tracking envío público (6h)
- #37 Sticky cart safe-area-inset iOS (30m)
- #38 Touch targets 44×44px (15m)

### Seguridad menores
- #35 Stripe webhook path secundario (ya arreglado con #1)
- #40 Admin rate limit + audit log (6h)

### SEO / Performance
- #24 OpenGraph/Twitter (2h)
- #25 Sitemap lastmod (1h)
- #26 generateMetadata por producto (1h)
- #41 Fuzzy search pg_trgm (4h)
- #42 Breadcrumb schema markup (2h)

---

## Chatbot IA — Mejoras (paralelo a sprints)

- Push proactivo al detectar moto del cliente sin mantenimiento
- Validación compatibilidad en checkout
- Historial de conversaciones en BD

---

## Auditoría SQL calidad de datos

`sql/auditoria-calidad-datos.sql`:
- Productos sin compatibility
- Productos sin imagen válida
- SKUs malformados
- Precios en 0 o negativos
- Stock 0 con carritos activos

---

## Estimación total

| Sprint | Contenido | Esfuerzo |
|---|---|---|
| 1 | Críticos (seguridad + legal + email) | 4-5 días senior + 1 día legal |
| 2 | Conversión alta | 7-9 días |
| 3 | Medios (perf + UX) | 5-7 días |
| Paralelo | Chatbot mejoras + auditoría BD | 4 días |
| TOTAL | | ~6 semanas senior + QA + legal |
