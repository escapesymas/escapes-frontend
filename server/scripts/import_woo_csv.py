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
