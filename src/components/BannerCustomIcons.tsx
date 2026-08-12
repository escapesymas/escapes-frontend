import React from 'react';

// 1. ESCAPES & ITV — Silenciador de Escape Deportivo de Carreras (100% Reconocible)
export function IconExhaustITV({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="exhaustBodyGrad" x1="12" y1="20" x2="36" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id="carbonCapGrad" x1="33" y1="15" x2="44" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
      </defs>

      {/* Colectores de entrada dobles en acero inox */}
      <path d="M4 29C8 29 11 27.5 14 25.5" stroke="#D97706" strokeWidth="3" strokeLinecap="round" />
      <path d="M5 34C9 34 13 32 16 29.5" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />

      {/* Silenciador principal de titanio estilo Akrapovic */}
      <path
        d="M13.5 21L34 16.5C35.5 16 37 17 37 18.5L36.5 26.5C36.5 28 35 29 33.5 29.5L14 31C12.5 31.5 11.5 30 11.8 28.5L12.8 23.5C13 22 13.5 21 13.5 21Z"
        fill="url(#exhaustBodyGrad)"
        stroke="#B45309"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Tapa cónica trasera de fibra de carbono */}
      <path
        d="M34 16.5L42 18.5C43.5 19 44.5 20.5 44 22L41.5 27.5C41 28.5 39.5 29 38 28.8L33.5 29.5"
        fill="url(#carbonCapGrad)"
        stroke="#0F172A"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />

      {/* Salida del tubo de escape */}
      <ellipse cx="42.5" cy="23" rx="2" ry="3.5" transform="rotate(-15 42.5 23)" fill="#0F172A" stroke="#F59E0B" strokeWidth="1" />

      {/* Chapa / Placa ITV de homologación con remaches */}
      <rect x="20" y="22" width="9" height="5" rx="1" transform="rotate(-12 20 22)" fill="#FEF3C7" stroke="#B45309" strokeWidth="1" />
      <circle cx="21.5" cy="23" r="0.6" fill="#B45309" />
      <circle cx="27.5" cy="21.8" r="0.6" fill="#B45309" />

      {/* Abrazaderas de montaje en carbono/titanio */}
      <path d="M18 20L16.5 30.5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
      <path d="M28 17.5L26.5 29.5" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />

      {/* Ondas / Gases de flujo de escape */}
      <path d="M44.5 20C46.5 18.5 47 17 46 16" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.8" />
      <path d="M44 25C46.5 24.5 47.5 23 46.5 21.5" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  );
}

// 2. CASCOS & ROPA — Casco Integral Deportivo Limpio, Elegante y 100% Reconocible
export function IconHelmetGear({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="helmetShellGrad" x1="8" y1="5" x2="40" y2="43" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="visorIridiumGrad" x1="10" y1="19" x2="38" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#6366F1" />
        </linearGradient>
      </defs>

      {/* Calota exterior suave y redondeada del casco */}
      <path
        d="M24 5C13.5 5 5 13.5 5 24C5 31 8.5 37 14 41L18 43H30L34 41C39.5 37 43 31 43 24C43 13.5 34.5 5 24 5Z"
        fill="url(#helmetShellGrad)"
        stroke="#064E3B"
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* Visera frontal panorámica oscura/iridium */}
      <path
        d="M11 19H37C39.2 19 40.5 21 40 23.5C38.5 29.5 32.5 33.5 24 33.5C15.5 33.5 9.5 29.5 8 23.5C7.5 21 8.8 19 11 19Z"
        fill="url(#visorIridiumGrad)"
        stroke="#065F46"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />

      {/* Reflejo espejo curvado de luz en la visera */}
      <path d="M14 22C20 20.5 28 20.5 34 22" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.8" />

      {/* Mecanismos laterales de bisagra de visera */}
      <circle cx="10.5" cy="22" r="1.5" fill="#F8FAFC" stroke="#064E3B" strokeWidth="0.8" />
      <circle cx="37.5" cy="22" r="1.5" fill="#F8FAFC" stroke="#064E3B" strokeWidth="0.8" />

      {/* Toma de aire superior discreta */}
      <rect x="20" y="8" width="8" height="2.5" rx="1.2" fill="#047857" stroke="#A7F3D0" strokeWidth="0.8" />

      {/* Rejillas de ventilación de la mentonera */}
      <path d="M19 37.5H29M21 40H27" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
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

// 4. FRENADO PRO — Disco de Freno 100% Redondo Ventilado con Pinza Roja Racing
export function IconWaveBrake({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="discSteel" x1="6" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#E2E8F0" />
          <stop offset="40%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#64748B" />
        </linearGradient>
        <linearGradient id="caliperBrembo" x1="26" y1="4" x2="44" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#991B1B" />
        </linearGradient>
      </defs>

      {/* Disco de freno 100% REDONDO circulo principal */}
      <circle
        cx="22"
        cy="24"
        r="16.5"
        fill="url(#discSteel)"
        stroke="#334155"
        strokeWidth="1.5"
      />

      {/* Banda de fricción de las pastillas con ranuras direccionales */}
      <circle cx="22" cy="24" r="11.5" stroke="#475569" strokeWidth="1" strokeDasharray="6 3" />
      <circle cx="22" cy="24" r="7" stroke="#475569" strokeWidth="1" />

      {/* Agujeros de ventilación dispuestos simétricamente en 360 grados */}
      <circle cx="22" cy="10.5" r="1.2" fill="#1E293B" />
      <circle cx="31.5" cy="14.5" r="1.2" fill="#1E293B" />
      <circle cx="35.5" cy="24" r="1.2" fill="#1E293B" />
      <circle cx="31.5" cy="33.5" r="1.2" fill="#1E293B" />
      <circle cx="22" cy="37.5" r="1.2" fill="#1E293B" />
      <circle cx="12.5" cy="33.5" r="1.2" fill="#1E293B" />
      <circle cx="8.5" cy="24" r="1.2" fill="#1E293B" />
      <circle cx="12.5" cy="14.5" r="1.2" fill="#1E293B" />

      {/* Núcleo central del disco mecanizado en aluminio oscuro */}
      <circle cx="22" cy="24" r="6" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
      <circle cx="22" cy="24" r="2.5" fill="#F8FAFC" />

      {/* Remaches flotantes en dorado/aluminio */}
      <circle cx="22" cy="18" r="1.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />
      <circle cx="27.2" cy="21" r="1.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />
      <circle cx="27.2" cy="27" r="1.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />
      <circle cx="22" cy="30" r="1.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />
      <circle cx="16.8" cy="27" r="1.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />
      <circle cx="16.8" cy="21" r="1.2" fill="#F59E0B" stroke="#B45309" strokeWidth="0.5" />

      {/* Pinza de freno monobloc deportiva roja superpuesta en la esquina superior derecha */}
      <path
        d="M27 4H41C43 4 44.5 5.5 44.5 7.5V17.5C44.5 19.5 43 21 41 21H34.5L27 13.5V4Z"
        fill="url(#caliperBrembo)"
        stroke="#7F1D1D"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Detalle de pistones dobles de la pinza */}
      <circle cx="33" cy="10" r="2" fill="#FFFFFF" stroke="#991B1B" strokeWidth="1" />
      <circle cx="39" cy="14" r="2" fill="#FFFFFF" stroke="#991B1B" strokeWidth="1" />
      <path d="M30 6.5H38" stroke="#FCA5A5" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
