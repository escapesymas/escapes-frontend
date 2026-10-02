import { Product, ProductVariant } from '../types';

/** Precio que paga el cliente: el rebajado si existe y es menor. */
export function effectivePrice(p: Pick<Product | ProductVariant, 'price' | 'salePrice'>): number {
  return p.salePrice != null && p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
}

export function formatEuro(n: number): string {
  return `${n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}

/** "Tallas S–XL · 3 colores" a partir de las opciones de un modelo. */
export function optionsSummary(options?: Record<string, string[]>): string {
  if (!options) return '';
  const parts: string[] = [];
  for (const [axis, values] of Object.entries(options)) {
    if (!values || values.length < 2) continue;
    if (axis === 'Talla') parts.push(`Tallas ${values[0]}–${values[values.length - 1]}`);
    else if (axis === 'Color') parts.push(`${values.length} colores`);
    else parts.push(`${values.length} ${axis.toLowerCase()}`);
  }
  return parts.slice(0, 2).join(' · ');
}
