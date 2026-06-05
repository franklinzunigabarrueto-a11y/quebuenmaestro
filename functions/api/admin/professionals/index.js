// GET /api/admin/professionals?status=pending  — lista todos para el panel admin
export async function onRequestGet({ env, request }) {
  if (!isAuthorized(request, env)) {
    return json({ error: 'No autorizado' }, 401);
  }

  const url    = new URL(request.url);
  const status = url.searchParams.get('status') || 'pending';

  const allowed = ['pending', 'approved', 'rejected', 'all'];
  if (!allowed.includes(status)) return json({ error: 'Status inválido' }, 400);

  const query = status === 'all'
    ? `SELECT id, tipo, nombre, email, whatsapp, especialidad, ciudades, status, created_at
       FROM professionals ORDER BY created_at DESC`
    : `SELECT id, tipo, nombre, email, whatsapp, especialidad, ciudades, status, created_at
       FROM professionals WHERE status = ? ORDER BY created_at DESC`;

  try {
    const stmt    = status === 'all' ? env.DB.prepare(query) : env.DB.prepare(query).bind(status);
    const { results } = await stmt.all();
    return json({ professionals: results });
  } catch (err) {
    return json({ error: 'Error en la consulta' }, 500);
  }
}

function isAuthorized(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_TOKEN}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
