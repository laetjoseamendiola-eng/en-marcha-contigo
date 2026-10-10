-- Migración: duracion de síntomas pasa de minutos (número) a opciones de texto.
-- Ejecutar UNA SOLA VEZ en Neon, rama prueba-vercel, ANTES de probar la nueva versión.
-- Convierte los registros existentes (en minutos) a su rango correspondiente.

BEGIN;

ALTER TABLE sintomas
  ALTER COLUMN duracion TYPE VARCHAR(30)
  USING (
    CASE
      WHEN duracion < 30 THEN 'Menos de 30 min'
      WHEN duracion <= 240 THEN '30 min a 4 h'
      WHEN duracion <= 720 THEN '4 a 12 h'
      WHEN duracion <= 1440 THEN '12 h a 1 día'
      ELSE 'Más de 1 día'
    END
  );

-- Revisión: debe mostrar solo textos de las opciones
SELECT duracion, COUNT(*) FROM sintomas GROUP BY duracion;

COMMIT;
