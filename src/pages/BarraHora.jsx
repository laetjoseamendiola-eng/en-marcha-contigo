import React, { useState, useEffect } from 'react';

// Franja pequeña que muestra la hora que usa la app y de dónde sale (dispositivo o zona manual).
const leerConfig = () => {
  try {
    const v = localStorage.getItem('cfg_reloj');
    return v ? JSON.parse(v) : { modo: 'dispositivo' };
  } catch (e) {
    return { modo: 'dispositivo' };
  }
};

const BarraHora = () => {
  const [ahora, setAhora] = useState(new Date());
  const config = leerConfig();
  const esManual = config.modo === 'manual';
  const zona = esManual ? config.zonaManual : (Intl.DateTimeFormat().resolvedOptions().timeZone || 'desconocida');

  useEffect(() => {
    const id = setInterval(() => setAhora(new Date()), 15000);
    return () => clearInterval(id);
  }, []);

  let texto;
  try {
    texto = new Intl.DateTimeFormat('es-MX', {
      timeZone: zona,
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    }).format(ahora);
  } catch (e) {
    texto = 'Zona no válida';
  }

  return (
    <div style={{
      padding: '6px 16px',
      fontSize: '0.85em',
      color: '#ffffff',
      background: 'rgba(0,0,0,0.25)',
      borderBottom: '1px solid rgba(42,172,176,0.2)',
      textAlign: 'center',
      flexWrap: 'wrap',
    }}>
      🕒 {texto} · {esManual ? `zona manual (${zona})` : `hora del dispositivo (${zona})`}
    </div>
  );
};

export default BarraHora;
