import { NextResponse } from 'next/server';
import pool from '@/lib/db';

const categoryMap: Record<number, { name: string; slug: string }> = {
  1: { name: "Sistemas de Escape", slug: "escapes" },
  2: { name: "Frenos de Competición", slug: "frenos" },
  3: { name: "Parte ciclo & Chasis", slug: "suspensiones" },
  4: { name: "Electrónica & ECU", slug: "electronica" },
  5: { name: "Transmisión & Desarrollo", slug: "transmision" },
  6: { name: "Mantenimiento & Fluidos", slug: "mantenimiento" },
  7: { name: "Neumáticos & Paddock", slug: "neumaticos" },
  8: { name: "Cascos", slug: "cascos" },
  9: { name: "Equipación Piloto", slug: "equipacion" },
  10: { name: "Accesorios & Maletas", slug: "accesorios" },

  101: { name: "Línea Completa (Racing)", slug: "linea-completa" },
  102: { name: "Slip-On (Silenciosos)", slug: "silenciadores" },
  103: { name: "Colectores", slug: "colectores" },
  104: { name: "Accesorios Escape", slug: "accesorios-escape" },

  201: { name: "Pastillas Sinterizadas", slug: "pastillas-sinterizadas" },
  202: { name: "Discos de Freno", slug: "discos-freno" },
  203: { name: "Bombas Radiales", slug: "bombas-radiales" },
  204: { name: "Latiguillos Metálicos", slug: "latiguillos-metalicos" },

  301: { name: "Amortiguadores Traseros", slug: "amortiguadores-traseros" },
  302: { name: "Cartuchos Horquilla", slug: "cartuchos-horquilla" },
  303: { name: "Amortiguadores Dirección", slug: "amortiguadores-direccion" },
  304: { name: "Estriberas", slug: "estriberas" },

  401: { name: "Centralitas (ECU)", slug: "centralitas" },
  402: { name: "Quickshifters", slug: "quickshifters" },
  403: { name: "Módulos ABS/TC", slug: "modulos-abs-tc" },
  404: { name: "Baterías Litio", slug: "baterias-litio" },

  501: { name: "Kits Cadena Completos", slug: "kits-cadena" },
  502: { name: "Cadenas X-Ring/Z-Ring", slug: "cadenas-arrastre" },
  503: { name: "Piñones", slug: "pinones" },
  504: { name: "Coronas Ergal", slug: "coronas" },

  601: { name: "Filtros Aire Racing", slug: "filtros-aire" },
  602: { name: "Filtros Aceite", slug: "filtros-aceite" },
  603: { name: "Aceites Motor Pro", slug: "aceites-motor" },
  604: { name: "Líquidos Hidráulicos", slug: "liquidos-hidraulicos" },

  701: { name: "Neumáticos Slick/Sport", slug: "neumaticos-slick" },
  702: { name: "Calentadores", slug: "calentadores" },
  703: { name: "Caballetes", slug: "caballetes" },
  704: { name: "Manómetros & Accesorios", slug: "manometros-accesorios" },

  801: { name: "Cascos Integrales", slug: "cascos-integrales" },
  802: { name: "Cascos Modulares", slug: "cascos-modulares" },
  803: { name: "Cascos Jet", slug: "cascos-jet" },
  804: { name: "Cascos Off-Road", slug: "cascos-off-road" },
  805: { name: "Recambios Cascos", slug: "recambios-cascos" },

  901: { name: "Chaquetas Moto", slug: "chaquetas-moto" },
  902: { name: "Monos", slug: "monos" },
  903: { name: "Guantes de Competición", slug: "guantes-competicion" },
  904: { name: "Botas Racing", slug: "botas-racing" },

  1001: { name: "Maletas & Baúles", slug: "maletas-baules" },
  1002: { name: "Soportes Quad Lock", slug: "soportes-quad-lock" },
  1003: { name: "Intercomunicadores", slug: "intercomunicadores" },
  1004: { name: "Personalización & Espejos", slug: "personalizacion-espejos" },
  1005: { name: "Promocional", slug: "promocional" }
};

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT DISTINCT category3_id FROM products WHERE category3_id IS NOT NULL AND status = 'published'`
    );
    const usedIds = new Set(result.rows.map((r: any) => r.category3_id));

    const categories = Object.entries(categoryMap)
      .filter(([id]) => {
        const catId = parseInt(id);
        return catId >= 100 && usedIds.has(catId);
      })
      .map(([id, cat]) => {
        const catId = parseInt(id);
        const parentId = Math.floor(catId / 100);
        const parent = categoryMap[parentId];
        return {
          id: catId,
          name: cat.name,
          slug: cat.slug,
          parentId,
          parentName: parent?.name || '',
          parentSlug: parent?.slug || ''
        };
      });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json([], { status: 500 });
  }
}
