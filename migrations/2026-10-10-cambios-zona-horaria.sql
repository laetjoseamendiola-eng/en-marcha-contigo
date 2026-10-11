-- Migración: registro de cambios de zona horaria (2026-10-10)
-- Ejecutar SOLO en la rama prueba-vercel de Neon.
-- No borra ni cambia datos existentes: sólo crea una tabla nueva.
-- fecha_local = hora de la zona NUEVA, sin zona (igual que fecha_programada de las tomas).

CREATE TABLE IF NOT EXISTS cambios_zona_horaria (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
    fecha_local TIMESTAMP NOT NULL,        -- hora local del cambio
    zona_anterior VARCHAR(60),             -- p. ej. America/Mexico_City (puede ser NULL la primera vez)
    zona_nueva VARCHAR(60) NOT NULL,       -- p. ej. Europe/Madrid
    offset_nuevo VARCHAR(10) NOT NULL,     -- p. ej. UTC-06:00, calculado por el servidor
    tipo VARCHAR(20) NOT NULL              -- 'manual' (lo cambió el paciente) | 'automatico' (cambió el dispositivo)
);

CREATE INDEX IF NOT EXISTS idx_cambios_zona_usuario
    ON cambios_zona_horaria (usuario_id, fecha_local);
