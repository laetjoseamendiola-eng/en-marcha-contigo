import { PALETA } from '../paleta.js';
import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

// Colores por tipo de síntoma
const COLORES_TIPO = {
  temblor: PALETA.turquesa,
  rigidez: PALETA.naranja,
  lentitud: PALETA.morado,
  equilibrio: PALETA.verde,
  fatiga: PALETA.rojo,
  otros: PALETA.grisOtros
};

const ETIQUETAS_TIPO = {
  temblor: 'Temblor',
  rigidez: 'Rigidez',
  lentitud: 'Lentitud / Bradicinesia',
  equilibrio: 'Equilibrio',
  fatiga: 'Fatiga',
  otros: 'Otros'
};

// Tooltip personalizado con tipografía accesible
const TooltipPersonalizado = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: PALETA.turquesaFondo,
      border: `2px solid ${PALETA.amarillo}`,
      borderRadius: '10px',
      padding: '12px 16px',
      color: PALETA.blanco,
      fontSize: '14px',
      minWidth: '160px'
    }}>
      <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: PALETA.navy, WebkitTextStroke: `1px ${PALETA.blanco}`, paintOrder: 'stroke fill' }}>
        {label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: '4px 0', color: entry.color }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

// Formato de fecha corto para el eje X
function formatFecha(fechaStr) {
  const [, mes, dia] = fechaStr.split('-');
  return `${dia}/${mes}`;
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
  const estiloTarjeta = {
    background: PALETA.blanco,
    borderRadius: '16px',
    border: '1px solid rgba(42,172,176,0.2)',
    padding: '20px',
    marginBottom: '20px'
  };

    const estiloBtnFiltro = (activo) => ({
    padding: '8px 16px',
    border: 'none',
    borderBottom: activo ? `3px solid ${PALETA.blanco}` : '3px solid transparent',
    background: 'transparent',
    color: PALETA.blanco,
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s'
  });

  // ─── Estado vacío ──────────────────────────────────────────────
  if (!cargando && datos?.total_registros === 0) {
    return (
      <div style={{ padding: '20px', color: PALETA.navy, textAlign: 'center' }}>
        <div style={estiloTarjeta}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📊</div>
          <p style={{ color: PALETA.navy, WebkitTextStroke: `2px ${PALETA.blanco}`, paintOrder: 'stroke fill', fontSize: '18px', marginBottom: '8px' }}>
            Sin datos aún en este período
          </p>
          <p style={{ color: PALETA.grisTexto, fontSize: '14px' }}>
            Registra síntomas para ver tu evolución aquí
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 0', color: PALETA.navy }}>

      {/* ─── Filtros ─────────────────────────────────────────────── */}
      <div style={{ ...estiloTarjeta, display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
        {/* Período */}
        <div style={{ flex: 1, minWidth: '200px' }}>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: PALETA.navy, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
            <p style={{ margin: '0 0 8px', fontSize: '12px', color: PALETA.navy, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Síntoma
            </p>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={() => setTipoFiltro('todos')} style={estiloBtnFiltro(tipoFiltro === 'todos')}>
                Todos
              </button>
              {datos.tipos_disponibles.map(t => (
                <button key={t} onClick={() => setTipoFiltro(t)} style={{
                  ...estiloBtnFiltro(tipoFiltro === t),
                  borderColor: COLORES_TIPO[t] || PALETA.turquesa
                }}>
                  {ETIQUETAS_TIPO[t] || t}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Vista */}
        <div>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: PALETA.navy, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
        <div style={{ textAlign: 'center', padding: '40px', color: PALETA.navy }}>
          Cargando evolución...
        </div>
      )}

      {error && (
        <div style={{ ...estiloTarjeta, borderColor: PALETA.rojo, color: PALETA.rojo, textAlign: 'center' }}>
          {error}
        </div>
      )}

      {/* ─── Gráfica de intensidad promedio ──────────────────────── */}
      {!cargando && datos?.serie_temporal?.length > 0 && (
        <>
          {/* Resumen rápido */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
            <div style={{ ...estiloTarjeta, textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: PALETA.blanco }}>
                {datos.total_registros}
              </div>
              <div style={{ fontSize: '12px', color: PALETA.navy, marginTop: '4px' }}>
                Registros totales
              </div>
            </div>
            <div style={{ ...estiloTarjeta, textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: PALETA.naranja }}>
                {datos.serie_temporal.length > 0
                  ? Math.round(
                      datos.serie_temporal.reduce((sum, d) => sum + d.intensidad_promedio, 0) /
                      datos.serie_temporal.length * 10
                    ) / 10
                  : '—'}
              </div>
              <div style={{ fontSize: '12px', color: PALETA.navy, marginTop: '4px' }}>
                Intensidad media
              </div>
            </div>
            <div style={{ ...estiloTarjeta, textAlign: 'center', padding: '16px' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: PALETA.morado }}>
                {datos.serie_temporal.length}
              </div>
              <div style={{ fontSize: '12px', color: PALETA.navy, marginTop: '4px' }}>
                Días con registro
              </div>
            </div>
          </div>

          {/* Gráfica principal: intensidad promedio diaria */}
          <div style={estiloTarjeta}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: PALETA.navy, WebkitTextStroke: `2px ${PALETA.blanco}`, paintOrder: 'stroke fill' }}>
              Intensidad promedio por día
            </h3>
            <ResponsiveContainer width="100%" height={220}>
              {vistaActiva === 'lineas' ? (
                <LineChart data={datos.serie_temporal} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETA.blanco} />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={formatFecha}
                    tick={{ fill: PALETA.blanco, fontWeight: 700, fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: PALETA.blanco, fontWeight: 700, fontSize: 11 }}
                    ticks={[0, 2, 4, 6, 8, 10]}
                  />
                  <Tooltip content={<TooltipPersonalizado />} />
                  <ReferenceLine y={5} stroke={PALETA.blanco} strokeDasharray="4 4" />
                  <Line
                    type="monotone"
                    dataKey="intensidad_promedio"
                    name="Intensidad"
                    stroke={PALETA.amarillo}
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: PALETA.turquesa, stroke: PALETA.navy, strokeWidth: 2 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              ) : (
                <BarChart data={datos.serie_temporal} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETA.blanco} />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={formatFecha}
                    tick={{ fill: PALETA.blanco, fontWeight: 700, fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: PALETA.blanco, fontWeight: 700, fontSize: 11 }}
                  />
                  <Tooltip content={<TooltipPersonalizado />} />
                  <Bar dataKey="intensidad_promedio" name="Intensidad" fill={PALETA.amarillo} radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Gráfica por tipo de síntoma (solo si hay varios tipos y no se está filtrando) */}
          {tipoFiltro === 'todos' && datos.tipos_disponibles?.length > 1 && (
            <div style={estiloTarjeta}>
              <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: PALETA.navy, WebkitTextStroke: `2px ${PALETA.blanco}`, paintOrder: 'stroke fill' }}>
                Evolución por tipo de síntoma
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={datos.serie_temporal} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={PALETA.blanco} />
                  <XAxis
                    dataKey="fecha"
                    tickFormatter={formatFecha}
                    tick={{ fill: PALETA.blanco, fontWeight: 700, fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fill: PALETA.blanco, fontWeight: 700, fontSize: 11 }}
                  />
                  <Tooltip content={<TooltipPersonalizado />} />
                  <Legend
                    wrapperStyle={{ color: PALETA.navy, fontSize: '12px', paddingTop: '8px' }}
                    formatter={(value) => ETIQUETAS_TIPO[value.replace('intensidad_', '')] || value}
                  />
                  {datos.tipos_disponibles.map(tipo => (
                    <Line
                      key={tipo}
                      type="monotone"
                      dataKey={`intensidad_${tipo}`}
                      name={`intensidad_${tipo}`}
                      stroke={COLORES_TIPO[tipo] || PALETA.grisOtros}
                      strokeWidth={2}
                      dot={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Frecuencia de registros por día */}
          <div style={estiloTarjeta}>
            <h3 style={{ margin: '0 0 16px', fontSize: '16px', color: PALETA.navy, WebkitTextStroke: `2px ${PALETA.blanco}`, paintOrder: 'stroke fill' }}>
              Frecuencia de registros
            </h3>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={datos.serie_temporal} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={PALETA.blanco} />
                <XAxis
                  dataKey="fecha"
                  tickFormatter={formatFecha}
                  tick={{ fill: PALETA.blanco, fontWeight: 700, fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis tick={{ fill: PALETA.blanco, fontWeight: 700, fontSize: 11 }} allowDecimals={false} />
                <Tooltip content={<TooltipPersonalizado />} />
                <Bar dataKey="total_registros" name="Registros" fill="rgba(42,172,176,0.35)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
