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
  const { horario, medicamentos = [], tomas = [], id_principal } = bloque;
  const estado = getEstadoBloque(tomas, horario);
  const tomaHora = tomas.find(t => t.tomada)?.fecha_toma_real;
  const tieneLevodopa = medicamentos.some(m =>
    m.nombre?.toLowerCase().includes('levodopa') ||
    m.principio_activo?.toLowerCase().includes('levodopa')
  );

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

          {/* Ventana ayuno solo para Cloisone */}
          {tieneLevodopa && (
            <VentanaAyuno horario={horario} estado={estado} />
          )}
        </div>

        {/* Botones acción */}
        {(estado === 'pendiente') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '12px' }}>
            <button
              onClick={() => onTomar(id_principal)}
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
              onClick={() => onOmitir(id_principal)}
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
  const [inicializado, setInicializado] = useState(false);

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

  const inicializarMedicamentos = async () => {
    try {
      const res = await fetch(`${apiUrl}/api/medicamentos/inicializar`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        setInicializado(true);
        await cargarTomas();
      }
    } catch (e) {
      console.error('Error inicializando:', e);
    }
  };

  useEffect(() => {
    cargarTomas();
  }, [cargarTomas]);

  const handleTomar = async (tomaId) => {
    setAccionCargando(true);
    try {
      const res = await fetch(`${apiUrl}/api/tomas/${tomaId}/tomar`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        setMensaje('✓ Toma registrada');
        await cargarTomas();
        setTimeout(() => setMensaje(''), 2500);
      }
    } catch (e) {
      setMensaje('Error al registrar');
    } finally {
      setAccionCargando(false);
    }
  };

  const handleOmitir = async (tomaId) => {
    setAccionCargando(true);
    try {
      const res = await fetch(`${apiUrl}/api/tomas/${tomaId}/omitir`, {
        method: 'POST',
        headers
      });
      if (res.ok) {
        setMensaje('Toma marcada como omitida');
        await cargarTomas();
        setTimeout(() => setMensaje(''), 2500);
      }
    } catch (e) {
      setMensaje('Error al omitir');
    } finally {
      setAccionCargando(false);
    }
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

  // Sin medicamentos configurados
  if (bloques.length === 0 && !inicializado) {
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
          <h3 style={{ color: '#2AACB0', margin: '0 0 12px' }}>Configura tu tratamiento</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px', marginBottom: '24px', lineHeight: '1.6' }}>
            Carga tu receta con Levodopa/Carbidopa ½ tab (08:00, 12:00, 16:00, 20:00)
            y Rasagilina 1mg (08:00) para empezar a registrar tus tomas.
          </p>
          <button
            onClick={inicializarMedicamentos}
            style={{
              background: '#2AACB0',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'inherit'
            }}
          >
            Cargar mi receta
          </button>
        </div>
      </div>
    );
  }

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

      {/* Tarjeta de rutina matutina */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: '12px',
        padding: '12px 16px',
        marginBottom: '16px',
        fontSize: '13px',
        color: 'rgba(255,255,255,0.75)',
        display: 'flex',
        gap: '8px',
        alignItems: 'flex-start'
      }}>
        <span>🌅</span>
        <span>
          7:30 despertar → estiramientos → medicamento 8:00 → actividades.<br/>
          <span style={{ color: 'rgba(255,193,7,0.7)' }}>Ayuno 7:00–9:00</span> · caminata libre después de las 9:00
        </span>
      </div>

      {/* Bloques de toma */}
      {bloques.map((bloque) => (
        <TarjetaToma
          key={bloque.horario}
          bloque={bloque}
          onTomar={handleTomar}
          onOmitir={handleOmitir}
          cargando={accionCargando}
        />
      ))}

      {/* Nota informativa */}
      <div style={{
        marginTop: '8px',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.75)',
        textAlign: 'center',
        lineHeight: '1.6'
      }}>
        🍽️ Ventana de ayuno: 1 hora antes y 1 hora después de cada toma de Cloisone
      </div>
    </div>
  );
}
