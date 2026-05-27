#!/usr/bin/env python3
import sys
import os
import time
import json
import urllib.request
import urllib.error
import argparse
import psycopg2
from concurrent.futures import ThreadPoolExecutor, as_completed

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db"
)

def fetch_sku_page(sku, page=0, retries=3):
    url = f"https://api.mybihr.com/occ/v2/bihres/products/compatibleVehicles?productCode={sku}&page={page}&pageSize=120"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    }
    req = urllib.request.Request(url, headers=headers)
    
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                data = json.loads(response.read().decode('utf-8'))
                vehicles = data.get("compatibleVehicles", [])
                compat_list = []
                for v in vehicles:
                    brand = v.get("brand", "").strip()
                    version = v.get("version", "").strip()
                    year = v.get("year")
                    cc = v.get("cylinder")
                    code = v.get("vehicleCode", "").strip()
                    
                    if brand and version:
                        compat_list.append({
                            "brand": brand,
                            "model": version,
                            "year": year,
                            "cc": cc,
                            "code": code
                        })
                
                pagination = data.get("pagination", {})
                total_pages = pagination.get("totalPages", 1)
                return compat_list, total_pages
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return [], 0
            elif e.code == 429:
                time.sleep(2 ** attempt)
            else:
                if attempt == retries - 1:
                    raise e
                time.sleep(1.5)
        except Exception as e:
            if attempt == retries - 1:
                raise e
            time.sleep(1.5)

def save_sku_compatibility(write_cur, prod_id, sku, name, pages_dict):
    # Consolidar todas las páginas descargadas
    all_compatibilities = []
    for p_num in sorted(pages_dict.keys()):
        all_compatibilities.extend(pages_dict[p_num])
    
    # Deduplicar
    seen = set()
    deduped = []
    for item in all_compatibilities:
        key = (item["brand"], item["model"], item["year"], item["cc"])
        if key not in seen:
            seen.add(key)
            deduped.append(item)
    
    # Guardar en base de datos
    if deduped:
        compat_json = json.dumps(deduped, ensure_ascii=False)
        write_cur.execute(
            "UPDATE products SET compatibility = %s, updated_at = NOW() WHERE id = %s",
            (compat_json, prod_id)
        )
        return len(deduped), len(pages_dict)
    else:
        write_cur.execute(
            "UPDATE products SET compatibility = '[]', updated_at = NOW() WHERE id = %s",
            (prod_id,)
        )
        return 0, len(pages_dict)

