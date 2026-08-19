\c almacen

CREATE TABLE IF NOT EXISTS personas (name TEXT NOT NULL);
CREATE UNIQUE INDEX IF NOT EXISTS uq_per_name ON personas (lower(name));