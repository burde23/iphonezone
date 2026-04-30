// functions/api/admin/products.js
// GET    /api/admin/products          → todos los productos (activos e inactivos)
// POST   /api/admin/products          → crear producto
// PUT    /api/admin/products          → actualizar producto (requiere id en body)
// DELETE /api/admin/products?id=xxx   → eliminar producto
// ─────────────────────────────────────────────────

// ── GET ───────────────────────────────────────────
export async function onRequestGet({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  try {
    const { results } = await env.DB
      .prepare('SELECT * FROM products ORDER BY id ASC')
      .all();

    const products = results.map(p => ({
      ...p,
      low:    p.low    === 1,
      active: p.active === 1,
    }));

    return json({ ok: true, products });

  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

// ── POST (crear) ──────────────────────────────────
export async function onRequestPost({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  try {
    const b = await request.json();

    // Campos requeridos
    if (!b.name || !b.cat) {
      return json({ ok: false, error: 'name y cat son requeridos' }, 400);
    }

    const result = await env.DB.prepare(`
      INSERT INTO products
        (name, stor, ars, usd, badge, btxt, stock_qty, low, stock_label, color, cat, url, img, active)
      VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      b.name.trim(),
      (b.stor  || '').trim(),
      b.ars    ? parseInt(b.ars)   : null,
      b.usd    ? parseInt(b.usd)   : null,
      b.badge  || 'b-new',
      (b.btxt  || 'Nuevo').trim(),
      parseInt(b.stock_qty || 0),
      b.low    ? 1 : 0,
      (b.stock_label || 'En stock').trim(),
      (b.color || '#1d1d1f').trim(),
      b.cat.trim(),
      (b.url   || '').trim(),
      b.img    ? b.img.trim() : null,
      b.active === false ? 0 : 1,
    ).run();

    return json({ ok: true, id: result.meta?.last_row_id, message: 'Producto creado' }, 201);

  } catch (err) {
    console.error('[POST /api/admin/products]', err);
    return json({ ok: false, error: err.message }, 500);
  }
}

// ── PUT (actualizar) ──────────────────────────────
export async function onRequestPut({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  try {
    const b = await request.json();

    if (!b.id) {
      return json({ ok: false, error: 'id requerido' }, 400);
    }

    await env.DB.prepare(`
      UPDATE products SET
        name        = ?,
        stor        = ?,
        ars         = ?,
        usd         = ?,
        badge       = ?,
        btxt        = ?,
        stock_qty   = ?,
        low         = ?,
        stock_label = ?,
        color       = ?,
        cat         = ?,
        url         = ?,
        img         = ?,
        active      = ?,
        updated_at  = datetime('now')
      WHERE id = ?
    `).bind(
      b.name.trim(),
      (b.stor  || '').trim(),
      b.ars    ? parseInt(b.ars)   : null,
      b.usd    ? parseInt(b.usd)   : null,
      b.badge  || 'b-new',
      (b.btxt  || 'Nuevo').trim(),
      parseInt(b.stock_qty || 0),
      b.low    ? 1 : 0,
      (b.stock_label || 'En stock').trim(),
      (b.color || '#1d1d1f').trim(),
      b.cat.trim(),
      (b.url   || '').trim(),
      b.img    ? b.img.trim() : null,
      b.active === false ? 0 : 1,
      b.id,
    ).run();

    return json({ ok: true, message: `Producto #${b.id} actualizado` });

  } catch (err) {
    console.error('[PUT /api/admin/products]', err);
    return json({ ok: false, error: err.message }, 500);
  }
}

// ── DELETE ────────────────────────────────────────
export async function onRequestDelete({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  try {
    const url = new URL(request.url);
    const id  = parseInt(url.searchParams.get('id'));

    if (!id || isNaN(id)) {
      return json({ ok: false, error: 'ID inválido' }, 400);
    }

    // Soft-delete: marcar como inactivo en vez de borrar
    await env.DB
      .prepare('UPDATE products SET active = 0, updated_at = datetime(\'now\') WHERE id = ?')
      .bind(id)
      .run();

    return json({ ok: true, message: `Producto #${id} desactivado` });

  } catch (err) {
    console.error('[DELETE /api/admin/products]', err);
    return json({ ok: false, error: err.message }, 500);
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

// ── helpers ───────────────────────────────────────
function isAuthorized(request, env) {
  const secret = env.ADMIN_SECRET;
  if (!secret) return false;
  return request.headers.get('x-admin-secret') === secret;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
