import { useEffect, useState } from 'react';

const played = new Set<string>();

/**
 * Clase de aparición que solo se aplica la primera vez que el componente se monta en esta carga de la página: la barra inferior
 * del móvil, por ejemplo, se monta de nuevo en cada pantalla y no debe volver a «entrar» en cada navegación.
 * El valor se fija al montar (no cambia en los renders siguientes, que cortarían la animación a medias); en el servidor siempre
 * devuelve la clase, igual que el primer montaje en el navegador, así que no hay diferencias al hidratar.
 */
export function useAppearOnce(key: string, className: string): string {
  const [cls] = useState(() => (played.has(key) ? '' : className));
  useEffect(() => { played.add(key); }, [key]);
  return cls;
}
