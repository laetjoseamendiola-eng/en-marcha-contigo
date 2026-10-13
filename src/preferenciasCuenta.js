// Preferencias guardadas en la cuenta del usuario (no en el navegador):
// configuracion del reloj y del periodo del reporte. Se leen al entrar y se guardan al cambiar.

export async function leerPreferencias(apiUrl, token) {
  try {
    const res = await fetch(`${apiUrl}/api/preferencias`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

export async function guardarPreferencias(apiUrl, token, cambios) {
  try {
    await fetch(`${apiUrl}/api/preferencias`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify(cambios),
    });
  } catch (e) { /* sin conexión: se guardará en el próximo cambio */ }
}

// Aplica la configuración del reloj guardada en la cuenta, para que rija al abrir la app.
export function aplicarRelojDeCuenta(pref) {
  if (pref && pref.config_reloj) {
    try { localStorage.setItem('cfg_reloj', JSON.stringify(pref.config_reloj)); } catch (e) { /* sin almacenamiento */ }
  }
}
