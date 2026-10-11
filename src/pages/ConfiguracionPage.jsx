import React, { useState, useEffect } from 'react';

// Claves de almacenamiento local (por navegador)
const CLAVE_RELOJ = 'cfg_reloj';            // { modo: 'dispositivo' | 'manual', zonaManual: 'America/Mexico_City' }
const CLAVE_ULTIMO = 'cfg_reloj_ultimo';    // { zona, offset } último estado conocido
const CLAVE_LOG = 'cfg_reloj_log';          // [{ fecha, tipo, zonaAnterior, offsetAnterior, zonaNueva, offsetNueva }]

// Zonas manuales con su huso de referencia en UTC. "verano" = la zona cambia de horario en verano.
const zonasManual = [
  { zona: 'America/Cancun', etiqueta: 'UTC-5', verano: false },
  { zona: 'America/Mexico_City', etiqueta: 'UTC-6', verano: false },
  { zona: 'America/Monterrey', etiqueta: 'UTC-6', verano: false },
  { zona: 'America/Tijuana', etiqueta: 'UTC-8; UTC-7 en horario de verano', verano: true },
  { zona: 'America/Bogota', etiqueta: 'UTC-5', verano: false },
  { zona: 'America/Lima', etiqueta: 'UTC-5', verano: false },
  { zona: 'America/Santiago', etiqueta: 'UTC-4; UTC-3 en horario de verano', verano: true },
  { zona: 'America/Argentina/Buenos_Aires', etiqueta: 'UTC-3', verano: false },
  { zona: 'America/Los_Angeles', etiqueta: 'UTC-8; UTC-7 en horario de verano', verano: true },
  { zona: 'America/New_York', etiqueta: 'UTC-5; UTC-4 en horario de verano', verano: true },
  { zona: 'Europe/Madrid', etiqueta: 'UTC+1; UTC+2 en horario de verano', verano: true },
  { zona: 'UTC', etiqueta: 'UTC+0', verano: false },
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

const guardarEntrada = (entrada) => {
  const nuevoLog = [entrada, ...leer(CLAVE_LOG, [])].slice(0, 30);
  escribir(CLAVE_LOG, nuevoLog);
  return nuevoLog;
};

const ConfiguracionPage = () => {
  // Configuración guardada (la que usa la app)
  const [guardada, setGuardada] = useState(() => leer(CLAVE_RELOJ, { modo: 'dispositivo', zonaManual: 'America/Mexico_City' }));
  // Borrador: lo que el usuario está editando, todavía no guardado
  const [borrador, setBorrador] = useState(guardada);
  const [log, setLog] = useState(() => leer(CLAVE_LOG, []));
  const [avisoCambio, setAvisoCambio] = useState(null);
  const [mensajeGuardado, setMensajeGuardado] = useState('');
  const [ahora, setAhora] = useState(new Date());

  // Al abrir la pantalla: solo en modo manual se compara con el último estado conocido.
  // En modo automático el celular ajusta la hora solo, así que no se avisa nada.
  useEffect(() => {
    const zonaAct = zonaDispositivo();
    const offsetAct = offsetDispositivo();
    const previo = leer(CLAVE_ULTIMO, null);
    const modoGuardado = leer(CLAVE_RELOJ, { modo: 'dispositivo' }).modo;

    if (modoGuardado === 'manual' && previo && (previo.zona !== zonaAct || previo.offset !== offsetAct)) {
      const entrada = {
        fecha: new Date().toISOString(),
        tipo: 'cambio del dispositivo',
        zonaAnterior: previo.zona,
        offsetAnterior: formatoOffset(previo.offset),
        zonaNueva: zonaAct,
        offsetNueva: formatoOffset(offsetAct),
      };
      setLog(guardarEntrada(entrada));
      setAvisoCambio(entrada);
    }
    escribir(CLAVE_ULTIMO, { zona: zonaAct, offset: offsetAct });

    // Reloj en pantalla, actualizado cada segundo
    const id = setInterval(() => setAhora(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Guardar: solo aquí se aplica la configuración. Si es manual, queda constancia de que el usuario aceptó el riesgo.
  const guardarConfiguracion = () => {
    escribir(CLAVE_RELOJ, borrador);
    setGuardada(borrador);
    // Avisa a la franja de hora (BarraHora) que la configuración cambió
    window.dispatchEvent(new Event('cfg-reloj-cambio'));
    if (borrador.modo === 'manual') {
      const entrada = {
        fecha: new Date().toISOString(),
        tipo: 'zona manual aceptada',
        zonaAnterior: zonaDispositivo(),
        offsetAnterior: formatoOffset(offsetDispositivo()),
        zonaNueva: borrador.zonaManual,
        offsetNueva: 'manual',
      };
      setLog(guardarEntrada(entrada));
      setMensajeGuardado(`Guardado. Aceptaste usar la zona ${borrador.zonaManual}; la hora puede no coincidir con tu dispositivo.`);
    } else {
      setMensajeGuardado('Guardado. La app usa la hora del dispositivo.');
    }
  };

  const hayCambios = JSON.stringify(borrador) !== JSON.stringify(guardada);

  const zonaUsada = guardada.modo === 'manual' ? guardada.zonaManual : zonaDispositivo();
  let horaUsada;
  try {
    horaUsada = ahora.toLocaleString('es-MX', { timeZone: zonaUsada, dateStyle: 'medium', timeStyle: 'medium' });
  } catch (e) {
    horaUsada = 'Zona no válida';
  }

  const tarjeta = { margin: '12px 16px', padding: '14px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(42,172,176,0.3)', color: '#ffffff' };
  const boton = { marginTop: '12px', padding: '8px 18px', borderRadius: '6px', border: 'none', background: '#2AACB0', color: '#ffffff', cursor: 'pointer', fontWeight: 'bold' };

  return (
    <div className="cfg-page" style={{ padding: '8px 0' }}>
      <style>{'.cfg-page, .cfg-page * { color: #ffffff !important; } .cfg-page select, .cfg-page select option { color: #000000 !important; background: #ffffff !important; }'}</style>

      {avisoCambio && (
        <div style={{ ...tarjeta, borderColor: 'rgba(230,180,60,0.7)' }}>
          <strong>Aviso:</strong> estás en zona manual y el reloj del dispositivo cambió
          ({avisoCambio.zonaAnterior} {avisoCambio.offsetAnterior} → {avisoCambio.zonaNueva} {avisoCambio.offsetNueva}).
          La app seguirá usando la zona manual. Revisa que sea la zona que quieres.
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
          <input type="radio" name="modo-reloj" checked={borrador.modo === 'dispositivo'} onChange={() => setBorrador({ ...borrador, modo: 'dispositivo' })} />
          {' '}Usar la hora del dispositivo (recomendado)
        </label>
        <label style={{ display: 'block', marginTop: '6px' }}>
          <input type="radio" name="modo-reloj" checked={borrador.modo === 'manual'} onChange={() => setBorrador({ ...borrador, modo: 'manual' })} />
          {' '}Elegir una zona manualmente
        </label>

        {borrador.modo === 'manual' && (
          <div style={{ marginTop: '8px' }}>
            <select value={borrador.zonaManual} onChange={(e) => setBorrador({ ...borrador, zonaManual: e.target.value })}>
              {zonasManual.map(z => <option key={z.zona} value={z.zona}>{z.zona} ({z.etiqueta})</option>)}
            </select>
            <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
              Aviso: con zona manual, la hora mostrada puede no coincidir con la de tu dispositivo. Esta opción aún no cambia la hora que guarda el servidor (se guarda en UTC). Al presionar Guardar aceptas este riesgo.
            </p>
            {zonasManual.find(z => z.zona === borrador.zonaManual)?.verano && (
              <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>
                Esta zona cambia su horario en verano; la hora mostrada se ajusta sola.
              </p>
            )}
          </div>
        )}

        <div>
          <button style={{ ...boton, opacity: hayCambios ? 1 : 0.5 }} disabled={!hayCambios} onClick={guardarConfiguracion}>
            Guardar configuración
          </button>
          {mensajeGuardado && <p style={{ margin: '8px 0 0 0', fontSize: '0.9em' }}>{mensajeGuardado}</p>}
        </div>
      </div>

      <div style={tarjeta}>
        <h3 style={{ margin: '0 0 8px 0' }}>Historial de cambios de hora o zona</h3>
        {log.length === 0 && <p style={{ margin: 0 }}>Sin cambios registrados en este dispositivo.</p>}
        {log.map((e, i) => (
          <p key={i} style={{ margin: '0 0 6px 0', fontSize: '0.9em' }}>
            {new Date(e.fecha).toLocaleString('es-MX')} ({e.tipo || 'cambio anterior a esta función'}): {e.zonaAnterior} {e.offsetAnterior} → {e.zonaNueva} {e.offsetNueva}
          </p>
        ))}
        <p style={{ margin: '8px 0 0 0', fontSize: '0.85em' }}>
          En modo automático no se registran cambios: el celular ajusta la hora solo. En modo manual sí se registra cuando cambia la zona del dispositivo. Limitación: no se detecta si alguien solo cambió la hora a mano sin cambiar la zona.
        </p>
      </div>
    </div>
  );
};

export default ConfiguracionPage;
