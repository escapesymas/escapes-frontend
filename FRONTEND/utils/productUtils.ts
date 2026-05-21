export const colorTranslationMap: Record<string, string> = {
  'BLK': 'NEGRO',
  'BLU': 'AZUL',
  'WHT': 'BLANCO',
  'ORG': 'NARANJA',
  'NYE': 'AMARILLO FLUOR',
  'RED': 'ROJO',
  'DRE': 'ROJO OSCURO',
  'GRN': 'VERDE',
  'YEL': 'AMARILLO',
  'GRY': 'GRIS',
  'PNK': 'ROSA',
  'BRN': 'MARRÓN',
  'SIL': 'PLATA',
  'GLD': 'ORO',
  'PUR': 'PÚRPURA',
  'NVY': 'AZUL MARINO',
  'KHK': 'CAQUI',
  'MNT': 'MENTA',
  'CAM': 'CAMUFLAJE'
};

/**
 * Limpia el título de un producto eliminando la información redundante de color y talla al final del string.
 * Ejemplo: "TLD GLOVE AIR MONO, NYE, M" -> "TLD GLOVE AIR MONO"
 */
export const cleanProductTitle = (title: string): string => {
  if (!title) return '';
  const parts = title.split(',').map(p => p.trim());
  if (parts.length <= 1) return title;

  const sizeRegex = /^(XXS|XS|S|M|L|XL|2XL|3XL|4XL|5XL|XXL|XXXL|Y?[XSML]|(US|EU|UK|YTH)?\s*\d{2,3})$/i;

  const isColorCode = (str: string): boolean => {
    const upper = str.toUpperCase();
    return !!(
      colorTranslationMap[upper] || 
      ['NEGRO', 'AZUL', 'BLANCO', 'NARANJA', 'AMARILLO', 'ROJO', 'VERDE', 'GRIS', 'ROSA', 'MARRÓN', 'PLATA', 'ORO', 'PÚRPURA', 'CELESTE', 'TURQUESA', 'FLUOR'].some(c => upper.includes(c)) ||
      (upper.length === 3 && /^[A-Z]{3}$/.test(upper))
    );
  };

  let cleanParts = [...parts];
  while (cleanParts.length > 1) {
    const lastPart = cleanParts[cleanParts.length - 1];
    if (sizeRegex.test(lastPart) || isColorCode(lastPart)) {
      cleanParts.pop();
    } else {
      break; 
    }
  }

  return cleanParts.join(', ');
};
