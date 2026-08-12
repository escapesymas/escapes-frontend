import React from 'react';

// 1. Icono personalizado: Tubo de Escape Deportivo & ITV
export function IconExhaustITV({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Cuerpo principal del silenciador de escape */}
      <path
        d="M4 19L18 10L26 13.5L12 22.5L4 19Z"
        fill="currentColor"
        fillOpacity="0.2"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {/* Colector de entrada */}
      <path
        d="M4 19L2 20.5M4 16.5L2 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Salida del silenciador (Tapa carbono) */}
      <path
        d="M26 13.5L29 12L25 9.5L22 11"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Chapa/Abrazadera de homologación ITV */}
      <rect
        x="13"
        y="12.5"
        width="3.5"
        height="7.5"
        rx="1"
        transform="rotate(-26 13 12.5)"
        fill="currentColor"
        fillOpacity="0.4"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      {/* Líneas de flujo/gases de escape */}
      <path
        d="M27.5 10C29.5 9 30.5 7.5 30 6"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

// 2. Icono personalizado: Casco Integral Deportivo & Equipación
export function IconHelmetGear({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Calota exterior del casco */}
      <path
        d="M16 4C9.37 4 4 9.37 4 16C4 20.5 6.5 24.5 10 26.5L13 28H20C24.42 28 28 24.42 28 20V16C28 9.37 22.63 4 16 4Z"
        fill="currentColor"
        fillOpacity="0.15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Visera aerodinámica tintada */}
      <path
        d="M9 13H24C25.1 13 26 13.9 26 15C26 17.5 24 19.5 21.5 19.5H12.5C10.5 19.5 9 18 9 16V13Z"
        fill="currentColor"
        fillOpacity="0.5"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Entrada de aire mentonera */}
      <path
        d="M13 24H19M14 26H18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Alerón trasero superior */}
      <path
        d="M8 8.5C11 6.5 16 6.5 20 8"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}

// 3. Icono personalizado: Cadena de Transmisión & Corona de Dientes
export function IconChainTransmission({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Corona / Engranaje dentado */}
      <circle
        cx="16"
        cy="16"
        r="11"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="3 2"
        fill="currentColor"
        fillOpacity="0.1"
      />
      {/* Eje central con agujeros de aligeramiento */}
      <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
      <circle cx="16" cy="9" r="1" fill="currentColor" />
      <circle cx="16" cy="23" r="1" fill="currentColor" />
      <circle cx="9" cy="16" r="1" fill="currentColor" />
      <circle cx="23" cy="16" r="1" fill="currentColor" />

      {/* Eslabón exterior de cadena X-Ring */}
      <path
        d="M3 13C3 11.34 4.34 10 6 10H10C11.66 10 13 11.34 13 13C13 14.66 11.66 16 10 16H6C4.34 16 3 14.66 3 13Z"
        fill="currentColor"
        fillOpacity="0.25"
        stroke="currentColor"
        strokeWidth="1.75"
      />
      <circle cx="6" cy="13" r="1.5" fill="currentColor" />
      <circle cx="10" cy="13" r="1.5" fill="currentColor" />
    </svg>
  );
}

// 4. Icono personalizado: Disco de Freno Floreado (Wave) & Pinza
export function IconWaveBrake({ className = 'w-7 h-7' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Disco de freno lobulado / wave */}
      <path
        d="M16 3C18 3 19.5 4.5 21 4C22.5 3.5 24 5 25 6.5C26 8 27.5 8.5 28 10C28.5 11.5 27.5 13 28 14.5C28.5 16 28.5 18 28 19.5C27.5 21 28.5 22.5 27.5 24C26.5 25.5 25 26 24 27.5C23 29 21 28.5 19.5 29C18 29.5 16 29.5 14.5 29C13 28.5 11 29 9.5 27.5C8 26 8.5 24.5 7.5 23.5C6.5 22.5 5 21 4.5 19.5C4 18 5 16.5 4.5 15C4 13.5 4 11.5 4.5 10C5 8.5 6.5 7.5 7.5 6C8.5 4.5 10.5 5 12 4.5C13.5 4 14.5 3 16 3Z"
        fill="currentColor"
        fillOpacity="0.12"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      {/* Agujeros de ventilación perforados */}
      <circle cx="16" cy="7.5" r="0.9" fill="currentColor" />
      <circle cx="23.5" cy="11" r="0.9" fill="currentColor" />
      <circle cx="24.5" cy="18.5" r="0.9" fill="currentColor" />
      <circle cx="18.5" cy="24.5" r="0.9" fill="currentColor" />
      <circle cx="11" cy="23.5" r="0.9" fill="currentColor" />
      <circle cx="7.5" cy="16" r="0.9" fill="currentColor" />

      {/* Núcleo central flotante */}
      <circle cx="16" cy="16" r="5" stroke="currentColor" strokeWidth="1.75" />
      <circle cx="16" cy="16" r="2.2" fill="currentColor" />

      {/* Pinza de freno deportiva (Brembo style) */}
      <path
        d="M21 2H27C28.1 2 29 2.9 29 4V10C29 11.1 28.1 12 27 12H24.5L21 8.5V2Z"
        fill="currentColor"
        fillOpacity="0.6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
