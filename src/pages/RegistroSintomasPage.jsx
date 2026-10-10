import React, { useState, useEffect } from 'react';
import './RegistroSintomasPage.css';
import EvolucionPage from './EvolucionPage.jsx';
import MiDiaPage from './MiDiaPage.jsx';
import FluctuacionesPage from './FluctuacionesPage.jsx';
import RegistroDiarioPage from './RegistroDiarioPage.jsx';
import ReportePage from './ReportePage.jsx';
import ConfiguracionPage from './ConfiguracionPage.jsx';
import BarraHora from './BarraHora.jsx';

const RegistroSintomasPage = ({ usuario, token, onLogout }) => {
  const [pestanaActiva, setPestanaActiva] = useState('midia'); // 'midia' | 'registro' | 'evolucion' | 'historial'
  const [formData, setFormData] = useState({
    tipo: '',
    intensidad: 3,
    duracion: '',
    localizacion: '',
    notas: ''
  });

  const opcionesDuracion = [
    'Menos de 30 min',
    '30 min a 4 h',
    '4 a 12 h',
    '12 h a 1 día',
    'Más de 1 día',
    'Todavía presente'
  ];

  const actualizarDuracion = async (id, valor) => {
    try {
      const response = await fetch(`${apiUrl}/api/sintomas/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ duracion: valor })
      });
      if (response.ok) {
        cargarSintomas();
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (error) {
      console.error('Error actualizando duración:', error);
    }
  };

  const [sintomas, setSintomas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [menuTipoAbierto, setMenuTipoAbierto] = useState(false);

  const hoyLocal = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Síntomas de días anteriores que siguen marcados como "Todavía presente"
  const sintomasAbiertos = sintomas.filter(
    s => s.duracion === 'Todavía presente' && s.fecha_registro && s.fecha_registro.slice(0, 10) < hoyLocal
  );

  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Headers con autenticación
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Nombre médico (se guarda) + descripción coloquial (solo se muestra)
  const tiposSintomas = [
    { nombre: 'Temblor', descripcion: 'en reposo' },
    { nombre: 'Rigidez', descripcion: 'músculos tensos o duros' },
    { nombre: 'Bradicinesia', descripcion: 'movimientos lentos' },
    { nombre: 'Inestabilidad postural', descripcion: 'pierdo el equilibrio' },
    { nombre: 'Congelamiento de la marcha', descripcion: 'Freezing o FOG' },
    { nombre: 'Distonía', descripcion: 'músculos que se contraen solos' },
    { nombre: 'Discinesia', descripcion: 'movimientos involuntarios' },
    { nombre: 'Alucinaciones', descripcion: 'veo o escucho cosas que no están' },
    { nombre: 'Depresión', descripcion: 'tristeza o desánimo persistente' },
    { nombre: 'Ansiedad', descripcion: 'nervios o preocupación constante' },
    { nombre: 'Insomnio', descripcion: 'no puedo dormir' },
    { nombre: 'Fatiga', descripcion: 'cansancio sin razón clara' },
    { nombre: 'Dolor', descripcion: 'molestia o ardor' },
    { nombre: 'Estreñimiento', descripcion: 'dificultad para evacuar' },
    { nombre: 'Disfagia', descripcion: 'dificultad para tragar' },
    { nombre: 'Disfunción visual', descripcion: 'problemas de la vista' }
  ];

  const localizaciones = [
    'Mano izquierda',
    'Mano derecha',
    'Brazo izquierdo',
    'Brazo derecho',
    'Hombro izquierdo',
    'Hombro derecho',
    'Pierna izquierda',
    'Pierna derecha',
    'Rodilla izquierda',
    'Rodilla derecha',
    'Pie izquierdo',
    'Pie derecho',
    'Tobillo izquierdo',
    'Tobillo derecho',
    'Dedos del pie izquierdo',
    'Dedos del pie derecho',
    'Cabeza',
    'Cara',
    'Cuello',
    'Tronco',
    'Generalizado'
  ];

  // Cargar síntomas al montar
  useEffect(() => {
    cargarSintomas();
  }, []);

  const cargarSintomas = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/sintomas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSintomas(data);
        cargarEstadisticas();
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (error) {
      console.error('Error cargando síntomas:', error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/sintomas/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'intensidad' ? parseInt(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.tipo || !formData.localizacion) {
      setMensaje('Por favor completa todos los campos requeridos');
      return;
    }

    if (formData.intensidad < 1 || formData.intensidad > 5) {
      setMensaje('La intensidad debe estar entre 1 y 5');
      return;
    }

    if (!formData.duracion) {
      setMensaje('Selecciona la duración');
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${apiUrl}/api/sintomas`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          tipo: formData.tipo,
          intensidad: formData.intensidad,
          duracion: formData.duracion,
          localizacion: formData.localizacion,
          notas: formData.notas
        })
      });

      if (response.ok) {
        setMensaje('Síntoma registrado correctamente');
        setFormData({
          tipo: '',
          intensidad: 3,
          duracion: '',
          localizacion: '',
          notas: ''
        });
        cargarSintomas();
        setTimeout(() => setMensaje(''), 3000);
      } else if (response.status === 401) {
        onLogout();
      } else {
        const error = await response.json();
        setMensaje(`Error: ${error.error}`);
      }
    } catch (error) {
      setMensaje(`Error de conexión: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };

  const handleEliminar = async (sintomaId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/sintomas/${sintomaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMensaje('Síntoma eliminado');
        cargarSintomas();
        setTimeout(() => setMensaje(''), 2000);
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (error) {
      setMensaje(`Error al eliminar: ${error.message}`);
    }
  };

  const getIntensidadColor = (intensidad) => {
    const colores = {
      1: '#28a745',
      2: '#ffc107',
      3: '#ff9800',
      4: '#ff6b6b',
      5: '#d32f2f'
    };
    return colores[intensidad] || '#999';
  };

  const getIntensidadLabel = (intensidad) => {
    const labels = {
      1: 'Muy leve',
      2: 'Leve',
      3: 'Moderado',
      4: 'Intenso',
      5: 'Muy intenso'
    };
    return labels[intensidad] || 'Desconocido';
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (fecha.toDateString() === hoy.toDateString()) {
      return `Hoy a las ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (fecha.toDateString() === ayer.toDateString()) {
      return `Ayer a las ${fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}`;
    }
    return fecha.toLocaleDateString('es-MX') + ' ' + fecha.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  // Estilos de pestañas inline para no tocar el CSS existente
  const estiloPestana = (activa) => ({
    padding: '10px 20px',
    border: 'none',
    borderBottom: activa ? '3px solid #2AACB0' : '3px solid transparent',
    background: 'transparent',
    color: activa ? '#2AACB0' : 'rgba(255,255,255,0.5)',
    fontSize: '15px',
    fontWeight: activa ? '600' : '400',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap'
  });

  return (
    <div className="registro-sintomas-container">
      {/* Barra de usuario */}
      <div className="user-bar">
        <div className="user-info">
          <img
            src="/assets/Logo_En_Marcha_Contigo_Fondo_Transparente.png"
            alt="En Marcha Contigo"
            className="user-bar-logo"
            style={{ background: '#ffffff', borderRadius: '999px', padding: '4px 14px', boxSizing: 'content-box' }}
          />
          <span className="user-greeting">Hola, {usuario.nombre}</span>
        </div>
        <button onClick={onLogout} className="btn-logout">
          Cerrar sesión
        </button>
      </div>

      {/* Hora que usa la app */}
      <BarraHora />

      {/* Recordatorio de síntomas abiertos de días anteriores */}
      {sintomasAbiertos.length > 0 && (
        <div style={{ margin: '12px 16px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(42,172,176,0.4)' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            Tienes {sintomasAbiertos.length} síntoma(s) de días anteriores marcados como "Todavía presente". ¿Cuánto duró?
          </p>
          {sintomasAbiertos.map(s => (
            <div key={s.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span>{s.tipo} ({s.fecha_registro.slice(0, 10)})</span>
              <select
                defaultValue=""
                onChange={(e) => e.target.value && actualizarDuracion(s.id, e.target.value)}
              >
                <option value="">Selecciona</option>
                {opcionesDuracion.filter(op => op !== 'Todavía presente').map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Navegación por pestañas */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(42,172,176,0.2)',
        padding: '0 16px',
        overflowX: 'auto',
        background: 'rgba(0,0,0,0.15)',
        gap: '4px'
      }}>
        <button style={estiloPestana(pestanaActiva === 'midia')} onClick={() => setPestanaActiva('midia')}>
          💊 Mi Día
        </button>
        <button style={estiloPestana(pestanaActiva === 'registro')} onClick={() => setPestanaActiva('registro')}>
          ✏️ Síntomas
        </button>
        <button style={estiloPestana(pestanaActiva === 'evolucion')} onClick={() => setPestanaActiva('evolucion')}>
          📈 Evolución
        </button>
        <button style={estiloPestana(pestanaActiva === 'fluctuaciones')} onClick={() => setPestanaActiva('fluctuaciones')}>
          🌡️ Estado
        </button>
        <button style={estiloPestana(pestanaActiva === 'historial')} onClick={() => setPestanaActiva('historial')}>
          📋 Historial
        </button>
        <button style={estiloPestana(pestanaActiva === 'diario')} onClick={() => setPestanaActiva('diario')}>
          🌿 Mi día
        </button>
        <button style={estiloPestana(pestanaActiva === 'reporte')} onClick={() => setPestanaActiva('reporte')}>
          📄 Reporte
        </button>
        <button style={estiloPestana(pestanaActiva === 'config')} onClick={() => setPestanaActiva('config')}>
          ⚙️ Configuración
        </button>
      </div>

      {/* Pestaña Reporte */}
      {pestanaActiva === 'config' && (
        <ConfiguracionPage />
      )}

      {pestanaActiva === 'reporte' && (
        <ReportePage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} />
      )}

      {/* Pestaña Diario síntomas no motores */}
      {pestanaActiva === 'diario' && (
        <RegistroDiarioPage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} />
      )}

      {/* Pestaña Mi Día */}
      {pestanaActiva === 'midia' && (
        <MiDiaPage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} />
      )}

      {/* Pestaña Fluctuaciones */}
      {pestanaActiva === 'fluctuaciones' && (
        <FluctuacionesPage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} />
      )}

      {/* Pestaña Evolución */}
      {pestanaActiva === 'evolucion' && (
        <div style={{ padding: '0 16px', maxWidth: '900px', margin: '0 auto' }}>
          <EvolucionPage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} />
        </div>
      )}

      {/* Pestaña Historial */}
      {pestanaActiva === 'historial' && (
        <div className="historial-section" style={{ padding: '20px 16px' }}>
          <h2>Historial de síntomas</h2>
          {sintomas.length === 0 ? (
            <div className="sin-datos">
              <p>No hay síntomas registrados aún</p>
            </div>
          ) : (
            <div className="sintomas-list">
              {sintomas.map(sintoma => (
                <div key={sintoma.id} className="sintoma-card">
                  <div className="sintoma-header">
                    <span className="sintoma-tipo">{sintoma.tipo}</span>
                    <span className="intensidad-badge" style={{ backgroundColor: getIntensidadColor(sintoma.intensidad) }}>
                      {sintoma.intensidad}/5
                    </span>
                  </div>
                  <div className="sintoma-details">
                    <div className="detail-item">
                      <span className="detail-label">Localización:</span>
                      <span className="detail-value">{sintoma.localizacion}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duración:</span>
                      <span className="detail-value">{sintoma.duracion}</span>
                    </div>
                    {sintoma.notas && (
                      <div className="detail-item">
                        <span className="detail-label">Notas:</span>
                        <span className="detail-value">{sintoma.notas}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Fecha:</span>
                      <span className="detail-value">{formatearFecha(sintoma.fecha_registro)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleEliminar(sintoma.id)} className="btn-eliminar">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pestaña Registro (contenido existente) */}
      {pestanaActiva === 'registro' && (
      <div className="registro-sintomas-wrapper">
        {/* Sección del formulario */}
        <div className="registro-form-section">
          <h1>Registro de Síntomas</h1>
          <p className="subtitle">Documenta tus síntomas para seguimiento neurológico</p>

          {mensaje && (
            <div className={`mensaje ${mensaje.includes('Error') ? 'error' : 'exito'}`}>
              {mensaje}
            </div>
          )}

          <form onSubmit={handleSubmit} className="registro-form">
            {/* Tipo de síntoma */}
            <div className="form-group">
              <label htmlFor="tipo">Tipo de síntoma *</label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  id="tipo"
                  aria-haspopup="listbox"
                  aria-expanded={menuTipoAbierto}
                  onClick={() => setMenuTipoAbierto(!menuTipoAbierto)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px',
                    background: '#fff', color: '#0D2C4D',
                    border: '1px solid #BFE6E6', borderRadius: '8px',
                    fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer'
                  }}
                >
                  {(() => {
                    const seleccionado = tiposSintomas.find(t => t.nombre === formData.tipo);
                    if (!seleccionado) return 'Selecciona un síntoma';
                    return (
                      <>
                        {seleccionado.nombre}{' '}
                        <span style={{ fontSize: '13px', opacity: 0.75 }}>({seleccionado.descripcion})</span>
                      </>
                    );
                  })()}
                </button>
                {menuTipoAbierto && (
                  <ul
                    role="listbox"
                    style={{
                      position: 'absolute', zIndex: 20, left: 0, right: 0, top: '100%',
                      margin: '4px 0 0', padding: 0, listStyle: 'none',
                      background: '#fff', border: '1px solid #BFE6E6', borderRadius: '8px',
                      maxHeight: '60vh', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
                    }}
                  >
                    {tiposSintomas.map(t => (
                      <li key={t.nombre} role="option" aria-selected={formData.tipo === t.nombre}>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, tipo: t.nombre }));
                            setMenuTipoAbierto(false);
                          }}
                          style={{
                            width: '100%', textAlign: 'left', padding: '14px',
                            background: formData.tipo === t.nombre ? '#E6F6F6' : 'transparent',
                            color: '#0D2C4D', border: 'none', borderBottom: '1px solid #eee',
                            fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1.35
                          }}
                        >
                          {t.nombre}{' '}
                          <span style={{ fontSize: '13px', opacity: 0.75 }}>({t.descripcion})</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {formData.tipo === 'Disfunción visual' && (
                <p className="subtitle" style={{ fontSize: '14px', marginTop: '6px' }}>
                  Anota aquí la sintomatología específica en Notas adicionales.
                </p>
              )}
            </div>

            {/* Intensidad */}
            <div className="form-group">
              <label htmlFor="intensidad">
                Intensidad: {formData.intensidad} — {getIntensidadLabel(formData.intensidad)} *
              </label>
              <div className="intensidad-container">
                <input
                  type="range"
                  id="intensidad"
                  name="intensidad"
                  min="1"
                  max="5"
                  value={formData.intensidad}
                  onChange={handleChange}
                  className="intensidad-slider"
                  style={{
                    background: `linear-gradient(to right, #28a745 0%, #ffc107 25%, #ff9800 50%, #ff6b6b 75%, #d32f2f 100%)`
                  }}
                />
                <div className="intensidad-labels">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            {/* Duración */}
            <div className="form-group">
              <label htmlFor="duracion">Duración *</label>
              <select
                id="duracion"
                name="duracion"
                value={formData.duracion}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una duración</option>
                {opcionesDuracion.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            {/* Localización */}
            <div className="form-group">
              <label htmlFor="localizacion">Localización *</label>
              <select
                id="localizacion"
                name="localizacion"
                value={formData.localizacion}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una localización</option>
                {localizaciones.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Notas */}
            <div className="form-group">
              <label htmlFor="notas">Notas adicionales</label>
              <textarea
                id="notas"
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                placeholder="Ej: Síntoma apareció después de tomar medicamento..."
                rows="3"
              />
            </div>

            <button type="submit" disabled={cargando} className="btn-submit">
              {cargando ? 'Registrando...' : 'Registrar síntoma'}
            </button>
          </form>
        </div>

        {/* Sección de estadísticas */}
        {estadisticas && (
          <div className="estadisticas-section">
            <h2>Estadísticas</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{estadisticas.total}</div>
                <div className="stat-label">Registros totales</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{estadisticas.promedio_intensidad}</div>
                <div className="stat-label">Intensidad promedio</div>
              </div>
              <div className="stat-card">
                <div className="stat-number-small">{estadisticas.duracion_frecuente || '—'}</div>
                <div className="stat-label">Duración más frecuente</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Síntoma frecuente</div>
                <div className="stat-number-small">{estadisticas.sintoma_mas_frecuente || '—'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      )} {/* fin pestaña registro */}
    </div>
  );
};

export default RegistroSintomasPage;
