#!/usr/bin/env python3
import os
import sys
import json
import urllib.parse
import psycopg2
import requests
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed

DB_URL = "postgresql://postgres:EscapesPostgres2026Vercel@127.0.0.1:5432/escapes_db"
UPLOADS_DIR = "/var/www/vhosts/backendescapes.com/server/uploads"
OPTIMIZED_DIR = os.path.join(UPLOADS_DIR, "optimized")

# Crear carpeta de optimización si no existe
os.makedirs(OPTIMIZED_DIR, exist_ok=True)

def process_product(product):
    prod_id, sku, name, images_str = product
    
    try:
        images_list = json.loads(images_str)
    except Exception:
        return False, "json_parse_error"

    if not isinstance(images_list, list) or len(images_list) == 0 or 'src' not in images_list[0]:
        return False, "invalid_image_list"

    external_url = images_list[0]['src'].strip()

    # Validar que sea un link http/https y no un zip
    if not external_url.startswith('http') or '.zip' in external_url.lower():
        # Registrar como placeholder para evitar re-análisis
        placeholder_json = json.dumps([{
            "src": "https://placehold.co/800x800/18181b/f97316?text=ESCAPES+Y+MAS",
            "srcMobile": "https://placehold.co/400x400/18181b/f97316?text=ESCAPES+Y+MAS",
            "alt": name
        }])
        update_product_db(prod_id, placeholder_json)
        return True, "skipped_zip_placeholder"

    temp_path = os.path.join(OPTIMIZED_DIR, f"temp_{sku}")
    desktop_filename = f"{sku}-desktop.webp"
    mobile_filename = f"{sku}-mobile.webp"
    dest_desktop = os.path.join(OPTIMIZED_DIR, desktop_filename)
    dest_mobile = os.path.join(OPTIMIZED_DIR, mobile_filename)

    try:
        # A. Descargar imagen original
        response = requests.get(external_url, timeout=10)
        if response.status_code != 200:
            raise Exception(f"Failed download status: {response.status_code}")
            
        with open(temp_path, "wb") as f:
            f.write(response.content)

        # B. Optimizar con Pillow (Desktop & Mobile)
        with Image.open(temp_path) as img:
            # Convertir a RGB en caso de RGBA (transparencias) para guardar en WebP correctamente
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")

            # 1. Desktop version (max width 800px)
            img_desktop = img.copy()
            if img_desktop.width > 800:
                h_size = int((float(img_desktop.height) * float(800 / float(img_desktop.width))))
                img_desktop = img_desktop.resize((800, h_size), Image.Resampling.LANCZOS)
            img_desktop.save(dest_desktop, "WEBP", quality=80)

            # 2. Mobile version (max width 400px)
            img_mobile = img.copy()
            if img_mobile.width > 400:
                h_size = int((float(img_mobile.height) * float(400 / float(img_mobile.width))))
                img_mobile = img_mobile.resize((400, h_size), Image.Resampling.LANCZOS)
            img_mobile.save(dest_mobile, "WEBP", quality=75)

        # C. BORRAR la imagen original descargada de forma inmediata una vez optimizada
        if os.path.exists(temp_path):
            os.remove(temp_path)

        # D. Guardar en base de datos apuntando a las nuevas URLs locales optimizadas
        optimized_json = json.dumps([{
            "src": f"https://backendescapes.com/uploads/optimized/{desktop_filename}",
            "srcMobile": f"https://backendescapes.com/uploads/optimized/{mobile_filename}",
            "alt": name
        }])
        
        update_product_db(prod_id, optimized_json)
        return True, "success"

    except Exception as e:
        # Si hubo algún error o formato no compatible, limpiar temp y asignar fallback
        if os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                pass

        fallback_json = json.dumps([{
            "src": "https://placehold.co/800x800/18181b/f97316?text=ESCAPES+Y+MAS",
            "srcMobile": "https://placehold.co/400x400/18181b/f97316?text=ESCAPES+Y+MAS",
            "alt": name
        }])
        update_product_db(prod_id, fallback_json)
        return False, str(e)

def update_product_db(prod_id, images_json):
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE products SET images = %s, updated_at = NOW() WHERE id = %s",
            (images_json, prod_id)
        )
        conn.commit()
    except Exception as e:
        conn.rollback()
        print(f"Error updating DB for id {prod_id}: {e}")
    finally:
        cur.close()
        conn.close()

def main():
    print("🐍 INICIANDO MOTOR PYTHON DE DESCARGA Y OPTIMIZACIÓN DE IMÁGENES...")
    
    # 1. Obtener productos pendientes de optimizar
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    cur.execute("""
        SELECT id, sku, name, images 
        FROM products 
        WHERE (images LIKE '%api.mybihr.com%' 
           OR images LIKE '%static.bihr.pro%')
           AND images NOT LIKE '%optimized%'
        ORDER BY id ASC
    """)
    products = cur.fetchall()
    cur.close()
    conn.close()

    total_count = len(products)
    print(f"🎯 Encontrados {total_count} productos con imágenes pendientes.")

    if total_count == 0:
        print("✅ Todo el catálogo está completamente optimizado en WebP.")
        return

    # 2. Ejecutar optimización con concurrencia mediante ThreadPoolExecutor
    CONCURRENCY = 10
    completed = 0
    skipped = 0
    failed = 0

    print(f"🚀 Iniciando procesamiento con {CONCURRENCY} hilos en paralelo...")
    
    with ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = {executor.submit(process_product, prod): prod for prod in products}
        
        for future in as_completed(futures):
            success, status = future.result()
            if success:
                if status == "success":
                    completed += 1
                else:
                    skipped += 1
            else:
                failed += 1

            total_processed = completed + skipped + failed
            if total_processed % 100 == 0 or total_processed == total_count:
                print(f"📈 Progreso: {total_processed}/{total_count} procesados (Optimizados: {completed}, Omitidos: {skipped}, Fallidos: {failed})")

    print("\n🎉 PROCESO DE OPTIMIZACIÓN EN PYTHON FINALIZADO 🎉")
    print(f"✅ Exitosamente optimizados (WebP Desktop/Mobile): {completed}")
    print(f"🚫 Omitidos/Placeholders asignados: {skipped}")
    print(f"❌ Fallidos (con fallback aplicado): {failed}")
    print("🧹 Todas las imágenes originales temporales fueron completamente borradas.")

if __name__ == "__main__":
    main()
