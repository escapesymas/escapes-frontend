-- =============================================================
-- Tabla de reviews/ratings — Escapes y Más
-- Ejecutar una sola vez en BD
-- =============================================================

CREATE TABLE IF NOT EXISTS reviews (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_email VARCHAR(255),
  username VARCHAR(100),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(200),
  content TEXT,
  verified_purchase BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_product_rating ON reviews(product_id, rating);

-- Vista para ratings agregados por producto (cache en query)
CREATE OR REPLACE VIEW product_rating_stats AS
SELECT
  product_id,
  COUNT(*) AS review_count,
  ROUND(AVG(rating)::numeric, 1) AS avg_rating,
  COUNT(*) FILTER (WHERE rating = 5) AS five_star,
  COUNT(*) FILTER (WHERE rating = 4) AS four_star,
  COUNT(*) FILTER (WHERE rating = 3) AS three_star,
  COUNT(*) FILTER (WHERE rating = 2) AS two_star,
  COUNT(*) FILTER (WHERE rating = 1) AS one_star
FROM reviews
GROUP BY product_id;
