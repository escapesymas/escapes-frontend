#!/usr/bin/env python3
"""
Script de importación masiva para múltiples catálogos de BIHR.
Importa productos, crea categorías/subcategorías necesarias siguiendo el esquema de BIHR,
y realiza el upsert en la base de datos.
"""

import os
import sys
import csv
import json
import re
import psycopg2

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db"
)

# Directorio de los CSVs
CSV_BASE = os.environ.get(
    "CSV_DIR",
    "/home/adrian/Documentos/GitHub/escapes-react/CATALOGO BIHR"
)

CSV_FILES = [
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_A-SIDER.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_ABAC.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_ALL BALLS.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_BANDO.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_ATHENA.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_BMC.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_DAYCO.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_DELL ORTO.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_EK CHAIN.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_JT DRIVE CHAIN.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_JT SPROCKETS.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_NGK.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_NTN.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_RENTHAL.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_REKLUSE.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_POLISPORT.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_SKYRICH.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_V PARTS.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_TWIN AIR.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_YSS.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_YUASA.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_VICMA.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_VICTOR REINZ.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_YOSHIMURA US.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_IXIL.csv',
    'cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_HIFLOFILTRO.csv'
]

# Definición de mapeo de categorías BIHR (Category1, Category2, Category3) -> (Parent_ID, Subcategory_ID)
# Si no existe la subcategoría se inserta con el ID proporcionado.
# IDs de las Categorías Principales existentes:
# 1: Sistemas de Escape, 2: Frenos de Competición, 3: Ciclista & Chasis, 4: Electrónica & ECU, 5: Transmisión & Desarrollo,
# 6: Mantenimiento & Fluidos, 7: Neumáticos & Paddock, 8: Cascos, 9: Equipación Piloto, 10: Accesorios & Maletas
CATEGORY_MAPPING = {
    # Frenos
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. BRAKE DISC"): (2, 202),
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. BRAKE PADS"): (2, 201),
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. BRAKE PARTS"): (2, 205),
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. BRAKING KIT"): (2, 206),

    # Ciclista & Chasis
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. SHOCK&FORK"): (3, 305),
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. WHEELS"): (3, 306),
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. MAN-MACHINE"): (3, 307),
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. SERVICE PARTS"): (3, 308),

    # Electrónica & ECU
    ("VEHICLE PARTS & ACCESSORIES", "ELECTRICAL PARTS", "ELECT. BATTERY"): (4, 405),
    ("VEHICLE PARTS & ACCESSORIES", "ELECTRICAL PARTS", "ELECT. CHARGE"): (4, 406),
    ("VEHICLE PARTS & ACCESSORIES", "ELECTRICAL PARTS", "ELECT. SPARK PLUG"): (4, 407),
    ("VEHICLE PARTS & ACCESSORIES", "ELECTRICAL PARTS", "ELECT. SWITCH"): (4, 408),
    ("VEHICLE PARTS & ACCESSORIES", "ELECTRICAL PARTS", "ELECT. AUX COMPONENT"): (4, 409),
    ("VEHICLE PARTS & ACCESSORIES", "ELECTRICAL PARTS", "ELECT. LIGHT BULB"): (4, 410),

    # Transmisión & Desarrollo
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. CHAIN"): (5, 502),
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. CHAIN KIT"): (5, 501),
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. SPROCKET"): (5, 503), # O 504 si es corona, se afina en post
    ("VEHICLE PARTS & ACCESSORIES", "CHASSIS PARTS", "CHAS. BELT"): (5, 505),

    # Mantenimiento & Fluidos / Motor Parts
    ("VEHICLE PARTS & ACCESSORIES", "ENGINE PARTS", "ENG. AIR FILTER"): (6, 601),
    ("VEHICLE PARTS & ACCESSORIES", "ENGINE PARTS", "ENG. OIL FILTER"): (6, 602),
    ("VEHICLE PARTS & ACCESSORIES", "ENGINE PARTS", "ENG. BEARING&GASKET"): (6, 606),
    ("VEHICLE PARTS & ACCESSORIES", "ENGINE PARTS", "ENG. BOTTOM ENGINE"): (6, 607),
    ("VEHICLE PARTS & ACCESSORIES", "ENGINE PARTS", "ENG. CLUTCH"): (6, 608),
    ("VEHICLE PARTS & ACCESSORIES", "ENGINE PARTS", "ENG. INTAKE"): (6, 609),
    ("VEHICLE PARTS & ACCESSORIES", "ENGINE PARTS", "ENG. LUB&COOLING"): (6, 610),
    ("VEHICLE PARTS & ACCESSORIES", "ENGINE PARTS", "ENG. MAINTENANCE KIT"): (6, 611),
    ("VEHICLE PARTS & ACCESSORIES", "ENGINE PARTS", "ENG. TOP ENGINE"): (6, 612),
    ("LIQUIDS & LUBRICANTS", "MAINTENANCE & CARE", "MNT&CARE CLEAN&CARE"): (6, 613),
    ("LIQUIDS & LUBRICANTS", "MAINTENANCE & CARE", "MNT&CARE SEALANT"): (6, 614),
    ("LIQUIDS & LUBRICANTS", "MAINTENANCE & CARE", "MNT&CARE SPRAY"): (6, 615),

    # Sistemas de Escape (IXIL, YOSHIMURA, etc.)
    ("VEHICLE PARTS & ACCESSORIES", "ACCESSORIES", "ACC. EXHAUST"): (1, 101),

    # Accesorios & Maletas
    ("VEHICLE PARTS & ACCESSORIES", "ACCESSORIES", "ACC. ACCESS."): (10, 1006),
    ("VEHICLE PARTS & ACCESSORIES", "ACCESSORIES", "ACC. COMFORT&CONVEN."): (10, 1007),
    ("VEHICLE PARTS & ACCESSORIES", "ACCESSORIES", "ACC. DESIGN PARTS"): (10, 1008),
    ("VEHICLE PARTS & ACCESSORIES", "ACCESSORIES", "ACC. ELECTRIC"): (10, 1009),
    ("VEHICLE PARTS & ACCESSORIES", "ACCESSORIES", "ACC. ELECTRONIC"): (10, 1010),
    ("VEHICLE PARTS & ACCESSORIES", "ACCESSORIES", "ACC. PLASTIC&PROTECT"): (10, 1011),
    ("OTHER PRODUCTS & SERVICES", "MARKETING DEPARTMENT", "CATALOG&DOCUMENT."): (10, 1005),
    ("OTHER PRODUCTS & SERVICES", "MARKETING DEPARTMENT", "DISPLAY"): (10, 1005),
    ("OTHER PRODUCTS & SERVICES", "MARKETING DEPARTMENT", "GOODIES"): (10, 1005),

    # Equipación Piloto
    ("RIDER GEAR", "APPAREL", "APPAREL UNDERCLOTHES"): (9, 905),
    ("RIDER GEAR", "SPORTSWEAR", "SPORTSWEAR HEAD"): (9, 906),
    ("RIDER GEAR", "SPORTSWEAR", "SPORTSWEAR T-SHIRT"): (9, 907),

    # Herramientas / Tooling
    ("TOOLING & WS", "CONSUMABLE", "CONS. CONSUMABLE"): (6, 605),
    ("TOOLING & WS", "TOOLING", "TOOLING CHASSIS"): (6, 616),
    ("TOOLING & WS", "TOOLING", "TOOLING ENGINE"): (6, 617),
    ("TOOLING & WS", "TOOLING", "TOOLING GENERAL"): (6, 618),
    ("TOOLING & WS", "WS", "WS. CLEANING SYSTEM"): (6, 619),
    ("TOOLING & WS", "WS", "WS. COMPRESSED AIR"): (6, 620),
    ("TOOLING & WS", "WS", "WS. FLUID DISTRIB."): (6, 621),
    ("TOOLING & WS", "WS", "WS. FURNITURE"): (6, 622),
    ("TOOLING & WS", "WS", "WS. TIRE EQUIP."): (6, 623),

    # Bicicletas
    ("VEHICLE PARTS & ACCESSORIES", "BICYCLE PARTS & ACCESSORIES", "BICYCLE PARTS"): (10, 1012),
}

