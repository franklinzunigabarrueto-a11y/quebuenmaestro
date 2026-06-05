-- Tabla principal de profesionales
CREATE TABLE IF NOT EXISTS professionals (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  tipo        TEXT    NOT NULL CHECK(tipo IN ('individual', 'empresa')),
  nombre      TEXT    NOT NULL,
  representante TEXT,
  rut         TEXT,
  años        INTEGER NOT NULL,
  whatsapp    TEXT    NOT NULL,
  email       TEXT    NOT NULL,
  telefono    TEXT,
  web         TEXT,
  instagram   TEXT,
  facebook    TEXT,
  ciudades    TEXT    NOT NULL, -- JSON array: ["Santiago","Talca"]
  viaja       INTEGER NOT NULL DEFAULT 0,
  otra_ciudad TEXT,
  especialidad TEXT   NOT NULL,
  servicios   TEXT,             -- JSON array
  certificaciones TEXT,
  descripcion TEXT    NOT NULL,
  horario     TEXT,             -- JSON array
  horario_detalle TEXT,
  fotos       TEXT,             -- JSON array de keys R2
  status      TEXT    NOT NULL DEFAULT 'pending'
                      CHECK(status IN ('pending','approved','rejected')),
  created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
  approved_at TEXT
);

-- Índices para las búsquedas más comunes
CREATE INDEX IF NOT EXISTS idx_status       ON professionals(status);
CREATE INDEX IF NOT EXISTS idx_especialidad ON professionals(especialidad);
CREATE INDEX IF NOT EXISTS idx_created      ON professionals(created_at DESC);

-- Rate limiting por IP (se limpia automáticamente al expirar)
CREATE TABLE IF NOT EXISTS rate_limits (
  key        TEXT PRIMARY KEY,  -- "{ip}|{endpoint}|{ventana_temporal}"
  count      INTEGER NOT NULL DEFAULT 1,
  expires_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_rl_expires ON rate_limits(expires_at);
