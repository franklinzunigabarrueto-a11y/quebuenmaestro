// GET /api/sponsors — lista auspiciadores activos (público)
export async function onRequestGet({ env }) {
  try {
    const { results } = await env.DB.prepare(
      `SELECT id, nombre, logo_url, website, descripcion
       FROM sponsors WHERE activo = 1 ORDER BY orden ASC, created_at ASC`
    ).all();
    return json({ sponsors: results });
  } catch {
    return json({ sponsors: [] });
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