# Nombres legibles para las subcategorías que puedan necesitar ser creadas
SUBCATEGORY_NAMES = {
    205: ("Piezas de Freno", "piezas-freno"),
    206: ("Kits de Frenado", "kits-frenado"),
    305: ("Horquillas y Amortiguadores", "horquillas-amortiguadores"),
    306: ("Ruedas y Llantas", "ruedas-llantas"),
    307: ("Mandos y Mandiles", "mandos-mandiles"),
    308: ("Servicio y Chasis", "servicio-chasis"),
    405: ("Baterías", "baterias-moto"),
    406: ("Carga y Alternadores", "carga-alternadores"),
    407: ("Bujías", "bujias-encendido"),
    408: ("Interruptores y Sensores", "interruptores-sensores"),
    409: ("Componentes Auxiliares Eléctricos", "auxiliares-electricos"),
    410: ("Bombillas y Luces", "bombillas-luces"),
    505: ("Correas de Transmisión", "correas-transmision"),
    605: ("Seguridad y Consumibles", "seguridad-consumibles"),
    606: ("Rodamientos y Juntas", "rodamientos-juntas"),
    607: ("Motor Carter/Cigüeñal", "motor-carter-cigueñal"),
    608: ("Embragues", "embragues"),
    609: ("Admisión y Carburación", "admision-carburacion"),
    610: ("Lubricación y Refrigeración", "lubricacion-refrigeracion"),
    611: ("Kits de Mantenimiento", "kits-mantenimiento"),
    612: ("Cilindros y Culatas", "cilindros-culatas"),
    613: ("Limpieza y Cuidado", "limpieza-cuidado"),
    614: ("Selladores y Adhesivos", "selladores-adhesivos"),
    615: ("Sprays Técnicos", "sprays-tecnicos"),
    616: ("Herramientas de Chasis", "herramientas-chasis"),
    617: ("Herramientas de Motor", "herramientas-motor"),
    618: ("Herramientas Generales", "herramientas-generales"),
    619: ("Sistemas de Limpieza Taller", "sistemas-limpieza-taller"),
    620: ("Aire Comprimido", "aire-comprimido"),
    621: ("Distribución de Fluidos", "distribucion-fluidos"),
    622: ("Mobiliario de Taller", "mobiliario-taller"),
    623: ("Equipamiento de Neumáticos", "equipamiento-neumaticos"),
    1006: ("Accesorios Genéricos", "accesorios-genericos"),
    1007: ("Confort y Conveniencia", "confort-conveniencia"),
    1008: ("Piezas de Diseño/Estética", "piezas-diseno"),
    1009: ("Accesorios Eléctricos", "accesorios-electricos"),
    1010: ("Accesorios Electrónicos", "accesorios-electronicos"),
    1011: ("Plásticos y Protecciones", "plasticos-protecciones"),
    1012: ("Componentes de Bicicleta", "componentes-bicicleta"),
    905: ("Ropa Interior Térmica", "ropa-interior-termica"),
    906: ("Gorras y Bandanas", "gorras-bandanas"),
    907: ("Camisetas y Ropa Deportiva", "camisetas-ropa-deportiva"),
}

