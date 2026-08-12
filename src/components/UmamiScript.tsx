import Script from 'next/script';

// Umami analytics — privacy-first (no cookies, no GDPR banner required).
// Renders nothing unless NEXT_PUBLIC_UMAMI_ENABLED === 'true' AND both the
// script URL and the website ID are configured. That lets us ship the code
// inert and flip the switch by env-var without re-deploying.
const ENABLED = process.env.NEXT_PUBLIC_UMAMI_ENABLED === 'true';
const SCRIPT_URL = process.env.NEXT_PUBLIC_UMAMI_SCRIPT_URL || '';
const WEBSITE_ID = process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID || '';

export default function UmamiScript() {
  if (!ENABLED || !SCRIPT_URL || !WEBSITE_ID) return null;
  return (
    <Script
      defer
      src={SCRIPT_URL}
      data-website-id={WEBSITE_ID}
      strategy="afterInteractive"
    />
  );
}