def main():
    parser = argparse.ArgumentParser(description="Sincronizar compatibilidades por lotes con logging inmediato.")
    parser.add_argument("--limit", type=int, default=None, help="Límite de productos a procesar")
    parser.add_argument("--sku", type=str, default=None, help="Procesar un único SKU específico")
    parser.add_argument("--brand", type=str, default=None, help="Filtrar por marca (ej: AFAM, BREMBO). Acepta varias separadas por coma.")
    parser.add_argument("--workers", type=int, default=15, help="Número de trabajadores concurrentes (máximo recomendado: 15)")
    parser.add_argument("--batch-size", type=int, default=15, help="Tamaño del lote de productos")
    args = parser.parse_args()

    print("🔗 Conectando a la base de datos...", flush=True)
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = True
    cur = conn.cursor()

    if args.sku:
        cur.execute("SELECT id, sku, name FROM products WHERE sku = %s", (args.sku,))
    else:
        # Construir filtro de marca
        if args.brand:
            brands = [b.strip() for b in args.brand.split(',')]
            brand_filter = "brand IN (" + ",".join(["%s"] * len(brands)) + ")"
            brand_params = brands
        else:
            brand_filter = "brand = 'AFAM'"
            brand_params = []

        query = f"""
            SELECT id, sku, name 
            FROM products 
            WHERE {brand_filter} AND (compatibility IS NULL OR compatibility = '[]')
            ORDER BY 
                CASE 
                    WHEN category2_id IN (501, 503, 504) THEN 1 
                    WHEN category2_id = 502 THEN 2
                    ELSE 3 
                END, 
                id
        """
        if args.limit:
            query += f" LIMIT {args.limit}"
        cur.execute(query, brand_params)

    products = cur.fetchall()
    total_products = len(products)
    cur.close()
    print(f"📋 Se encontraron {total_products} productos para procesar.", flush=True)

    if total_products == 0:
        print("✅ No hay productos pendientes de sincronizar.", flush=True)
        conn.close()
        sys.exit(0)

    print(f"🚀 Iniciando sincronización por lotes de {args.batch_size} productos con {args.workers} trabajadores...", flush=True)

    write_cur = conn.cursor()
    completed_products = 0

    with ThreadPoolExecutor(max_workers=args.workers) as executor:
        for b_idx in range(0, total_products, args.batch_size):
            batch = products[b_idx : b_idx + args.batch_size]
            print(f"\n📦 Procesando lote {b_idx // args.batch_size + 1} ({len(batch)} productos)...", flush=True)
            
            # 1. Obtener la página 0 y total_pages para todo el lote en paralelo
            future_to_sku = {}
            sku_data = {}
            for prod_id, sku, name in batch:
                sku_data[sku] = {
                    "prod_id": prod_id,
                    "name": name,
                    "total_pages": None,
                    "pages": {}
                }
                f = executor.submit(fetch_sku_page, sku, 0)
                future_to_sku[f] = (sku, 0)
            
            # Esperar a que terminen todas las páginas 0 del lote
            for f in as_completed(future_to_sku):
                sku, page = future_to_sku[f]
                try:
                    compat_list, total_pages = f.result()
                    sku_data[sku]["total_pages"] = total_pages
                    sku_data[sku]["pages"][0] = compat_list
                except Exception as exc:
                    print(f"⚠️ Error al obtener página 0 para SKU {sku}: {exc}", flush=True)
                    sku_data[sku]["total_pages"] = 0
            
            # 2. Encolar y descargar el resto de páginas en paralelo
            sub_futures = {}
            for sku, info in sku_data.items():
                tot = info["total_pages"]
                if tot > 1:
                    for p in range(1, tot):
                        f = executor.submit(fetch_sku_page, sku, p)
                        sub_futures[f] = (sku, p)
            
            # Si un producto de este lote no necesita más páginas, guardarlo ya
            for sku in list(sku_data.keys()):
                info = sku_data[sku]
                if info["total_pages"] <= 1:
                    try:
                        num_saved, num_pages = save_sku_compatibility(write_cur, info["prod_id"], sku, info["name"], info["pages"])
                        completed_products += 1
                        if num_saved > 0:
                            print(f"[{completed_products}/{total_products}] SKU {sku} - {info['name'][:30]}...: ✔️ {num_saved} vehículos guardados.", flush=True)
                        else:
                            print(f"[{completed_products}/{total_products}] SKU {sku} - {info['name'][:30]}...: ⚪ Sin vehículos (marcado vacío).", flush=True)
                    except Exception as exc:
                        print(f"❌ Error al guardar SKU {sku}: {exc}", flush=True)
                    del sku_data[sku]
            
            # 3. Procesar sub-páginas a medida que terminan
            if sub_futures:
                for f in as_completed(sub_futures):
                    sku, page = sub_futures[f]
                    try:
                        compat_list, _ = f.result()
                        if sku in sku_data:
                            sku_data[sku]["pages"][page] = compat_list
                            
                            # Comprobar si ya tenemos todas las páginas para este SKU
                            info = sku_data[sku]
                            if len(info["pages"]) == info["total_pages"]:
                                num_saved, num_pages = save_sku_compatibility(write_cur, info["prod_id"], sku, info["name"], info["pages"])
                                completed_products += 1
                                if num_saved > 0:
                                    print(f"[{completed_products}/{total_products}] SKU {sku} - {info['name'][:30]}...: ✔️ {num_saved} vehículos guardados (en {num_pages} páginas).", flush=True)
                                else:
                                    print(f"[{completed_products}/{total_products}] SKU {sku} - {info['name'][:30]}...: ⚪ Sin vehículos (marcado vacío).", flush=True)
                                del sku_data[sku]
                    except Exception as exc:
                        print(f"⚠️ Error al obtener página {page} para SKU {sku}: {exc}", flush=True)
                        # Si falla un sub-hilo, marcamos error y removemos el producto para evitar bloqueos
                        if sku in sku_data:
                            print(f"❌ Abortando SKU {sku} debido a fallo en la descarga de página {page}.", flush=True)
                            del sku_data[sku]

    write_cur.close()
    conn.close()
    print(f"\n🎉 Sincronización completada. Total procesados en esta ejecución: {completed_products}", flush=True)

if __name__ == "__main__":
    main()
