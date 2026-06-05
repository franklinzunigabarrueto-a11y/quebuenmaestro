// GET  /api/review/:token — valida el token y devuelve datos del profesional
// POST /api/review/:token — guarda la reseña y marca el token como usado
export async function onRequestGet({ env, params }) {
  const result = await validateToken(env, params.token);
  if (result.error) return json(result, result.status || 400);

  const { token, pro } = result;
  return json({
    valid: true,
    professional: {
      id:          pro.id,
      nombre:      pro.nombre,
      especialidad: pro.especialidad,
      avatar:      pro.avatar ? `/api/photos/${pro.avatar}` : null,
    },
    expires_at: token.expires_at,
  });
}

export async function onRequestPost({ env, params, request }) {
  const result = await validateToken(env, params.token);
  if (result.error) return json(result, result.status || 400);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400); }

  const rating = parseInt(body.rating, 10);
  if (isNaN(rating) || rating < 1 || rating > 5) {
    return json({ error: 'Rating debe ser entre 1 y 5' }, 400);
  }

  const reviewerName = (body.reviewer_name || '').trim().slice(0, 80);
  if (!reviewerName) return json({ error: 'Tu nombre es obligatorio' }, 400);

  const comment = (body.comment || '').replace(/<[^>]*>/g, '').trim().slice(0, 500);

  const { token, pro } = result;

  try {
    await env.DB.prepare(
      `INSERT INTO reviews (professional_id, token_id, rating, comment, reviewer_name)
       VALUES (?, ?, ?, ?, ?)`
    ).bind(pro.id, token.id, rating, comment || null, reviewerName).run();

    await env.DB.prepare(
      `UPDATE review_tokens SET status = 'used', used_at = datetime('now') WHERE id = ?`
    ).bind(token.id).run();

    return json({ success: true, professional: pro.nombre });
  } catch {
    return json({ error: 'Error al guardar la reseña' }, 500);
  }
}

async function validateToken(env, tokenStr) {
  if (!tokenStr || tokenStr.length < 10) {
    return { error: 'Token inválido', status: 400 };
  }

  const token = await env.DB
    .prepare(`SELECT * FROM review_tokens WHERE token = ?`)
    .bind(tokenStr).first();

  if (!token) return { error: 'Link inválido o expirado', status: 404 };
  if (token.status === 'used') return { error: 'Este link ya fue utilizado', status: 410 };
  if (token.status === 'expired' || new Date(token.expires_at) < new Date()) {
    return { error: 'Este link ha expirado', status: 410 };
  }

  const pro = await env.DB
    .prepare(`SELECT id, nombre, especialidad, avatar FROM professionals WHERE id = ? AND status = 'approved'`)
    .bind(token.professional_id).first();

  if (!pro) return { error: 'Profesional no disponible', status: 404 };

  return { token, pro };
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status, headers: { 'Content-Type': 'application/json' },
  });
}
