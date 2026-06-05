// POST /api/upload  — sube una foto a R2, devuelve el key
// Límite: 5MB, solo imágenes JPEG/PNG/WEBP
export async function onRequestPost({ env, request }) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return json({ error: 'FormData inválido' }, 400);

  const file = formData.get('file');
  if (!file || typeof file === 'string') return json({ error: 'Archivo requerido' }, 400);

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return json({ error: 'Tipo de archivo no permitido. Usa JPG, PNG o WEBP.' }, 400);
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) return json({ error: 'El archivo supera los 5MB' }, 400);

  // Verificar magic bytes — confirma que el contenido sea realmente una imagen
  const realImage = await validateImageBytes(file);
  if (!realImage) {
    return json({ error: 'El archivo no es una imagen válida.' }, 400);
  }

  // Key: pending/timestamp_random.ext — no accesible públicamente hasta aprobación
  const ext = file.type.split('/')[1].replace('jpeg', 'jpg');
  const key = `pending/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  try {
    await env.FOTOS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
    });
    return json({ key });
  } catch (err) {
    return json({ error: 'Error al subir la imagen' }, 500);
  }
}

// Verifica que los primeros bytes correspondan a JPEG, PNG o WEBP real
async function validateImageBytes(file) {
  try {
    const buffer = await file.slice(0, 12).arrayBuffer();
    const b      = new Uint8Array(buffer);
    const isJpeg = b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF;
    const isPng  = b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47;
    const isWebp = b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 &&
                   b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50;
    return isJpeg || isPng || isWebp;
  } catch {
    return false;
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
