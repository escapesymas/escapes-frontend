#!/usr/bin/env python3
import csv
import json
import os
import psycopg2
import sys

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db"
)

CSV_FILE = os.environ.get(
    "CSV_FILE",
    "/home/adrian/Documentos/GitHub/escapes-react/CATALOGO BIHR/cat-extended-full-ES01-ES001-es-2026_05_17_00_15_01_AFAM.csv"
)

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

def main():
    if not os.path.exists(CSV_FILE):
        print(f"Error: No se encontró el archivo CSV en {CSV_FILE}")
        sys.exit(1)

    print(f"🔗 Conectando a la base de datos...")
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Cargar regla de precios para AFAM si existe
    margin_percent = 20
    try:
        cur.execute("SELECT margin_percent FROM pricing_rules WHERE rule_type = 'brand' AND LOWER(target_id) = 'afam' AND active = 1")
        row = cur.fetchone()
        if row:
            margin_percent = row[0]
            print(f"📈 Regla de precio encontrada para AFAM: {margin_percent}% de margen.")
        else:
            print(f"📈 Usando margen por defecto de {margin_percent}% para AFAM.")
    except Exception as e:
        print(f"⚠️ Error al consultar reglas de margen: {e}. Usando 20% por defecto.")
        conn.rollback()

    inserted = 0
    updated = 0
    skipped = 0

    print("📖 Leyendo catálogo CSV de AFAM...")
    with open(CSV_FILE, encoding="utf-8-sig", newline="") as f:
        reader = csv.DictReader(f)
        
        for index, row in enumerate(reader):
            sku = row.get("PartNumber", "").strip()
            if not sku:
                sku = row.get("SupplierProductCode", "").strip()
            
            if not sku:
                skipped += 1
                continue

            name = row.get("ProductName", "").strip() or row.get("Designation", "").strip() or "AFAM Producto"
            # Truncar nombre a 255
            name = name[:255]

            description = row.get("Description", "").strip() or row.get("HtmlDescription", "").strip()
            brand = "AFAM"
            supplier_code = row.get("SupplierProductCode", "").strip()
            old_part_number = row.get("OldPartNumber", "").strip()

            # Precios
            cost_raw = row.get("BaseDealerPriceExcludingTax", "").strip()
            retail_ex_raw = row.get("RetailPriceExcludingTax", "").strip()
            retail_inc_raw = row.get("RetailPriceIncludingTax", "").strip()

            cost = parse_price(cost_raw)
            if cost == 0:
                cost = parse_price(retail_ex_raw)
            
            # Importa el retail directamente (con impuestos incluidos)
            price = parse_price(retail_inc_raw)
            if price == 0:
                price_ex = parse_price(retail_ex_raw)
                if price_ex > 0:
                    price = round(price_ex * 1.21)
                else:
                    price = round(cost * 1.21)

            barcode = row.get("BarCode", "").strip()
            stock = 0
            try:
                stock = int(row.get("StockValue", "0").strip())
            except ValueError:
                pass

            commodity_code = row.get("CommodityCode", "").strip()
            ondemand = row.get("OnDemand", "").strip() in ["1", "true", "True"]
            dropshipping = row.get("DropShipping", "").strip() in ["1", "true", "True"]
            delivery_plant = row.get("DeliveryPlant", "").strip()

            # Categorías
            category_id = 5 # Transmisión & Desarrollo por defecto para AFAM
            category2 = row.get("Category2", "").strip()
            category3 = row.get("Category3", "").strip()

            # Dimensiones
            weight_g = None
            try:
                weight_g = int(float(row.get("Weight (g)", "").strip()))
            except (ValueError, TypeError):
                pass

            length_mm = None
            try:
                length_mm = int(float(row.get("Length (mm)", "").strip()))
            except (ValueError, TypeError):
                pass

            width_mm = None
            try:
                width_mm = int(float(row.get("Width (mm)", "").strip()))
            except (ValueError, TypeError):
                pass

            height_mm = None
            try:
                height_mm = int(float(row.get("Height (mm)", "").strip()))
            except (ValueError, TypeError):
                pass

            volume_cm3 = None
            try:
                volume_cm3 = int(float(row.get("Volume (cm³)", "").strip()))
            except (ValueError, TypeError):
                pass

            # Imágenes
            images_list = []
            for i in range(1, 7):
                pic = row.get(f"Picture{i}", "").strip()
                if pic:
                    images_list.append(pic)
            images_json = json.dumps(images_list)

            # Insertar / Upsert en la base de datos
            cur.execute("""
                INSERT INTO products (
                    sku, name, brand, supplier_code, old_part_number,
                    cost, price, stock, barcode, description,
                    category_id, category2, category3,
                    weight_g, length_mm, width_mm, height_mm, volume_cm3,
                    dropshipping, ondemand, delivery_plant, commodity_code,
                    status, created_at, updated_at, images
                ) VALUES (
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s,
                    %s, %s, %s, %s, %s,
                    %s, %s, %s, %s,
                    'published', NOW(), NOW(), %s
                )
                ON CONFLICT (sku) DO UPDATE SET
                    name = EXCLUDED.name,
                    brand = EXCLUDED.brand,
                    supplier_code = EXCLUDED.supplier_code,
                    old_part_number = EXCLUDED.old_part_number,
                    cost = EXCLUDED.cost,
                    price = EXCLUDED.price,
                    stock = EXCLUDED.stock,
                    barcode = EXCLUDED.barcode,
                    description = EXCLUDED.description,
                    category_id = EXCLUDED.category_id,
                    category2 = EXCLUDED.category2,
                    category3 = EXCLUDED.category3,
                    weight_g = EXCLUDED.weight_g,
                    length_mm = EXCLUDED.length_mm,
                    width_mm = EXCLUDED.width_mm,
                    height_mm = EXCLUDED.height_mm,
                    volume_cm3 = EXCLUDED.volume_cm3,
                    dropshipping = EXCLUDED.dropshipping,
                    ondemand = EXCLUDED.ondemand,
                    delivery_plant = EXCLUDED.delivery_plant,
                    commodity_code = EXCLUDED.commodity_code,
                    images = EXCLUDED.images,
                    updated_at = NOW()
                RETURNING (xmax = 0) AS was_inserted
            """, (
                sku, name, brand, supplier_code, old_part_number,
                cost, price, stock, barcode, description,
                category_id, category2, category3,
                weight_g, length_mm, width_mm, height_mm, volume_cm3,
                dropshipping, ondemand, delivery_plant, commodity_code,
                images_json
            ))

            row_result = cur.fetchone()
            if row_result and row_result[0]:
                inserted += 1
            else:
                updated += 1

            if (inserted + updated) % 500 == 0:
                conn.commit()
                print(f"  → {inserted} insertados, {updated} actualizados, {skipped} omitidos...")

    print("🤖 Actualizando subcategorías en base a reglas de nombre de Transmisión...")
    # 501: Kit de transmisión, 502: Cadenas, 503: Piñones, 504: Coronas
    category_rules = [
        (501, "(LOWER(name) LIKE '%%kit%%')"),
        (502, "(LOWER(name) LIKE '%%cadena%%' OR LOWER(name) LIKE '%%chain%%' OR LOWER(name) LIKE '%%link%%' OR LOWER(name) LIKE '%%enganche%%' OR LOWER(name) LIKE '%%connect%%')"),
        (503, "(LOWER(name) LIKE '%%piñon%%' OR LOWER(name) LIKE '%%sprocket%%' OR LOWER(name) LIKE '%%piñón%%')"),
        (504, "(LOWER(name) LIKE '%%corona%%')"),
    ]

    for sub_id, clause in category_rules:
        sql = f"UPDATE products SET category2_id = %s, updated_at = NOW() WHERE brand = 'AFAM' AND {clause}"
        cur.execute(sql, (sub_id,))

    conn.commit()
    cur.close()
    conn.close()

    print(f"\n✅ IMPORTACIÓN AFAM COMPLETA:")
    print(f"   Insertados:  {inserted}")
    print(f"   Actualizados: {updated}")
    print(f"   Omitidos:    {skipped}")
    print(f"   TOTAL:       {inserted + updated}")

if __name__ == "__main__":
    main()
