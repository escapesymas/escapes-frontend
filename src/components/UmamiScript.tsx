import Script from 'next/script';
import { createBeforeSend } from '../lib/umamiBeforeSend';

// Umami analytics — privacy-first (no cookies, no GDPR banner required).
// Renders nothing unless NEXT_PUBLIC_UMAMI_ENABLED === 'true' AND the website
// ID is configured.
//
// El script se sirve desde el propio dominio (/a/m.js, y los eventos van a
// /a/api/send): Traefik lo reenvía a Umami. Los bloqueadores de anuncios
// filtran umami.escapesymas.com/script.js, pero no una ruta propia de la tienda.
// data-domains: solo cuenta las visitas de la web real (no localhost ni pruebas).
const ENABLED = process.env.NEXT_PUBLIC_UMAMI_ENABLED === 'true';
const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || '';

export default function UmamiScript() {
  if (!ENABLED || !WEBSITE_ID) return null;
  return (
    <>
      {/* El filtro tiene que existir antes que el script de Umami (lo busca por nombre en cada envío): ver lib/umamiBeforeSend.ts. */}
      <script suppressHydrationWarning dangerouslySetInnerHTML={{ __html: `window.umamiBeforeSend=(${createBeforeSend.toString()})();` }} />
      <Script
        defer
        src="/a/m.js"
        data-website-id={WEBSITE_ID}
        data-domains="escapesymas.com"
        data-before-send="umamiBeforeSend"
        strategy="afterInteractive"
      />
    </>
  );
}
