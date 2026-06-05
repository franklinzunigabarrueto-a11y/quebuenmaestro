// POST /api/admin/tokens — genera un token de calificación para un profesional
export async function onRequestPost({ env, request }) {
  if (!isAuthorized(request, env)) return json({ error: 'No autorizado' }, 401);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400); }

  const { professional_id } = body;
  if (!professional_id) return json({ error: 'professional_id requerido' }, 400);

  const pro = await env.DB
    .prepare(`SELECT id, nombre FROM professionals WHERE id = ? AND status = 'approved'`)
    .bind(professional_id)
    .first();
  if (!pro) return json({ error: 'Profesional no encontrado o no aprobado' }, 404);

  // Token aleatorio de 32 bytes hex
  const tokenBytes = new Uint8Array(32);
  crypto.getRandomValues(tokenBytes);
  const token     = Array.from(tokenBytes, b => b.toString(16).padStart(2, '0')).join('');
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await env.DB.prepare(
    `INSERT INTO review_tokens (professional_id, token, expires_at) VALUES (?, ?, ?)`
  ).bind(professional_id, token, expiresAt).run();

  const baseUrl = env.PUBLIC_BASE_URL || 'https://quebuenmaestro.cl';
  return json({
    token,
    url:        `${baseUrl}/calificar.html?token=${token}`,
    expires_at: expiresAt,
    professional: pro.nombre,
  });
}

// GET /api/admin/tokens?professional_id=X — lista tokens de un profesional
export async function onRequestGet({ env, request }) {
  if (!isAuthorized(request, env)) return json({ error: 'No autorizado' }, 401);

  const url  = new URL(request.url);
  const pid  = parseInt(url.searchParams.get('professional_id'), 10);
  if (isNaN(pid)) return json({ error: 'professional_id inválido' }, 400);

  const { results } = await env.DB
    .prepare(`SELECT id, token, status, created_at, expires_at, used_at
              FROM review_tokens WHERE professional_id = ? ORDER BY created_at DESC`)
    .bind(pid).all();

  return json({ tokens: results });
}

function isAuthorized(request, env) {
  return (request.headers.get('Authorization') || '') === `Bearer ${env.ADMIN_TOKEN}`;
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
