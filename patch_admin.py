import sys

with open('server/index.ts', 'r') as f:
    content = f.read()

# Buscamos donde empieza el case 'products-list' para insertar los nuevos actions
target = "case 'products-list': {"
insertion = """
      case 'get-attributes': {
        const attrsRes = await pool.query('SELECT * FROM product_attributes ORDER BY id ASC');
        const termsRes = await pool.query('SELECT * FROM product_attribute_terms ORDER BY id ASC');
        
        // Group terms by attribute_id
        const attributes = attrsRes.rows.map(a => {
          return {
            ...a,
            terms: termsRes.rows.filter(t => t.attribute_id === a.id)
          };
        });
        
        return res.json(attributes);
      }

      case 'add-attribute': {
        const { name } = req.body;
        if (!name) return res.status(400).json({ error: 'Nombre requerido' });
        const r = await pool.query('INSERT INTO product_attributes (name) VALUES ($1) RETURNING *', [name]);
        return res.json(r.rows[0]);
      }

      case 'add-attribute-term': {
        const { attribute_id, name } = req.body;
        if (!attribute_id || !name) return res.status(400).json({ error: 'Faltan datos' });
        const r = await pool.query('INSERT INTO product_attribute_terms (attribute_id, name) VALUES ($1, $2) RETURNING *', [attribute_id, name]);
        return res.json(r.rows[0]);
      }

      case 'get-product-variations': {
        const { product_id } = req.query;
        if (!product_id) return res.status(400).json({ error: 'Falta product_id' });
        
        const variationsRes = await pool.query('SELECT * FROM product_variations WHERE parent_product_id = $1', [product_id]);
        const variations = variationsRes.rows;
        
        if (variations.length > 0) {
          const varIds = variations.map(v => v.id);
          const varTermsRes = await pool.query(`
            SELECT pva.variation_id, pva.attribute_id, pva.term_id, pa.name as attribute_name, pat.name as term_name
            FROM product_variation_attributes pva
            JOIN product_attributes pa ON pva.attribute_id = pa.id
            JOIN product_attribute_terms pat ON pva.term_id = pat.id
            WHERE pva.variation_id = ANY($1)
          `, [varIds]);
          
          variations.forEach(v => {
            v.attributes = varTermsRes.rows.filter(t => t.variation_id === v.id);
          });
        }
        
        return res.json(variations);
      }

      case 'save-product-variations': {
        const { product_id, variations } = req.body;
        if (!product_id || !Array.isArray(variations)) return res.status(400).json({ error: 'Datos inválidos' });
        
        // Empezamos una transacción
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          // Por simplicidad, borramos todas las variaciones anteriores y las recreamos (o se podría hacer un UPSERT)
          await client.query('DELETE FROM product_variations WHERE parent_product_id = $1', [product_id]);
          
          for (const v of variations) {
            const resVar = await client.query(`
              INSERT INTO product_variations (parent_product_id, sku, price, stock_status, stock_quantity)
              VALUES ($1, $2, $3, $4, $5) RETURNING id
            `, [product_id, v.sku || null, v.price || 0, v.stock_status || 'instock', v.stock_quantity || 0]);
            
            const newVarId = resVar.rows[0].id;
            
            if (v.attributes && Array.isArray(v.attributes)) {
              for (const attr of v.attributes) {
                if (attr.attribute_id && attr.term_id) {
                  await client.query(`
                    INSERT INTO product_variation_attributes (variation_id, attribute_id, term_id)
                    VALUES ($1, $2, $3)
                  `, [newVarId, attr.attribute_id, attr.term_id]);
                }
              }
            }
          }
          await client.query('COMMIT');
          return res.json({ success: true });
        } catch (e) {
          await client.query('ROLLBACK');
          throw e;
        } finally {
          client.release();
        }
      }

      """

if target in content:
    content = content.replace(target, insertion + target)
    with open('server/index.ts', 'w') as f:
        f.write(content)
    print("Backend API patched with product variation actions.")
else:
    print("Target string not found.")

