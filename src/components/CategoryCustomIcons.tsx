import React from 'react';

// 1. CASCOS (1001) - Casco Integral Deportivo Iridium
export function IconCascos({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catHelmetShell" x1="8" y1="5" x2="40" y2="43" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="50%" stopColor="#7C3AED" />
          <stop offset="100%" stopColor="#6D28D9" />
        </linearGradient>
        <linearGradient id="catVisorIridium" x1="10" y1="19" x2="38" y2="33" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="50%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#3B82F6" />
        </linearGradient>
      </defs>
      <path
        d="M24 5C13.5 5 5 13.5 5 24C5 31 8.5 37 14 41L18 43H30L34 41C39.5 37 43 31 43 24C43 13.5 34.5 5 24 5Z"
        fill="url(#catHelmetShell)"
        stroke="#4C1D95"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M11 19H37C39.2 19 40.5 21 40 23.5C38.5 29.5 32.5 33.5 24 33.5C15.5 33.5 9.5 29.5 8 23.5C7.5 21 8.8 19 11 19Z"
        fill="url(#catVisorIridium)"
        stroke="#5B21B6"
        strokeWidth="1.75"
        strokeLinejoin="round"
      />
      <path d="M14 22C20 20.5 28 20.5 34 22" stroke="#FFFFFF" strokeWidth="1.75" strokeLinecap="round" strokeOpacity="0.8" />
      <circle cx="10.5" cy="22" r="1.5" fill="#F8FAFC" stroke="#4C1D95" strokeWidth="0.8" />
      <circle cx="37.5" cy="22" r="1.5" fill="#F8FAFC" stroke="#4C1D95" strokeWidth="0.8" />
      <rect x="20" y="8" width="8" height="2.5" rx="1.2" fill="#6D28D9" stroke="#DDD6FE" strokeWidth="0.8" />
      <path d="M19 37.5H29M21 40H27" stroke="#DDD6FE" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 2. CHASIS (1002) - Horquilla delantera & Amortiguador de suspensión
export function IconChasis({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catForkGrad" x1="12" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <linearGradient id="catSpringGrad" x1="20" y1="16" x2="28" y2="34" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
      {/* Botellas de horquilla izquierda y derecha */}
      <rect x="12" y="6" width="6" height="36" rx="3" fill="url(#catForkGrad)" stroke="#1E40AF" strokeWidth="1.5" />
      <rect x="30" y="6" width="6" height="36" rx="3" fill="url(#catForkGrad)" stroke="#1E40AF" strokeWidth="1.5" />
      {/* Puente tija superior e inferior */}
      <rect x="10" y="10" width="28" height="5" rx="2" fill="#1E293B" stroke="#60A5FA" strokeWidth="1.5" />
      <rect x="10" y="24" width="28" height="4" rx="1.5" fill="#1E293B" stroke="#60A5FA" strokeWidth="1.5" />
      {/* Muelle central de amortiguador */}
      <path d="M21 16C21 16 27 18 27 20C27 22 21 24 21 26C21 28 27 30 27 32C27 34 21 36 21 36" stroke="url(#catSpringGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 3. CICLISMO (1003) - Bicicleta MTB / Carretera Racing
export function IconCiclismo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catBikeGrad" x1="6" y1="10" x2="42" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#84CC16" />
          <stop offset="100%" stopColor="#4D7C0F" />
        </linearGradient>
      </defs>
      {/* Rueda trasera y delantera */}
      <circle cx="12" cy="32" r="9" stroke="url(#catBikeGrad)" strokeWidth="2.5" />
      <circle cx="36" cy="32" r="9" stroke="url(#catBikeGrad)" strokeWidth="2.5" />
      <circle cx="12" cy="32" r="2" fill="#84CC16" />
      <circle cx="36" cy="32" r="2" fill="#84CC16" />
      {/* Cuadro de bicicleta */}
      <path d="M12 32L21 18L30 32H12Z" stroke="#F8FAFC" strokeWidth="2" strokeLinejoin="round" />
      <path d="M21 18L33 18L36 32" stroke="#F8FAFC" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Manillar y sillín */}
      <path d="M31 14H36" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 15H24" stroke="#84CC16" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// 4. ELECTRICIDAD (1004) - Batería de moto & Rayo de encendido
export function IconElectricidad({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catBatGrad" x1="8" y1="12" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="catSparkGrad" x1="20" y1="8" x2="28" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#FDE047" />
        </linearGradient>
      </defs>
      {/* Cuerpo batería */}
      <rect x="8" y="14" width="32" height="26" rx="4" fill="url(#catBatGrad)" stroke="#854D0E" strokeWidth="1.5" />
      {/* Bornes + y - */}
      <rect x="13" y="9" width="6" height="5" rx="1" fill="#EF4444" />
      <rect x="29" y="9" width="6" height="5" rx="1" fill="#3B82F6" />
      <path d="M16 11.5V11.5M14.5 11.5H17.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M30.5 11.5H33.5" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
      {/* Rayo de alto voltaje */}
      <path d="M26 18L18 28H25L22 36L31 25H24L26 18Z" fill="url(#catSparkGrad)" stroke="#78350F" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// 5. EQUIPAMIENTO PILOTO (1005) - Chaqueta de cuero racing & Guante
export function IconEquipamientoPiloto({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catJacketGrad" x1="10" y1="8" x2="38" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#BE185D" />
        </linearGradient>
      </defs>
      {/* Chaqueta de piloto con protecciones rígidas */}
      <path
        d="M16 8L24 13L32 8L42 16L37 25L33 23V40H15V23L11 25L6 16L16 8Z"
        fill="url(#catJacketGrad)"
        stroke="#831843"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      {/* Cremallera central */}
      <path d="M24 13V40" stroke="#FCE7F3" strokeWidth="2" strokeDasharray="3 2" />
      {/* Protecciones deslizaderas en hombros */}
      <path d="M12 13L17 18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M36 13L31 18" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// 6. EQUIPAMIENTO VEHICULO (1006) - Maleta rígida de viaje / Top Case
export function IconEquipamientoVehiculo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catCaseGrad" x1="8" y1="12" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
      </defs>
      {/* Maleta top case de aluminio adventure */}
      <rect x="8" y="14" width="32" height="26" rx="4" fill="url(#catCaseGrad)" stroke="#78350F" strokeWidth="1.5" />
      {/* Asa superior */}
      <path d="M18 14V9C18 7.5 19.5 6.5 21 6.5H27C28.5 6.5 30 7.5 30 9V14" stroke="#78350F" strokeWidth="2" strokeLinecap="round" />
      {/* Refuerzos esquineros y cierre */}
      <rect x="21" y="22" width="6" height="10" rx="1" fill="#FEF3C7" stroke="#78350F" strokeWidth="1" />
      <path d="M8 22H40" stroke="#78350F" strokeWidth="1.5" />
      <circle cx="13" cy="18" r="1" fill="#78350F" />
      <circle cx="35" cy="18" r="1" fill="#78350F" />
    </svg>
  );
}

// 7. ESCAPES (1007) - Silenciador Akrapovic
export function IconEscapes({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catExhaustGrad" x1="12" y1="20" x2="36" y2="28" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="50%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
      <path d="M4 29C8 29 11 27.5 14 25.5" stroke="#0891B2" strokeWidth="3" strokeLinecap="round" />
      <path
        d="M13.5 21L34 16.5C35.5 16 37 17 37 18.5L36.5 26.5C36.5 28 35 29 33.5 29.5L14 31C12.5 31.5 11.5 30 11.8 28.5L12.8 23.5C13 22 13.5 21 13.5 21Z"
        fill="url(#catExhaustGrad)"
        stroke="#164E63"
        strokeWidth="1.5"
      />
      <path d="M34 16.5L42 18.5C43.5 19 44.5 20.5 44 22L41.5 27.5C41 28.5 39.5 29 38 28.8L33.5 29.5" fill="#0F172A" stroke="#0891B2" strokeWidth="1.5" />
      <circle cx="42.5" cy="23" r="2" fill="#0F172A" stroke="#22D3EE" strokeWidth="1" />
    </svg>
  );
}

// 8. FRENOS (1008) - Disco de freno & Pinza Brembo
export function IconFrenos({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catDiscSteel" x1="6" y1="8" x2="38" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F8FAFC" />
          <stop offset="100%" stopColor="#94A3B8" />
        </linearGradient>
      </defs>
      <circle cx="22" cy="24" r="16" fill="url(#catDiscSteel)" stroke="#334155" strokeWidth="1.5" />
      <circle cx="22" cy="24" r="11" stroke="#475569" strokeWidth="1" strokeDasharray="5 3" />
      <circle cx="22" cy="24" r="5" fill="#0F172A" stroke="#94A3B8" strokeWidth="1.5" />
      {/* Pinza Brembo Roja */}
      <path d="M26 5H40C42 5 43.5 6.5 43.5 8.5V18.5C43.5 20.5 42 22 40 22H33.5L26 14.5V5Z" fill="#EF4444" stroke="#991B1B" strokeWidth="1.5" />
      <circle cx="33" cy="11" r="1.8" fill="#FFFFFF" />
      <circle cx="38" cy="15" r="1.8" fill="#FFFFFF" />
    </svg>
  );
}

// 9. HERRAMIENTAS (1009) - Llave fija y carraca de taller
export function IconHerramientas({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catToolGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#78716C" />
          <stop offset="100%" stopColor="#44403C" />
        </linearGradient>
      </defs>
      {/* Llave inglesa / fija cruzada */}
      <path d="M38 10C35 7 30 7 27 10L10 27C7 30 7 35 10 38C13 41 18 41 21 38L38 21C41 18 41 13 38 10Z" fill="url(#catToolGrad)" stroke="#1C1917" strokeWidth="1.5" />
      <circle cx="14" cy="34" r="3" fill="#E7E5E4" />
      <path d="M32 12L36 16" stroke="#E7E5E4" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// 10. LUBRICANTES Y LIMPIADORES (1010) - Bote de lubricante & Gota de aceite
export function IconLubricantes({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catOilGrad" x1="12" y1="12" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#14B8A6" />
          <stop offset="100%" stopColor="#0F766E" />
        </linearGradient>
      </defs>
      {/* Bote de spray técnico */}
      <rect x="14" y="16" width="20" height="24" rx="3" fill="url(#catOilGrad)" stroke="#134E4A" strokeWidth="1.5" />
      <rect x="20" y="8" width="8" height="8" rx="1.5" fill="#E0F2FE" stroke="#134E4A" strokeWidth="1.5" />
      <path d="M24 8V5" stroke="#134E4A" strokeWidth="2" strokeLinecap="round" />
      {/* Gota de aceite */}
      <path d="M24 22C24 22 18 28 18 31C18 34.3 20.7 37 24 37C27.3 37 30 34.3 30 31C30 28 24 22 24 22Z" fill="#F59E0B" stroke="#B45309" strokeWidth="1" />
    </svg>
  );
}

// 11. MATERIAL PROMOCIONAL (1011) - Display promocional & Tag
export function IconMaterialPromocional({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catTagGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
      </defs>
      <path d="M8 20L20 8H36C38 8 40 10 40 12V28L28 40H12C10 40 8 38 8 36V20Z" fill="url(#catTagGrad)" stroke="#312E81" strokeWidth="1.5" />
      <circle cx="28" cy="16" r="3" fill="#EEF2FF" />
      <path d="M16 28L24 20" stroke="#EEF2FF" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

// 12. MOTOR (1012) - Pistón & Bloque Motor Racing
export function IconMotor({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catPistonGrad" x1="12" y1="6" x2="36" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F97316" />
          <stop offset="100%" stopColor="#C2410C" />
        </linearGradient>
      </defs>
      {/* Cabeza del pistón con segmentos */}
      <rect x="12" y="8" width="24" height="18" rx="3" fill="url(#catPistonGrad)" stroke="#7C2D12" strokeWidth="1.5" />
      <path d="M12 13H36M12 17H36" stroke="#FFEDD5" strokeWidth="1.5" />
      {/* Biela de pistón */}
      <path d="M20 26L16 42H32L28 26" fill="#1E293B" stroke="#7C2D12" strokeWidth="1.5" />
      <circle cx="24" cy="35" r="3" fill="#F97316" />
    </svg>
  );
}

// 13. MOVILIDAD URBANA (1013) - Scooter eléctrico / Patinete
export function IconMovilidadUrbana({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catScooterGrad" x1="8" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>
      </defs>
      <circle cx="12" cy="36" r="6" stroke="url(#catScooterGrad)" strokeWidth="2.5" />
      <circle cx="36" cy="36" r="6" stroke="url(#catScooterGrad)" strokeWidth="2.5" />
      <path d="M12 36H36" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 36L26 12H20" stroke="url(#catScooterGrad)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 14. NEUMATICOS (1014) - Rueda / Neumático con tacos/dibujo
export function IconNeumaticos({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catTireGrad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
      </defs>
      <circle cx="24" cy="24" r="18" fill="#1E293B" stroke="url(#catTireGrad)" strokeWidth="3" />
      <circle cx="24" cy="24" r="10" fill="#0F172A" stroke="#64748B" strokeWidth="2" />
      <circle cx="24" cy="24" r="4" fill="#10B981" />
      {/* Tacos / Dibujo del neumático */}
      <path d="M24 3V8M24 40V45M3 24H8M40 24H45M9 9L13 13M35 35L39 39M9 39L13 35M35 13L39 9" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// 15. PIEZAS POSTVENTA (1015) - Engranaje de repuesto
export function IconPiezasPostventa({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catPartGrad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>
      </defs>
      <path d="M24 10L27 13H33V19L36 22V26L33 29V35H27L24 38L21 35H15V29L12 26V22L15 19V13H21L24 10Z" fill="url(#catPartGrad)" stroke="#881337" strokeWidth="1.5" />
      <circle cx="24" cy="24" r="7" fill="#0F172A" stroke="#FDA4AF" strokeWidth="1.5" />
    </svg>
  );
}

// 16. PLASTICA (1016) - Carenado & Kit de plásticos offroad
export function IconPlastica({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catFairingGrad" x1="8" y1="8" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D946EF" />
          <stop offset="100%" stopColor="#A21CAF" />
        </linearGradient>
      </defs>
      <path d="M8 12L24 6L40 12L34 38L24 42L14 38L8 12Z" fill="url(#catFairingGrad)" stroke="#701A75" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 16L24 22L32 16" stroke="#FDE8E8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 17. TRANSPORTE - GARAJE - PADDOCK (1017) - Caballete de Paddock & Carpa
export function IconTransporteGaraje({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <defs>
        <linearGradient id="catPaddockGrad" x1="8" y1="10" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#64748B" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
      </defs>
      {/* Caballete de paddock de tubos de acero */}
      <path d="M10 38L18 16H30L38 38" stroke="url(#catPaddockGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 26H34" stroke="#F8FAFC" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="10" cy="38" r="3" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1" />
      <circle cx="38" cy="38" r="3" fill="#EF4444" stroke="#7F1D1D" strokeWidth="1" />
    </svg>
  );
}

export const CATEGORY_HD_ICONS: Record<number, { icon: React.ComponentType<{ className?: string }>; color: string }> = {
  1001: { icon: IconCascos, color: 'text-violet-500' },
  1002: { icon: IconChasis, color: 'text-blue-500' },
  1003: { icon: IconCiclismo, color: 'text-lime-500' },
  1004: { icon: IconElectricidad, color: 'text-yellow-500' },
  1005: { icon: IconEquipamientoPiloto, color: 'text-pink-500' },
  1006: { icon: IconEquipamientoVehiculo, color: 'text-amber-500' },
  1007: { icon: IconEscapes, color: 'text-cyan-500' },
  1008: { icon: IconFrenos, color: 'text-red-500' },
  1009: { icon: IconHerramientas, color: 'text-stone-500' },
  1010: { icon: IconLubricantes, color: 'text-teal-500' },
  1011: { icon: IconMaterialPromocional, color: 'text-indigo-500' },
  1012: { icon: IconMotor, color: 'text-orange-500' },
  1013: { icon: IconMovilidadUrbana, color: 'text-sky-500' },
  1014: { icon: IconNeumaticos, color: 'text-emerald-500' },
  1015: { icon: IconPiezasPostventa, color: 'text-rose-500' },
  1016: { icon: IconPlastica, color: 'text-fuchsia-500' },
  1017: { icon: IconTransporteGaraje, color: 'text-slate-500' },
};
