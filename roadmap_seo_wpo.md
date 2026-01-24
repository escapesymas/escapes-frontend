# Hoja de Ruta: Optimización Integral E-commerce y Foro de Motos

Como Consultor Senior en SEO Técnico, WPO y Product Manager, presento a continuación la estrategia detallada para maximizar conversiones, visibilidad orgánica y rendimiento técnico.

## 1. Matriz de Prioridades (Impacto vs. Esfuerzo)

| Iniciativa | Impacto Estimado | Esfuerzo Técnico | Prioridad |
| :--- | :---: | :---: | :---: |
| **Optimización Critical Rendering Path (CRP)** | 🔴 Alto | 🟠 Medio | **P0 - Crítica** |
| **Estrategia de Caché Híbrida (Foro/Tienda)** | 🔴 Alto | 🔴 Alto | **P1 - Alta** |
| **Arquitectura de URLs (Marca/Modelo/Año)** | 🔴 Alto | 🔴 Alto | **P1 - Alta** |
| **Datos Estructurados (Schema.org)** | 🟠 Medio | 🟢 Bajo | **P2 - Media** |
| **Mi Garaje (Perfil Usuario)** | 🔴 Alto | 🔴 Alto | **P2 - Media** |
| **Mejora Checkout Móvil** | 🔴 Alto | 🟠 Medio | **P0 - Crítica** |
| **Optimización Imágenes (WebP/AVIF + Lazy)** | 🟠 Medio | 🟢 Bajo | **P1 - Alta** |
| **Enlazado Interno Automático (Foro -> Producto)** | 🟠 Medio | 🟠 Medio | **P2 - Media** |
| **Buscador VIN / Matrícula** | 🟣 Muy Alto (UX) | 🔴 Alto | **P3 - Futuro** |

---

## 2. Desarrollo Técnico Detallado

### 1. Rendimiento y WPO (Web Performance)

#### Optimización del Critical Rendering Path (CRP)
Con miles de referencias, el objetivo es pintar el contenido principal (LCP) en < 1.0s.
*   **CSS Crítico (Critical CSS):** Extraer e inyectar *inline* en el `<head>` solo el CSS necesario para el "above the fold". Cargar el resto de estilos de forma asíncrona (`rel="preload"`).
*   **Code Splitting (JS):** Dividir los bundles por rutas. No cargar JS del Checkout en la Home, ni JS del editor de texto del Foro en las fichas de producto.
*   **Resource Hints:** Utilizar `dns-prefetch` y `preconnect` para dominios de terceros (ej. CDN de imágenes, Analytics).

#### Estrategia de Almacenamiento en Caché (Híbrida)
El desafío es mezclar contenido estático (tienda) con dinámico (foro).
*   **Tienda (Catálogo/Fichas):** Implementar **Stale-While-Revalidate (SWR)**. Servir la versión en caché inmediatamente mientras se actualiza en segundo plano. Cachear a nivel de CDN (Edge Caching) para usuarios anónimos.
*   **Foro (Hilos/Respuestas):** No cachear HTML completo para usuarios logueados. Usar "Fragment Caching" para partes estáticas (header, footer, sidebar) y cargar el contenido dinámico (nuevos posts) mediante llamadas API ligeras (hydration) o SSR con tiempos de expiración muy cortos (TTL < 1min).

#### Optimización de Imágenes y Diagramas
*   **Formatos:** Servir **AVIF** como primera opción, con fallback a **WebP**.
*   **Diagramas Técnicos (Despieces):**
    *   No usar JPG/PNG planos. Usar **SVG** siempre que sea vectorizable para nitidez infinita al hacer zoom.
    *   Si son bitmapped, usar "Lazy Loading" nativo (`loading="lazy"`) y asegurar que tengan dimensiones explícitas (`width`/`height`) para evitar CLS (Cumulative Layout Shift).
    *   Implementar un visor "pan & zoom" eficiente que cargue azulejos (tiling) solo si la imagen original es inmensa (>4k px).

### 2. SEO y Arquitectura de la Información

#### URLs Amigables y Jerárquicas
Estructura lógica para capturar tráfico long-tail y facilitar la navegación:
*   `dominio.com/recambios/{marca}/{modelo}/{ano}/{categoria}/{producto}`
*   *Ejemplo:* `dominio.com/recambios/honda/cbr-600-rr/2022/escapes/akraprovic-slip-on`
*   **Canonicalización:** Asegurar que variaciones de orden (ej. filtros) apunten a la URL canónica principal.

#### Datos Estructurados (Schema.org)
Implementación JSON-LD para ganar Rich Snippets:
*   **Producto (`Product`):** Propiedades obligatorias: `name`, `description`, `image`, `sku`, `brand`.
*   **Oferta (`Offer`):** `price`, `priceCurrency`, `availability` (InStock/OutOfStock).
*   **Opiniones (`AggregateRating`):** Crucial para CTR. Integrar reseñas verificadas.
*   **Foro (`DiscussionForumPosting`):** Para los hilos. Marcar las preguntas como `Question` y la respuesta aceptada (si existe) como `Answer`.
*   **BreadcrumbList:** Indispensable para que Google entienda la jerarquía Marca > Modelo.

#### Enlazado Interno Automático
Script que analiza el contenido de los posts del foro:
*   Detectar menciones de "Producto X" o "Referencia Y".
*   Generar automáticamente un enlace "dofollow" a la ficha del producto en la tienda.
*   Crear una "Card de Producto" flotante o al final del post si se detecta una intención transaccional clara.

### 3. Funcionalidades de Valor Añadido

#### Buscador Avanzado (VIN / Matrícula)
*   Integración con API de base de datos de vehículos (ej. DGT en España o servicios privados tipo TecDoc).
*   **Flujo:** Usuario introduce matrícula -> Sistema devuelve "Honda CBR 600 RR 2022" -> Redirección automática a la categoría filtrada para esa moto exacta. Elimina la fricción de seleccionar manual.

#### Integración Foro-Tienda ("Etiquetado de Piezas")
*   Permitir a usuarios con reputación > X (Expertos) usar un botón "Insertar Producto" en el editor del foro.
*   Buscador modal rápido dentro del editor.
*   Resultado: Un bloque visual dentro del post (Foto + Precio + Botón "Añadir al carrito") directamente en la guía de reparación.

#### Mi Garaje
*   Sección privada en el perfil.
*   Permitir guardar múltiples motos (Alias: "La de circuito", "La de diario").
*   **Sticky Header Contextual:** Cuando el usuario selecciona una moto de su garaje, toda la navegación de la tienda se filtra automáticamente: "Viendo recambios compatibles con: **Yamaha R1 2005**".

### 4. UX y Conversión (CRO)

#### Checkout Móvil (Contexto: "Manos Sucias")
*   **Guest Checkout por defecto:** No forzar registro/login al principio.
*   **Inputs Grandes:** Campos de formulario con altura de toque > 48px y espaciado generoso.
*   **Teclados Numéricos:** Forzar teclado numérico en campos de teléfono y tarjeta (`inputmode="numeric"`).
*   **Pago One-Tap:** Integración prioritaria de Apple Pay / Google Pay. Es difícil sacar la tarjeta de crédito con grasa en las manos, pero la huella/cara funciona rápido.

#### Sistema de Reseñas Verificadas (Karma + Compra)
*   Distinguir reseñas de "Comprador Verificado" (icono verde) de "Opinión de Usuario".
*   Mostrar el "Rango del Foro" del usuario junto a su reseña en el producto. Una opinión de un "Mecánico Experto" (Rango Foro) vale x10 para la conversión que la de un anónimo.
