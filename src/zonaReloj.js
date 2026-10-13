// Zona horaria del reloj integrado de la app (modo manual o la del dispositivo).
// Toda hora y fecha que muestra la app debe salir en esta zona.
export function zonaReloj() {
  try {
    const cfg = JSON.parse(localStorage.getItem('cfg_reloj') || 'null');
    if (cfg && cfg.modo === 'manual' && cfg.zonaManual) return cfg.zonaManual;
  } catch (e) { /* sin configuración guardada */ }
  try { return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'; } catch (e) { return 'UTC'; }
}

// "13:05" (24 h) -> "1:05 p. m." (12 h)
export function hora12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(Number.isNaN(m) ? 0 : m).padStart(2, '0')} ${h >= 12 ? 'p. m.' : 'a. m.'}`;
}

// Clave de día "AAAA-MM-DD" del día de esa fecha en la zona del reloj.
export function diaClave(fecha) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: zonaReloj(), year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}
