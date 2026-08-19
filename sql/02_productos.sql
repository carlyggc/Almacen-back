\c almacen

CREATE TABLE IF NOT EXISTS productos (
  id TEXT PRIMARY KEY,
  deposit TEXT NOT NULL,
  name TEXT NOT NULL,
  cat TEXT, category TEXT, unit TEXT,
  qty INTEGER DEFAULT 0,
  required INTEGER DEFAULT 0,
  price NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'Bs',
  faltante BOOLEAN DEFAULT FALSE,
  photo TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_prod_dep_name ON productos (deposit, lower(name));