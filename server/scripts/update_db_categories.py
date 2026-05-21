#!/usr/bin/env python3
import os
import psycopg2

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://postgres:EscapesPostgres2026Vercel@localhost:5432/escapes_db"
)

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
    # General Casco Integral (801) is run last, excluding the others
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

def main():
    print(f"Connecting to database...")
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False
    cur = conn.cursor()

    try:
        total_updated = 0
        for sub_id, parent_id, clause in category_rules:
            # We target products with the parent_id to map them to the sub_id
            clause_escaped = clause.replace('%', '%%')
            sql = f"UPDATE products SET category_id = %s, updated_at = NOW() WHERE category_id = %s AND {clause_escaped}"
            cur.execute(sql, (sub_id, parent_id))
            rows_updated = cur.rowcount
            total_updated += rows_updated
            print(f"Subcategory {sub_id} (parent {parent_id}): updated {rows_updated} products")

        conn.commit()
        print(f"\nMigration successfully completed! Total products re-categorized: {total_updated}")
    except Exception as e:
        conn.rollback()
        print(f"Error during migration: {e}")
        raise e
    finally:
        cur.close()
        conn.close()

if __name__ == "__main__":
    main()
