// PATCH  /api/admin/sponsors/:id — actualizar (activo, orden, datos)
// DELETE /api/admin/sponsors/:id — eliminar
export async function onRequestPatch({ env, request, params }) {
  if (!isAuthorized(request, env)) return json({ error: 'No autorizado' }, 401);
  const id = parseInt(params.id);
  if (!id) return json({ error: 'ID inválido' }, 400);

  try {
    const body = await request.json();
    const fields = [];
    const values = [];

    if (body.nombre    !== undefined) { fields.push('nombre = ?');      values.push(body.nombre.trim()); }
    if (body.logo_url  !== undefined) { fields.push('logo_url = ?');    values.push(body.logo_url.trim()); }
    if (body.website   !== undefined) { fields.push('website = ?');     values.push(body.website.trim()); }
    if (body.descripcion !== undefined) { fields.push('descripcion = ?'); values.push(body.descripcion.trim()); }
    if (body.activo    !== undefined) { fields.push('activo = ?');      values.push(body.activo ? 1 : 0); }
    if (body.orden     !== undefined) { fields.push('orden = ?');       values.push(parseInt(body.orden) || 0); }

    if (fields.length === 0) return json({ error: 'Nada que actualizar' }, 400);

    values.push(id);
    await env.DB.prepare(`UPDATE sponsors SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    return json({ success: true });
  } catch {
    return json({ error: 'Error al actualizar' }, 500);
  }
}

export async function onRequestDelete({ env, request, params }) {
  if (!isAuthorized(request, env)) return json({ error: 'No autorizado' }, 401);
  const id = parseInt(params.id);
  if (!id) return json({ error: 'ID inválido' }, 400);

  try {
    await env.DB.prepare('DELETE FROM sponsors WHERE id = ?').bind(id).run();
    return json({ success: true });
  } catch {
    return json({ error: 'Error al eliminar' }, 500);
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
