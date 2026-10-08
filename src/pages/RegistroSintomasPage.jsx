import React, { useState, useEffect } from 'react';
import './RegistroSintomasPage.css';

const RegistroSintomasPage = () => {
  const [formData, setFormData] = useState({
    tipo: '',
    intensidad: 3,
    duracion: 30,
    localizacion: '',
    notas: ''
  });

  const [sintomas, setSintomas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const usuarioId = 1; // Por ahora asumimos usuario_id = 1
  const apiUrl = import.meta.env.VITE_API_URL || '';

  const tiposSintomas = [
    'Temblor',
    'Rigidez',
    'Bradicinesia',
    'Inestabilidad postural',
    'Congelamiento de la marcha',
    'Distonía',
    'Discinesia',
    'Alucinaciones',
    'Depresión',
    'Ansiedad',
    'Insomnio',
    'Fatiga',
    'Dolor',
    'Estreñimiento',
    'Disfagia',
    'Problemas de visión'
  ];

  const localizaciones = [
    'Mano izquierda',
    'Mano derecha',
    'Brazo izquierdo',
    'Brazo derecho',
    'Pierna izquierda',
    'Pierna derecha',
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
      const response = await fetch(`${apiUrl}/api/sintomas/${usuarioId}`);
      if (response.ok) {
        const data = await response.json();
        setSintomas(data);
        cargarEstadisticas();
      }
    } catch (error) {
      console.error('Error cargando síntomas:', error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/sintomas/stats/${usuarioId}`);
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
      [name]: name === 'intensidad' || name === 'duracion' ? parseInt(value) : value
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

    if (formData.duracion < 1) {
      setMensaje('La duración debe ser mayor a 0');
      return;
    }

    setCargando(true);
    try {
      const response = await fetch(`${apiUrl}/api/sintomas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          usuario_id: usuarioId,
          tipo: formData.tipo,
          intensidad: formData.intensidad,
          duracion: formData.duracion,
          localizacion: formData.localizacion,
          notas: formData.notas
        })
      });

      if (response.ok) {
        setMensaje('✓ Síntoma registrado correctamente');
        setFormData({
          tipo: '',
          intensidad: 3,
          duracion: 30,
          localizacion: '',
          notas: ''
        });
        cargarSintomas();
        setTimeout(() => setMensaje(''), 3000);
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
        method: 'DELETE'
      });

      if (response.ok) {
        setMensaje('✓ Síntoma eliminado');
        cargarSintomas();
        setTimeout(() => setMensaje(''), 2000);
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

  return (
    <div className="registro-sintomas-container">
      <div className="registro-sintomas-wrapper">
        {/* Sección del formulario */}
        <div className="registro-form-section">
          <h1>📋 Registro de Síntomas</h1>
          <p className="subtitle">Documenta tus síntomas de Parkinson para seguimiento médico</p>

          {mensaje && (
            <div className={`mensaje ${mensaje.includes('Error') ? 'error' : 'exito'}`}>
              {mensaje}
            </div>
          )}

          <form onSubmit={handleSubmit} className="registro-form">
            {/* Tipo de síntoma */}
            <div className="form-group">
              <label htmlFor="tipo">Tipo de síntoma *</label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona un síntoma</option>
                {tiposSintomas.map(tipo => (
                  <option key={tipo} value={tipo}>{tipo}</option>
                ))}
              </select>
            </div>

            {/* Intensidad */}
            <div className="form-group">
              <label htmlFor="intensidad">
                Intensidad: {formData.intensidad} - {getIntensidadLabel(formData.intensidad)} *
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
              <label htmlFor="duracion">Duración (minutos) *</label>
              <input
                type="number"
                id="duracion"
                name="duracion"
                value={formData.duracion}
                onChange={handleChange}
                min="1"
                required
              />
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
              {cargando ? 'Registrando...' : '✓ Registrar síntoma'}
            </button>
          </form>
        </div>

        {/* Sección de estadísticas */}
        {estadisticas && (
          <div className="estadisticas-section">
            <h2>📊 Estadísticas</h2>
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
                <div className="stat-number">{estadisticas.duracion_promedio}m</div>
                <div className="stat-label">Duración promedio</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Síntoma frecuente</div>
                <div className="stat-number-small">{estadisticas.sintoma_mas_frecuente || '-'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sección del historial */}
      <div className="historial-section">
        <h2>📈 Historial de síntomas</h2>

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
                  <span
                    className="intensidad-badge"
                    style={{ backgroundColor: getIntensidadColor(sintoma.intensidad) }}
                  >
                    {sintoma.intensidad}/5
                  </span>
                </div>

                <div className="sintoma-details">
                  <div className="detail-item">
                    <span className="detail-label">📍 Localización:</span>
                    <span className="detail-value">{sintoma.localizacion}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">⏱️ Duración:</span>
                    <span className="detail-value">{sintoma.duracion} minutos</span>
                  </div>
                  {sintoma.notas && (
                    <div className="detail-item">
                      <span className="detail-label">📝 Notas:</span>
                      <span className="detail-value">{sintoma.notas}</span>
                    </div>
                  )}
                  <div className="detail-item">
                    <span className="detail-label">🕐 Fecha:</span>
                    <span className="detail-value">{formatearFecha(sintoma.fecha_registro)}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleEliminar(sintoma.id)}
                  className="btn-eliminar"
                >
                  🗑️ Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistroSintomasPage;
