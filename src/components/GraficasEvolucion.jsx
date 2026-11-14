import React from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine
} from 'recharts';

// Gráficas de la pestaña Evolución. Las usan Evolución y el Reporte,
// para que títulos, nombres, unidades y ejes sean idénticos en las dos pantallas.

export const COLORES_TIPO = {
  temblor: '#00A7A7',
  rigidez: '#E67E22',
  lentitud: '#8E44AD',
  equilibrio: '#27AE60',
  fatiga: '#E74C3C',
  otros: '#95A5A6'
};

export const ETIQUETAS_TIPO = {
  temblor: 'Temblor',
  rigidez: 'Rigidez',
  lentitud: 'Lentitud / Bradicinesia',
  equilibrio: 'Equilibrio',
  fatiga: 'Fatiga',
  otros: 'Otros'
};

// Una forma distinta por tipo, para no depender solo del color.
export const FORMAS_TIPO = {
  temblor: 'circulo',
  rigidez: 'cuadrado',
  lentitud: 'triangulo',
  equilibrio: 'rombo',
  fatiga: 'cruz',
  otros: 'triangulo_inv'
};

export const TITULO_EJE_FECHA = 'Fecha';
export const TITULO_EJE_INTENSIDAD = 'Intensidad (0 a 10)';
export const TITULO_EJE_REGISTROS = 'Registros por día';

export const ESTILO_TARJETA = {
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '16px',
  border: '2px solid #FFC107',
  padding: '20px',
  marginBottom: '20px'
};

export function formatFecha(fechaStr) {
  const [, mes, dia] = fechaStr.split('-');
  return `${dia}/${mes}`;
}

// "AAAA-MM-DD" -> "DD/MM/AAAA"
export function fechaCompleta(fechaStr) {
  const [a, m, d] = fechaStr.split('-');
  return `${d}/${m}/${a}`;
}

const TICK = { fill: '#FFFFFF', fontWeight: 700, fontSize: 13 };
const TITULO_EJE = { fill: '#FFFFFF', fontWeight: 700, fontSize: 12 };
const MARGEN = { top: 8, right: 12, bottom: 4, left: 4 };
const ALTO_EJE_X = 46;
const ANCHO_EJE_Y = 50;

const etiquetaX = { value: TITULO_EJE_FECHA, position: 'insideBottom', offset: 0, ...TITULO_EJE };
const etiquetaY = (texto) => ({ value: texto, angle: -90, position: 'insideLeft', offset: 14, style: { textAnchor: 'middle' }, ...TITULO_EJE });

// Dibuja una forma (círculo, cuadrado, etc.) centrada en (cx, cy).
function Forma({ forma, cx, cy, r, color, borde = '#0D2C4D' }) {
  const comun = { fill: color, stroke: borde, strokeWidth: 1.5 };
  switch (forma) {
    case 'cuadrado':
      return <rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} {...comun} />;
    case 'triangulo':
      return <polygon points={`${cx},${cy - r - 1} ${cx - r - 1},${cy + r} ${cx + r + 1},${cy + r}`} {...comun} />;
    case 'triangulo_inv':
      return <polygon points={`${cx},${cy + r + 1} ${cx - r - 1},${cy - r} ${cx + r + 1},${cy - r}`} {...comun} />;
    case 'rombo':
      return <polygon points={`${cx},${cy - r - 2} ${cx + r + 2},${cy} ${cx},${cy + r + 2} ${cx - r - 2},${cy}`} {...comun} />;
    case 'cruz': {
      const a = r + 1, g = 2.2;
      return <polygon points={`${cx - g},${cy - a} ${cx + g},${cy - a} ${cx + g},${cy - g} ${cx + a},${cy - g} ${cx + a},${cy + g} ${cx + g},${cy + g} ${cx + g},${cy + a} ${cx - g},${cy + a} ${cx - g},${cy + g} ${cx - a},${cy + g} ${cx - a},${cy - g} ${cx - g},${cy - g}`} {...comun} />;
    }
    default:
      return <circle cx={cx} cy={cy} r={r} {...comun} />;
  }
}

function crearPunto(forma, color, r = 5) {
  return function Punto(props) {
    const { cx, cy, index } = props;
    if (cx == null || cy == null) return null;
    return <Forma key={`p-${index}`} forma={forma} cx={cx} cy={cy} r={r} color={color} />;
  };
}

