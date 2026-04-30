// functions/api/products.js
// GET /api/products          → todos los productos activos
// GET /api/products?cat=xxx  → filtrado por categoría
// ─────────────────────────────────────────────────

export async function onRequestGet({ request, env }) {
  try {
    const url    = new URL(request.url);
    const cat    = url.searchParams.get('cat');   // filtro opcional

    let query  = 'SELECT * FROM products WHERE active = 1';
    const args = [];

    if (cat && cat !== 'all') {
      query += ' AND cat = ?';
      args.push(cat);
    }

    query += ' ORDER BY id ASC';

    const { results } = await env.DB.prepare(query).bind(...args).all();

    // Normalizar booleans (SQLite devuelve 0/1)
    const products = results.map(p => ({
      ...p,
      low:    p.low    === 1,
      active: p.active === 1,
      ars:    p.ars    ?? null,
      usd:    p.usd    ?? null,
      img:    p.img    ?? null,
    }));

    return json({ ok: true, products });

  } catch (err) {
    console.error('[GET /api/products]', err);
    return json({ ok: false, error: err.message }, 500);
  }
}

// ── helper ───────────────────────────────────────
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
