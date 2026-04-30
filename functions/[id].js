// functions/api/admin/orders/[id].js
// GET  /api/admin/orders/:id  → detalle completo de una orden
// ─────────────────────────────────────────────────

export async function onRequestGet({ request, env, params }) {
  if (!isAuthorized(request, env)) {
    return json({ ok: false, error: 'No autorizado' }, 401);
  }

  try {
    const id = parseInt(params.id);
    if (!id || isNaN(id)) {
      return json({ ok: false, error: 'ID inválido' }, 400);
    }

    const order = await env.DB
      .prepare('SELECT * FROM orders WHERE id = ?')
      .bind(id)
      .first();

    if (!order) {
      return json({ ok: false, error: 'Orden no encontrada' }, 404);
    }

    // Parsear items_json
    let items = [];
    try {
      items = JSON.parse(order.items_json || '[]');
    } catch {
      items = [];
    }

    return json({ ok: true, order: { ...order, items } });

  } catch (err) {
    console.error(`[GET /api/admin/orders/${params.id}]`, err);
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
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, x-admin-secret',
  };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  });
}
