import React, { useState, useEffect, useCallback } from 'react';

// Estados del Diario de Hauser
const ESTADOS = [
  {
    id: 'ON',
    label: 'ON',
    emoji: '🟢',
    descripcion: 'Me siento bien, activo',
    color: '#27AE60',
    colorFondo: 'rgba(39,174,96,0.15)',
    colorBorde: 'rgba(39,174,96,0.5)'
  },
  {
    id: 'OFF',
    label: 'OFF',
    emoji: '🔴',
    descripcion: 'Síntomas presentes, lento',
    color: '#E74C3C',
    colorFondo: 'rgba(231,76,60,0.15)',
    colorBorde: 'rgba(231,76,60,0.5)'
  },
  {
    id: 'ON_DISC_LEVE',
    label: 'ON con movimientos',
    emoji: '🟡',
    descripcion: 'Activo pero con movimientos involuntarios leves',
    color: '#F39C12',
    colorFondo: 'rgba(243,156,18,0.15)',
    colorBorde: 'rgba(243,156,18,0.5)'
  },
  {
    id: 'DORMIDO',
    label: 'Dormido',
    emoji: '😴',
    descripcion: 'Dormido / descansando',
    color: '#8E9EAB',
    colorFondo: 'rgba(142,158,171,0.1)',
    colorBorde: 'rgba(142,158,171,0.3)'
  }
];

const COLOR_POR_ESTADO = {
  ON: '#27AE60',
  OFF: '#E74C3C',
  ON_DISC_LEVE: '#F39C12',
  ON_DISC_GRAVE: '#E67E22',
  DORMIDO: '#4A5568',
  vacio: 'rgba(255,255,255,0.06)'
};

function bloqueActual() {
  const now = new Date();
  const h = now.getHours();
  const m = now.getMinutes() < 30 ? '00' : '30';
  return `${String(h).padStart(2, '0')}:${m}`;
}

function fechaHoy() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Genera todos los bloques de 30min del día (6:00 a 23:30)
function generarBloques() {
  const bloques = [];
  for (let h = 6; h < 24; h++) {
    bloques.push(`${String(h).padStart(2, '0')}:00`);
    bloques.push(`${String(h).padStart(2, '0')}:30`);
  }
  return bloques;
}

// Tooltip simple para la grilla
function TooltipBloque({ hora, estado }) {
  if (!estado) return null;
  const def = ESTADOS.find(e => e.id === estado);
  return (
    <div style={{
      position: 'absolute',
      bottom: '110%',
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#1B3A5C',
      border: '1px solid #2AACB0',
      borderRadius: '8px',
      padding: '6px 10px',
      fontSize: '11px',
      color: 'white',
      whiteSpace: 'nowrap',
      zIndex: 10,
      pointerEvents: 'none'
    }}>
      {hora} — {def?.label || estado}
    </div>
  );
}

