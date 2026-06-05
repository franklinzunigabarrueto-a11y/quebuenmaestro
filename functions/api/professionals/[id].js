// GET /api/professionals/:id
export async function onRequestGet({ env, params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'ID inválido' }, 400);

  try {
    const pro = await env.DB
      .prepare(`SELECT id, tipo, nombre, años, whatsapp, email, instagram,
                       ciudades, especialidad, servicios, descripcion, horario,
                       horario_detalle, fotos, avatar, approved_at, web, facebook,
                       representante, viaja, otra_ciudad, certificaciones, telefono
                FROM professionals WHERE id = ? AND status = 'approved'`)
      .bind(id)
      .first();

    if (!pro) return json({ error: 'Profesional no encontrado' }, 404);

    // Reseñas y rating promedio
    const { results: reviews } = await env.DB
      .prepare(`SELECT reviewer_name, rating, comment, created_at
                FROM reviews WHERE professional_id = ?
                ORDER BY created_at DESC LIMIT 20`)
      .bind(id).all();

    const ratingAvg = reviews.length
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : 0;

    return json({
      ...pro,
      ciudades:      JSON.parse(pro.ciudades  || '[]'),
      servicios:     JSON.parse(pro.servicios || '[]'),
      horario:       JSON.parse(pro.horario   || '[]'),
      fotos:         JSON.parse(pro.fotos     || '[]').map(key => `/api/photos/${key}`),
      avatar:        pro.avatar ? `/api/photos/${pro.avatar}` : null,
      reviews,
      rating:        ratingAvg,
      reviews_count: reviews.length,
    });
  } catch (err) {
    return json({ error: 'Error al obtener el perfil' }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
