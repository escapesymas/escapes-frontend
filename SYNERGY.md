# 🫡💫 Protocolo de Sinergia: Uri + Antigravity

Este documento define las reglas de colaboración entre **Uri** (Asistente del VPS y Guardián del Backend) y **Antigravity** (Especialista en Frontend y UX). Nuestro objetivo es mantener "Escapes y Más" como una plataforma de alto rendimiento, fluida y coherente.

---

## 🏗️ Reparto de Roles

*   **Uri (En el Servidor):** Gestiona el VPS, MariaDB, Redis y el plugin de optimización del catálogo (`escapes-catalog-optimizer`). Es el encargado de que los datos lleguen rápido a la API.
*   **Antigravity (Local):** Gestiona el diseño, la lógica de React y la experiencia de usuario. Su "punto de verdad" es el código que vive en este repositorio.

---

## 🔄 Flujo de Trabajo Sincronizado

1.  **Repositorio Compartido:** GitHub es nuestro punto de encuentro. Uri sube cambios del motor de datos; Antigravity los recibe mediante *GitHub Desktop*.
2.  **Despliegue Automático:** Cualquier cambio subido por Uri o Antigravity dispara un deploy en **Vercel**.
3.  **Identidad de Git:** Para evitar bloqueos en Vercel, Uri siempre firmará sus commits como `escapesymas <info@escapesymas.com>`.

---

## 🛠️ Herramientas de Sinergia Actuales

### 1. El Motor de Compatibilidad (`escapes/v1`)
Uri ha implementado un motor inteligente en el servidor que filtra 94.000 productos en milisegundos.
- **Endpoint Clave:** `/wp-json/escapes/v1/compatible-categories`
- **Uso:** No descargues productos masivos. Pide a la API las categorías compatibles para una moto y muestra el componente `CompatibleCategories.tsx`.

### 2. Caché Híbrida (Redis + REST Cache)
El backend está optimizado con **Redis** en la RAM del servidor.
- **Regla:** Antigravity debe confiar en que las peticiones repetitivas a la API serán instantáneas. No es necesario implementar sistemas complejos de estado local para el catálogo; deja que el servidor haga el trabajo sucio.

### 3. Estética y UX (Bihr Style)
- **Dark Mode:** Mantener siempre la estética premium (Carbono, Naranja Racing, Neones).
- **Filtro No Intrusivo:** El catálogo debe empezar "limpio". No se muestran productos hasta que el cliente defina qué busca.
- **Jerarquía:** Mostrar siempre categorías padre (Chasis, Motor...) con sus hijos debajo cuando hay una moto seleccionada.

---

## 📝 Instrucciones para Antigravity

- **Consulta a Uri:** Antes de crear una tabla nueva o un sistema de datos complejo, pregúntale a Uri si puede optimizarlo desde el servidor (PHP/SQL).
- **Reporte de Errores:** Si notas que la API tarda más de 500ms, avisa a Uri para que revise los logs de MariaDB o la configuración de Redis.
- **Componentes:** Usa siempre el sistema de `types.ts` para mantener la coherencia de los datos que envía el backend.

---

*Documento creado por Uri para Adrian. ¡Vamos a hacer que esta web vuele! 🏍️💨*
