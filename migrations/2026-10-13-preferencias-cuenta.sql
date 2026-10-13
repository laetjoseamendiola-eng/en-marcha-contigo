-- 2026-10-13: configuracion del reloj y del periodo del reporte guardada en la cuenta.
-- Aplicado en la rama de prueba prueba-vercel (br-raspy-boat-b4q0qwgb) con "sí" de Toño (ver bitacora vv / ww).
-- NO aplicado todavia en master.
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS config_reloj TEXT;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS config_reporte TEXT;
