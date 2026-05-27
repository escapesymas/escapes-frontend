#!/usr/bin/env python3
"""
Importar catálogo BREMBO / BREMBO RACING desde CSV de BIHR.
Uso:
    python3 import_brembo_csv.py                   # ambos CSV
    CSV_FILE=<path> python3 import_brembo_csv.py   # un CSV concreto

Mapeo de categorías BIHR → nuestra BD (igual que BIHR):
  VEHICLE PARTS & ACCESSORIES > CHASSIS PARTS
    CHAS. BRAKE PADS  → cat 2 (Frenos), subcat 201 (Pastillas Sinterizadas)
    CHAS. BRAKE DISC  → cat 2 (Frenos), subcat 202 (Discos de Freno)
    CHAS. BRAKE PARTS → cat 2 (Frenos), subcat 205 (Piezas de Freno) [crear si no existe]
  TOOLING & WS > CONSUMABLE
    CONS. SAFETY EQUIP. → cat 6 (Mantenimiento), subcat 605 (Seguridad/Consumibles) [crear si no existe]
  OTHER PRODUCTS & SERVICES > MARKETING DEPARTMENT
    DISPLAY / GOODIES  → cat 10 (Accesorios), subcat 1005 (Artículos Promocionales)
"""

import csv
import json
import os
import re
import sys
import psycopg2

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db"
)

# Archivos CSV a importar (en orden)
_CSV_BASE = os.environ.get(
    "CSV_DIR",
    "/home/adrian/Documentos/GitHub/escapes-react/CATALOGO BIHR"
)
DEFAULT_CSV_FILES = [
    os.path.join(_CSV_BASE, "cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_BREMBO.csv"),
    os.path.join(_CSV_BASE, "cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_BREMBO RACING.csv"),
]

# ---------------------------------------------------------------------------
# Mapeo BIHR (Category2, Category3) → (category_id, category2_id)
# Las entradas con category2_id=None se auto-asignarán a la categoría padre
# ---------------------------------------------------------------------------
CATEGORY_MAP = {
    # VEHICLE PARTS & ACCESSORIES > CHASSIS PARTS
    ("CHASSIS PARTS", "CHAS. BRAKE PADS"):  (2, 201),  # Pastillas Sinterizadas
    ("CHASSIS PARTS", "CHAS. BRAKE DISC"):  (2, 202),  # Discos de Freno
    ("CHASSIS PARTS", "CHAS. BRAKE PARTS"): (2, 205),  # Piezas de Freno (crear si falta)
    # TOOLING & WS > CONSUMABLE
    ("CONSUMABLE", "CONS. SAFETY EQUIP."): (6, 605),   # Seguridad/Consumibles (crear si falta)
    # OTHER PRODUCTS & SERVICES > MARKETING DEPARTMENT
    ("MARKETING DEPARTMENT", "DISPLAY"):   (10, 1005), # Artículos Promocionales
    ("MARKETING DEPARTMENT", "GOODIES"):   (10, 1005), # Artículos Promocionales
}

# Subcategorías que hay que crear si no existen:
# (id, name, slug, parent_id)
SUBCATEGORIES_TO_ENSURE = [
    (205, "Piezas de Freno",          "piezas-freno",       2),
    (605, "Seguridad y Consumibles",  "seguridad-consumibles", 6),
]

# ---------------------------------------------------------------------------

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

def slugify(text):
    text = text.lower()
    text = re.sub(r'[áàäâ]', 'a', text)
    text = re.sub(r'[éèëê]', 'e', text)
    text = re.sub(r'[íìïî]', 'i', text)
    text = re.sub(r'[óòöô]', 'o', text)
    text = re.sub(r'[úùüû]', 'u', text)
    text = re.sub(r'ñ', 'n', text)
    text = re.sub(r'[^a-z0-9]+', '-', text)
    return text.strip('-')

def ensure_subcategories(cur):
    """Crea subcategorías si no existen en la BD."""
    for sub_id, name, slug, parent_id in SUBCATEGORIES_TO_ENSURE:
        cur.execute("SELECT id FROM categories WHERE id = %s", (sub_id,))
        if cur.fetchone() is None:
            cur.execute(
                "INSERT INTO categories (id, name, slug, parent_id, created_at, updated_at) "
                "VALUES (%s, %s, %s, %s, NOW(), NOW())",
                (sub_id, name, slug, parent_id)
            )
            print(f"  ✅ Subcategoría creada: [{sub_id}] {name} (parent={parent_id})")
        else:
            print(f"  ✔️  Subcategoría ya existe: [{sub_id}] {name}")

def get_category_mapping(category2, category3):
    """Devuelve (category_id, category2_id) según el mapeo BIHR."""
    key = (category2.strip(), category3.strip())
    if key in CATEGORY_MAP:
        return CATEGORY_MAP[key]
    # Fallback por Category2
    if "CHASSIS PARTS" in category2:
        return (2, None)
    if "CONSUMABLE" in category2:
        return (6, None)
    if "MARKETING" in category2:
        return (10, 1005)
    # Fallback genérico → Accesorios
    return (10, None)

