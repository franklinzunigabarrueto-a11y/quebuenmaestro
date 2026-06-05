// GET /api/professionals/preview/:id
// Devuelve un perfil en cualquier estado (pending/approved/rejected) para previsualización.
// No expone datos de contacto sensibles si el perfil aún no está aprobado.
export async function onRequestGet({ env, params }) {
  const id = parseInt(params.id, 10);
  if (isNaN(id)) return json({ error: 'ID inválido' }, 400);

  try {
    const pro = await env.DB
      .prepare('SELECT * FROM professionals WHERE id = ?')
      .bind(id)
      .first();

    if (!pro) return json({ error: 'Perfil no encontrado' }, 404);

    const fotos = JSON.parse(pro.fotos || '[]');
    const data  = {
      id:             pro.id,
      tipo:           pro.tipo,
      nombre:         pro.nombre,
      años:           pro.años,
      especialidad:   pro.especialidad,
      descripcion:    pro.descripcion,
      certificaciones: pro.certificaciones,
      ciudades:       JSON.parse(pro.ciudades  || '[]'),
      servicios:      JSON.parse(pro.servicios || '[]'),
      horario:        JSON.parse(pro.horario   || '[]'),
      horario_detalle: pro.horario_detalle,
      viaja:          pro.viaja,
      isPending:      pro.status !== 'approved',
      avatar:         pro.avatar ? `/api/photos/${pro.avatar}` : null,
      fotos:          fotos.map(key => `/api/photos/${key}`),
      approved_at:    pro.approved_at,
      // Datos de contacto solo si está aprobado
      whatsapp:  pro.status === 'approved' ? pro.whatsapp  : null,
      email:     pro.status === 'approved' ? pro.email     : null,
      instagram: pro.status === 'approved' ? pro.instagram : null,
      web:       pro.status === 'approved' ? pro.web       : null,
      telefono:  pro.status === 'approved' ? pro.telefono  : null,
    };

    return json(data);
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