// Leyenda con la forma, el color y el nombre de cada serie.
function Leyenda({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginTop: '10px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
      {items.map(it => (
        <span key={it.texto} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            {it.forma === 'barra'
              ? <rect x="2" y="2" width="12" height="12" fill={it.color} stroke={it.borde || '#0D2C4D'} strokeWidth="1.5" />
              : <Forma forma={it.forma} cx={8} cy={8} r={5} color={it.color} />}
          </svg>
          {it.texto}
        </span>
      ))}
    </div>
  );
}

export const TooltipPersonalizado = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div style={{
      background: '#00A7A7',
      border: 'none',
      borderRadius: '10px',
      padding: '12px 16px',
      color: '#FFFFFF',
      fontWeight: 700,
      fontSize: '15px',
      minWidth: '160px'
    }}>
      <p style={{ margin: '0 0 8px', fontWeight: 'bold', color: '#0D2C4D' }}>
        {label && /^\d{4}-\d{2}-\d{2}$/.test(label) ? fechaCompleta(label) : label}
      </p>
      {payload.map((entry, i) => (
        <p key={i} style={{ margin: '4px 0', color: '#FFFFFF', fontWeight: 700 }}>
          {entry.name}: <strong>{entry.value}</strong>
        </p>
      ))}
    </div>
  );
};

// Tarjeta de cada gráfica: título, periodo y contenido.
function TarjetaGrafica({ titulo, periodoTxt, style, children }) {
  return (
    <div className="tarjeta-reporte grafica-evolucion" style={{ ...ESTILO_TARJETA, ...style }}>
      <h3 style={{ margin: '0 0 4px', fontSize: '16px', color: '#00A7A7' }}>{titulo}</h3>
      {periodoTxt && (
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginBottom: '12px' }}>{periodoTxt}</div>
      )}
      {children}
    </div>
  );
}

// ─── 3 tarjetas de resumen ───────────────────────────────────────
export function ResumenEvolucion({ datos }) {
  const serie = datos.serie_temporal;
  const estilo = { ...ESTILO_TARJETA, textAlign: 'center', padding: '16px', marginBottom: 0 };
  const media = serie.length > 0
    ? Math.round(serie.reduce((sum, d) => sum + d.intensidad_promedio, 0) / serie.length * 10) / 10
    : '—';
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '12px', marginBottom: '20px' }}>
      <div className="tarjeta-reporte" style={estilo}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#00A7A7' }}>{datos.total_registros}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>Registros totales</div>
      </div>
      <div className="tarjeta-reporte" style={estilo}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#E67E22' }}>{media}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>Intensidad media</div>
      </div>
      <div className="tarjeta-reporte" style={estilo}>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#8E44AD' }}>{serie.length}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>Días con registro</div>
      </div>
    </div>
  );
}

// ─── Intensidad Promedio por Día ─────────────────────────────────
export function GraficaIntensidad({ serie, vista = 'lineas', periodoTxt, animar = true, style }) {
  const ejes = [
    <CartesianGrid key="g" strokeDasharray="3 3" stroke="rgba(255,255,255,0.25)" />,
    <XAxis key="x" dataKey="fecha" tickFormatter={formatFecha} tick={TICK} interval="preserveStartEnd" height={ALTO_EJE_X} label={etiquetaX} />,
    <YAxis key="y" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={TICK} width={ANCHO_EJE_Y} label={etiquetaY(TITULO_EJE_INTENSIDAD)} />,
    <Tooltip key="t" content={<TooltipPersonalizado />} />
  ];
  return (
    <TarjetaGrafica titulo="Intensidad Promedio por Día" periodoTxt={periodoTxt} style={style}>
      <ResponsiveContainer width="100%" height={240}>
        {vista === 'lineas' ? (
          <LineChart data={serie} margin={MARGEN}>
            {ejes}
            <ReferenceLine y={5} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            <Line type="monotone" dataKey="intensidad_promedio" name="Intensidad" stroke="#FFC107" strokeWidth={4}
              dot={crearPunto('circulo', '#FFC107', 5)} activeDot={{ r: 7 }} isAnimationActive={animar} />
          </LineChart>
        ) : (
          <BarChart data={serie} margin={MARGEN}>
            {ejes}
            <Bar dataKey="intensidad_promedio" name="Intensidad" fill="#FFC107" radius={[4, 4, 0, 0]} isAnimationActive={animar} />
          </BarChart>
        )}
      </ResponsiveContainer>
      <Leyenda items={[{ forma: vista === 'lineas' ? 'circulo' : 'barra', color: '#FFC107', texto: 'Intensidad' }]} />
    </TarjetaGrafica>
  );
}

