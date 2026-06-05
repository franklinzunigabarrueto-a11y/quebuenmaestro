// GET /api/professionals?city=&specialty=&search=&sort=rating
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const city      = url.searchParams.get('city')      || '';
  const specialty = url.searchParams.get('specialty') || '';
  const search    = url.searchParams.get('search')    || '';
  const sort      = url.searchParams.get('sort')      || 'rating';

  let query = `SELECT id, tipo, nombre, rut, años, whatsapp, email, instagram,
                      ciudades, especialidad, servicios, descripcion, horario,
                      horario_detalle, fotos, avatar, approved_at
               FROM professionals WHERE status = 'approved'`;
  const params = [];

  if (city) {
    query += ` AND ciudades LIKE ?`;
    params.push(`%${city}%`);
  }
  if (specialty) {
    query += ` AND especialidad = ?`;
    params.push(specialty);
  }
  if (search) {
    query += ` AND (nombre LIKE ? OR descripcion LIKE ? OR especialidad LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }

  const orderMap = {
    rating:   'approved_at DESC',
    name:     'nombre ASC',
    city:     'ciudades ASC',
    newest:   'approved_at DESC',
  };
  query += ` ORDER BY ${orderMap[sort] || 'approved_at DESC'}`;

  try {
    const { results } = await env.DB.prepare(query).bind(...params).all();

    // Rating promedio por profesional en una sola consulta
    const ids = results.map(p => p.id);
    let ratingsMap = {};
    if (ids.length > 0) {
      const placeholders = ids.map(() => '?').join(',');
      const { results: ratings } = await env.DB
        .prepare(`SELECT professional_id, AVG(rating) as avg, COUNT(*) as cnt
                  FROM reviews WHERE professional_id IN (${placeholders})
                  GROUP BY professional_id`)
        .bind(...ids).all();
      ratings.forEach(r => { ratingsMap[r.professional_id] = r; });
    }

    const professionals = results.map(p => {
      const r = ratingsMap[p.id];
      return {
        ...p,
        ciudades:      JSON.parse(p.ciudades  || '[]'),
        servicios:     JSON.parse(p.servicios || '[]'),
        horario:       JSON.parse(p.horario   || '[]'),
        fotos:         JSON.parse(p.fotos     || '[]').map(key => `/api/photos/${key}`),
        avatar:        p.avatar ? `/api/photos/${p.avatar}` : null,
        rating:        r ? Math.round(r.avg * 10) / 10 : 0,
        reviews_count: r ? r.cnt : 0,
      };
    });
    return json({ professionals });
  } catch (err) {
    return json({ error: 'Error al obtener profesionales' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
