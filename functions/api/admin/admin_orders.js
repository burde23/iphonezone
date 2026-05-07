// functions/api/admin/orders.js
// GET    /api/admin/orders              → listado de órdenes (paginado)
// GET    /api/admin/orders?status=xxx   → filtrado por estado
// GET    /api/admin/orders?q=email      → búsqueda por email/nombre
// GET    /api/admin/orders?page=2       → paginación (20 por página)
// PATCH  /api/admin/orders              → actualizar status
// DELETE /api/admin/orders?id=X        → eliminar orden permanentemente
// ─────────────────────────────────────────────────

export async function onRequestGet({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  try {
    const url    = new URL(request.url);
    const status = url.searchParams.get('status');
    const q      = url.searchParams.get('q');
    const page   = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit  = 20;
    const offset = (page - 1) * limit;

    let where  = 'WHERE 1=1';
    const args = [];

    if (status && status !== 'all') {
      where += ' AND status = ?';
      args.push(status);
    }

    if (q) {
      where += ' AND (email LIKE ? OR nombre LIKE ? OR apellido LIKE ?)';
      const like = `%${q}%`;
      args.push(like, like, like);
    }

    const countResult = await env.DB
      .prepare(`SELECT COUNT(*) as total FROM orders ${where}`)
      .bind(...args)
      .first();
    const total = countResult?.total ?? 0;

    const { results } = await env.DB
      .prepare(
        `SELECT id, order_date, status, nombre, apellido, email,
                telefono, ciudad, provincia, subtotal, item_count
         FROM orders ${where}
         ORDER BY order_date DESC
         LIMIT ? OFFSET ?`
      )
      .bind(...args, limit, offset)
      .all();

    return json({
      ok:      true,
      orders:  results,
      total,
      page,
      pages:   Math.ceil(total / limit),
    });

  } catch (err) {
    console.error('[GET /api/admin/orders]', err);
    return json({ ok: false, error: err.message }, 500);
  }
}

// PATCH /api/admin/orders → actualizar status de una orden
export async function onRequestPatch({ request, env }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  try {
    const { id, status } = await request.json();
    const validStatuses = ['pendiente','pagado','enviado','cancelado'];

    if (!id || !validStatuses.includes(status)) {
      return json({ ok: false, error: 'Datos inválidos' }, 400);
    }

    await env.DB
      .prepare('UPDATE orders SET status = ? WHERE id = ?')
      .bind(status, id)
      .run();

    return json({ ok: true, message: `Orden #${id} actualizada a "${status}"` });

  } catch (err) {
    console.error('[PATCH /api/admin/orders]', err);
    return json({ ok: false, error: err.message }, 500);
  }
}

// DELETE /api/admin/orders?id=X → eliminar orden permanentemente
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

    const existing = await env.DB
      .prepare('SELECT id FROM orders WHERE id = ?')
      .bind(id)
      .first();

    if (!existing) {
      return json({ ok: false, error: 'Orden no encontrada' }, 404);
    }

    await env.DB
      .prepare('DELETE FROM orders WHERE id = ?')
      .bind(id)
      .run();

    return json({ ok: true, message: `Orden #${id} eliminada` });

  } catch (err) {
    console.error('[DELETE /api/admin/orders]', err);
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
  const auth = request.headers.get('x-admin-secret') || '';
  return auth === secret;
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin':  '*',
    'Access-Control-Allow-Methods': 'GET, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
