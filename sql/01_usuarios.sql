
CREATE TABLE IF NOT EXISTS usuarios (
  id SERIAL PRIMARY KEY,
  usuario TEXT UNIQUE NOT NULL,
  clave TEXT NOT NULL,
  nombre TEXT NOT NULL,
  rol TEXT NOT NULL DEFAULT 'admin'
);

INSERT INTO usuarios (usuario, clave, nombre, rol)
VALUES ('admin', 'almacen2026', 'Carly', 'admin')
ON CONFLICT (usuario) DO NOTHING;