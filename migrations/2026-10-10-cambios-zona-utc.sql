-- Migración: hora real del cambio de zona en UTC (2026-10-10, 21:38)
-- Ejecutar SOLO en la rama prueba-vercel de Neon.
-- Motivo: fecha_local está en la hora de la zona NUEVA; al ordenar mezclaba zonas.
-- fecha_utc es la hora real del cambio, en UTC, para ordenar sin errores.
-- Rellena las filas existentes: fecha_utc = fecha_local - offset_nuevo (p. ej. UTC-06:00 => +6 horas).

ALTER TABLE cambios_zona_horaria ADD COLUMN IF NOT EXISTS fecha_utc TIMESTAMP;

UPDATE cambios_zona_horaria
SET fecha_utc = fecha_local - (
    CASE WHEN substring(offset_nuevo FROM 4 FOR 1) = '-' THEN -1 ELSE 1 END
) * make_interval(
    hours => substring(offset_nuevo FROM 5 FOR 2)::int,
    mins  => substring(offset_nuevo FROM 8 FOR 2)::int
)
WHERE fecha_utc IS NULL;

ALTER TABLE cambios_zona_horaria ALTER COLUMN fecha_utc SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_cambios_zona_utc
    ON cambios_zona_horaria (usuario_id, fecha_utc);