// ─── Evolución por Tipo de Síntoma ───────────────────────────────
export function GraficaPorTipo({ serie, tipos, periodoTxt, animar = true, style }) {
  const MARGEN_TIPO = { ...MARGEN, right: 128 };
  // Posición vertical aproximada del último punto de cada tipo, separada para que las etiquetas no se encimen.
  const ultimo = {};
  tipos.forEach(t => {
    for (let i = serie.length - 1; i >= 0; i--) {
      if (serie[i][`intensidad_${t}`] != null) { ultimo[t] = { i, v: serie[i][`intensidad_${t}`] }; break; }
    }
  });
  const PX_POR_UNIDAD = 15, GAP = 13;
  const orden = tipos.filter(t => ultimo[t]).sort((a, b) => ultimo[b].v - ultimo[a].v);
  const desplazamiento = {};
  let yPrevio = null;
  orden.forEach(t => {
    const yIdeal = (10 - ultimo[t].v) * PX_POR_UNIDAD;
    const y = yPrevio === null ? yIdeal : Math.max(yIdeal, yPrevio + GAP);
    desplazamiento[t] = y - yIdeal;
    yPrevio = y;
  });
  const etiquetaFinal = (tipo) => (props) => {
    const { x, y, index } = props;
    if (!ultimo[tipo] || index !== ultimo[tipo].i || x == null || y == null) return null;
    return (
      <text key={`e-${tipo}`} x={x + 10} y={y + (desplazamiento[tipo] || 0)} dy={4}
        fill="#FFFFFF" fontSize={11} fontWeight={700}>
        {ETIQUETAS_TIPO[tipo] || tipo}
      </text>
    );
  };
  return (
    <TarjetaGrafica titulo="Evolución por Tipo de Síntoma" periodoTxt={periodoTxt} style={style}>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={serie} margin={MARGEN_TIPO}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.25)" />
          <XAxis dataKey="fecha" tickFormatter={formatFecha} tick={TICK} interval="preserveStartEnd" height={ALTO_EJE_X} label={etiquetaX} />
          <YAxis domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} tick={TICK} width={ANCHO_EJE_Y} label={etiquetaY(TITULO_EJE_INTENSIDAD)} />
          <Tooltip content={<TooltipPersonalizado />} />
          {tipos.map(tipo => (
            <Line
              key={tipo}
              type="monotone"
              dataKey={`intensidad_${tipo}`}
              name={ETIQUETAS_TIPO[tipo] || tipo}
              stroke={COLORES_TIPO[tipo] || '#95A5A6'}
              strokeWidth={3}
              dot={crearPunto(FORMAS_TIPO[tipo] || 'circulo', COLORES_TIPO[tipo] || '#95A5A6', 4)}
              activeDot={{ r: 6 }}
              connectNulls
              label={etiquetaFinal(tipo)}
              isAnimationActive={animar}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
      <Leyenda items={tipos.map(t => ({ forma: FORMAS_TIPO[t] || 'circulo', color: COLORES_TIPO[t] || '#95A5A6', texto: ETIQUETAS_TIPO[t] || t }))} />
    </TarjetaGrafica>
  );
}

// ─── Frecuencia de Registros ─────────────────────────────────────
export function GraficaFrecuencia({ serie, periodoTxt, animar = true, style }) {
  return (
    <TarjetaGrafica titulo="Frecuencia de Registros" periodoTxt={periodoTxt} style={style}>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={serie} margin={MARGEN}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.25)" />
          <XAxis dataKey="fecha" tickFormatter={formatFecha} tick={TICK} interval="preserveStartEnd" height={ALTO_EJE_X} label={etiquetaX} />
          <YAxis tick={TICK} allowDecimals={false} width={ANCHO_EJE_Y} label={etiquetaY(TITULO_EJE_REGISTROS)} />
          <Tooltip content={<TooltipPersonalizado />} />
          <Bar dataKey="total_registros" name="Registros" fill="rgba(0, 167, 167,0.35)" stroke="#00A7A7" strokeWidth={1.5} radius={[3, 3, 0, 0]} isAnimationActive={animar} />
        </BarChart>
      </ResponsiveContainer>
      <Leyenda items={[{ forma: 'barra', color: 'rgba(0, 167, 167,0.35)', borde: '#00A7A7', texto: 'Registros' }]} />
    </TarjetaGrafica>
  );
}
