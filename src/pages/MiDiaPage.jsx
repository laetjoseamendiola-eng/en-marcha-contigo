import React, { useState, useEffect, useCallback } from 'react';

// Estado visual por toma
const ESTADO_ICONS = {
  pendiente: '⏳',
  tomada: '✅',
  omitida: '❌',
  futura: '🕐'
};

// Ventana de ayuno en minutos antes y después de cada toma
const AYUNO_MINUTOS = 60;

function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function ahora() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatHora(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function getEstadoBloque(tomas, horario) {
  // Si alguna toma del bloque fue tomada
  if (tomas.some(t => t.tomada)) return 'tomada';
  if (tomas.some(t => t.omitida)) return 'omitida';
  const minutosHorario = horaAMinutos(horario);
  const minutosAhora = ahora();
  if (minutosAhora < minutosHorario - 5) return 'futura';
  return 'pendiente';
}

function VentanaAyuno({ horario, estado }) {
  const minHorario = horaAMinutos(horario);
  const inicio = minHorario - AYUNO_MINUTOS;
  const fin = minHorario + AYUNO_MINUTOS;

  const fmtMin = (m) => {
    const h = Math.floor(((m % 1440) + 1440) % 1440 / 60);
    const min = ((m % 1440) + 1440) % 1440 % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const activa = estado === 'pendiente' || estado === 'tomada';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      color: activa ? 'rgba(255,193,7,0.9)' : 'rgba(255,255,255,0.3)',
      marginTop: '4px'
    }}>
      <span>🍽️</span>
      <span>Ayuno {fmtMin(inicio)} – {fmtMin(fin)}</span>
    </div>
  );
}

function TarjetaToma({ bloque, onTomar, onOmitir, cargando }) {
  const { horario, tomas = [] } = bloque;
  // Medicamentos del bloque, tomados de cada toma (nombre y sustancia activa)
  const medicamentos = tomas.map(t => ({
    id: t.id,
    nombre: t.medicamento_nombre,
    dosis: t.medicamento_dosis,
    principio_activo: t.principio_activo,
    separacion_comida_min: t.separacion_comida_min
  }));
  const estado = getEstadoBloque(tomas, horario);
  const tomaHora = tomas.find(t => t.tomada)?.fecha_toma_real;
  // Ids de las tomas que aún no están marcadas (cada toma tiene su propio id)
  const idsPendientes = tomas.filter(t => !t.tomada && !t.omitida).map(t => t.id);
  const tieneAyuno = medicamentos.some(m => (m.separacion_comida_min || 0) > 0);

  const colorBorde = {
    tomada: 'rgba(40,167,69,0.5)',
    omitida: 'rgba(220,53,69,0.4)',
    pendiente: 'rgba(42,172,176,0.5)',
    futura: 'rgba(255,255,255,0.1)'
  }[estado];

  const colorFondo = {
    tomada: 'rgba(40,167,69,0.08)',
    omitida: 'rgba(220,53,69,0.06)',
    pendiente: 'rgba(42,172,176,0.08)',
    futura: 'rgba(255,255,255,0.03)'
  }[estado];

  return (
    <div style={{
      background: colorFondo,
      border: `1px solid ${colorBorde}`,
      borderRadius: '16px',
      padding: '18px 20px',
      marginBottom: '14px',
      transition: 'all 0.3s ease'
    }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{horario}</span>
            <span style={{ fontSize: '22px' }}>{ESTADO_ICONS[estado]}</span>
          </div>
          {/* Lista de medicamentos */}
          <div style={{ marginTop: '8px' }}>
            {medicamentos.map((med, i) => (
              <div key={i} style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.85)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '2px'
              }}>
                <span>💊</span>
                <span style={{ fontWeight: '500' }}>{med.nombre}</span>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>{med.dosis}</span>
              </div>
            ))}
          </div>

          {/* Hora real de toma */}
          {estado === 'tomada' && tomaHora && (
            <div style={{ fontSize: '12px', color: 'rgba(40,167,69,0.9)', marginTop: '6px' }}>
              ✓ Tomado a las {formatHora(tomaHora)}
            </div>
          )}

          {/* Ventana de ayuno: sólo si el medicamento lo requiere (dato de su registro) */}
          {tieneAyuno && (
            <VentanaAyuno horario={horario} estado={estado} />
          )}
        </div>

        {/* Botones acción */}
        {(estado === 'pendiente') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '12px' }}>
            <button
              onClick={() => onTomar(idsPendientes)}
              disabled={cargando}
              style={{
                background: '#2AACB0',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                minWidth: '90px',
                fontFamily: 'inherit',
                transition: 'opacity 0.2s'
              }}
            >
              Tomé ✓
            </button>
            <button
              onClick={() => onOmitir(idsPendientes)}
              disabled={cargando}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Omitir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Resumen de adherencia del día
