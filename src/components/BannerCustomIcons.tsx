import React from 'react';

// 1. ESCAPES & ITV — Escape deportivo de titanio & carbono con llama/gases
export function IconExhaustITV({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="exhaustBody" x1="6" y1="30" x2="38" y2="16" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="exhaustCap" x1="34" y1="18" x2="44" y2="12" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="flameGrad" x1="40" y1="14" x2="47" y2="6" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* Tubo de colectivo de entrada */}
      <path d="M4 33C8 33 11 31 14 28.5" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      <path d="M6 37C10 37 13 35 16 32.5" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />

      {/* Silenciador principal */}
      <path
        d="M13 29.5L34 16.5C35.5 15.5 37 16.5 37 18.5L35.5 25.5C35 27 33.5 28 32 29L11 41C9.5 42 7.5 41 7.5 39.5L9.5 32.5C10 30.5 11.5 29.5 13 29.5Z"
        fill="url(#exhaustBody)"
        stroke="#B45309"
        strokeWidth="1.5"
      />

      {/* Tapa trasera estilo Carbono */}
      <path
        d="M34 16.5L42 12C43.5 11 45 12.5 44 14.5L40 22.5C39.5 23.5 38.5 24 37.5 24.5L35.5 25.5"
        fill="url(#exhaustCap)"
        stroke="#1E293B"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Salida del tubo */}
      <ellipse cx="41.5" cy="14" rx="2.5" ry="4" transform="rotate(-30 41.5 14)" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />

      {/* Chapa / Placa ITV de homologación */}
      <rect x="20" y="21" width="8" height="4.5" rx="1" transform="rotate(-30 20 21)" fill="#FEF3C7" stroke="#B45309" strokeWidth="1" />
      <circle cx="21.5" cy="22" r="0.5" fill="#B45309" />
      <circle cx="26" cy="19.5" r="0.5" fill="#B45309" />

      {/* Abrazadera de fijación con muelle */}
      <path d="M25 15.5L20 25.5" stroke="#78350F" strokeWidth="2.5" strokeLinecap="round" />

      {/* Ráfaga de gas/llama de escape */}
      <path d="M42 12C45 9 46 6 44.5 4C43 2 40 4 38 7" fill="url(#flameGrad)" />
    </svg>
  );
}

// 2. CASCOS & ROPA — Casco integral deportivo aerodinámico con visera iridium
export function IconHelmetGear({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="helmetShell" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="visorIridium" x1="14" y1="18" x2="38" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* Calota exterior del casco */}
      <path
        d="M24 6C13.5 6 5 14.5 5 25C5 32 8.5 38 14 41.5L18 43H30C37 43 43 37 43 30V25C43 14.5 34.5 6 24 6Z"
        fill="url(#helmetShell)"
        stroke="#065F46"
        strokeWidth="1.5"
      />

      {/* Visera de carreras espejo/iridium */}
      <path
        d="M13 19H36C38 19 39.5 20.5 39 22.5C38 27 34.5 30.5 29 30.5H18C14.5 30.5 12 28 12 24.5V20.5C12 19.5 12.5 19 13 19Z"
        fill="url(#visorIridium)"
        stroke="#064E3B"
        strokeWidth="1.5"
      />
      {/* Detalle reflejo espejo en visera */}
      <path d="M16 21H28C32 21 34 23 34 25" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.7" />

      {/* Alerón / spoiler trasero aerodinámico */}
      <path d="M10 13C16 10 24 10 30 12" stroke="#A7F3D0" strokeWidth="2.5" strokeLinecap="round" />

      {/* Toma de aire superior */}
      <rect x="20" y="8" width="8" height="2.5" rx="1" fill="#064E3B" />

      {/* Mentonera y rejillas de ventilación frontal */}
      <path d="M19 37H29M20 40H28" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />

      {/* Pin de fijación visera tear-off */}
      <circle cx="14" cy="23" r="1.5" fill="#F1F5F9" />
      <circle cx="36" cy="23" r="1.5" fill="#F1F5F9" />
    </svg>
  );
}

