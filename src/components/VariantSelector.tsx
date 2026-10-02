'use client';

import { ProductFamily, ProductVariant } from '../types';
import { colorSwatch } from '../lib/catalogParams';

interface Props {
  family: ProductFamily;
  current: Record<string, string>;
  onSelect: (variant: ProductVariant) => void;
}

/**
 * Selector de talla/color/etc. de un modelo. Cada combinación es un producto
 * (SKU) propio; elegir un valor salta a la variante que mejor encaja con lo ya
 * elegido en los demás ejes.
 */
export default function VariantSelector({ family, current, onSelect }: Props) {
  const axes = family.axes || {};
  const variants = family.variants || [];
  if (!Object.keys(axes).length || variants.length < 2) return null;

  const matches = (v: ProductVariant, wanted: Record<string, string>) =>
    Object.entries(wanted).every(([k, val]) => v.options[k] === val);

  const pick = (axis: string, value: string): ProductVariant | undefined => {
    const others = Object.fromEntries(Object.entries(current).filter(([k]) => k !== axis && axes[k]));
    const candidates = variants.filter((v) => v.options[axis] === value);
    return (
      candidates.find((v) => matches(v, others) && v.inStock) ||
      candidates.find((v) => matches(v, others)) ||
      candidates.find((v) => v.inStock) ||
      candidates[0]
    );
  };

  return (
    <div className="flex flex-col gap-3" data-testid="variant-selector">
      {Object.entries(axes).map(([axis, values]) => (
        <fieldset key={axis}>
          <legend className="text-[10px] font-mono font-bold uppercase tracking-wider text-text-muted mb-1.5">
            {axis}: <span className="text-foreground">{current[axis] || '—'}</span>
          </legend>
          <div className="flex flex-wrap gap-1.5">
            {values.map((value) => {
              const target = pick(axis, value);
              const selected = current[axis] === value;
              const others = Object.fromEntries(Object.entries(current).filter(([k]) => k !== axis && axes[k]));
              // ¿Existe esta combinación con lo ya elegido en los otros ejes?
              const combo = variants.find((v) => v.options[axis] === value && matches(v, others));
              const outOfStock = combo ? !combo.inStock : !target?.inStock;
              return (
                <button
                  key={value}
                  type="button"
                  disabled={!target}
                  aria-pressed={selected}
                  title={!combo ? 'No disponible en esta combinación' : outOfStock ? 'Agotado' : undefined}
                  onClick={() => target && !selected && onSelect(target)}
                  className={`relative min-w-[2.5rem] px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase rounded border transition-all cursor-pointer flex items-center gap-1.5 ${
                    selected
                      ? 'bg-accent text-slate-950 border-accent'
                      : 'bg-card text-foreground border-card-border hover:border-accent'
                  } ${outOfStock && !selected ? 'opacity-50 line-through' : ''} ${!combo && !selected ? 'border-dashed' : ''}`}
                >
                  {axis === 'Color' && (
                    <span className="inline-block w-3 h-3 rounded-full border border-card-border" style={{ backgroundColor: colorSwatch(value) }} />
                  )}
                  {value}
                </button>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
}