function ResumenDia({ tomas }) {
  const tomadas = tomas.filter(t => t.tomada).length;
  const total = tomas.filter(t => !t.futura).length;
  const pct = total > 0 ? Math.round((tomadas / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div style={{
      background: 'rgba(42,172,176,0.08)',
      border: '1px solid rgba(42,172,176,0.2)',
      borderRadius: '12px',
      padding: '14px 18px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '2px' }}>
          Adherencia hoy
        </div>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: pct >= 80 ? '#28a745' : '#ffc107' }}>
          {pct}%
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '2px' }}>
          Tomas
        </div>
        <div style={{ fontSize: '18px', color: 'white' }}>
          {tomadas}/{total} <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>completadas</span>
        </div>
      </div>
    </div>
  );
}

export default function MiDiaPage({ token, apiUrl }) {
  const [bloques, setBloques] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [accionCargando, setAccionCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const cargarTomas = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/tomas/hoy`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBloques(data.bloques || []);
      } else if (res.status === 404) {
        // No hay medicamentos configurados
        setBloques([]);
      }
    } catch (e) {
      console.error('Error cargando tomas:', e);
    } finally {
      setCargando(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    cargarTomas();
  }, [cargarTomas]);

  // Marca cada toma del bloque (una petición por toma). Si alguna falla, lo dice.
  const marcarTomas = async (ids, accion) => {
    if (!ids || ids.length === 0) return false;
    setAccionCargando(true);
    let todoBien = true;
    try {
      for (const id of ids) {
        const res = await fetch(`${apiUrl}/api/tomas/${id}/${accion}`, {
          method: 'POST',
          headers
        });
        if (!res.ok) todoBien = false;
      }
      await cargarTomas();
    } catch (e) {
      todoBien = false;
    } finally {
      setAccionCargando(false);
    }
    return todoBien;
  };

  const handleTomar = async (ids) => {
    const ok = await marcarTomas(ids, 'tomar');
    setMensaje(ok ? '✓ Toma registrada' : 'Error al registrar la toma');
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleOmitir = async (ids) => {
    const ok = await marcarTomas(ids, 'omitir');
    setMensaje(ok ? 'Toma marcada como omitida' : 'Error al omitir la toma');
    setTimeout(() => setMensaje(''), 2500);
  };

  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  // Aplanar tomas de todos los bloques para el resumen
  const todasLasTomas = bloques.flatMap(b => b.tomas || []);

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.75)' }}>
        Cargando plan de tomas...
      </div>
    );
  }

  // Sin medicamentos registrados: se pide registrarlos (ya no se carga ninguna receta fija)
  if (bloques.length === 0) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(42,172,176,0.08)',
          border: '1px solid rgba(42,172,176,0.3)',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
          <h3 style={{ color: '#2AACB0', margin: '0 0 12px' }}>Aún no hay medicamentos registrados</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: '1.6' }}>
            Agrega tus medicamentos, dosis y horarios en <strong>Registro de medicamentos y dosis</strong> para ver tus tomas del día.
          </p>
        </div>
      </div>
    );
  }

  // Sustancias activas del día (para el pie de la ventana de ayuno), sin nombres comerciales
  const sustanciasAyuno = [...new Set(
    bloques.flatMap(b => (b.tomas || []))
      .filter(t => (t.separacion_comida_min || 0) > 0 && t.principio_activo)
      .map(t => t.principio_activo)
  )];

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>

      {/* Fecha */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>
          {hoy}
        </div>
        <div style={{ fontSize: '20px', fontWeight: '600', color: 'white', marginTop: '2px' }}>
          Mi plan de tomas
        </div>
      </div>

      {/* Mensaje de feedback */}
      {mensaje && (
        <div style={{
          background: mensaje.includes('Error') ? 'rgba(220,53,69,0.15)' : 'rgba(40,167,69,0.15)',
          border: `1px solid ${mensaje.includes('Error') ? 'rgba(220,53,69,0.4)' : 'rgba(40,167,69,0.4)'}`,
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '16px',
          fontSize: '14px',
          color: mensaje.includes('Error') ? '#ff6b6b' : '#5dde83'
        }}>
          {mensaje}
        </div>
      )}

      {/* Resumen adherencia */}
      <ResumenDia tomas={todasLasTomas} />

      {/* Bloques de toma (la rutina del día la escribe cada persona; ya no hay texto fijo) */}
      {bloques.map((bloque) => (
        <TarjetaToma
          key={bloque.horario}
          bloque={bloque}
          onTomar={handleTomar}
          onOmitir={handleOmitir}
          cargando={accionCargando}
        />
      ))}

      {/* Nota informativa: sustancia activa, no nombre comercial */}
      {sustanciasAyuno.length > 0 && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.75)',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          🍽️ Ventana de ayuno: 1 hora antes y 1 hora después de cada toma de {sustanciasAyuno.join(', ')}
        </div>
      )}
    </div>
  );
}
