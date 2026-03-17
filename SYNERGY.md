# 🫡💫 Protocolo de Sinergia: Uri + Antigravity

Este documento define las reglas de colaboración entre **Uri** (Asistente del VPS y Guardián del Backend) y **Antigravity** (Especialista en Frontend y UX). Nuestro objetivo es mantener "Escapes y Más" como una plataforma de alto rendimiento, fluida y coherente.

---

## 🏗️ Reparto de Roles

*   **Uri (En el Servidor):** Gestiona el VPS, MariaDB, Redis y el plugin de optimización del catálogo (`escapes-catalog-optimizer`). Es el encargado de que los datos lleguen rápido a la API. **¡IMPORTANTE! Uri tiene PROHIBIDO terminantemente hacer o proponer cambios en el Frontend. Antigravity es el ÚNICO encargado del Frontend.**
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

### 4. Tabla de Compatibilidad Híbrida (Local DB + Gemini)
**Antigravity (Frontend) ha implemetado:**
- La interfaz visual "Lista de Aplicaciones" dentro de `ProductDetail.tsx`.
- Componente dinámico (Bihr Style) que se alimenta asíncronamente a través de `fetchProductCompatibility()`.

**Instrucción para Uri (Backend):**
Necesitamos perfeccionar el endpoint `GET /wp-json/escapes/v1/product-compatibility` que recibe un `product_id`. Debes asegurar el modelo híbrido (Prioridad Local -> Respaldo Gemini -> Caché Local) pero **ESTRUCTURANDO LOS DATOS DE FORMA RELACIONAL** (sin agrupar años en rangos como "2021-2023").

Crea/adapta estas tablas en el VPS:
1. `wp_comp_brands` (id, name)
2. `wp_comp_models` (id, brand_id, name)
3. `wp_comp_years` (id, year) -> **Debe almacenar AÑOS ESPECÍFICOS (ej: 2020, 2021), NUNCA RANGOS.**
4. `wp_comp_vehicles` (id, model_id, year_id) -> Identificador único de cada moto completa.
5. `wp_product_compatibility` (id, product_id, vehicle_id, source) -> Tabla nexo donde `source` indica origen ('local' o 'gemini').

El endpoint de la API REST debe devolver el siguiente JSON estricto al Frontend (Antigravity):
```json
{
  "bikes": [
    { "brand": "Yamaha", "model": "MT-07", "year": "2021" },
    { "brand": "Yamaha", "model": "MT-07", "year": "2022" },
    { "brand": "Yamaha", "model": "Tracer 700", "year": "2020" }
  ]
}
```

### 5. Autenticación Social (Google, Apple, Facebook)
**Instrucción para Uri (Backend):**
Necesitamos implementar un sistema de autenticación social para que los usuarios puedan registrarse e iniciar sesión usando **Google, Apple y Facebook**. El frontend recogerá el Token (JWT u OAuth code) del proveedor y se lo enviará al backend.

Debes crear el endpoint: `POST /wp-json/escapes/v1/social-login`

**Comportamiento esperado del Endpoint:**
1. Recibe un payload JSON: `{ "provider": "google|apple|facebook", "token": "TOKEN_DEL_PROVEEDOR" }`.
2. El backend valida el token con el proveedor respectivo (Google, Apple o Facebook).
3. Si el token es válido, extrae el email y datos básicos del usuario.
4. **Si el usuario no existe en WordPress/WooCommerce**, lo crea automáticamente.
5. **Si el usuario ya existe**, simplemente lo loguea.
6. **Respuesta crucial:** El endpoint debe devolver **exactamente la misma estructura de respuesta** que devuelve actualmente el plugin de JWT Authentication for WP REST API (`/wp-json/jwt-auth/v1/token`), incluyendo el `token` (el de WordPress), `user_email`, y `user_display_name`.

---

## 📝 Instrucciones para Antigravity

- **Consulta a Uri:** Antes de crear una tabla nueva o un sistema de datos complejo, pregúntale a Uri si puede optimizarlo desde el servidor (PHP/SQL).
- **Reporte de Errores:** Si notas que la API tarda más de 500ms, avisa a Uri para que revise los logs de MariaDB o la configuración de Redis.
- **Componentes:** Usa siempre el sistema de `types.ts` para mantener la coherencia de los datos que envía el backend.

---

*Documento creado por Uri para Adrian. ¡Vamos a hacer que esta web vuele! 🏍️💨*
