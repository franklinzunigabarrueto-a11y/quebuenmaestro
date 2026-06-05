// GET  /api/admin/sponsors — lista todos los auspiciadores
// POST /api/admin/sponsors — crear auspiciador
export async function onRequestGet({ env, request }) {
  if (!isAuthorized(request, env)) return json({ error: 'No autorizado' }, 401);
  try {
    const { results } = await env.DB.prepare(
      `SELECT * FROM sponsors ORDER BY orden ASC, created_at ASC`
    ).all();
    return json({ sponsors: results });
  } catch {
    return json({ error: 'Error en la consulta' }, 500);
  }
}

export async function onRequestPost({ env, request }) {
  if (!isAuthorized(request, env)) return json({ error: 'No autorizado' }, 401);
  try {
    const body = await request.json();
    const { nombre, logo_url = '', website = '', descripcion = '', orden = 0 } = body;
    if (!nombre?.trim()) return json({ error: 'El nombre es obligatorio' }, 400);

    const result = await env.DB.prepare(
      `INSERT INTO sponsors (nombre, logo_url, website, descripcion, orden)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(nombre.trim(), logo_url.trim(), website.trim(), descripcion.trim(), orden).run();

    return json({ success: true, id: result.meta.last_row_id }, 201);
  } catch {
    return json({ error: 'Error al crear auspiciador' }, 500);
  }
}

function isAuthorized(request, env) {
  return (request.headers.get('Authorization') || '') === `Bearer ${env.ADMIN_TOKEN}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