def parse_price(val):
    if not val:
        return 0
    val = str(val).strip().replace('"', '').replace(' ', '')
    if '.' in val and ',' in val:
        if val.find('.') > val.find(','):
            val = val.replace(',', '')
        else:
            val = val.replace('.', '').replace(',', '.')
    elif ',' in val:
        val = val.replace(',', '.')
    try:
        return round(float(val) * 100)
    except ValueError:
        return 0

def ensure_categories(cur):
    """Crea subcategorías si no existen."""
    for sub_id, (name, slug) in SUBCATEGORY_NAMES.items():
        cur.execute("SELECT id FROM categories WHERE id = %s", (sub_id,))
        if cur.fetchone() is None:
            # Determinar parent_id
            parent_id = sub_id // 100 if sub_id >= 100 else 1
            if sub_id >= 1000:
                parent_id = sub_id // 100
            cur.execute(
                "INSERT INTO categories (id, name, slug, parent_id, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, NOW(), NOW())",
                (sub_id, name, slug, parent_id)
            )
            print(f"  📂 Creada subcategoría: [{sub_id}] {name} (parent_id={parent_id})")

def get_category_ids(c1, c2, c3):
    key = (c1.strip(), c2.strip(), c3.strip())
    if key in CATEGORY_MAPPING:
        return CATEGORY_MAPPING[key]
    
    # Fallbacks inteligentes por Category2
    c2_strip = c2.strip()
    if "CHASSIS PARTS" in c2_strip:
        return (3, None)
    if "ENGINE PARTS" in c2_strip:
        return (6, None)
    if "ACCESSORIES" in c2_strip:
        return (10, None)
    if "ELECTRICAL PARTS" in c2_strip:
        return (4, None)
    
    return (10, None) # Fallback genérico a Accesorios

