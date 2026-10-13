-- 2026-10-13: una cuenta, una sesion. Columna para el identificador de la sesion activa.
-- Aplicado en la rama de prueba prueba-vercel (br-raspy-boat-b4q0qwgb) con "sí" de Toño. NO aplicado en master.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sesion_id VARCHAR(64);
