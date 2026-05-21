#!/usr/bin/env python3
"""
Import WooCommerce catalog CSV into PostgreSQL products table.
Maps CSV category paths to existing category_ids in the DB.
Uses SKU as unique key. Skips rows with no SKU.
"""

import csv
import json
import os
import psycopg2
import re
import sys

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db"
)

CSV_FILE = "/tmp/catalogo-completo.csv"

# ──────────────────────────────────────────────
# MAPEO: Categoría CSV  →  category_id en BD
# BD IDs (según storeData.ts + distribución actual):
#  1 = Sistemas de Escape
#  2 = Frenos de Competición
#  3 = Ciclista & Chasis (suspensiones, amortiguadores)
#  4 = Electrónica & ECU
#  5 = Transmisión & Desarrollo
#  6 = Mantenimiento & Fluidos (filtros, aceites)
#  7 = Neumáticos & Paddock
#  8 = Cascos
#  9 = Equipación Piloto
# 10 = Accesorios & Maletas
# ──────────────────────────────────────────────
CATEGORY_MAP = {
    # ── ESCAPES → 1
    "Escapes > Silencioso":          1,
    "Escapes > Escape completo":     1,
    "Escapes > Colector":            1,
    "Escapes > Catalizador":         1,
    "Escapes > Protector de escape": 1,
    "Escapes > Recambio Escapes":    1,
    "Escapes > Recambios":           1,
    "Escapes > Accesorios":          1,
    "Escapes > Emulador":            1,
    "Escapes > Portamatrículas":     1,

    # ── FRENOS → 2
    "Frenos > Discos de freno":      2,
    "Frenos > Pastillas de freno":   2,
    "Frenos > Kit de frenos":        2,
    "Frenos > Bomba de embrague":    2,
    "Frenos > Manetas":              2,
    "Bomba de freno":                2,
    "Pinza de freno":                2,
    "Discos de freno":               2,
    "Recambio de frenos":            2,
    "Kit de freno sobredimensionado": 2,

    # ── SUSPENSIONES / CHASIS → 3
    "Amortiguador":                  3,
    "Horquilla":                     3,
    "Cartucho de horquilla":         3,
    "Muelle Amortiguador":           3,
    "Muelle Horquilla":              3,
    "Recambio suspensiones":         3,
    "Öhlins > Amortiguador":         3,
    "Öhlins > Amortiguador de dirección": 3,
    "Öhlins > Cartucho de horquilla": 3,
    "Öhlins > Horquilla":            3,
    "Öhlins > Muelle Amortiguador":  3,
    "Öhlins > Muelle Horquilla":     3,
    "Öhlins > Kit tapón y muelles":  3,

    # ── TRANSMISIÓN → 5
    "Transmisión > Cadenas":         5,
    "Transmisión > Coronas":         5,
    "Transmisión > Piñones":         5,
    "Transmisión > Kit de transmisión": 5,
    "Transmisión > Eslabón de cadena": 5,

    # ── MANTENIMIENTO / FLUIDOS → 6
    "Filtros de aire > Onroad":      6,
    "Filtros de aire > Offroad":     6,
    "Filtros de aire > Racing":      6,
    "Filtros de aire > Mixto":       6,
    "Aceite":                        6,
    "Öhlins > Aceite":               6,
    "Recambios":                     6,  # genérico → mantenimiento
}

DEFAULT_CATEGORY_ID = 1  # fallback: escapes (revisar manualmente si hay otros)


def parse_price(val: str) -> int:
    """Convert '1.234,56' or '1234.56' to integer cents."""
    if not val:
        return 0
    val = val.strip().replace('"', '').replace(' ', '')
    # Spanish format: 1.234,56
    val = val.replace('.', '').replace(',', '.')
    try:
        return round(float(val) * 100)
    except ValueError:
        return 0