def import_single_csv(cur, filepath):
    filename = os.path.basename(filepath)
    print(f"\n🚀 Iniciando importación de {filename}...")
    
    if not os.path.exists(filepath):
        print(f"❌ Archivo no encontrado: {filepath}")
        return 0, 0, 0

    with open(filepath, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"📖 {len(rows)} registros leídos de {filename}.")
    
    inserted = 0
    updated = 0
    skipped = 0

    for row in rows:
        sku = row.get("PartNumber", "").strip()
        if not sku:
            sku = row.get("SupplierProductCode", "").strip()
        if not sku:
            skipped += 1
            continue

        brand = row.get("Brand", "").strip() or "BIHR"
        name = row.get("ProductName", "").strip() or row.get("Designation", "").strip() or f"{brand} Producto"
        name = name[:255]

        description = row.get("Description", "").strip() or row.get("HtmlDescription", "").strip()
        supplier_code = row.get("SupplierProductCode", "").strip()
        old_part_number = row.get("OldPartNumber", "").strip()
        barcode = row.get("BarCode", "").strip()

        # Precios
        cost_raw = row.get("BaseDealerPriceExcludingTax", "").strip()
        retail_ex = row.get("RetailPriceExcludingTax", "").strip()
        retail_in = row.get("RetailPriceIncludingTax", "").strip()

        cost = parse_price(cost_raw) or parse_price(retail_ex)
        price = parse_price(retail_in)
        if price == 0:
            price_ex = parse_price(retail_ex)
            price = round(price_ex * 1.21) if price_ex > 0 else round(cost * 1.21)

        stock = 0
        try:
            stock = int(row.get("StockValue", "0").strip())
        except ValueError:
            pass

        ondemand = row.get("OnDemand", "").strip() in ("1", "true", "True")
        dropshipping = row.get("DropShipping", "").strip() in ("1", "true", "True")
        delivery_plant = row.get("DeliveryPlant", "").strip()
        commodity_code = row.get("CommodityCode", "").strip()

        # Categorías
        c1 = row.get("Category1", "").strip()
        c2 = row.get("Category2", "").strip()
        c3 = row.get("Category3", "").strip()
        category_id, category2_id = get_category_ids(c1, c2, c3)

        # Ajuste extra para piñones/coronas RENTHAL/JT
        if category2_id == 503:
            name_lower = name.lower()
            if "corona" in name_lower or "rear sprocket" in name_lower or "coronas" in name_lower:
                category2_id = 504

        # Dimensiones
        def safe_int(key):
            try:
                return int(float(row.get(key, "").strip()))
            except (ValueError, TypeError):
                return None

        weight_g = safe_int("Weight (g)")
        length_mm = safe_int("Length (mm)")
        width_mm = safe_int("Width (mm)")
        height_mm = safe_int("Height (mm)")
        volume_cm3 = safe_int("Volume (cm³)")

        # Imágenes
        images_list = [row.get(f"Picture{i}", "").strip()
                       for i in range(1, 7)
                       if row.get(f"Picture{i}", "").strip()]
        images_json = json.dumps(images_list)

        cur.execute("""
            INSERT INTO products (
                sku, name, brand, supplier_code, old_part_number,
                cost, price, stock, barcode, description,
                category_id, category2_id, category2, category3,
                weight_g, length_mm, width_mm, height_mm, volume_cm3,
                dropshipping, ondemand, delivery_plant, commodity_code,
                status, created_at, updated_at, images
            ) VALUES (
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                %s, %s, %s, %s, %s,
                %s, %s, %s, %s,
                'published', NOW(), NOW(), %s
            )
            ON CONFLICT (sku) DO UPDATE SET
                name           = EXCLUDED.name,
                brand          = EXCLUDED.brand,
                supplier_code  = EXCLUDED.supplier_code,
                old_part_number= EXCLUDED.old_part_number,
                cost           = EXCLUDED.cost,
                price          = EXCLUDED.price,
                stock          = EXCLUDED.stock,
                barcode        = EXCLUDED.barcode,
                description    = EXCLUDED.description,
                category_id    = EXCLUDED.category_id,
                category2_id   = EXCLUDED.category2_id,
                category2      = EXCLUDED.category2,
                category3      = EXCLUDED.category3,
                weight_g       = EXCLUDED.weight_g,
                length_mm      = EXCLUDED.length_mm,
                width_mm       = EXCLUDED.width_mm,
                height_mm      = EXCLUDED.height_mm,
                volume_cm3     = EXCLUDED.volume_cm3,
                dropshipping   = EXCLUDED.dropshipping,
                ondemand       = EXCLUDED.ondemand,
                delivery_plant = EXCLUDED.delivery_plant,
                commodity_code = EXCLUDED.commodity_code,
                images         = EXCLUDED.images,
                updated_at     = NOW()
            RETURNING (xmax = 0) AS was_inserted
        """, (
            sku, name, brand, supplier_code, old_part_number,
            cost, price, stock, barcode, description,
            category_id, category2_id, c2, c3,
            weight_g, length_mm, width_mm, height_mm, volume_cm3,
            dropshipping, ondemand, delivery_plant, commodity_code,
            images_json
        ))

        res = cur.fetchone()
        if res and res[0]:
            inserted += 1
        else:
            updated += 1

        if (inserted + updated) % 1000 == 0:
            cur.connection.commit()
            print(f"    → {inserted} insertados, {updated} actualizados, {skipped} omitidos...")

    cur.connection.commit()
    print(f"  ✔️ Finalizado {filename}: {inserted} creados, {updated} actualizados, {skipped} omitidos.")
    return inserted, updated, skipped

def main():
    print("🔗 Conectando a la base de datos...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    print("🗂️ Verificando y creando subcategorías en la BD...")
    ensure_categories(cur)
    conn.commit()

    total_ins = total_upd = total_skp = 0

    for filename in CSV_FILES:
        filepath = os.path.join(CSV_BASE, filename)
        ins, upd, skp = import_single_csv(cur, filepath)
        total_ins += ins
        total_upd += upd
        total_skp += skp

    cur.close()
    conn.close()

    print("\n" + "="*50)
    print("🎉 PROCESAMIENTO DE CATÁLOGOS COMPLETADO")
    print(f"   Insertados:   {total_ins}")
    print(f"   Actualizados: {total_upd}")
    print(f"   Omitidos:     {total_skp}")
    print(f"   Total:        {total_ins + total_upd}")
    print("="*50 + "\n")

if __name__ == "__main__":
    main()
