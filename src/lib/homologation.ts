/**
 * Homologación de un escape según el dato de la ficha (atributo «Homologación» del proveedor).
 * El título nunca debe decir «homologado» sin que el dato lo diga: un escape de competición no pasa la ITV.
 */
export type RoadHomologation = 'yes' | 'no' | 'unknown';

export function roadHomologation(attributes?: Record<string, string> | null): RoadHomologation {
  const raw = String(attributes?.['Homologación'] ?? '').trim();
  if (!raw) return 'unknown';
  // «Homologación CE & No homologado en Suiza»: lo de otro país no cambia que valga en la UE.
  const value = raw.replace(/no\s+homologad[oa]\s+en\s+[\p{L}\s]+?(?=\s*&|$)/giu, '').trim();
  if (/no\s+homologad|circuito|competici|\bfim\b|racing|solo\s+(para\s+)?uso/i.test(value)) return 'no';
  if (/homologaci[oó]n\s+ce|homologad[oa]|\be-?mark\b|\bece\b/i.test(value)) return 'yes';
  return 'unknown';
}
