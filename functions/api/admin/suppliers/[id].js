// PATCH /api/admin/suppliers/:id — aprobar o rechazar
// DELETE /api/admin/suppliers/:id — eliminar
export async function onRequestPatch({ env, request, params }) {
  if (!isAuth(request, env)) return json({ error: 'No autorizado' }, 401);
  const id   = parseInt(params.id);
  const body = await request.json();
  const { action } = body;
  if (!['approve','reject'].includes(action)) return json({ error: 'Acción inválida' }, 400);
  try {
    await env.DB.prepare(`UPDATE suppliers SET status = ? WHERE id = ?`)
      .bind(action === 'approve' ? 'approved' : 'rejected', id).run();
    return json({ success: true });
  } catch { return json({ error: 'Error al actualizar' }, 500); }
}

export async function onRequestDelete({ env, request, params }) {
  if (!isAuth(request, env)) return json({ error: 'No autorizado' }, 401);
  try {
    await env.DB.prepare('DELETE FROM suppliers WHERE id = ?').bind(parseInt(params.id)).run();
    return json({ success: true });
  } catch { return json({ error: 'Error al eliminar' }, 500); }
}

function isAuth(req, env) {
  return (req.headers.get('Authorization') || '') === `Bearer ${env.ADMIN_TOKEN}`;
}
function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
