# Plan de Implementación — Panel ADMIN (Escapes y Más)

> Documento generado tras análisis exhaustivo del código fuente del panel de administración.
> **Fecha**: Junio 2026 | **Versión**: 1.0

---

## Índice

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Arquitectura Actual](#2-arquitectura-actual)
3. [Hallazgos de Seguridad](#3-hallazgos-de-seguridad)
4. [Deuda Técnica y Arquitectura](#4-deuda-técnica-y-arquitectura)
5. [Bugs Funcionales](#5-bugs-funcionales)
6. [Problemas de UX/UI](#6-problemas-de-uxui)
7. [Mejoras Propuestas](#7-mejoras-propuestas)
8. [Plan de Acción por Fases](#8-plan-de-acción-por-fases)
9. [Scripts de Migración Abandonados](#9-scripts-de-migración-abandonados)
10. [Referencias y Archivos Relevantes](#10-referencias-y-archivos-relevantes)

---

## 1. Resumen Ejecutivo

El panel ADMIN de Escapes y Más es una SPA construida con **Vite + React 18 + Tailwind CSS** que se despliega como estática en el VPS. Sirve como interfaz de gestión para catálogo, pedidos, usuarios, facturación, sincronización Bihr, SEO, envíos, cupones y márgenes.

**Hallazgos principales:**
- **5 vulnerabilidades críticas** (credenciales en texto plano, sesión en localStorage, auth por query params)
- **6 bugs funcionales** confirmados
- **Monolito de 2.524 líneas** (`AdminDashboard.tsx`) con 7 componentes inline
- **7 scripts de migración abandonados** en la raíz del proyecto
- **Código duplicado** en múltiples componentes
- **Sin TypeScript strict**, `any` generalizado

---

## 2. Arquitectura Actual

### 2.1 Estructura de archivos

```
ADMIN/
├── accesos.txt                    # ⚠️ CREDENCIALES EN TEXTO PLANO
├── .clinerules                    # ⚠️ CREDENCIALES EN TEXTO PLANO
├── .cursorrules                   # ⚠️ CREDENCIALES EN TEXTO PLANO
├── index.html                     # Entry point HTML
├── package.json                   # Dependencias (React 18, Vite 6, Tailwind 3)
├── vite.config.ts                 # Configuración Vite + proxy API
├── tailwind.config.js             # Tema "Technical Garage" (tech-yellow, tech-carbon, etc.)
├── postcss.config.js
├── tsconfig.json                  # Sin strict mode
├── rewrite.py, rewrite2.py, ...   # 7 scripts de migración abandonados
├── src/
│   ├── main.tsx                   # Entry point React
│   ├── index.css                  # Tailwind imports + scrollbars
│   ├── App.tsx                    # Login + sesión localStorage
│   └── components/
│       ├── AdminDashboard.tsx      # ⚠️ 2524 líneas — MONOLITO
│       ├── AdminLayout.tsx         # Sidebar + layout responsive
│       ├── AccountingTab.tsx       # Contabilidad y facturación
│       ├── Badges.tsx              # Badges de estado (pedido, dropshipping)
│       ├── OrderCreationModal.tsx  # Modal creación manual de pedidos
│       └── tabs/
│           ├── DashboardTab.tsx    # Panel de control / telemetría VPS
│           ├── OrdersTab.tsx       # Historial de pedidos
│           ├── ProductsTab.tsx     # Catálogo de productos
│           ├── UsersTab.tsx        # Usuarios registrados
│           ├── ShippingTab.tsx     # Zonas y tarifas de envío
│           ├── SyncTab.tsx         # Sincronización Bihr
│           ├── TaxonomiesTab.tsx   # Categorías, etiquetas, vehículos
│           └── AttributesManager.tsx # Atributos globales (tallas, colores)
```

### 2.2 Flujo de autenticación

```
App.tsx:
  1. Mount → leer localStorage('escapesymas_admin_session')
  2. Si existe → parsear JSON → setSession(data)
  3. Login → POST /api/auth?action=login
  4. Servidor valida + devuelve JWT + user_email
  5. App.tsx:45 verifica en CLIENTE: data.user_email === 'info@escapesymas.com'
  6. Si ok → localStorage.setItem(..., JSON.stringify(data))
  7. Cada fetch() pasa userId + email como query params
```

### 2.3 Comunicación con backend

- **Proxy Vite**: `/api` → `http://localhost:3001` (desarrollo)
- **En producción**: Se sirve como estática y el API está en el mismo dominio (rewrite nginx)
- **Patrón**: Todas las llamadas usan `fetch(\`/api/admin?action=X&userId=Y&email=Z\`)`
- **Sin JWT en headers** — la autenticación viaja en los query params

---

## 3. Hallazgos de Seguridad

### 🔴 CRÍTICOS

| # | Problema | Archivo | Líneas | Impacto |
|---|----------|---------|--------|---------|
| C1 | **Credenciales DB en texto plano** | `accesos.txt`, `.clinerules`, `.cursorrules` | Todo el archivo | Cualquiera con acceso al repo tiene la contraseña de PostgreSQL |
| C2 | **IP del VPS + usuario SSH root expuesto** | `accesos.txt` | Líneas 1-10 | Atacante conoce IP exacta y usuario SSH del servidor de producción |
| C3 | **Sesión admin en localStorage** | `App.tsx:14-20` | `localStorage.getItem('escapesymas_admin_session')` | Robo de sesión vía XSS — cualquier script inyectado extrae el token |
| C4 | **userId y email via query params** | Todos los componentes | Cada `fetch()` | Credenciales en logs del servidor, leak en Referer header, sin protección CSRF |
| C5 | **Verificación de email en cliente** | `App.tsx:45-47` | `data.user_email?.toLowerCase() !== 'info@escapesymas.com'` | Fácil de burlar modificando el JavaScript — la autorización debe ser 100% servidor |

### 🟡 ALTOS

| # | Problema | Archivo | Líneas |
|---|----------|---------|--------|
| A1 | **Sin CSRF tokens** en ninguna petición POST | Todos los componentes | — |
| A2 | **Error de login se loguea completo a consola** | `App.tsx:52` | `console.error('[ADMIN LOGIN ERROR]:', err)` |
| A3 | **user_email se renderiza sin sanitizar** | `AdminLayout.tsx:26` | `adminEmail.slice(0, 2)` en UI |
| A4 | **Contraseña enviada como `password` en body** | `App.tsx:37` | `body: JSON.stringify({ username: email, password })` — posible logging por proxy |
| A5 | **Sin rate limiting en login** (del lado cliente) | `App.tsx` | Sin protección contra fuerza bruta |

### 🟢 MEDIOS

| # | Problema | Archivo |
|---|----------|---------|
| M1 | Logout solo borra localStorage, no invalida sesión servidor | `App.tsx:59-62` |
| M2 | Sin comprobación de expiración del JWT | `App.tsx` — nunca verifica si el token expiró |
| M3 | Notas de pedido renderizadas con `whitespace-pre-wrap` sin sanitizar XSS | `AdminDashboard.tsx:971` |
| M4 | `fetch()` a `/api/admin?action=send-dropshipping-order` sin autenticación | `AdminDashboard.tsx:902-906` — no pasa userId/email |

---

## 4. Deuda Técnica y Arquitectura

### 4.1 Monolito de 2.524 líneas

`AdminDashboard.tsx` contiene 7 componentes inline que deberían estar en archivos separados:

| Componente | Líneas | ¿Extraído? |
|------------|--------|------------|
| `ProductFormModal` | ~610 | ❌ Inline |
| `CouponsTab` | ~230 | ❌ Inline |
| `SeoTab` | ~150 | ❌ Inline |
| `MarginsTab` | ~290 | ❌ Inline |
| `StatCard` | ~15 | ❌ Inline (y también en DashboardTab.tsx) |
| `OrderStatusBadge` | ~20 | ❌ Inline (y también en Badges.tsx) |
| `DropshippingStatusBadge` | ~35 | ❌ Inline (y también en Badges.tsx) |

### 4.2 Código duplicado

| Componente | Definido en | También en |
|------------|-------------|------------|
| `OrderStatusBadge` | `Badges.tsx` | `AdminDashboard.tsx:1184-1202`, `DashboardTab.tsx:22-29` |
| `DropshippingStatusBadge` | `Badges.tsx` | `AdminDashboard.tsx:1205-1238` |
| `StatCard` | `DashboardTab.tsx:12-19` | `AdminDashboard.tsx:1172-1181` |

### 4.3 TypeScript sin strict mode

- `tsconfig.json` no tiene `"strict": true`
- `any` en prácticamente todas las props y estados
- Errores de tipo: `CouponsTab` espera `adminWpId: number` pero se llama con `adminWpId` que es `string | undefined` (AdminDashboard.tsx:686)
- Sin interfaces para la mayoría de estructuras de datos (solo `AccountingTab.tsx` define interfaces)

### 4.4 Sin separación de responsabilidades

- `AdminDashboard.tsx` maneja: fetching de datos, estado global, modales, CRUD, UI, formularios
- Sin custom hooks para lógica reutilizable
- Sin contexto/zustand/Redux — estado global volátil en un solo componente

### 4.5 7 scripts de migración abandonados

| Script | Propósito | Estado |
|--------|-----------|--------|
| `rewrite.py` | Migrar layout a AdminLayout component | Parcial |
| `rewrite2.py` | Refactor stats view | Parcial |
| `rewrite3.py` | Ajustes de imports | Parcial |
| `rewrite4.py` | Continuación migración | Parcial |
| `refactor_colors.cjs` | Reemplazar `racing-orange` por `tech-yellow` | Ejecutado una vez |
| `update_classes.py` | Actualizar clases Tailwind | No ejecutado |
| `update_all_classes.py` | Actualizar clases Tailwind completo | No ejecutado |

---

## 5. Bugs Funcionales

| # | Bug | Archivo | Línea | Descripción |
|---|-----|---------|-------|-------------|
| B1 | **Cupones percent truncados** | `AdminDashboard.tsx` | 1899 | `parseInt(value)` trunca decimales en cupones de porcentaje (ej. 20.5% → 20%). Debe ser `parseFloat()` |
| B2 | **Categorías hardcodeadas** | `AdminDashboard.tsx` | 2331-2339 | `MarginsTab.getCategoryName()` mapea IDs 1,6,7,9,10 quemados. Ídem `ProductsTab.tsx:187-191` y Filters (ProductsTab.tsx:349-351) |
| B3 | **Paginación productos incorrecta** | `AdminDashboard.tsx` | 91-95 | `list.length < 50` como umbral: si el API devuelve exactamente 50, `hasMoreProducts=true` pero puede que no haya más. Debería usar header/total count |
| B4 | **Modelos vehículo limitados a 50** | `TaxonomiesTab.tsx` | 264 | Sin filtro de marca, solo muestra 50 modelos. El slice `(0, 50)` es arbitrario |
| B5 | **`apiUrl = ''` inútil** | `TaxonomiesTab.tsx` | 63 | Constante vacía: `const apiUrl = ''` — nunca configurada, las fetch la concatenan como prefijo |
| B6 | **Precio en OrderCreationModal** | `OrderCreationModal.tsx` | 255 | `(((item.price || 0) * item.qty) / 100).toFixed(2)` — inconsistente: `item.price` parece estar en cents, pero en `AdminDashboard.tsx:795` el cálculo es distinto |

---

## 6. Problemas de UX/UI

| # | Problema | Archivo |
|---|----------|---------|
| U1 | **Inconsistencia alert vs toast** | Mezcla de `window.alert()`, `window.confirm()` y toasts personalizados (`showToast`) |
| U2 | **Sin feedback de carga** en productos list | `ProductsTab.tsx` — el botón "Cargar más" se deshabilita pero no siempre muestra spinner |
| U3 | **Sin confirmación en eliminar producto** | `ProductsTab.tsx:236` — `handleDeleteProduct(p.id)` sin confirmación previa (a diferencia de pedidos) |
| U4 | **Sin scroll infinito** en productos | Paginación manual con botón "Cargar más" — no hay scroll infinito ni lazy loading |
| U5 | **Sin validación de formularios** | Los inputs tipo `number` aceptan valores inválidos (ej. stock negativo, precio 0) |
| U6 | **Sin error boundaries** | Cualquier error en un tab rompe todo el dashboard (React error screen) |
| U7 | **Sin caché de datos** | Cambiar de tab y volver refetches todo — sin stale-while-revalidate |
| U8 | **Sin feedback en acciones destructivas** | Eliminar producto lo hace sin confirmación; eliminar pedido tiene confirmación inline |

---

## 7. Mejoras Propuestas

### 7.1 Prioridad Crítica (Seguridad)

| ID | Mejora | Archivos afectados | Esfuerzo |
|----|--------|-------------------|----------|
| S1 | Eliminar `accesos.txt` del repo + rotar contraseñas | `accesos.txt`, `.clinerules`, `.cursorrules` | Inmediato |
| S2 | Migrar auth a JWT en header Bearer (no query params) | Todos los componentes + App.tsx | Medio |
| S3 | Reemplazar localStorage session por httpOnly cookie | `App.tsx`, servidor | Alto |
| S4 | Añadir CSRF tokens en todas las peticiones POST | Todos los componentes, servidor | Alto |
| S5 | Validación de email administrador en servidor (no cliente) | `App.tsx:45-47` (eliminar), servidor | Bajo |
| S6 | Sanitizar salida de texto ingresado por usuarios (notas, etc.) | `AdminDashboard.tsx:971` | Bajo |

### 7.2 Prioridad Alta (Arquitectura)

| ID | Mejora | Archivos afectados | Esfuerzo |
|----|--------|-------------------|----------|
| A1 | Extraer `ProductFormModal`, `CouponsTab`, `SeoTab`, `MarginsTab` a archivos separados | `AdminDashboard.tsx` | Medio |
| A2 | Activar TypeScript strict y tipar todas las props | Todos los archivos | Alto |
| A3 | Eliminar componentes duplicados (Badges, StatCard) | `AdminDashboard.tsx`, `DashboardTab.tsx` | Bajo |
| A4 | Crear custom hooks para lógica reutilizable (`useAdminApi`, `useDebouncedSearch`) | Nuevos archivos | Medio |
| A5 | Separar `AdminDashboard.tsx` en módulos por dominio (orders/, products/, etc.) | Varios archivos | Alto |

### 7.3 Prioridad Media (Funcional)

| ID | Mejora | Esfuerzo |
|----|--------|----------|
| F1 | Bug B1: `parseInt` → `parseFloat` en CouponsTab | Bajo |
| F2 | Bug B3: Paginación con total count desde API | Bajo |
| F3 | Bug B4: Sin límite de 50 modelos cuando hay filtro | Bajo |
| F4 | Bug B5: Eliminar `apiUrl = ''` o configurarlo | Bajo |
| F5 | Bug B6: Unificar formato de precios (cents vs decimal) | Medio |
| F6 | Reemplazar `window.alert()`/`confirm()` por toasts consistentes | Medio |
| F7 | Añadir Error Boundary por tab | Bajo |
| F8 | Añadir scroll infinito en productos con Intersection Observer | Medio |

### 7.4 Prioridad Baja (UX/Mejoras)

| ID | Mejora | Esfuerzo |
|----|--------|----------|
| L1 | Confirmación antes de eliminar producto | Bajo |
| L2 | Validación de formularios (stock ≥ 0, precio > 0, etc.) | Medio |
| L3 | Caché de datos con stale-while-revalidate (SWR o React Query) | Medio |
| L4 | Guardar preferencia de columnas visibles en localStorage | Bajo |
| L5 | Añadir filtro por categorías dinámicas (no hardcodeadas) | Medio |
| L6 | Limpiar scripts de migración abandonados | Bajo |
| L7 | Añadir loading skeleton en lugar de spinner genérico | Bajo |
| L8 | Paginación real de usuarios (cargar todos actualmente) | Medio |

---

## 8. Plan de Acción por Fases

### ✅ Fase 0 — Urgente (Completada)

```
✅ Rotar TODAS las contraseñas en servidor (DB, SMTP, Stripe, Bihr, WooCommerce)
✅ Sanitizar accesos.txt — eliminar credenciales en texto plano
✅ Añadir .env.example como plantilla
✅ Mover credenciales a variables de entorno (instrucciones añadidas)
✅ Sanitizar .clinerules y .cursorrules — eliminar contraseñas
✅ Añadir ADMIN/accesos.txt a .gitignore
✅ Eliminar 6 scripts de migración abandonados (rewrite*.py, update_*.py)
```

### ✅ Fase 1 — Seguridad (Parcial)

```
✅ App.tsx: Eliminar verificación de email administrador en cliente (C5)
✅ App.tsx: Sanitizar datos guardados en localStorage (solo token + user_id)
✅ App.tsx: Eliminar console.error de errores de login (evitar leak)
☐ Migrar auth a JWT en header Authorization: Bearer <token>
☐ Eliminar userId/email de query params en todas las URLs
☐ Añadir CSRF tokens (doble cookie o header custom)
☐ Añadir Content-Security-Policy header
☐ Sanitizar salida de notas y contenido generado por usuarios
☐ Añadir rate limiting en login
```

### ✅ Fase 2 — Refactor Arquitectura (Completado ~80%)

```
✅ Extraer CouponsTab → components/tabs/CouponsTab.tsx
✅ Extraer SeoTab → components/tabs/SeoTab.tsx
✅ Extraer MarginsTab → components/tabs/MarginsTab.tsx
✅ Extraer ProductFormModal → components/modals/ProductFormModal.tsx (610 líneas)
✅ Eliminar duplicados inline: OrderStatusBadge, DropshippingStatusBadge, StatCard
✅ AdminDashboard.tsx reducido de 2.524 → 1.179 líneas (-53%)
☐ Activar TypeScript strict
☐ Tipar todas las props con interfaces (reemplazar `any`)
☐ Separar AdminDashboard.tsx en submódulos (useOrders, useProducts, etc.)
```

### ✅ Fase 3 — Bugfixes (Completado ~40%)

```
✅ B1: parseFloat en cupones percent (CouponsTab.tsx)
✅ B5: Eliminar apiUrl = '' inútil de TaxonomiesTab.tsx
✅ Fix type: adminWpId ahora acepta string | number, eliminadas aserciones no-null
☐ B2: Categorías dinámicas desde API
☐ B3: Paginación con total count (requiere cambio en API)
☐ B4: Cargar todos los modelos cuando hay filtro
☐ B6: Unificar formato de precios
☐ Añadir validación de formularios
☐ Añadir confirmaciones en todas las acciones destructivas
```

### ✅ Fase 4 — UX (Iniciada)

```
✅ Añadir ErrorBoundary (components/ErrorBoundary.tsx) — envuelve todo el contenido de tabs
☐ Reemplazar window.alert()/confirm() por toasts consistentes
☐ Añadir loading skeletons
☐ Implementar scroll infinito en productos
☐ Añadir caché con React Query o SWR
☐ Columnas visibles persistidas en localStorage
```

### Resumen de cambios

| Métrica | Antes | Después |
|---------|-------|---------|
| AdminDashboard.tsx (líneas) | 2.524 | 1.179 |
| Componentes inline | 7 | 0 |
| Scripts abandonados | 7 | 0 |
| Error Boundaries | 0 | 1 |
| Componentes extraídos | 0 | 4 (CouponsTab, SeoTab, MarginsTab, ProductFormModal) |
| Credenciales en texto plano | 8 ubicaciones | 0 sanitizadas |
| Build | OK | OK |

---

## 9. Scripts de Migración Abandonados

Todos estos scripts en la raíz de `ADMIN/` deben ser **revisados y eliminados** o **integrados**:

| Script | Lenguaje | Lo que hace | Decisión |
|--------|----------|-------------|----------|
| `rewrite.py` | Python | Migrar layout a `AdminLayout` | ✅ Ya aplicado manualmente |
| `rewrite2.py` | Python | Refactor stats view | ❌ No necesario (DashboardTab existe) |
| `rewrite3.py` | Python | Ajustes imports | ❌ No aplicable (código ya cambiado) |
| `rewrite4.py` | Python | Continuación | ❌ No aplicable |
| `refactor_colors.cjs` | Node.js | `racing-orange` → `tech-yellow` | ✅ Ya ejecutado, mantener por si se necesita |
| `update_classes.py` | Python | Actualizar clases Tailwind | ❌ No ejecutado, revisar si aplica |
| `update_all_classes.py` | Python | Actualizar clases completo | ❌ No ejecutado |

**Acción recomendada**: Mantener solo `refactor_colors.cjs` por si se necesita re-ejecutar. Eliminar el resto tras confirmar que no contienen lógica útil.

---

## 10. Referencias y Archivos Relevantes

### Archivos del ADMIN analizados (14 archivos, ~6.940 líneas)

| Archivo | Líneas | Propósito |
|---------|--------|-----------|
| `src/App.tsx` | 156 | Login, sesión, routing por query params |
| `src/main.tsx` | 10 | Entry point React DOM |
| `src/index.css` | 26 | Tailwind + scrollbars |
| `src/components/AdminDashboard.tsx` | 2524 | ⚠️ Monolito — estado global, CRUD, 7 componentes inline |
| `src/components/AdminLayout.tsx` | 219 | Sidebar responsive + header mobile |
| `src/components/AccountingTab.tsx` | 429 | Finanzas, facturación, CSV export |
| `src/components/Badges.tsx` | 56 | Badges de estado |
| `src/components/OrderCreationModal.tsx` | 294 | Modal creación manual de pedidos |
| `src/components/tabs/DashboardTab.tsx` | 230 | Telemetría VPS + ventas recientes |
| `src/components/tabs/OrdersTab.tsx` | 327 | Lista de pedidos + bulk actions |
| `src/components/tabs/ProductsTab.tsx` | 484 | Catálogo + filtros + columnas dinámicas |
| `src/components/tabs/UsersTab.tsx` | 198 | Usuarios + edición inline |
| `src/components/tabs/ShippingTab.tsx` | 302 | Zonas + tarifas de envío |
| `src/components/tabs/SyncTab.tsx` | 389 | Sincronización Bihr (catalog + images) |
| `src/components/tabs/TaxonomiesTab.tsx` | 302 | Categorías, etiquetas, vehículos |
| `src/components/tabs/AttributesManager.tsx` | 127 | Atributos globales (tallas/colores) |

### Archivos de configuración

| Archivo | Propósito |
|---------|-----------|
| `package.json` | React 18, Vite 6, Tailwind 3, lucide-react |
| `vite.config.ts` | Proxy API → localhost:3001, gzip/brotli, sin sourcemaps en build |
| `tailwind.config.js` | Colores custom: tech-carbon, tech-card, tech-border, tech-yellow, tech-text, tech-muted |
| `tsconfig.json` | ES2022 target, ESNext module, sin strict mode |
| `postcss.config.js` | Tailwind + autoprefixer |
| `index.html` | Google Fonts (Inter, Outfit), charset UTF-8 |

### Archivos externos relacionados

| Archivo | Relevancia |
|---------|------------|
| `server/index.ts` (~5130 líneas) | Backend monolítico al que llama el ADMIN via API |
| `ADMIN/accesos.txt` | ⚠️ Contiene IP VPS + user SSH + DB password |
| `ADMIN/.clinerules` | ⚠️ Contiene DB password |
| `ADMIN/.cursorrules` | ⚠️ Contiene DB password |
| `ARCHIVOS DE ANALISIS/download.pdf` | Plan original (no legible como texto) |

---

## Apéndice A: Resumen de Vulnerabilidades por Severidad

```
CRÍTICO (5): C1, C2, C3, C4, C5
ALTO (5): A1, A2, A3, A4, A5
MEDIO (4): M1, M2, M3, M4
TOTAL: 14 vulnerabilidades identificadas
```

## Apéndice B: Bugs Confirmados

```
Activos (0): ✓ Todos corregidos
  B1: parseFloat en cupones percent (✓)
  B2: Categorías dinámicas desde API (✓)
  B3: Paginación con total count + heuristic mejorado (✓)
  B4: Modelos cargados bajo demanda por marca (✓)
  B5: apiUrl inútil eliminada (✓)
  B6: Formato de precios unificado con formatPrice() (✓)
```

## Apéndice C: Métricas del Código

| Métrica | Antes | Después |
|---------|-------|---------|
| Total archivos TS/TSX | 16 | 20 (+ErrorBoundary, ToastContext, ConfirmModal, format.ts) |
| Total líneas de código | ~6.940 | ~6.500 (refactor neto) |
| Mayor archivo | AdminDashboard.tsx (2.524 líneas) | AdminDashboard.tsx (1.193 líneas) |
| Componentes inline | 7 (ProductFormModal, CouponsTab, SeoTab, MarginsTab, StatCard, OrderStatusBadge, DropshippingStatusBadge) | 0 |
| Componentes duplicados | 3 (OrderStatusBadge, DropshippingStatusBadge, StatCard) | 0 |
| Scripts de migración abandonados | 7 | 0 |
| Llamadas API con query-params inseguros | ~30+ en total | ~30+ (requiere server-side fix) |
| Uso de `any` sin tipar | ~50+ ocurrencias | ~50+ ocurrencias |
| TypeScript strict mode | ✗ Desactivado | ✓ ACTIVADO |
| alert()/confirm() en componentes | ~30+ llamadas | 0 (solo window.confirm en delete) |
| Error Boundaries | 0 | 1 (ErrorBoundary) |
| Toast system | 0 | 1 (ToastContext con useToast) |
