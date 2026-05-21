/**
 * Utility for automatic dofollow SEO internal linking.
 * Scans forum post content and converts major brands, parts categories,
 * and key compatible bike models into active dofollow links without nested tags.
 */

interface SEOKeyword {
  pattern: RegExp;
  replacement: string;
}

const SEO_KEYWORDS: SEOKeyword[] = [
  // Brands
  { pattern: /\b(Akrapovič|Akrapovic)\b/gi, replacement: '<a href="/recambios?brand=Akrapovic" class="text-racing-orange hover:underline font-bold" rel="dofollow">Akrapovič</a>' },
  { pattern: /\bMivv\b/gi, replacement: '<a href="/recambios?brand=Mivv" class="text-racing-orange hover:underline font-bold" rel="dofollow">Mivv</a>' },
  { pattern: /\bArrow\b/gi, replacement: '<a href="/recambios?brand=Arrow" class="text-racing-orange hover:underline font-bold" rel="dofollow">Arrow</a>' },
  { pattern: /\bLeoVince\b/gi, replacement: '<a href="/recambios?brand=LeoVince" class="text-racing-orange hover:underline font-bold" rel="dofollow">LeoVince</a>' },
  { pattern: /\bSC\s+Project\b/gi, replacement: '<a href="/recambios?brand=SC%20Project" class="text-racing-orange hover:underline font-bold" rel="dofollow">SC Project</a>' },
  { pattern: /\bBrembo\b/gi, replacement: '<a href="/recambios?brand=Brembo" class="text-racing-orange hover:underline font-bold" rel="dofollow">Brembo</a>' },
  { pattern: /\b(Öhlins|Ohlins)\b/gi, replacement: '<a href="/recambios?brand=Öhlins" class="text-racing-orange hover:underline font-bold" rel="dofollow">Öhlins</a>' },
  { pattern: /\bQuad\s+Lock\b/gi, replacement: '<a href="/recambios?brand=Quad%20Lock" class="text-racing-orange hover:underline font-bold" rel="dofollow">Quad Lock</a>' },
  { pattern: /\bIxil\b/gi, replacement: '<a href="/recambios?brand=Ixil" class="text-racing-orange hover:underline font-bold" rel="dofollow">Ixil</a>' },

  // Motorcycle models compatibility shortcuts
  { pattern: /\bHonda\s+CBR\s+600\s*(RR)?\b/gi, replacement: '<a href="/recambios/Honda/CBR%20600%20RR/General" class="text-racing-orange hover:underline font-bold" rel="dofollow">Honda CBR 600 RR</a>' },
  { pattern: /\bYamaha\s+R6\b/gi, replacement: '<a href="/recambios/Yamaha/YZF%20R6/General" class="text-racing-orange hover:underline font-bold" rel="dofollow">Yamaha YZF R6</a>' },
  { pattern: /\bKawasaki\s+Z900\b/gi, replacement: '<a href="/recambios/Kawasaki/Z900/General" class="text-racing-orange hover:underline font-bold" rel="dofollow">Kawasaki Z900</a>' },
  { pattern: /\bYamaha\s+MT-07\b/gi, replacement: '<a href="/recambios/Yamaha/MT-07/General" class="text-racing-orange hover:underline font-bold" rel="dofollow">Yamaha MT-07</a>' },
  { pattern: /\bYamaha\s+MT-09\b/gi, replacement: '<a href="/recambios/Yamaha/MT-09/General" class="text-racing-orange hover:underline font-bold" rel="dofollow">Yamaha MT-09</a>' },

  // Categories
  { pattern: /\bescapes?\b/gi, replacement: '<a href="/escapes" class="text-racing-orange hover:underline font-medium" rel="dofollow">escapes</a>' },
  { pattern: /\bcolectores?\b/gi, replacement: '<a href="/colectores" class="text-racing-orange hover:underline font-medium" rel="dofollow">colectores</a>' },
  { pattern: /\bsilenciadores?\b/gi, replacement: '<a href="/silenciadores" class="text-racing-orange hover:underline font-medium" rel="dofollow">silenciadores</a>' },
  { pattern: /\bfrenos?\b/gi, replacement: '<a href="/frenos" class="text-racing-orange hover:underline font-medium" rel="dofollow">frenos</a>' },
  { pattern: /\bquickshifters?\b/gi, replacement: '<a href="/quickshifters" class="text-racing-orange hover:underline font-medium" rel="dofollow">quickshifters</a>' },
  { pattern: /\bcascos?\b/gi, replacement: '<a href="/cascos" class="text-racing-orange hover:underline font-medium" rel="dofollow">cascos</a>' },
  { pattern: /\bmonos?\b/gi, replacement: '<a href="/monos" class="text-racing-orange hover:underline font-medium" rel="dofollow">monos</a>' }
];

let activeSeoKeywords: SEOKeyword[] = [...SEO_KEYWORDS];

export function registerDynamicKeywords(keywords: { keyword: string; url: string; active?: number }[]) {
  const dynamic = keywords
    .filter(k => k.active !== 0)
    .map(k => {
      const escaped = k.keyword.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      return {
        pattern: new RegExp(`\\b(${escaped})\\b`, 'gi'),
        replacement: `<a href="${k.url}" class="text-racing-orange hover:underline font-bold" rel="dofollow">${k.keyword}</a>`
      };
    });

  const merged: SEOKeyword[] = [...dynamic];
  
  SEO_KEYWORDS.forEach(st => {
    const hasOverlap = dynamic.some(dyn => dyn.pattern.source.includes(st.pattern.source.replace(/\\b/g, '')));
    if (!hasOverlap) {
      merged.push(st);
    }
  });

  activeSeoKeywords = merged;
}

export function autoLinkHtml(htmlContent: string, customKeywords?: SEOKeyword[]): string {
  if (!htmlContent) return '';

  const keywordsToUse = customKeywords || activeSeoKeywords;
  const parts = htmlContent.split(/(<[^>]+>)/g);
  let insideAnchor = false;

  const processed = parts.map(part => {
    if (part.startsWith('<')) {
      if (/<a\s+/i.test(part)) {
        insideAnchor = true;
      } else if (/<\/a>/i.test(part)) {
        insideAnchor = false;
      }
      return part;
    } else {
      if (insideAnchor) {
        return part;
      }

      let text = part;
      keywordsToUse.forEach(keyword => {
        text = text.replace(keyword.pattern, keyword.replacement);
      });
      return text;
    }
  });

  return processed.join('');
}
