
CREATE TABLE IF NOT EXISTS salidas (
  id TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT, cat TEXT, unit TEXT,
  qty INTEGER, deposit TEXT,
  serial TEXT, recipient TEXT, destination TEXT
);