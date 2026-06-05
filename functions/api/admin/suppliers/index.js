// GET  /api/admin/suppliers — todos los proveedores
// PATCH/DELETE manejados en [id].js
export async function onRequestGet({ env, request }) {
  if (!isAuth(request, env)) return json({ error: 'No autorizado' }, 401);
  try {
    const url    = new URL(request.url);
    const status = url.searchParams.get('status') || 'all';
    const query  = status === 'all'
      ? `SELECT * FROM suppliers ORDER BY created_at DESC`
      : `SELECT * FROM suppliers WHERE status = ? ORDER BY created_at DESC`;
    const stmt   = status === 'all' ? env.DB.prepare(query) : env.DB.prepare(query).bind(status);
    const { results } = await stmt.all();
    return json({ suppliers: results });
  } catch { return json({ error: 'Error en consulta' }, 500); }
}

function isAuth(req, env) {
  return (req.headers.get('Authorization') || '') === `Bearer ${env.ADMIN_TOKEN}`;
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