def main():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    inserted = 0
    updated = 0
    skipped = 0

    with open(CSV_FILE, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            sku = row.get("SKU", "").strip()
            if not sku:
                skipped += 1
                continue

            name = row.get("Nombre", "").strip()[:255]
            description = (row.get("Descripción", "") or row.get("Descripción corta", "")).strip()
            price_raw = row.get("Precio normal", "").strip()
            sale_raw = row.get("Precio rebajado", "").strip()
            cat_str = row.get("Categorías", "").strip()
            brand = row.get("Marcas", "").strip()
            images_raw = row.get("Imágenes", "").strip()
            published = row.get("Publicado", "1").strip()

            price = parse_price(price_raw)
            sale_price = parse_price(sale_raw) if sale_raw else None
            category_id = CATEGORY_MAP.get(cat_str, DEFAULT_CATEGORY_ID)
            status = "active" if published == "1" else "draft"

            # Images: comma-separated URLs → JSON array
            images_list = [u.strip() for u in images_raw.split(",") if u.strip()]
            images_json = json.dumps(images_list)

            # Attributes JSONB
            attrs = {}
            if brand:
                attrs["brand"] = brand
            if cat_str:
                attrs["csv_category"] = cat_str
            attrs_json = json.dumps(attrs, ensure_ascii=False)

            cur.execute("""
                INSERT INTO products (sku, name, description, price, sale_price, category_id,
                                      images, status, provider_id, attributes, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s::jsonb, NOW(), NOW())
                ON CONFLICT (sku) DO UPDATE SET
                    name        = EXCLUDED.name,
                    description = EXCLUDED.description,
                    price       = EXCLUDED.price,
                    sale_price  = EXCLUDED.sale_price,
                    category_id = EXCLUDED.category_id,
                    images      = EXCLUDED.images,
                    status      = EXCLUDED.status,
                    attributes  = EXCLUDED.attributes,
                    updated_at  = NOW()
                RETURNING (xmax = 0) AS was_inserted
            """, (
                sku, name, description, price, sale_price, category_id,
                images_json, status, "woocommerce", attrs_json
            ))

            row_result = cur.fetchone()
            if row_result and row_result[0]:
                inserted += 1
            else:
                updated += 1

            if (inserted + updated) % 500 == 0:
                conn.commit()
                print(f"  → {inserted} insertados, {updated} actualizados, {skipped} omitidos...")

    print("   Actualizando subcategorías en base a reglas de nombre...")
    category_rules = [
        # ── ESCAPES (1)
        (101, 1, "(LOWER(name) LIKE '%racing%' OR LOWER(name) LIKE '%completo%')"),
        (102, 1, "(LOWER(name) LIKE '%silenciador%' OR LOWER(name) LIKE '%silencioso%' OR LOWER(name) LIKE '%slip-on%' OR LOWER(name) LIKE '%escape%')"),
        (103, 1, "(LOWER(name) LIKE '%colector%' OR LOWER(name) LIKE '%header%')"),
        (104, 1, "(LOWER(name) LIKE '%accesorio%')"),

        # ── FRENOS (2)
        (201, 2, "(LOWER(name) LIKE '%pastilla%' OR LOWER(name) LIKE '%pad%')"),
        (202, 2, "(LOWER(name) LIKE '%disco%' OR LOWER(name) LIKE '%disc%')"),
        (203, 2, "(LOWER(name) LIKE '%bomba%' OR LOWER(name) LIKE '%pump%')"),
        (204, 2, "(LOWER(name) LIKE '%latiguillo%' OR LOWER(name) LIKE '%line%')"),

        # ── CICLISTA & CHASIS (3)
        (301, 3, "(LOWER(name) LIKE '%amortiguador%' OR LOWER(name) LIKE '%shock%')"),
        (302, 3, "(LOWER(name) LIKE '%horquilla%' OR LOWER(name) LIKE '%fork%')"),
        (303, 3, "(LOWER(name) LIKE '%direccion%' OR LOWER(name) LIKE '%steering%')"),
        (304, 3, "(LOWER(name) LIKE '%estribera%' OR LOWER(name) LIKE '%peg%')"),

        # ── ELECTRÓNICA & ECU (4)
        (401, 4, "(LOWER(name) LIKE '%centralita%' OR LOWER(name) LIKE '%ecu%')"),
        (402, 4, "(LOWER(name) LIKE '%quickshifter%' OR LOWER(name) LIKE '%shifter%')"),
        (403, 4, "(LOWER(name) LIKE '%abs%' OR LOWER(name) LIKE '%tc%')"),
        (404, 4, "(LOWER(name) LIKE '%litio%' OR LOWER(name) LIKE '%lithium%')"),

        # ── TRANSMISIÓN & DESARROLLO (5)
        (501, 5, "(LOWER(name) LIKE '%kit%')"),
        (502, 5, "(LOWER(name) LIKE '%cadena%' OR LOWER(name) LIKE '%chain%')"),
        (503, 5, "(LOWER(name) LIKE '%piñon%' OR LOWER(name) LIKE '%sprocket%')"),
        (504, 5, "(LOWER(name) LIKE '%corona%')"),

        # ── MANTENIMIENTO & FLUIDOS (6)
        (601, 6, "(LOWER(name) LIKE '%filtro%' OR LOWER(name) LIKE '%filter%')"),
        (602, 6, "(LOWER(name) LIKE '%filtro aceite%')"),
        (603, 6, "(LOWER(name) LIKE '%aceite%' OR LOWER(name) LIKE '%oil%')"),
        (604, 6, "(LOWER(name) LIKE '%liquido%' OR LOWER(name) LIKE '%fluid%')"),

        # ── NEUMÁTICOS & PADDOCK (7)
        (701, 7, "(LOWER(name) LIKE '%neumatico%' OR LOWER(name) LIKE '%tire%' OR LOWER(name) LIKE '%slick%')"),
        (702, 7, "(LOWER(name) LIKE '%calentador%' OR LOWER(name) LIKE '%warmer%')"),
        (703, 7, "(LOWER(name) LIKE '%caballete%' OR LOWER(name) LIKE '%stand%')"),
        (704, 7, "(LOWER(name) LIKE '%manometro%' OR LOWER(name) LIKE '%gauge%')"),

        # ── CASCOS (8)
        (802, 8, "(LOWER(name) LIKE '%modular%' OR LOWER(name) LIKE '%flip-up%' OR LOWER(name) LIKE '%system%')"),
        (803, 8, "(LOWER(name) LIKE '%jet%' OR LOWER(name) LIKE '%open face%' OR LOWER(name) LIKE '%open-face%')"),
        (804, 8, "(LOWER(name) LIKE '%off-road%' OR LOWER(name) LIKE '%offroad%' OR LOWER(name) LIKE '%cross%' OR LOWER(name) LIKE '%enduro%' OR LOWER(name) LIKE '%trial%' OR LOWER(name) LIKE '%dual-sport%' OR LOWER(name) LIKE '%dualsport%')"),
        (801, 8, "(LOWER(name) NOT LIKE '%modular%' AND LOWER(name) NOT LIKE '%flip-up%' AND LOWER(name) NOT LIKE '%system%' AND LOWER(name) NOT LIKE '%jet%' AND LOWER(name) NOT LIKE '%open face%' AND LOWER(name) NOT LIKE '%open-face%' AND LOWER(name) NOT LIKE '%off-road%' AND LOWER(name) NOT LIKE '%offroad%' AND LOWER(name) NOT LIKE '%cross%' AND LOWER(name) NOT LIKE '%enduro%' AND LOWER(name) NOT LIKE '%trial%' AND LOWER(name) NOT LIKE '%dual-sport%' AND LOWER(name) NOT LIKE '%dualsport%')"),

        # ── EQUIPACIÓN PILOTO (9)
        (901, 9, "(LOWER(name) LIKE '%chaqueta%' OR LOWER(name) LIKE '%jacket%')"),
        (902, 9, "(LOWER(name) LIKE '%mono%' AND LOWER(name) NOT LIKE '%glove%' AND LOWER(name) NOT LIKE '%guante%' AND LOWER(name) NOT LIKE '%pants%' AND LOWER(name) NOT LIKE '%pantalón%' AND LOWER(name) NOT LIKE '%jersey%' AND LOWER(name) NOT LIKE '%camiseta%' AND LOWER(name) NOT LIKE '%chaqueta%' AND LOWER(name) NOT LIKE '%bota%')"),
        (903, 9, "(LOWER(name) LIKE '%guante%' OR LOWER(name) LIKE '%glove%')"),
        (904, 9, "(LOWER(name) LIKE '%bota%' OR LOWER(name) LIKE '%boot%')"),

        # ── ACCESORIOS & MALETAS (10)
        (1001, 10, "(LOWER(name) LIKE '%baul%' OR LOWER(name) LIKE '%maleta%' OR LOWER(name) LIKE '%case%')"),
        (1002, 10, "(LOWER(name) LIKE '%quad lock%')"),
        (1003, 10, "(LOWER(name) LIKE '%intercom%')"),
        (1004, 10, "(LOWER(name) LIKE '%retrovisor%' OR LOWER(name) LIKE '%espejo%' OR LOWER(name) LIKE '%mirror%')"),
    ]
    for sub_id, parent_id, clause in category_rules:
        clause_escaped = clause.replace('%', '%%')
        sql = f"UPDATE products SET category_id = %s, updated_at = NOW() WHERE category_id = %s AND {clause_escaped}"
        cur.execute(sql, (sub_id, parent_id))

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✅ IMPORTACIÓN COMPLETA:")
    print(f"   Insertados:  {inserted}")
    print(f"   Actualizados: {updated}")
    print(f"   Omitidos:    {skipped}")
    print(f"   TOTAL:       {inserted + updated}")


if __name__ == "__main__":
    main()
