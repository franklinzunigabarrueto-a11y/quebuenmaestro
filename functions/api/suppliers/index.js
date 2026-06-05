// GET /api/suppliers — lista proveedores aprobados (público)
export async function onRequestGet({ env, request }) {
  const url      = new URL(request.url);
  const categoria = url.searchParams.get('categoria') || '';
  const ciudad   = url.searchParams.get('ciudad') || '';
  const search   = url.searchParams.get('search') || '';

  try {
    const { results } = await env.DB.prepare(
      `SELECT id, nombre, descripcion, categoria, ciudades, web, instagram, logo, created_at
       FROM suppliers WHERE status = 'approved' ORDER BY created_at DESC`
    ).all();

    let list = results || [];
    if (categoria) list = list.filter(s => s.categoria === categoria);
    if (ciudad)    list = list.filter(s => {
      try { return JSON.parse(s.ciudades).some(c => c.toLowerCase().includes(ciudad.toLowerCase())); }
      catch { return s.ciudades?.toLowerCase().includes(ciudad.toLowerCase()); }
    });
    if (search)    list = list.filter(s =>
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.descripcion.toLowerCase().includes(search.toLowerCase())
    );

    return json({ suppliers: list });
  } catch {
    return json({ suppliers: [] });
  }
}

export async function onRequestPost({ env, request }) {
  try {
    const body = await request.json();
    const { nombre, email, whatsapp, web = '', instagram = '', descripcion, categoria, ciudades, logo = '' } = body;

    if (!nombre || !email || !whatsapp || !descripcion || !categoria || !ciudades?.length)
      return json({ error: 'Faltan campos obligatorios' }, 400);

    await env.DB.prepare(
      `INSERT INTO suppliers (nombre, email, whatsapp, web, instagram, descripcion, categoria, ciudades, logo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(nombre, email, whatsapp, web, instagram, descripcion, categoria,
           JSON.stringify(ciudades), logo).run();

    return json({ success: true }, 201);
  } catch {
    return json({ error: 'Error al registrar' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}
