// Una cuenta, una sesion: si el servidor responde que la sesion se inicio en otro
// dispositivo, se borra la sesion local y se vuelve a la pantalla de inicio de sesion.
export function instalarControlSesion() {
  if (typeof window === 'undefined' || window.__controlSesionInstalado) return;
  window.__controlSesionInstalado = true;
  const fetchOriginal = window.fetch.bind(window);
  window.fetch = async (...args) => {
    const res = await fetchOriginal(...args);
    if (res.status === 401) {
      try {
        const datos = await res.clone().json();
        if (datos && String(datos.error || '').includes('otro dispositivo')) {
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('usuario');
          window.location.reload();
        }
      } catch (e) { /* respuesta sin JSON: no es el caso */ }
    }
    return res;
  };
}
