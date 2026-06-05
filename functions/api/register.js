const LOWERCASE_ES = new Set([
  'el','la','los','las','un','una','unos','unas',
  'de','del','en','con','por','para','a','al','ante','bajo','entre','hacia','hasta','sin','sobre','tras',
  'y','e','o','u','ni','que',
]);

function toTitleCase(str) {
  if (!str) return str;
  return str.trim().toLowerCase().split(/\s+/).map((word, i) => {
    if (i > 0 && LOWERCASE_ES.has(word)) return word;
    return word.charAt(0).toUpperCase() + word.slice(1);
  }).join(' ');
}

// Elimina tags HTML y limita longitud para prevenir XSS almacenado
function sanitizeText(str, maxLen = 1000) {
  if (!str) return str;
  return str.replace(/<[^>]*>/g, '').replace(/[<>]/g, '').trim().slice(0, maxLen);
}

// Valida que una URL sea http/https — rechaza javascript: y similares
function safeUrl(url) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  return trimmed.slice(0, 300);
}

// POST /api/register — guarda el perfil en D1 y notifica por email
export async function onRequestPost({ env, request }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  // Validación de campos obligatorios
  const required = ['tipo', 'nombre', 'años', 'whatsapp', 'email', 'ciudades', 'especialidad', 'descripcion'];
  for (const field of required) {
    if (!body[field] || (Array.isArray(body[field]) && body[field].length === 0)) {
      return json({ error: `Campo requerido: ${field}` }, 400);
    }
  }

  // Validar email básico
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return json({ error: 'Email inválido' }, 400);
  }

  // Validar años de experiencia
  const años = parseInt(body.años, 10);
  if (isNaN(años) || años < 1 || años > 60) {
    return json({ error: 'Años de experiencia inválido' }, 400);
  }

  try {
    const result = await env.DB.prepare(`
      INSERT INTO professionals
        (tipo, nombre, representante, rut, años, whatsapp, email, telefono, web,
         instagram, facebook, ciudades, viaja, otra_ciudad, especialidad,
         servicios, certificaciones, descripcion, horario, horario_detalle, fotos, avatar)
      VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `).bind(
      body.tipo,
      toTitleCase(sanitizeText(body.nombre, 120)),
      body.representante ? toTitleCase(sanitizeText(body.representante, 120)) : null,
      body.rut             || null,
      años,
      body.whatsapp.trim().replace(/\D/g, '').slice(0, 8),
      body.email.trim().toLowerCase().slice(0, 200),
      sanitizeText(body.telefono, 20)    || null,
      safeUrl(body.web)                  || null,
      sanitizeText(body.instagram, 60)?.replace(/^@/, '') || null,
      sanitizeText(body.facebook, 120)   || null,
      JSON.stringify((Array.isArray(body.ciudades) ? body.ciudades : [body.ciudades]).map(c => sanitizeText(c, 60))),
      body.viaja ? 1 : 0,
      sanitizeText(body.otra_ciudad, 60) || null,
      sanitizeText(body.especialidad, 80),
      JSON.stringify((body.servicios || []).map(s => sanitizeText(s, 80))),
      sanitizeText(body.certificaciones, 200) || null,
      sanitizeText(body.descripcion, 600),
      JSON.stringify((body.horario || []).map(h => sanitizeText(h, 40))),
      sanitizeText(body.horario_detalle, 80) || null,
      JSON.stringify(body.fotos    || []),
      body.avatar          || null,
    ).run();

    const id = result.meta.last_row_id;

    // Notificación por email al admin (MailChannels, gratis vía Cloudflare Workers)
    await notifyAdmin(env, { id, nombre: body.nombre, especialidad: body.especialidad, email: body.email });

    return json({ success: true, id });
  } catch (err) {
    console.error('DB error:', err);
    return json({ error: 'Error al guardar el registro' }, 500);
  }
}

async function notifyAdmin(env, { id, nombre, especialidad, email }) {
  if (!env.RESEND_API_KEY) return;
  const adminEmail = env.ADMIN_EMAIL || 'franklinzunigabarrueto@gmail.com';
  const baseUrl    = env.PUBLIC_BASE_URL || 'https://quebuenmaestro.cl';

  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Québuenmaestro! <noreply@quebuenmaestro.cl>',
        to: [adminEmail],
        subject: `Nuevo registro pendiente — ${nombre}`,
        html: `
          <h2>Nuevo profesional registrado</h2>
          <p>
            <strong>Nombre:</strong> ${nombre}<br>
            <strong>Especialidad:</strong> ${especialidad}<br>
            <strong>Email:</strong> ${email}
          </p>
          <p><a href="${baseUrl}/admin.html">Revisar en panel de administración →</a></p>
        `,
      }),
    });
  } catch {
    // Email no es crítico — el registro quedó guardado igual
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
