-- Migración: historial de dosis y horarios (2026-10-10)
-- Ejecutar SOLO en la rama prueba-vercel de Neon.
-- No borra ni cambia datos existentes: sólo crea una tabla nueva.

CREATE TABLE IF NOT EXISTS historial_dosis (
    id SERIAL PRIMARY KEY,
    medicamento_id INTEGER NOT NULL REFERENCES medicamentos_programados(id),
    dosis VARCHAR(50) NOT NULL,
    horarios TEXT NOT NULL,              -- JSON, p. ej. ["08:00","16:00"]
    fecha_inicio TIMESTAMP NOT NULL DEFAULT NOW(),
    fecha_fin TIMESTAMP NULL              -- NULL = vigente
);

CREATE INDEX IF NOT EXISTS idx_historial_dosis_medicamento
    ON historial_dosis (medicamento_id, fecha_inicio);