// 3. TRANSMISIÓN — Engranaje / Corona con cadena dorada de alto rendimiento
export function IconChainTransmission({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="gearGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="chainGold" x1="2" y1="12" x2="22" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>

      {/* Corona trasera / Engranaje dentado */}
      <path
        d="M24 8L26.5 11L30 9.5L31 13L34.5 13.5L34 17L37 19L35 22L37 25L34 27L34.5 30.5L31 31L30 34.5L26.5 33L24 36L21.5 33L18 34.5L17 31L13.5 30.5L14 27L11 25L13 22L11 19L14 17L13.5 13.5L17 13L18 9.5L21.5 11L24 8Z"
        fill="url(#gearGrad)"
        stroke="#1E40AF"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Núcleo de la corona mecanizado cnc */}
      <circle cx="24" cy="22" r="8" fill="#0F172A" stroke="#60A5FA" strokeWidth="1.5" />
      <circle cx="24" cy="22" r="3.5" fill="#3B82F6" />

      {/* Ventanas de aligeramiento de la corona */}
      <circle cx="24" cy="11.5" r="1.5" fill="#93C5FD" />
      <circle cx="24" cy="32.5" r="1.5" fill="#93C5FD" />
      <circle cx="13.5" cy="22" r="1.5" fill="#93C5FD" />
      <circle cx="34.5" cy="22" r="1.5" fill="#93C5FD" />

      {/* Eslabón de cadena dorada X-Ring superpuesto */}
      <rect x="4" y="16" width="16" height="10" rx="5" fill="url(#chainGold)" stroke="#B45309" strokeWidth="1.5" />
      <rect x="14" y="16" width="16" height="10" rx="5" fill="url(#chainGold)" stroke="#B45309" strokeWidth="1.5" />

      {/* Pinos / Remaches de cadena */}
      <circle cx="9" cy="21" r="2" fill="#FEF3C7" stroke="#78350F" strokeWidth="1" />
      <circle cx="19" cy="21" r="2" fill="#FEF3C7" stroke="#78350F" strokeWidth="1" />
      <circle cx="25" cy="21" r="2" fill="#FEF3C7" stroke="#78350F" strokeWidth="1" />
    </svg>
  );
}

// 4. FRENADO PRO — Disco Wave ventilado con pinza roja racing tipo Brembo
export function IconWaveBrake({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="discMetal" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="50%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id="caliperRed" x1="28" y1="4" x2="44" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#B91C1C" />
        </linearGradient>
      </defs>

      {/* Disco floreado Wave */}
      <path
        d="M24 6C27 6 29 8 32 7.5C35 7 37.5 9.5 37 12.5C36.5 15.5 38.5 17.5 39 20.5C39.5 23.5 37.5 26 37 29C36.5 32 34.5 34 32 34.5C29.5 35 27 37 24 37C21 37 18.5 35 16 34.5C13.5 34 11.5 32 11 29C10.5 26 8.5 23.5 9 20.5C9.5 17.5 11.5 15.5 11 12.5C10.5 9.5 13 7 16 7.5C19 8 21 6 24 6Z"
        fill="url(#discMetal)"
        stroke="#475569"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Pista de frenado con ranuras de dispersión de calor */}
      <path d="M24 11C30.5 11 35.5 16 35.5 22.5C35.5 29 30.5 34 24 34C17.5 34 12.5 29 12.5 22.5C12.5 16 17.5 11 24 11Z" fill="#F1F5F9" fillOpacity="0.4" stroke="#475569" strokeWidth="1" />

      {/* Perforaciones de ventilación del disco */}
      <circle cx="24" cy="13" r="1" fill="#1E293B" />
      <circle cx="32" cy="17" r="1" fill="#1E293B" />
      <circle cx="33" cy="26" r="1" fill="#1E293B" />
      <circle cx="25" cy="31" r="1" fill="#1E293B" />
      <circle cx="16" cy="29" r="1" fill="#1E293B" />
      <circle cx="14" cy="19" r="1" fill="#1E293B" />

      {/* Núcleo central del disco en aluminio anodizado */}
      <circle cx="24" cy="22.5" r="6" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
      <circle cx="24" cy="22.5" r="2.5" fill="#E2E8F0" />

      {/* Remaches flotantes del disco */}
      <circle cx="24" cy="16.5" r="1" fill="#F59E0B" />
      <circle cx="30" cy="22.5" r="1" fill="#F59E0B" />
      <circle cx="24" cy="28.5" r="1" fill="#F59E0B" />
      <circle cx="18" cy="22.5" r="1" fill="#F59E0B" />

      {/* Pinza de freno deportiva racing (Monobloc 4 pistones) */}
      <path
        d="M30 4H42C43.5 4 45 5.5 45 7V17C45 18.5 43.5 20 42 20H36L30 14V4Z"
        fill="url(#caliperRed)"
        stroke="#7F1D1D"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Pistones de la pinza */}
      <circle cx="35" cy="9" r="2" fill="#FEF2F2" stroke="#991B1B" strokeWidth="1" />
      <circle cx="40" cy="13" r="2" fill="#FEF2F2" stroke="#991B1B" strokeWidth="1" />
      <path d="M32 6H40" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
