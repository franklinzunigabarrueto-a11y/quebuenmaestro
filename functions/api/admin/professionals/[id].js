// PATCH /api/admin/professionals/:id  — approve o reject
export async function onRequestPatch({ env, request, params }) {
  if (!isAuthorized(request, env)) {
    return json({ error: 'No autorizado' }, 401);
  }

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'ID inválido' }, 400);

  let body;
  try { body = await request.json(); } catch { return json({ error: 'JSON inválido' }, 400); }

  const { action } = body;
  if (!['approve', 'reject'].includes(action)) {
    return json({ error: 'action debe ser "approve" o "reject"' }, 400);
  }

  const pro = await env.DB
    .prepare('SELECT nombre, email, fotos, avatar FROM professionals WHERE id = ?')
    .bind(id)
    .first();
  if (!pro) return json({ error: 'Profesional no encontrado' }, 404);

  let newFotos = JSON.parse(pro.fotos || '[]');

  if (action === 'approve') {
    // Mover fotos de pending/ → approved/{id}/
    const movedFotos = [];
    for (const key of newFotos) {
      if (key.startsWith('pending/')) {
        const filename = key.split('/').pop();
        const newKey   = `approved/${id}/${filename}`;
        try {
          const obj = await env.FOTOS.get(key);
          if (obj) {
            await env.FOTOS.put(newKey, obj.body, {
              httpMetadata: { contentType: obj.httpMetadata?.contentType || 'image/jpeg' },
            });
            await env.FOTOS.delete(key);
            movedFotos.push(newKey);
          }
        } catch {
          // Si falla mover una foto, continúa con las demás
        }
      } else {
        movedFotos.push(key);
      }
    }
    newFotos = movedFotos;

    // Mover avatar de pending/ → approved/{id}/
    let newAvatar = pro.avatar || null;
    if (newAvatar && newAvatar.startsWith('pending/')) {
      const filename = newAvatar.split('/').pop();
      const avatarKey = `approved/${id}/${filename}`;
      try {
        const obj = await env.FOTOS.get(newAvatar);
        if (obj) {
          await env.FOTOS.put(avatarKey, obj.body, {
            httpMetadata: { contentType: obj.httpMetadata?.contentType || 'image/jpeg' },
          });
          await env.FOTOS.delete(newAvatar);
          newAvatar = avatarKey;
        }
      } catch { /* no crítico */ }
    }

    await env.DB.prepare(
      `UPDATE professionals SET status = 'approved', approved_at = ?, fotos = ?, avatar = ? WHERE id = ?`
    ).bind(new Date().toISOString(), JSON.stringify(newFotos), newAvatar, id).run();

    await notifyProfessional(env, id, pro.nombre, pro.email);

  } else {
    // Rechazar: eliminar fotos y avatar pending/ de R2
    for (const key of newFotos) {
      if (key.startsWith('pending/')) {
        try { await env.FOTOS.delete(key); } catch { /* no crítico */ }
      }
    }
    if (pro.avatar && pro.avatar.startsWith('pending/')) {
      try { await env.FOTOS.delete(pro.avatar); } catch { /* no crítico */ }
    }

    await env.DB.prepare(
      `UPDATE professionals SET status = 'rejected', fotos = '[]' WHERE id = ?`
    ).bind(id).run();
  }

  return json({ success: true, id, status: action === 'approve' ? 'approved' : 'rejected' });
}

// GET /api/admin/professionals/:id — ver detalle completo
export async function onRequestGet({ env, request, params }) {
  if (!isAuthorized(request, env)) return json({ error: 'No autorizado' }, 401);

  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'ID inválido' }, 400);

  const pro = await env.DB.prepare('SELECT * FROM professionals WHERE id = ?').bind(id).first();
  if (!pro) return json({ error: 'No encontrado' }, 404);

  const fotos = JSON.parse(pro.fotos || '[]');

  return json({
    ...pro,
    ciudades:  JSON.parse(pro.ciudades  || '[]'),
    servicios: JSON.parse(pro.servicios || '[]'),
    horario:   JSON.parse(pro.horario   || '[]'),
    fotos,
    // URLs para previsualizar en el admin (requieren token en el header)
    fotos_preview: fotos.map(key => `/api/admin/photos/${key}`),
  });
}

async function notifyProfessional(env, id, nombre, email) {
  if (!env.RESEND_API_KEY) return;
  const baseUrl = env.PUBLIC_BASE_URL || 'https://quebuenmaestro.cl';
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Québuenmaestro! <noreply@quebuenmaestro.cl>',
        to: [email],
        subject: '¡Tu perfil ya está publicado en Québuenmaestro!',
        html: `
          <h2>¡Hola ${nombre}!</h2>
          <p>Tu perfil fue aprobado y ya está visible en el directorio de profesionales.</p>
          <p><a href="${baseUrl}/perfil.html?id=${id}">Ver mi perfil →</a></p>
          <p>El equipo de Québuenmaestro!</p>
        `,
      }),
    });
  } catch { /* no crítico */ }
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
