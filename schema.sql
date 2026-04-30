-- ═══════════════════════════════════════════════
--  iPhone Zone · Cloudflare D1 Schema
--  Ejecutar: wrangler d1 execute iphonezone-db --file=schema.sql
-- ═══════════════════════════════════════════════

-- ── Tabla de productos ──────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  name        TEXT    NOT NULL,
  stor        TEXT    NOT NULL DEFAULT '',
  ars         INTEGER,                      -- null = "Consultá precio"
  usd         INTEGER,
  badge       TEXT    NOT NULL DEFAULT 'b-new',  -- b-new | b-sale | b-pop
  btxt        TEXT    NOT NULL DEFAULT 'Nuevo',
  stock_qty   INTEGER NOT NULL DEFAULT 0,
  low         INTEGER NOT NULL DEFAULT 0,   -- 0 = false, 1 = true (SQLite boolean)
  stock_label TEXT    NOT NULL DEFAULT 'En stock',
  color       TEXT    NOT NULL DEFAULT '#1d1d1f',
  cat         TEXT    NOT NULL DEFAULT 'accesorios', -- accesorios|cargadores|combos|equipos
  url         TEXT    NOT NULL DEFAULT '',
  img         TEXT,                          -- null = usar SVG placeholder
  active      INTEGER NOT NULL DEFAULT 1,   -- 1 = visible en tienda
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ── Tabla de órdenes ────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  order_date      TEXT    NOT NULL DEFAULT (datetime('now')),
  status          TEXT    NOT NULL DEFAULT 'pendiente', -- pendiente|pagado|enviado|cancelado

  -- Datos del cliente
  nombre          TEXT    NOT NULL,
  apellido        TEXT    NOT NULL,
  email           TEXT    NOT NULL,
  telefono        TEXT    NOT NULL,

  -- Datos de envío
  calle           TEXT    NOT NULL,
  cp              TEXT    NOT NULL,
  ciudad          TEXT    NOT NULL,
  provincia       TEXT    NOT NULL,
  notas           TEXT    NOT NULL DEFAULT '',

  -- Datos de la compra
  subtotal        INTEGER NOT NULL DEFAULT 0,  -- en ARS, sin decimales
  items_json      TEXT    NOT NULL,            -- JSON array de items
  item_count      INTEGER NOT NULL DEFAULT 0,  -- total de unidades

  -- MercadoPago (para integración futura)
  mp_preference_id TEXT,
  mp_payment_id    TEXT
);

-- ── Índices útiles ──────────────────────────────
CREATE INDEX IF NOT EXISTS idx_orders_date     ON orders(order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status   ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email    ON orders(email);
CREATE INDEX IF NOT EXISTS idx_products_cat    ON products(cat);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active);

-- ── Datos iniciales de productos ────────────────
INSERT INTO products (name, stor, ars, badge, btxt, stock_qty, low, stock_label, color, cat, url, img, active) VALUES
  ('Funda Silicona Negra', 'Compatible con todos los modelos',
   12999, 'b-sale', '19% OFF', 50, 0, 'En stock', '#1d1d1f', 'accesorios',
   'https://iphonezone2.mitiendanube.com/productos/funda-silicona-negra/',
   'https://dcdn-us.mitiendanube.com/stores/006/109/273/products/img_0497-bdf84a26d57a38edfa17458998822874-480-0.webp', 1),

  ('Funda MagSafe', 'Compatible iPhone 12 en adelante',
   12999, 'b-sale', '19% OFF', 30, 0, 'En stock', '#3a3a3c', 'accesorios',
   'https://iphonezone2.mitiendanube.com/productos/funda-magsafe/',
   'https://dcdn-us.mitiendanube.com/stores/006/109/273/products/img_0501-33c6527d103a1e01b917459473771123-480-0.webp', 1),

  ('Cabezal 20W tipo-C', 'Carga Rápida · USB-C',
   50500, 'b-sale', '8% OFF', 20, 0, 'En stock', '#e8e8e0', 'cargadores',
   'https://iphonezone2.mitiendanube.com/productos/cabezal-20w-tipo-c-carga-rapida/',
   'https://dcdn-us.mitiendanube.com/stores/006/109/273/products/img_0503-d70ab357eceba5203f17459479361582-480-0.webp', 1),

  ('MagSafe', 'Cargador inalámbrico 15W',
   27000, 'b-sale', '23% OFF', 15, 0, 'En stock', '#c5b99a', 'cargadores',
   'https://iphonezone2.mitiendanube.com/productos/magsafe/',
   'https://dcdn-us.mitiendanube.com/stores/006/109/273/products/img_0505-e0f73bb7346e34db2f17459482323192-480-0.webp', 1),

  ('Combo AirPods Pro + Battery Pack', 'Pack especial · Ahorrás más',
   69500, 'b-pop', 'Pack especial', 10, 0, 'En stock', '#4a7fa8', 'combos',
   'https://iphonezone2.mitiendanube.com/productos/combo-airpods-pro-battery-pack/',
   'https://dcdn-us.mitiendanube.com/stores/006/109/273/products/img_0499-6ae2875dfa1924b3dd17459482987626-480-0.webp', 1),

  ('Equipos Sellados', 'Nuevos · Originales · Con garantía',
   NULL, 'b-new', 'Nuevo', 0, 1, 'Consultá stock', '#d4c8b8', 'equipos',
   'https://iphonezone2.mitiendanube.com/equipos/equipos-sellados/', NULL, 1),

  ('Equipos Seminuevos', 'Revisados · Testeados · Garantía',
   NULL, 'b-pop', 'Seminuevo', 0, 1, 'Consultá stock', '#8e8e93', 'equipos',
   'https://iphonezone2.mitiendanube.com/equipos/equipos-seminuevos1/', NULL, 1);
