import React, { useState, useEffect } from 'react';

// Claves de almacenamiento local (por navegador)
const CLAVE_RELOJ = 'cfg_reloj';            // { modo: 'dispositivo' | 'manual', zonaManual: 'America/Mexico_City' }
const CLAVE_ULTIMO = 'cfg_reloj_ultimo';    // { zona, offset } último estado conocido
const CLAVE_LOG = 'cfg_reloj_log';          // [{ fecha, zonaAnterior, offsetAnterior, zonaNueva, offsetNueva }]

const zonasManual = [
  'America/Mexico_City',
  'America/Monterrey',
  'America/Tijuana',
  'America/Cancun',
  'America/Bogota',
  'America/Lima',
  'America/Santiago',
  'America/Argentina/Buenos_Aires',
  'America/Los_Angeles',
  'America/New_York',
  'Europe/Madrid',
  'UTC',
];

// Lectura/escritura protegida: el navegador puede bloquear localStorage
const leer = (clave, respaldo) => {
  try {
    const v = localStorage.getItem(clave);
    return v ? JSON.parse(v) : respaldo;
  } catch (e) {
    return respaldo;
  }
};
const escribir = (clave, valor) => {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (e) {
    /* sin almacenamiento: la pantalla sigue funcionando */
  }
};

const zonaDispositivo = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'desconocida';
  } catch (e) {
    return 'desconocida';
  }
};

// Diferencia con UTC en minutos según el reloj del dispositivo ahora mismo
const offsetDispositivo = () => -new Date().getTimezoneOffset();

const formatoOffset = (min) => {
  const signo = min >= 0 ? '+' : '-';
  const a = Math.abs(min);
  return `UTC${signo}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
};

const ConfiguracionPage = () => {
  const [config, setConfig] = useState(() => leer(CLAVE_RELOJ, { modo: 'dispositivo', zonaManual: 'America/Mexico_City' }));
  const [log, setLog] = useState(() => leer(CLAVE_LOG, []));
  const [avisoCambio, setAvisoCambio] = useState(null);
  const [ahora, setAhora] = useState(new Date());

  // Al abrir la pantalla: comparar con el último estado conocido y registrar cambios
  useEffect(() => {
    const zonaAct = zonaDispositivo();
    const offsetAct = offsetDispositivo();
    const previo = leer(CLAVE_ULTIMO, null);

    if (previo && (previo.zona !== zonaAct || previo.offset !== offsetAct)) {
      const entrada = {
        fecha: new Date().toISOString(),
        zonaAnterior: previo.zona,
        offsetAnterior: formatoOffset(previo.offset),
        zonaNueva: zonaAct,
        offsetNueva: formatoOffset(offsetAct),
      };
      const nuevoLog = [entrada, ...leer(CLAVE_LOG, [])].slice(0, 30);
      escribir(CLAVE_LOG, nuevoLog);
      setLog(nuevoLog);
      setAvisoCambio(entrada);
    }
    escribir(CLAVE_ULTIMO, { zona: zonaAct, offset: offsetAct });

    // Reloj en pantalla, actualizado cada segundo
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const cambiarModo = (modo) => {
    const nuevo = { ...config, modo };
    setConfig(nuevo);
    escribir(CLAVE_RELOJ, nuevo);
  };

  const cambiarZona = (zonaManual) => {
    const nuevo = { ...config, zonaManual };
    setConfig(nuevo);
    escribir(CLAVE_RELOJ, nuevo);
  };

  const zonaUsada = config.modo === 'manual' ? config.zonaManual : zonaDispositivo();
  let horaUsada;
  try {
    horaUsada = ahora.toLocaleString('es-MX', { timeZone: zonaUsada, dateStyle: 'medium', timeStyle: 'medium' });
  } catch (e) {
    horaUsada = 'Zona no válida';
  }

  const tarjeta = { margin: '12px 16px', padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(42,172,176,0.3)' };

  return (
    <div style={{ padding: '8px 0' }}>
      {avisoCambio && (
        <div style={{ ...tarjeta, borderColor: 'rgba(230,180,60,0.7)' }}>
          <strong>Aviso:</strong> se detectó un cambio de hora o zona en este dispositivo
          ({avisoCambio.zonaAnterior} {avisoCambio.offsetAnterior} → {avisoCambio.zonaNueva} {avisoCambio.offsetNueva}).
          Revisa que la hora sea la correcta. Si cambiaste la hora a propósito, es normal que aparezca este aviso.
          <div style={{ marginTop: '8px' }}>
            <button onClick={() => setAvisoCambio(null)}>Entendido</button>
          </div>
        </div>
      )}

      <div style={tarjeta}>
        <h3 style={{ margin: '0 0 8px 0' }}>Hora y zona horaria</h3>
        <p style={{ margin: '0 0 6px 0' }}>Hora que usa la app: <strong>{horaUsada}</strong></p>
        <p style={{ margin: '0 0 6px 0' }}>Zona del dispositivo: {zonaDispositivo()} ({formatoOffset(offsetDispositivo())})</p>

        <label style={{ display: 'block', marginTop: '10px' }}>
          <input type="radio" name="modo-reloj" checked={config.modo === 'dispositivo'} onChange={() => cambiarModo('dispositivo')} />
          {' '}Usar la hora del dispositivo (recomendado)
        </label>
        <label style={{ display: 'block', marginTop: '6px' }}>
          <input type="radio" name="modo-reloj" checked={config.modo === 'manual'} onChange={() => cambiarModo('manual')} />
          {' '}Elegir una zona manualmente
        </label>

        {config.modo === 'manual' && (
          <div style={{ marginTop: '8px' }}>
            <select value={config.zonaManual} onChange={(e) => cambiarZona(e.target.value)}>
              {zonasManual.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
              Aviso: con zona manual, la hora mostrada puede no coincidir con la de tu dispositivo. Esta opción aún no cambia la hora que guarda el servidor (se guarda en UTC).
            </p>
          </div>
        )}
      </div>

      <div style={tarjeta}>
        <h3 style={{ margin: '0 0 8px 0' }}>Historial de cambios de hora o zona</h3>
        {log.length === 0 && <p style={{ margin: 0 }}>Sin cambios registrados en este dispositivo.</p>}
        {log.map((e, i) => (
          <p key={i} style={{ margin: '0 0 6px 0', fontSize: '0.9em' }}>
            {new Date(e.fecha).toLocaleString('es-MX')}: {e.zonaAnterior} {e.offsetAnterior} → {e.zonaNueva} {e.offsetNueva}
          </p>
        ))}
        <p style={{ margin: '8px 0 0 0', fontSize: '0.85em' }}>
          Limitación: la app detecta cambios de zona y de horario de verano, pero no puede saber si alguien solo cambió la hora a mano sin cambiar la zona.
        </p>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
