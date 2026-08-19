const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:carla123@localhost:5432/almacen',
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

const prodOut = r => ({ id: r.id, deposit: r.deposit, name: r.name, cat: r.cat, category: r.category, unit: r.unit, qty: r.qty, required: r.required, price: parseFloat(r.price) || 0, currency: r.currency, faltante: r.faltante, photo: r.photo, createdAt: r.created_at });
const catOut = r => ({ name: r.name, unit: r.unit, cat: r.cat, type: r.type, price: parseFloat(r.price) || 0, photo: r.photo });

app.get('/', (req, res) => res.send('✅ API del almacén funcionando'));

// ── LOGIN ──
app.post('/api/login', async (req, res) => {
  const { user, pass } = req.body || {};
  const r = await pool.query('SELECT nombre, rol FROM usuarios WHERE usuario=$1 AND clave=$2', [user || '', pass || '']);
  if (r.rows.length) return res.json(r.rows[0]);
  res.status(401).json({ error: 'credenciales' });
});

// ── PRODUCTOS ──
// ✅ INSERT SIMPLE: cada carga es un LOTE NUEVO con su fecha (historial de entradas)
app.post('/api/productos', async (req, res) => {
  const p = req.body || {};
  const r = await pool.query(
    `INSERT INTO productos (id, deposit, name, cat, category, unit, qty, required, price, currency, faltante, photo, created_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [p.id, p.deposit, p.name, p.cat || null, p.category || null, p.unit || null, p.qty || 0, p.required || 0, p.price || 0, p.currency || 'Bs', !!p.faltante, p.photo || null, p.createdAt || new Date().toISOString()]);
  res.json(r.rows[0]);
});
app.get('/api/productos', async (req, res) => {
  const r = await pool.query('SELECT * FROM productos ORDER BY created_at DESC');
  res.json(r.rows.map(prodOut));
});
app.put('/api/productos/:id', async (req, res) => {
  const campos = ['deposit', 'name', 'cat', 'category', 'unit', 'qty', 'required', 'price', 'currency', 'faltante', 'photo'].filter(k => k in (req.body || {}));
  if (!campos.length) return res.json({ ok: true });
  const sets = campos.map((k, i) => `"${k}"=$${i + 1}`).join(', ');
  const vals = campos.map(k => req.body[k]);
  vals.push(req.params.id);
  const r = await pool.query(`UPDATE productos SET ${sets} WHERE id=$${campos.length + 1} RETURNING *`, vals);
  if (!r.rows.length) return res.status(404).json({ error: 'no existe' });
  res.json(prodOut(r.rows[0]));
});
app.delete('/api/productos/:id', async (req, res) => {
  await pool.query('DELETE FROM productos WHERE id=$1', [req.params.id]);
  res.json({ ok: true });
});

// ── CATÁLOGO ──
app.post('/api/catalogo', async (req, res) => {
  const c = req.body || {};
  const r = await pool.query(
    `INSERT INTO catalogo (name, unit, cat, type, price, photo) VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT (lower(name)) DO UPDATE SET
       unit = COALESCE(EXCLUDED.unit, catalogo.unit),
       cat = COALESCE(EXCLUDED.cat, catalogo.cat),
       type = COALESCE(EXCLUDED.type, catalogo.type),
       price = CASE WHEN EXCLUDED.price > 0 THEN EXCLUDED.price ELSE catalogo.price END,
       photo = COALESCE(EXCLUDED.photo, catalogo.photo)
     RETURNING *`,
    [c.name, c.unit || null, c.cat || null, c.type || null, c.price || 0, c.photo || null]);
  res.json(catOut(r.rows[0]));
});
app.get('/api/catalogo', async (req, res) => {
  const r = await pool.query('SELECT * FROM catalogo ORDER BY name');
  res.json(r.rows.map(catOut));
});

// ── UNIDADES ──
app.get('/api/unidades', async (req, res) => {
  const r = await pool.query('SELECT name FROM unidades ORDER BY name');
  res.json(r.rows.map(x => x.name));
});
app.post('/api/unidades', async (req, res) => {
  const n = String((req.body || {}).name || '').trim();
  if (n) await pool.query('INSERT INTO unidades (name) VALUES ($1) ON CONFLICT (lower(name)) DO NOTHING', [n]);
  res.json({ ok: true });
});

// ── PERSONAS ──
app.get('/api/personas', async (req, res) => {
  const r = await pool.query('SELECT name FROM personas ORDER BY name');
  res.json(r.rows.map(x => x.name));
});
app.post('/api/personas', async (req, res) => {
  const n = String((req.body || {}).name || '').trim();
  if (n) await pool.query('INSERT INTO personas (name) VALUES ($1) ON CONFLICT (lower(name)) DO NOTHING', [n]);
  res.json({ ok: true });
});
app.post('/api/personas/importar', async (req, res) => {
  const names = (req.body || {}).names || [];
  for (const n of names) await pool.query('INSERT INTO personas (name) VALUES ($1) ON CONFLICT (lower(name)) DO NOTHING', [String(n)]);
  res.json({ ok: true, total: names.length });
});

// ── SALIDAS ──
app.get('/api/salidas', async (req, res) => {
  const r = await pool.query('SELECT id, created_at AS "createdAt", name, cat, unit, qty, deposit, serial, recipient, destination FROM salidas ORDER BY created_at DESC');
  res.json(r.rows);
});
app.post('/api/salidas', async (req, res) => {
  const s = req.body || {};
  await pool.query('INSERT INTO salidas (id, created_at, name, cat, unit, qty, deposit, serial, recipient, destination) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
    [s.id, s.createdAt || new Date().toISOString(), s.name || null, s.cat || null, s.unit || null, s.qty || 0, s.deposit || null, s.serial || null, s.recipient || null, s.destination || null]);
  res.json({ ok: true });
});

// ── CATEGORÍAS (color dinámico) ──
const CAT_PALETTE = ['#E53935','#1E88E5','#8E24AA','#43A047','#FB8C00','#D81B60','#6D4C41','#3949AB','#7CB342','#F4511E','#5E35B1','#00695C','#AD1457','#283593','#558B2F','#F9A825','#4E342E','#546E7A'];
app.get('/api/categorias', async (req, res) => {
  const r = await pool.query('SELECT name, color FROM categorias ORDER BY name');
  res.json(r.rows);
});
app.post('/api/categorias', async (req, res) => {
  const { name, color } = req.body || {};
  const n = String(name || '').trim();
  if (!n) return res.json({ ok: true });
  const ex = await pool.query('SELECT name, color FROM categorias WHERE lower(name)=$1', [n.toLowerCase()]);
  if (ex.rows.length) return res.json(ex.rows[0]);
  let c = color;
  if (!c) {
    const all = await pool.query('SELECT color FROM categorias');
    const used = new Set(all.rows.map(x => x.color));
    c = CAT_PALETTE.find(x => !used.has(x)) || '#546E7A';
  }
  const ins = await pool.query('INSERT INTO categorias (name, color) VALUES ($1,$2) ON CONFLICT (lower(name)) DO NOTHING RETURNING *', [n, c]);
  res.json(ins.rows[0] || { name: n, color: c });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('✅ API en http://localhost:' + PORT));