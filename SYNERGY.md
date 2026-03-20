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

### 4. Tabla de Compatibilidad Híbrida (Master List + Legacy Support)
**Antigravity (Frontend) ha implemetado:**
- La interfaz visual "Lista de Aplicaciones" dentro de `ProductDetail.tsx`.
- Componente dinámico (Bihr Style) que se alimenta asíncronamente a través de `fetchProductCompatibility()`.

**Cambio Importante (2026-03-20):**
Uri ha integrado una **Tabla Maestra de Vehículos** (`wp_vehicles_master`) con 64.350 registros oficiales. Esta tabla es ahora la fuente de verdad primaria.

**Instrucción para Antigravity:**
El endpoint `GET /wp-json/escapes/v1/product-compatibility` ha sido actualizado. Ahora devuelve datos más ricos cuando el vehículo está mapeado en la lista maestra.

**Estructura de Respuesta Actualizada:**
```json
{
  "bikes": [
    { 
      "brand": "KAWASAKI", 
      "model": "NINJA 250 R", 
      "year": "2009",
      "version": "NINJA 250 R SPECIAL EDITION (EX250K)",
      "category": "SUPERSPORT",
      "displacement": 250
    }
  ],
  "source": "master_list | local_legacy | fallback_text"
}
```
*Nota: Los campos `version`, `category` y `displacement` solo vienen si `source` es `master_list`. Antigravity debe manejar la presencia opcional de estos campos en la UI (ej: mostrar la versión exacta si está disponible).*

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
