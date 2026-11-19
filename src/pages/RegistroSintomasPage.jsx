import { zonaReloj, hora12, diaClave } from '../zonaReloj';
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

  const [otroTexto, setOtroTexto] = useState('');
  const [pendientes, setPendientes] = useState([]);

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

  // Nombre guardado (key) + nombre visible + definición corta. Las keys de síntomas que ya existían se conservan.
  const TIPOS_MOTORES = [
    { key: 'Bradicinesia', nombre: 'Bradicinesia', descripcion: 'lentitud al moverme' },
    { key: 'Temblor', nombre: 'Temblor en reposo', descripcion: 'temblor cuando estoy quieto' },
    { key: 'Rigidez', nombre: 'Rigidez muscular', descripcion: 'tensión o músculos duros' },
    { key: 'Inestabilidad postural', nombre: 'Inestabilidad postural', descripcion: 'dificultad para mantener el equilibrio' },
    { key: 'Alteración de la marcha', nombre: 'Alteración de la marcha', descripcion: 'pasos cortos o arrastrar pies' },
    { key: 'Congelamiento de la marcha', nombre: 'Congelamiento de la marcha', descripcion: 'pies pegados al suelo' },
    { key: 'Discinesia', nombre: 'Discinesia', descripcion: 'movimientos involuntarios' },
    { key: 'Distonía', nombre: 'Distonía', descripcion: 'contracción o calambre sostenido' },
    { key: 'Hipomimia', nombre: 'Hipomimia', descripcion: 'cara menos expresiva' },
    { key: 'Disartria o hipofonía', nombre: 'Disartria o hipofonía', descripcion: 'voz baja o poco clara' },
    { key: 'Disfagia', nombre: 'Disfagia', descripcion: 'dificultad al tragar' },
    { key: 'Micrografía', nombre: 'Micrografía', descripcion: 'letra pequeña al escribir' }
  ];

  const TIPOS_NO_MOTORES = [
    { key: 'Fatiga', nombre: 'Fatiga', descripcion: 'cansancio profundo' },
    { key: 'Insomnio', nombre: 'Trastornos del sueño nocturno', descripcion: 'dificultad para dormir bien' },
    { key: 'Somnolencia diurna', nombre: 'Somnolencia diurna', descripcion: 'mucho sueño de día' },
    { key: 'Estreñimiento', nombre: 'Estreñimiento', descripcion: 'dificultad para evacuar' },
    { key: 'Ansiedad', nombre: 'Ansiedad', descripcion: 'inquietud o nerviosismo' },
    { key: 'Depresión', nombre: 'Ánimo bajo o depresión', descripcion: 'tristeza o desánimo' },
    { key: 'Apatía', nombre: 'Apatía', descripcion: 'falta de motivación' },
    { key: 'Dolor', nombre: 'Dolor', descripcion: 'en cuerpo o articulaciones' },
    { key: 'Síntomas urinarios', nombre: 'Síntomas urinarios', descripcion: 'urgencia o frecuencia al orinar' },
    { key: 'Hipotensión ortostática', nombre: 'Hipotensión ortostática', descripcion: 'mareo al ponerme de pie' },
    { key: 'Dificultad de atención o memoria', nombre: 'Dificultad de atención o memoria', descripcion: 'cuesta concentrarme o recordar' },
    { key: 'Sialorrea', nombre: 'Sialorrea', descripcion: 'exceso de saliva' },
    { key: 'Alucinaciones', nombre: 'Alucinaciones', descripcion: 'veo o escucho cosas irreales' }
  ];

  const tiposSintomas = [...TIPOS_MOTORES, ...TIPOS_NO_MOTORES];
  const PREFIJO_OTRO = 'Otro: ';
  const LARGO_MAX_TIPO = 50;
  const OTRO = '__otro__';

  // Compara sin mayúsculas, sin acentos y sin espacios sobrantes
  const normalizarTexto = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

  // Si el texto de «Otro» coincide con un síntoma de la lista, se guarda ese síntoma
  const tipoDesdeOtro = (texto) => {
    const limpio = String(texto || '').trim();
    if (!limpio) return '';
    const n = normalizarTexto(limpio);
    const encontrado = tiposSintomas.find(t => normalizarTexto(t.key) === n || normalizarTexto(t.nombre) === n);
    return encontrado ? encontrado.key : PREFIJO_OTRO + limpio;
  };

  const renderGrupoTipos = (titulo, lista) => [
    <li key={`titulo-${titulo}`} role="presentation" style={{ padding: '10px 14px 4px', fontSize: '13px', fontWeight: 700, color: '#00A7A7' }}>{titulo}</li>,
    ...lista.map(t => (
      <li key={t.key} role="option" aria-selected={formData.tipo === t.key}>
        <button
          type="button"
          onClick={() => {
            setFormData(prev => ({ ...prev, tipo: t.key }));
            setOtroTexto('');
            setMenuTipoAbierto(false);
          }}
          style={{
            width: '100%', textAlign: 'left', padding: '14px',
            background: formData.tipo === t.key ? '#00A7A7' : 'transparent',
            color: '#FFFFFF', border: 'none', borderBottom: '1px solid #FFFFFF',
            fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1.35
          }}
        >
          {t.nombre}{' '}
          <span style={{ fontSize: '13px', opacity: 0.75 }}>({t.descripcion})</span>
        </button>
      </li>
    ))
  ];

  const nombreVisibleTipo = (tipo) => {
    const t = tiposSintomas.find(x => x.key === tipo);
    if (t) return t.nombre;
    return tipo;
  };


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
      const response = await fetch(`${apiUrl}/api/sintomas?zona=${encodeURIComponent(zonaReloj())}`, {
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
      const response = await fetch(`${apiUrl}/api/sintomas/stats?zona=${encodeURIComponent(zonaReloj())}`, {
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

  const validarEntrada = (entrada) => {
    if (!entrada.tipo || !entrada.localizacion) {
      return 'Por favor completa todos los campos requeridos';
    }
    if (entrada.intensidad < 1 || entrada.intensidad > 5) {
      return 'La intensidad debe estar entre 1 y 5';
    }
    if (!entrada.duracion) {
      return 'Selecciona la duración';
    }
    return '';
  };

  const entradaActual = () => {
    const tipo = formData.tipo === OTRO ? tipoDesdeOtro(otroTexto) : formData.tipo;
    return { ...formData, tipo };
  };

  const limpiarFormulario = () => {
    setFormData({ tipo: '', intensidad: 3, duracion: '', localizacion: '', notas: '' });
    setOtroTexto('');
  };

  const agregarOtroSintoma = () => {
    if (formData.tipo === OTRO && !otroTexto.trim()) {
      setMensaje('Escribe el síntoma en el campo de «Otro»');
      return;
    }
    const entrada = entradaActual();
    if (entrada.tipo.length > LARGO_MAX_TIPO) {
      setMensaje('El nombre del síntoma es demasiado largo (máximo 50 caracteres)');
      return;
    }
    const error = validarEntrada(entrada);
    if (error) {
      setMensaje(error);
      return;
    }
    setPendientes(prev => [...prev, entrada]);
    limpiarFormulario();
    setMensaje('Síntoma agregado a la lista');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const lista = [...pendientes];
    if (formData.tipo || pendientes.length === 0) {
      const entrada = entradaActual();
      if (entrada.tipo.length > LARGO_MAX_TIPO) {
        setMensaje('El nombre del síntoma es demasiado largo (máximo 50 caracteres)');
        return;
      }
      const error = validarEntrada(entrada);
      if (error) {
        setMensaje(error);
        return;
      }
      lista.push(entrada);
    }

    setCargando(true);
    let guardados = 0;
    try {
      for (const entrada of lista) {
        const response = await fetch(`${apiUrl}/api/sintomas?zona=${encodeURIComponent(zonaReloj())}`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            tipo: entrada.tipo,
            intensidad: entrada.intensidad,
            duracion: entrada.duracion,
            localizacion: entrada.localizacion,
            notas: entrada.notas
          })
        });
        if (response.ok) {
          guardados += 1;
        } else if (response.status === 401) {
          onLogout();
          return;
        } else {
          const error = await response.json();
          setPendientes(lista.slice(guardados));
          limpiarFormulario();
          setMensaje(`Se guardaron ${guardados} de ${lista.length}. Error: ${error.error}`);
          cargarSintomas();
          return;
        }
      }
      setPendientes([]);
      limpiarFormulario();
      setMensaje(lista.length === 1 ? 'Síntoma registrado correctamente' : `${lista.length} síntomas registrados correctamente`);
      cargarSintomas();
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setPendientes(lista.slice(guardados));
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
        setMensaje('Síntoma eliminado correctamente');
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

    if (diaClave(fecha) === diaClave(hoy)) {
      return `Hoy a las ${fecha.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', timeZone: zonaReloj() })}`;
    } else if (diaClave(fecha) === diaClave(ayer)) {
      return `Ayer a las ${fecha.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', timeZone: zonaReloj() })}`;
    }
    return fecha.toLocaleDateString('es-MX', { timeZone: zonaReloj() }) + ' ' + fecha.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', timeZone: zonaReloj() });
  };

  // Estilos de pestañas inline para no tocar el CSS existente
  const estiloPestana = (activa) => ({
    padding: '10px 20px',
    border: 'none',
    borderBottom: activa ? '3px solid #00A7A7' : '3px solid transparent',
    background: 'transparent',
    color: activa ? '#00A7A7' : 'rgba(255,255,255,0.75)',
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
            src="/assets/logo_negativo_sombra.png"
            alt="En Marcha Contigo"
            className="user-bar-logo"
            style={{ background: 'transparent' }}
          />
          <span className="user-greeting">Hola, {usuario.nombre}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPestanaActiva('config')}
            className="btn-logout"
            style={pestanaActiva === 'config' ? { outline: '2px solid #FFC107', outlineOffset: '2px' } : undefined}
          >
            ⚙️ Configuración
          </button>
          <button onClick={onLogout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Hora que usa la app */}
      <BarraHora />

      {/* Recordatorio de síntomas abiertos de días anteriores */}
      {sintomasAbiertos.length > 0 && (
        <div style={{ margin: '12px 16px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0, 167, 167,0.4)' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            Tienes {sintomasAbiertos.length} síntoma(s) de días anteriores marcados como "Sigue presente". ¿Cuánto duró?
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
        borderBottom: '1px solid rgba(0, 167, 167,0.2)',
        padding: '0 16px',
        overflowX: 'auto',
        background: 'rgba(0,0,0,0.15)',
        gap: '4px'
      }}>
        <button style={estiloPestana(pestanaActiva === 'midia')} onClick={() => setPestanaActiva('midia')}>
          💊 Mi Día
        </button>
        <button style={estiloPestana(pestanaActiva === 'registro')} onClick={() => setPestanaActiva('registro')}>
          ✏️ Síntomas motores
        </button>
        <button style={estiloPestana(pestanaActiva === 'evolucion')} onClick={() => setPestanaActiva('evolucion')}>
          📈 Mi evolución
        </button>
        <button style={estiloPestana(pestanaActiva === 'fluctuaciones')} onClick={() => setPestanaActiva('fluctuaciones')}>
          🌡️ Estado motor
        </button>
        <button style={estiloPestana(pestanaActiva === 'historial')} onClick={() => setPestanaActiva('historial')}>
          📋 Mis registros
        </button>
        <button style={estiloPestana(pestanaActiva === 'diario')} onClick={() => setPestanaActiva('diario')}>
          🌿 Bienestar diario
        </button>
        <button style={estiloPestana(pestanaActiva === 'reporte')} onClick={() => setPestanaActiva('reporte')}>
          📄 Reporte
        </button>
      </div>

      {/* Pestaña Reporte */}
      {pestanaActiva === 'config' && (
        <ConfiguracionPage token={token} apiUrl={apiUrl} />
      )}

      {pestanaActiva === 'reporte' && (
        <ReportePage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} fechaRegistro={usuario?.fecha_registro} />
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
          <h2>Historial de Síntomas</h2>
          {sintomas.length === 0 ? (
            <div className="sin-datos">
              <p>Aún no hay síntomas registrados</p>
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
          <h1>Mi Seguimiento</h1>
          <p className="subtitle">Documenta tus síntomas y tomas para tu seguimiento neurológico</p>

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
                    background: '#0D2C4D', color: '#FFFFFF',
                    border: '2px solid #FFFFFF', borderRadius: '8px',
                    fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer'
                  }}
                >
                  {formData.tipo === OTRO ? 'Otro síntoma (escríbelo aquí)' : (() => {
                    const seleccionado = tiposSintomas.find(t => t.key === formData.tipo);
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
                      background: '#0D2C4D', border: '2px solid #FFFFFF', borderRadius: '8px',
                      maxHeight: '60vh', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
                    }}
                  >
                    {renderGrupoTipos('Motores', TIPOS_MOTORES)}
                    {renderGrupoTipos('No motores', TIPOS_NO_MOTORES)}
                    <li role="option" aria-selected={formData.tipo === OTRO}>
                      <button
                        type="button"
                        onClick={() => { setFormData(prev => ({ ...prev, tipo: OTRO })); setMenuTipoAbierto(false); }}
                        style={{
                          width: '100%', textAlign: 'left', padding: '14px',
                          background: formData.tipo === OTRO ? '#00A7A7' : 'transparent',
                          color: '#FFFFFF', border: 'none', borderBottom: '1px solid #FFFFFF',
                          fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1.35
                        }}
                      >
                        Otro síntoma (escríbelo aquí)
                      </button>
                    </li>
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

            {formData.tipo === OTRO && (
              <div className="form-group">
                <label htmlFor="otro-texto">¿Qué sentiste? *</label>
                <input
                  id="otro-texto"
                  type="text"
                  maxLength={LARGO_MAX_TIPO - PREFIJO_OTRO.length}
                  value={otroTexto}
                  onChange={(e) => setOtroTexto(e.target.value)}
                  placeholder="ej. calambre en el dedo, zumbido, sensación de frío"
                />
                <p className="subtitle" style={{ fontSize: '14px', marginTop: '6px' }}>
                  Puedes anotar uno o varios síntomas con tus propias palabras; aparecerán tal como los escribas en tu seguimiento y en tu reporte.
                </p>
              </div>
            )}

            <button type="button" onClick={agregarOtroSintoma} disabled={cargando} className="btn-submit" style={{ marginBottom: '10px' }}>
              + Agregar otro síntoma
            </button>

            {pendientes.length > 0 && (
              <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                <p style={{ margin: '0 0 6px' }}>Síntomas en la lista ({pendientes.length}):</p>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  {pendientes.map((p, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      {nombreVisibleTipo(p.tipo)}, intensidad {p.intensidad}, {p.duracion}, {p.localizacion}{' '}
                      <button type="button" onClick={() => setPendientes(prev => prev.filter((_, j) => j !== i))} style={{ marginLeft: '6px' }}>
                        Quitar
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}

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
