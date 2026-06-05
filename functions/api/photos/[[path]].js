// GET /api/photos/* — sirve fotos aprobadas públicamente
// Solo entrega imágenes bajo el prefijo approved/
export async function onRequestGet({ env, params }) {
  const key = Array.isArray(params.path) ? params.path.join('/') : params.path;

  if (!key || !key.startsWith('approved/')) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const object = await env.FOTOS.get(key);
    if (!object) return new Response('Not found', { status: 404 });

    return new Response(object.body, {
      headers: {
        'Content-Type':  object.httpMetadata?.contentType || 'image/jpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch {
    return new Response('Error', { status: 500 });
  }
}