def import_csv(cur, csv_file):
    inserted = 0
    updated = 0
    skipped = 0

    brand_name = "BREMBO"
    if "RACING" in csv_file.upper():
        # Distinguir BREMBO RACING en el nombre del archivo
        # (la marca ya viene en el CSV campo Brand)
        pass

    # Cargar regla de precios para Brembo si existe
    margin_percent = 20
    try:
        cur.execute(
            "SELECT margin_percent FROM pricing_rules "
            "WHERE rule_type = 'brand' AND LOWER(target_id) IN ('brembo','brembo racing') AND active = 1 "
            "ORDER BY created_at DESC LIMIT 1"
        )
        row = cur.fetchone()
        if row:
            margin_percent = row[0]
            print(f"  📈 Regla de precio encontrada: {margin_percent}% de margen.")
    except Exception as e:
        print(f"  ⚠️ No se pudo leer la regla de margen: {e} — usando {margin_percent}%")
        cur.connection.rollback()

    print(f"  📖 Leyendo {os.path.basename(csv_file)}...")
    with open(csv_file, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        rows = list(reader)
    print(f"  📦 {len(rows)} filas a procesar.")

    for row in rows:
        sku = row.get("PartNumber", "").strip()
        if not sku:
            sku = row.get("SupplierProductCode", "").strip()
        if not sku:
            skipped += 1
            continue

        brand = row.get("Brand", brand_name).strip() or brand_name
        name = (row.get("ProductName", "").strip()
                or row.get("Designation", "").strip()
                or f"{brand} Producto")
        name = name[:255]

        description = row.get("Description", "").strip() or row.get("HtmlDescription", "").strip()
        supplier_code = row.get("SupplierProductCode", "").strip()
        old_part_number = row.get("OldPartNumber", "").strip()
        barcode = row.get("BarCode", "").strip()

        # Precios
        cost_raw  = row.get("BaseDealerPriceExcludingTax", "").strip()
        retail_ex = row.get("RetailPriceExcludingTax", "").strip()
        retail_in = row.get("RetailPriceIncludingTax", "").strip()

        cost  = parse_price(cost_raw) or parse_price(retail_ex)
        price = parse_price(retail_in)
        if price == 0:
            price_ex = parse_price(retail_ex)
            price = round(price_ex * 1.21) if price_ex > 0 else round(cost * 1.21)

        stock = 0
        try:
            stock = int(row.get("StockValue", "0").strip())
        except ValueError:
            pass

        ondemand    = row.get("OnDemand", "").strip() in ("1", "true", "True")
        dropshipping = row.get("DropShipping", "").strip() in ("1", "true", "True")
        delivery_plant = row.get("DeliveryPlant", "").strip()
        commodity_code = row.get("CommodityCode", "").strip()

        # Categorías
        category2_csv = row.get("Category2", "").strip()
        category3_csv = row.get("Category3", "").strip()
        category_id, category2_id = get_category_mapping(category2_csv, category3_csv)

        # Dimensiones
        def safe_int(key):
            try:
                return int(float(row.get(key, "").strip()))
            except (ValueError, TypeError):
                return None

        weight_g   = safe_int("Weight (g)")
        length_mm  = safe_int("Length (mm)")
        width_mm   = safe_int("Width (mm)")
        height_mm  = safe_int("Height (mm)")
        volume_cm3 = safe_int("Volume (cm³)")

        # Imágenes
        images_list = [row.get(f"Picture{i}", "").strip()
                       for i in range(1, 7)
                       if row.get(f"Picture{i}", "").strip()]
        images_json = json.dumps(images_list)

        # Upsert
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
            category_id, category2_id, category2_csv, category3_csv,
            weight_g, length_mm, width_mm, height_mm, volume_cm3,
            dropshipping, ondemand, delivery_plant, commodity_code,
            images_json
        ))

        res = cur.fetchone()
        if res and res[0]:
            inserted += 1
        else:
            updated += 1

        if (inserted + updated) % 200 == 0:
            cur.connection.commit()
            print(f"    → {inserted} insertados, {updated} actualizados, {skipped} omitidos…")

    cur.connection.commit()
    return inserted, updated, skipped


def main():
    csv_files = [os.environ["CSV_FILE"]] if "CSV_FILE" in os.environ else DEFAULT_CSV_FILES

    # Verificar que existen
    for f in csv_files:
        if not os.path.exists(f):
            print(f"❌ No se encontró: {f}")
            sys.exit(1)

    print("🔗 Conectando a la base de datos…")
    conn = psycopg2.connect(DB_URL)
    cur  = conn.cursor()

    # 1. Asegurar subcategorías necesarias
    print("\n🗂️  Verificando subcategorías necesarias…")
    ensure_subcategories(cur)
    conn.commit()

    # 2. Importar cada CSV
    total_inserted = total_updated = total_skipped = 0
    for csv_file in csv_files:
        print(f"\n{'='*60}")
        print(f"📂 Importando: {os.path.basename(csv_file)}")
        print(f"{'='*60}")
        ins, upd, skp = import_csv(cur, csv_file)
        total_inserted += ins
        total_updated  += upd
        total_skipped  += skp
        print(f"  ✅ Resultado: {ins} insertados, {upd} actualizados, {skp} omitidos.")

    cur.close()
    conn.close()

    print(f"\n{'='*60}")
    print(f"🎉 IMPORTACIÓN BREMBO COMPLETA")
    print(f"   Insertados:  {total_inserted}")
    print(f"   Actualizados: {total_updated}")
    print(f"   Omitidos:    {total_skipped}")
    print(f"   TOTAL:       {total_inserted + total_updated}")
    print(f"{'='*60}")
    print(f"\n➡️  Siguiente paso:")
    print(f"   Ejecuta el script de sincronización de compatibilidades filtrando por marca BREMBO.")


if __name__ == "__main__":
    main()