// Grilla del día tipo mapa de calor
function GrillaDia({ fluctuaciones, bloqueActualStr }) {
  const [hovered, setHovered] = useState(null);
  const bloques = generarBloques();
  const mapaEstados = {};
  fluctuaciones.forEach(f => { mapaEstados[f.hora_bloque] = f.estado; });

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '4px',
        marginBottom: '12px'
      }}>
        {bloques.map(hora => {
          const estado = mapaEstados[hora];
          const esActual = hora === bloqueActualStr;
          return (
            <div
              key={hora}
              onMouseEnter={() => setHovered(hora)}
              onMouseLeave={() => setHovered(null)}
              style={{
                position: 'relative',
                background: COLOR_POR_ESTADO[estado] || COLOR_POR_ESTADO.vacio,
                borderRadius: '6px',
                height: '32px',
                border: esActual ? '2px solid white' : '1px solid rgba(255,255,255,0.08)',
                cursor: 'default',
                transition: 'opacity 0.15s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {esActual && (
                <div style={{
                  width: '6px', height: '6px',
                  borderRadius: '50%',
                  background: 'white',
                  opacity: 0.9
                }} />
              )}
              {hovered === hora && (
                <TooltipBloque hora={hora} estado={estado} />
              )}
            </div>
          );
        })}
      </div>

      {/* Leyenda horas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(6, 1fr)',
        gap: '4px',
        marginBottom: '16px'
      }}>
        {['6h', '7h', '8h', '9h', '10h', '11h',
          '12h', '13h', '14h', '15h', '16h', '17h',
          '18h', '19h', '20h', '21h', '22h', '23h'].map(h => (
          <div key={h} style={{
            fontSize: '9px',
            color: 'rgba(255,255,255,0.75)',
            textAlign: 'center'
          }}>{h}</div>
        ))}
      </div>

      {/* Leyenda colores */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {ESTADOS.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{
              width: '12px', height: '12px',
              borderRadius: '3px',
              background: e.color
            }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>{e.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{
            width: '12px', height: '12px',
            borderRadius: '3px',
            background: COLOR_POR_ESTADO.vacio,
            border: '1px solid rgba(255,255,255,0.15)'
          }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>Sin registro</span>
        </div>
      </div>
    </div>
  );
}

export default function FluctuacionesPage({ token, apiUrl }) {
  const [fluctuaciones, setFluctuaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [registrando, setRegistrando] = useState(false);
  const [estadoSeleccionado, setEstadoSeleccionado] = useState(null);
  const [confirmado, setConfirmado] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [vistaActiva, setVistaActiva] = useState('ahora'); // 'ahora' | 'hoy'

  const bloque = bloqueActual();
  const hoy = fechaHoy();

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const cargarFluctuaciones = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/fluctuaciones?dias=1`, { headers });
      if (res.ok) {
        const data = await res.json();
        // data es array de días; tomamos el de hoy
        const diaHoy = data.find(d => d.fecha === hoy);
        setFluctuaciones(diaHoy?.bloques || []);
      }
    } catch (e) {
      console.error('Error cargando fluctuaciones:', e);
    } finally {
      setCargando(false);
    }
  }, [apiUrl, token, hoy]);

  useEffect(() => {
    cargarFluctuaciones();
  }, [cargarFluctuaciones]);

  // Estado del bloque actual
  const estadoBloqueActual = fluctuaciones.find(f => f.hora_bloque === bloque)?.estado;

  const handleRegistrar = async (estadoId) => {
    setRegistrando(true);
    try {
      const res = await fetch(`${apiUrl}/api/fluctuaciones`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          estado: estadoId,
          hora_bloque: bloque,
          fecha: hoy
        })
      });
      if (res.ok) {
        setEstadoSeleccionado(estadoId);
        setConfirmado(true);
        await cargarFluctuaciones();
        setTimeout(() => {
          setConfirmado(false);
          setEstadoSeleccionado(null);
        }, 2000);
      }
    } catch (e) {
      setMensaje('Error al registrar');
      setTimeout(() => setMensaje(''), 2000);
    } finally {
      setRegistrando(false);
    }
  };

  const estiloBtn = (activo) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    border: `1px solid ${activo ? '#2AACB0' : 'rgba(255,255,255,0.15)'}`,
    background: activo ? '#2AACB0' : 'transparent',
    color: 'white',
    fontSize: '13px',
    fontWeight: activo ? '600' : '400',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s'
  });

  const estiloTarjeta = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(42,172,176,0.15)',
    borderRadius: '16px',
    padding: '20px',
    marginBottom: '16px'
  };

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>

      {/* Selector de vista */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setVistaActiva('ahora')} style={estiloBtn(vistaActiva === 'ahora')}>
          ⚡ Ahora
        </button>
        <button onClick={() => setVistaActiva('hoy')} style={estiloBtn(vistaActiva === 'hoy')}>
          📅 Mi día
        </button>
      </div>

      {/* ── VISTA AHORA ─────────────────────────────────────── */}
      {vistaActiva === 'ahora' && (
        <>
          {/* Bloque horario actual */}
          <div style={{ ...estiloTarjeta, textAlign: 'center', paddingBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Bloque actual
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
              {bloque}
            </div>
            {estadoBloqueActual && (
              <div style={{
                display: 'inline-block',
                background: COLOR_POR_ESTADO[estadoBloqueActual] + '33',
                border: `1px solid ${COLOR_POR_ESTADO[estadoBloqueActual]}`,
                borderRadius: '20px',
                padding: '4px 14px',
                fontSize: '13px',
                color: COLOR_POR_ESTADO[estadoBloqueActual]
              }}>
                {ESTADOS.find(e => e.id === estadoBloqueActual)?.emoji} {ESTADOS.find(e => e.id === estadoBloqueActual)?.label}
              </div>
            )}
          </div>

          {/* Confirmación animada */}
          {confirmado && (
            <div style={{
              textAlign: 'center',
              padding: '20px',
              fontSize: '48px',
              animation: 'fadeIn 0.3s ease'
            }}>
              ✓
              <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                Registrado
              </div>
            </div>
          )}

          {/* Botones de estado */}
          {!confirmado && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ESTADOS.map(estado => (
                <button
                  key={estado.id}
                  onClick={() => handleRegistrar(estado.id)}
                  disabled={registrando}
                  style={{
                    background: estadoSeleccionado === estado.id
                      ? estado.colorFondo
                      : 'rgba(255,255,255,0.04)',
                    border: `2px solid ${estado.colorBorde}`,
                    borderRadius: '16px',
                    padding: '20px 24px',
                    color: 'white',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                    width: '100%'
                  }}
                >
                  <span style={{ fontSize: '32px', flexShrink: 0 }}>{estado.emoji}</span>
                  <div>
                    <div style={{ fontSize: '20px', fontWeight: '600', color: estado.color }}>
                      {estado.label}
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
                      {estado.descripcion}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {mensaje && (
            <div style={{ textAlign: 'center', padding: '12px', color: '#ff6b6b', fontSize: '14px' }}>
              {mensaje}
            </div>
          )}

          {/* Nota aclaratoria */}
          <div style={{
            marginTop: '20px',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.25)',
            textAlign: 'center',
            lineHeight: '1.6'
          }}>
            Registra cómo te sientes en este momento.<br/>
            Puedes actualizar el bloque si cambia tu estado.
          </div>
        </>
      )}

      {/* ── VISTA HOY ───────────────────────────────────────── */}
      {vistaActiva === 'hoy' && (
        <div style={estiloTarjeta}>
          <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#2AACB0' }}>
            Hoy — {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h3>

          {cargando ? (
            <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.75)' }}>
              Cargando...
            </div>
          ) : (
            <GrillaDia fluctuaciones={fluctuaciones} bloqueActualStr={bloque} />
          )}

          {/* Resumen del día */}
          {fluctuaciones.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '10px',
              marginTop: '16px'
            }}>
              {ESTADOS.filter(e => e.id !== 'DORMIDO').map(e => {
                const count = fluctuaciones.filter(f => f.estado === e.id).length;
                if (count === 0) return null;
                return (
                  <div key={e.id} style={{
                    background: e.colorFondo,
                    border: `1px solid ${e.colorBorde}`,
                    borderRadius: '10px',
                    padding: '10px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <span style={{ fontSize: '20px' }}>{e.emoji}</span>
                    <div>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: e.color }}>
                        {count * 30}m
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>
                        {e.label}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {fluctuaciones.length === 0 && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.75)', fontSize: '14px' }}>
              Sin registros hoy todavía.<br/>
              <span style={{ fontSize: '12px' }}>Usa "⚡ Ahora" para agregar el primero.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
