import React, { useState, useEffect } from 'react';
import {
  ResumenEvolucion, GraficaIntensidad, GraficaPorTipo, GraficaFrecuencia,
  COLORES_TIPO, ETIQUETAS_TIPO, ESTILO_TARJETA
} from '../components/GraficasEvolucion';

// Texto del periodo que se escribe en cada gráfica
function textoPeriodo(dias) {
  const hoy = new Intl.DateTimeFormat('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date());
  return `Período: últimos ${dias} días, hasta el ${hoy}`;
}

export default function EvolucionPage({ token, apiUrl }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [diasFiltro, setDiasFiltro] = useState(30);
  const [tipoFiltro, setTipoFiltro] = useState('todos');
  const [vistaActiva, setVistaActiva] = useState('lineas'); // 'lineas' | 'barras'

  useEffect(() => {
    cargarEvolucion();
  }, [diasFiltro, tipoFiltro]);

  async function cargarEvolucion() {
    setCargando(true);
    setError(null);
    try {
      let url = `${apiUrl}/api/sintomas/evolucion?dias=${diasFiltro}`;
      if (tipoFiltro !== 'todos') url += `&tipo=${tipoFiltro}`;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('No se pudo cargar la evolución');
      const json = await res.json();
      setDatos(json);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  // ─── Estilos base ───────────────────────────────────────────────
  const estiloTarjeta = ESTILO_TARJETA;

  const estiloBtnFiltro = (activo) => ({
    padding: '8px 16px',
    borderRadius: '20px',
    border: '1px solid rgba(0, 167, 167,0.4)',
    background: activo ? '#00A7A7' : 'rgba(255,255,255,0.05)',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: activo ? '600' : '400',
    transition: 'all 0.2s ease'
  });

  // ─── Estado vacío ──────────────────────────────────────────────
  if (!cargando && datos?.total_registros === 0) {
    return (
      <div style={{ padding: '20px', color: 'white', textAlign: 'center' }}>
        <div style={estiloTarjeta}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p style={{ color: '#00A7A7', fontSize: '18px', marginBottom: '8px' }}>
            Sin datos aún en este período
          </p>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>
            Registra síntomas para ver tu evolución aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0', color: 'white' }}>

      {/* ─── Filtros ─────────────────────────────────────────────── */}
      <div style={{ ...estiloTarjeta, display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {/* Período */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Período
          </p>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[7, 14, 30, 90].map(d => (
              <button key={d} onClick={() => setDiasFiltro(d)} style={estiloBtnFiltro(diasFiltro === d)}>
                {d === 7 ? '1 sem' : d === 14 ? '2 sem' : d === 30 ? '1 mes' : '3 meses'}
              </button>
            ))}
          </div>
        </div>

        {/* Tipo de síntoma */}
        {datos?.tipos_disponibles?.length > 0 && (
          <div style={{ flex: 1, minWidth: '200px' }}>
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Síntoma
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => setTipoFiltro('todos')} style={estiloBtnFiltro(tipoFiltro === 'todos')}>
                Todos
              </button>
              {datos.tipos_disponibles.map(t => (
                <button key={t} onClick={() => setTipoFiltro(t)} style={{
                  ...estiloBtnFiltro(tipoFiltro === t),
                  borderColor: COLORES_TIPO[t] || '#00A7A7'
                }}>
                  {ETIQUETAS_TIPO[t] || t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vista */}
        <div>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'rgba(255,255,255,0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Vista
          </p>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => setVistaActiva('lineas')} style={estiloBtnFiltro(vistaActiva === 'lineas')}>
              〰 Líneas
            </button>
            <button onClick={() => setVistaActiva('barras')} style={estiloBtnFiltro(vistaActiva === 'barras')}>
              ▐ Barras
            </button>
          </div>
        </div>
      </div>

      {/* ─── Estado cargando ─────────────────────────────────────── */}
      {cargando && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.75)' }}>
          Cargando evolución...
        </div>
      )}

      {error && (
        <div style={{ ...estiloTarjeta, borderColor: '#E74C3C', color: '#E74C3C', textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* ─── Gráfica de intensidad promedio ──────────────────────── */}
      {!cargando && datos?.serie_temporal?.length > 0 && (
        <>
          <ResumenEvolucion datos={datos} />

          <GraficaIntensidad serie={datos.serie_temporal} vista={vistaActiva} periodoTxt={textoPeriodo(diasFiltro)} />

          {/* Gráfica por tipo de síntoma (solo si hay varios tipos y no se está filtrando) */}
          {tipoFiltro === 'todos' && datos.tipos_disponibles?.length > 1 && (
            <GraficaPorTipo serie={datos.serie_temporal} tipos={datos.tipos_disponibles} periodoTxt={textoPeriodo(diasFiltro)} />
          )}

          <GraficaFrecuencia serie={datos.serie_temporal} periodoTxt={textoPeriodo(diasFiltro)} />
        </>
      )}
    </div>
  );
}
