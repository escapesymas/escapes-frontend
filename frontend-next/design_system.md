# 🛠️ Sistema de Diseño — Escapes y Más (Next.js Frontend)

Este documento define la identidad visual, la paleta de colores y el enfoque de accesibilidad/CRO para la nueva interfaz de la plataforma web de escapes y recambios premium.

---

## 📐 Concepto Visual: **Technical Garage** (Estilo Industrial / Telemetría)

Inspirado en los paneles de control de motocicletas de carreras, consolas de telemetría de Moto GP y cajas de herramientas metálicas de alta precisión.

*   **Tipografía Primaria:** Monospace (`font-mono`) para encabezados, códigos de pieza, medidas, badges y elementos de compatibilidad. Da un acabado técnico y preciso.
*   **Tipografía Secundaria:** Sans-serif (`font-sans`) para textos de lectura largos (p. ej., descripción de productos, hilos de discusión) para garantizar alta legibilidad.
*   **Detalles Visuales:** Bordes limpios tipo rejilla (`rounded-md`, aprox. 6px), uso de indicadores de estado (p. ej., color verde de éxito para indicar compatibilidad de piezas), y sombras suaves.

---

## 🎨 Ficha de Colores y Tokens CSS

El sistema es **completamente adaptativo** y cambia de color de forma nativa a través de variables de entorno CSS (`globals.css`) según las preferencias del dispositivo del cliente (`prefers-color-scheme`).

### 🌑 Tema Oscuro (Modo Nocturno / Garaje)
Adecuado para evocar la estética nocturna del motorista y la exclusividad del carbono y el titanio.

*   **Fondo de Página (Background):** `bg-[#0a0a0b]` (Negro carbón puro).
*   **Tarjetas y Contenedores (Cards):** `bg-[#121315]` (Gris titanio oscuro mate) con borde `border-[#1e293b]`.
*   **Acento (Llamadas a la acción/Botones):** `bg-[#facc15]` (Amarillo neón / competición) con textos en negro.
*   **Texto Principal:** `text-[#f1f5f9]` (Blanco slate).
*   **Texto Secundario (Muted):** `text-[#94a3b8]` (Gris slate).

### ☀️ Tema Claro (Modo Diurno / Alta Lectura)
Diseñado para eliminar la fatiga visual al leer especificaciones técnicas muy densas y dar fiabilidad en el Checkout.

*   **Fondo de Página (Background):** `bg-[#f8fafc]` (Gris slate ultra claro).
*   **Tarjetas y Contenedores (Cards):** `bg-[#ffffff]` (Blanco puro) con borde `border-[#e2e8f0]`.
*   **Acento (Llamadas a la acción/Botones):** `bg-[#eab308]` (Amarillo oscuro de alta visibilidad) con textos en negro.
*   **Texto Principal:** `text-[#0f172a]` (Slate oscuro).
*   **Texto Secundario (Muted):** `text-[#475569]` (Gris slate medio).

---

## 🔄 Adaptabilidad del Logotipo
El logo principal (`/logo-cabecera.svg`) es de color blanco por defecto. Para adaptarse de forma óptima a los temas dinámicos:
*   En **Tema Claro**, se le aplican las clases CSS `invert` (invirtiendo el color a negro para que resalte sobre el fondo blanco).
*   En **Tema Oscuro**, se mantiene en `dark:invert-0` (color blanco original integrado en el diseño oscuro).

---

## 📈 Criterios de CRO (Optimización de Conversión)
*   **Mobile-First:** La búsqueda por modelo de moto y las compras de impulso en comunidad deben estar diseñadas para su uso rápido con el pulgar.
*   **Legibilidad Técnica:** En las tablas de compatibilidad y fichas técnicas de escape, el tamaño de la letra y el contraste debe cumplir rigurosamente el nivel **WCAG AA** para evitar abandonos.
*   **Sincronización de Sesión:** Next.js persistirá los carritos entre dispositivos para que el cliente que descubra el escape en su garaje con el móvil pueda finalizar el pago fácilmente en su ordenador.
