

CREATE TABLE IF NOT EXISTS catalogo (
  name TEXT NOT NULL,
  unit TEXT, cat TEXT, type TEXT,
  price NUMERIC(12,2) DEFAULT 0,
  photo TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_cat_name ON catalogo (lower(name));