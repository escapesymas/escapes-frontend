'use client';

/** Vuelve a abrir el aviso de cookies para cambiar o retirar el permiso. */
export default function CookieSettingsButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event('open_cookie_settings'))}
      className={className}
    >
      Gestionar cookies
    </button>
  );
}
