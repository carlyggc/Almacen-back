\c almacen

CREATE TABLE IF NOT EXISTS unidades (name TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS uq_uni_name ON unidades (lower(name));