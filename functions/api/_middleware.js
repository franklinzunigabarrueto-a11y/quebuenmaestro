// Middleware global para todos los endpoints /api/*
// Se ejecuta ANTES que cualquier función de la API

const RATE_LIMITS = {
  // Avatar (1) + 6 fotos trabajo + margen reintentos = 12
  'POST|/api/upload':   { max: 12, windowHours: 1,  message: 'Límite de subida alcanzado. Espera 1 hora.' },
  // Máx 5 registros por IP cada 12 horas (permite reintentos si hay error)
  'POST|/api/register': { max: 5,  windowHours: 12, message: 'Límite de registro alcanzado. Intenta más tarde.' },
  // Máx 60 consultas al directorio por minuto por IP
  'GET|/api/professionals':           { max: 60,  windowHours: 0.017, message: 'Demasiadas consultas. Espera un momento.' },
  // Máx 120 vistas de perfil por hora por IP (evita enumeración masiva)
  'GET|/api/professionals/:id':       { max: 120, windowHours: 1,     message: 'Demasiadas solicitudes. Espera un momento.' },
  // Máx 30 previews por hora por IP
  'GET|/api/professionals/preview/:id': { max: 30, windowHours: 1,   message: 'Demasiadas solicitudes. Espera un momento.' },
};

const MAX_BODY_BYTES = 6 * 1024 * 1024; // 6MB máximo absoluto por request

export async function onRequest({ request, env, next }) {
  const url    = new URL(request.url);
  const path   = url.pathname;
  const method = request.method;
  const ip     = request.headers.get('CF-Connecting-IP') ||
                 request.headers.get('X-Forwarded-For')?.split(',')[0] ||
                 'anonymous';

  // ── 1. Rechazar request bodies excesivamente grandes ─────────────────────
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return errorJson('Solicitud demasiado grande', 413);
  }

  // ── 2. Bloquear User-Agents conocidos de bots/scrapers ───────────────────
  const ua = (request.headers.get('user-agent') || '').toLowerCase();
  const badBots = ['scrapy', 'python-requests', 'go-http-client', 'curl/', 'wget/'];
  if (badBots.some(bot => ua.includes(bot)) && !path.startsWith('/api/admin')) {
    return errorJson('Acceso no permitido', 403);
  }

  // ── 3. Rate limiting por IP y endpoint ───────────────────────────────────
  // Normalizar rutas con parámetros para matching
  const normalizedPath = path
    .replace(/\/api\/professionals\/preview\/\d+$/, '/api/professionals/preview/:id')
    .replace(/\/api\/professionals\/\d+$/, '/api/professionals/:id');

  const ruleKey = `${method}|${normalizedPath}`;
  let rule      = RATE_LIMITS[ruleKey];

  // Rate limiting estricto para rutas admin: 30 requests por hora por IP
  if (path.startsWith('/api/admin')) {
    rule = { max: 30, windowHours: 1, message: 'Límite de solicitudes admin alcanzado. Espera 1 hora.' };
  }

  if (rule && env.DB) {
    const windowEpoch = Math.floor(Date.now() / (rule.windowHours * 3600 * 1000));
    const rlKey       = `${ip}|${path}|${windowEpoch}`;
    const expiresHrs  = rule.windowHours + 1;

    try {
      // Limpiar entradas expiradas (una vez cada ~50 requests aprox.)
      if (Math.random() < 0.02) {
        await env.DB.prepare(`DELETE FROM rate_limits WHERE expires_at < datetime('now')`).run();
      }

      // Leer contador actual
      const row   = await env.DB.prepare('SELECT count FROM rate_limits WHERE key = ?').bind(rlKey).first();
      const count = row ? row.count : 0;

      if (count >= rule.max) {
        return errorJson(rule.message, 429, { 'Retry-After': String(Math.ceil(rule.windowHours * 3600)) });
      }

      // Incrementar o crear contador
      await env.DB.prepare(`
        INSERT INTO rate_limits (key, count, expires_at)
        VALUES (?, 1, datetime('now', '+' || ? || ' hours'))
        ON CONFLICT(key) DO UPDATE SET count = count + 1
      `).bind(rlKey, String(Math.ceil(expiresHrs))).run();

    } catch {
      // Si el rate limiter falla, dejar pasar (fail-open para no romper el sitio)
    }
  }

  // ── 4. Continuar con el handler normal ───────────────────────────────────
  return next();
}

function errorJson(message, status, extraHeaders = {}) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
    },
  });
}
