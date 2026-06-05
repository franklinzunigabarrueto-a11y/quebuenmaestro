// GET /api/admin/photos/* — sirve fotos pendientes para revisión del admin
// Requiere token Bearer — permite ver pending/ y approved/
export async function onRequestGet({ env, request, params }) {
  if (!isAuthorized(request, env)) {
    return new Response('No autorizado', { status: 401 });
  }

  const key = Array.isArray(params.path) ? params.path.join('/') : params.path;
  if (!key) return new Response('Not found', { status: 404 });

  try {
    const object = await env.FOTOS.get(key);
    if (!object) return new Response('Not found', { status: 404 });

    return new Response(object.body, {
      headers: {
        'Content-Type':  object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Error', { status: 500 });
  }
}

function isAuthorized(request, env) {
  const auth = request.headers.get('Authorization') || '';
  return auth === `Bearer ${env.ADMIN_TOKEN}`;
}
