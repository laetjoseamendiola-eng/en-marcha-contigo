import React, { useId } from 'react';
import {
  ComposedChart, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

// Gráfica unificada de la pestaña Evolución. La usan Evolución y el Reporte,
// para que títulos, nombres, unidades y ejes sean idénticos en las dos pantallas.

// ─── Identidad de cada síntoma: color + forma + trazo + nombre ────
export const COLORES_TIPO = {
  temblor: '#00868A',
  rigidez: '#1F3A5F',
  lentitud: '#8E44AD',
  equilibrio: '#1E8449',
  fatiga: '#C0392B',
  otros: '#5D6D7E'
};

export const ETIQUETAS_TIPO = {
  temblor: 'Temblor',
  rigidez: 'Rigidez',
  lentitud: 'Lentitud / Bradicinesia',
  equilibrio: 'Equilibrio',
  fatiga: 'Fatiga',
  otros: 'Otros'
};

export const FORMAS_TIPO = {
  temblor: 'circulo',
  rigidez: 'cuadrado',
  lentitud: 'triangulo',
  equilibrio: 'rombo',
  fatiga: 'cruz',
  otros: 'triangulo_inv'
};

export const TRAZOS_TIPO = {
  temblor: '',
  rigidez: '10 5',
  lentitud: '2 5',
  equilibrio: '12 4 2 4',
  fatiga: '5 4',
  otros: '16 5'
};

// Para síntomas que no están en la lista fija (p. ej. Distonía): se reparten estos, en orden alfabético.
const EXTRA_FORMAS = ['estrella', 'hexagono', 'equis', 'rombo', 'cuadrado', 'triangulo', 'cruz', 'circulo'];
const EXTRA_TRAZOS = ['8 3 2 3 2 3', '3 3', '14 3', '6 2 1 2', '10 5', '2 5', '5 4', ''];
const EXTRA_COLORES = ['#B9770E', '#2E86C1', '#7D3C98', '#117A65', '#A04000', '#34495E', '#CB4335', '#B7950B'];

// "dolor_de_cabeza" -> "Dolor de cabeza"
const NOMBRES_CONOCIDOS = { distonia: 'Distonía', bradicinesia: 'Bradicinesia', discinesia: 'Discinesia', disfagia: 'Disfagia' };
function nombreBonito(tipo) {
  if (NOMBRES_CONOCIDOS[String(tipo).toLowerCase()]) return NOMBRES_CONOCIDOS[String(tipo).toLowerCase()];
  const t = String(tipo).replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Devuelve { clave: { nombre, color, forma, trazo } } para todos los síntomas pedidos.
export function estiloDeTipos(tipos) {
  const estilos = {};
  let i = 0;
  [...tipos].sort().forEach(t => {
    if (ETIQUETAS_TIPO[t]) {
      estilos[t] = { nombre: ETIQUETAS_TIPO[t], color: COLORES_TIPO[t], forma: FORMAS_TIPO[t], trazo: TRAZOS_TIPO[t] };
    } else {
      estilos[t] = {
        nombre: nombreBonito(t),
        color: EXTRA_COLORES[i % EXTRA_COLORES.length],
        forma: EXTRA_FORMAS[i % EXTRA_FORMAS.length],
        trazo: EXTRA_TRAZOS[i % EXTRA_TRAZOS.length]
      };
      i++;
    }
  });
  return estilos;
}

export const TITULO_EJE_FECHA = 'Fecha';
export const TITULO_EJE_INTENSIDAD = 'Intensidad (0 a 10)';
export const TITULO_EJE_REGISTROS = 'Registros por día';
export const TITULO_EJE_REGISTROS_SEMANA = 'Registros por semana';

export const ESTILO_TARJETA = {
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '16px',
  border: '2px solid #FFC107',
  padding: '20px',
  marginBottom: '20px'
};

// "AAAA-MM-DD" -> "DD/MM"
export function formatFecha(fechaStr) {
  const [, mes, dia] = fechaStr.split('-');
  return `${dia}/${mes}`;
}

// "AAAA-MM-DD" -> "DD/MM/AAAA"
export function fechaCompleta(fechaStr) {
  const [a, m, d] = fechaStr.split('-');
  return `${d}/${m}/${a}`;
}

// Lunes de la semana de una fecha "AAAA-MM-DD"
function lunesDe(fechaStr) {
  const [a, m, d] = fechaStr.split('-').map(Number);
  const f = new Date(a, m - 1, d, 12);
  const dif = (f.getDay() + 6) % 7; // lunes = 0
  f.setDate(f.getDate() - dif);
  const p2 = n => String(n).padStart(2, '0');
  return `${f.getFullYear()}-${p2(f.getMonth() + 1)}-${p2(f.getDate())}`;
}

const MAX_SERIES = 6;       // si hay más, se muestran 5 y el resto va en «Otros»
const DIAS_MAX_DIARIO = 31; // si el periodo es más largo, se agrupa por semana

// Convierte la respuesta de la API en filas listas para graficar.
// Cada síntoma solo tiene valor en los días (o semanas) en que tiene registros; en los demás, null.
export function prepararDatos(serie, tipos, dias) {
  const semanal = dias > DIAS_MAX_DIARIO;
  const conteo = (fila, t) => (fila[`n_${t}`] != null ? fila[`n_${t}`] : (fila[`intensidad_${t}`] != null ? 1 : 0));

  // 1. Qué síntomas se muestran (los 5 más registrados + «Otros» si hay más de 6)
  const total = {};
  tipos.forEach(t => { total[t] = serie.reduce((s, f) => s + conteo(f, t), 0); });
  let grupoDe = {};
  let claves;
  if (tipos.length > MAX_SERIES) {
    const orden = [...tipos].sort((a, b) => total[b] - total[a] || a.localeCompare(b));
    const visibles = orden.slice(0, MAX_SERIES - 1);
    tipos.forEach(t => { grupoDe[t] = visibles.includes(t) ? t : 'otros'; });
    claves = [...visibles];
    if (!claves.includes('otros')) claves.push('otros');
  } else {
    tipos.forEach(t => { grupoDe[t] = t; });
    claves = [...tipos];
  }

  // 2. Agrupar por día o por semana, con promedio ponderado por número de registros
  const cubos = new Map();
  serie.forEach(f => {
    const clave = semanal ? lunesDe(f.fecha) : f.fecha;
    if (!cubos.has(clave)) {
      cubos.set(clave, { clave, sumaProm: 0, nProm: 0, registros: 0, por: {} });
    }
    const c = cubos.get(clave);
    const nDia = f.total_registros || 0;
    c.sumaProm += (f.intensidad_promedio || 0) * nDia;
    c.nProm += nDia;
    c.registros += nDia;
    tipos.forEach(t => {
      const v = f[`intensidad_${t}`];
      const n = conteo(f, t);
      if (v == null || n === 0) return;
      const g = grupoDe[t];
      if (!c.por[g]) c.por[g] = { suma: 0, n: 0 };
      c.por[g].suma += v * n;
      c.por[g].n += n;
    });
  });

  const redondea = x => Math.round(x * 10) / 10;
  const filas = [...cubos.values()]
    .sort((a, b) => (a.clave < b.clave ? -1 : 1))
    .map(c => {
      const fila = {
        fecha: c.clave,
        promedio: c.nProm > 0 ? redondea(c.sumaProm / c.nProm) : null,
        registros: c.registros
      };
      claves.forEach(k => {
        fila[`s_${k}`] = c.por[k] && c.por[k].n > 0 ? redondea(c.por[k].suma / c.por[k].n) : null;
      });
      return fila;
    });
  return { filas, claves, semanal };
}

// ─── Formas para los puntos ─────────────────────────────────────
function Forma({ forma, cx, cy, r, color, borde = '#1a1a2e', relleno }) {
  const comun = { fill: relleno || color, stroke: borde, strokeWidth: 1.5 };
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
    case 'equis': {
      const a = r + 1, g = 2.2;
      return <polygon points={`${cx - g},${cy - a} ${cx + g},${cy - a} ${cx + g},${cy - g} ${cx + a},${cy - g} ${cx + a},${cy + g} ${cx + g},${cy + g} ${cx + g},${cy + a} ${cx - g},${cy + a} ${cx - g},${cy + g} ${cx - a},${cy + g} ${cx - a},${cy - g} ${cx - g},${cy - g}`} {...comun} transform={`rotate(45 ${cx} ${cy})`} />;
    }
    case 'estrella': {
      const R = r + 3, rr = (r + 3) * 0.45;
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const ang = -Math.PI / 2 + (i * Math.PI) / 5;
        const rad = i % 2 === 0 ? R : rr;
        pts.push(`${cx + rad * Math.cos(ang)},${cy + rad * Math.sin(ang)}`);
      }
      return <polygon points={pts.join(' ')} {...comun} />;
    }
    case 'hexagono': {
      const R = r + 2;
      const pts = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i * Math.PI) / 3;
        pts.push(`${cx + R * Math.cos(ang)},${cy + R * Math.sin(ang)}`);
      }
      return <polygon points={pts.join(' ')} {...comun} />;
    }
    default:
      return <circle cx={cx} cy={cy} r={r} {...comun} />;
  }
}

function crearPunto(forma, color, r = 5, relleno) {
  return function Punto(props) {
    const { cx, cy, index } = props;
    if (cx == null || cy == null) return null;
    return <Forma key={`p-${index}`} forma={forma} cx={cx} cy={cy} r={r} color={color} relleno={relleno} />;
  };
}

// ─── Leyenda única ───────────────────────────────────────────────
function Leyenda({ claves, estilos, tituloRegistros, idRayas }) {
  const item = { display: 'inline-flex', alignItems: 'center', gap: '6px' };
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 18px', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: '#1a1a2e' }}>
      {claves.map(k => {
        const e = estilos[k];
        return (
          <span key={k} style={item}>
            <svg width="40" height="18" viewBox="0 0 40 18" aria-hidden="true">
              <line x1="1" y1="9" x2="39" y2="9" stroke={e.color} strokeWidth="3" strokeDasharray={e.trazo || undefined} />
              <Forma forma={e.forma} cx={20} cy={9} r={5} color={e.color} />
            </svg>
            {e.nombre}
          </span>
        );
      })}
      <span style={item}>
        <svg width="40" height="18" viewBox="0 0 40 18" aria-hidden="true">
          <line x1="1" y1="9" x2="39" y2="9" stroke="#000" strokeWidth="4" strokeDasharray="2 4" strokeLinecap="round" />
          <circle cx="20" cy="9" r="4" fill="#fff" stroke="#000" strokeWidth="1.5" />
        </svg>
        Promedio
      </span>
      <span style={item}>
        <svg width="22" height="18" viewBox="0 0 22 18" aria-hidden="true">
          <rect x="2" y="2" width="18" height="14" fill="#D9D9D9" stroke="#8A8A8A" strokeWidth="1.2" />
          <path d="M2 16 L20 2 M2 10 L11 2 M11 16 L20 8" stroke="#8A8A8A" strokeWidth="1" />
        </svg>
        {tituloRegistros}
      </span>
    </div>
  );
}

// ─── Tarjeta ─────────────────────────────────────────────────────
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

// ─── Gráfica unificada ───────────────────────────────────────────
const TINTA = '#1a1a2e';
const TICK = { fill: TINTA, fontWeight: 600, fontSize: 12 };
const TITULO_EJE = { fill: TINTA, fontWeight: 600, fontSize: 12 };
const ALTO = 400;
const MARGEN = { top: 12, right: 8, bottom: 4, left: 4 };

export function GraficaUnificada({ serie, tipos, dias, periodoTxt, animar = true, style }) {
  const idRayas = 'rayas-' + useId().replace(/:/g, '');
  const { filas, claves, semanal } = prepararDatos(serie, tipos, dias);
  const estilos = estiloDeTipos(claves);
  const tituloRegistros = semanal ? TITULO_EJE_REGISTROS_SEMANA : TITULO_EJE_REGISTROS;
  const nombreRegistros = tituloRegistros;
  const maxReg = Math.max(1, ...filas.map(f => f.registros));
  const topeDerecho = Math.max(4, Math.ceil(maxReg * 2));
  const altoEjeX = semanal ? 86 : 44;
  const altoPlot = ALTO - MARGEN.top - MARGEN.bottom - altoEjeX;
  const pxPorUnidad = altoPlot / 10;

  // Último punto de cada síntoma, para escribir su nombre sin que se encimen.
  const ultimo = {};
  claves.forEach(k => {
    for (let i = filas.length - 1; i >= 0; i--) {
      if (filas[i][`s_${k}`] != null) { ultimo[k] = { i, v: filas[i][`s_${k}`] }; break; }
    }
  });
  const GAP = 14;
  const desplazamiento = {};
  let yPrevio = null;
  claves.filter(k => ultimo[k])
    .sort((a, b) => ultimo[b].v - ultimo[a].v)
    .forEach(k => {
      const yIdeal = (10 - ultimo[k].v) * pxPorUnidad;
      const y = yPrevio === null ? yIdeal : Math.max(yIdeal, yPrevio + GAP);
      desplazamiento[k] = y - yIdeal;
      yPrevio = y;
    });
  const etiquetaFinal = (k) => (props) => {
    const { x, y, index } = props;
    if (!ultimo[k] || index !== ultimo[k].i || x == null || y == null) return null;
    return (
      <text key={`e-${k}`} x={x + 4} y={y - 12 + (desplazamiento[k] || 0)} textAnchor="end"
        fill={estilos[k].color} fontSize={12} fontWeight={800}
        stroke="#FFFFFF" strokeWidth={3} paintOrder="stroke">
        {estilos[k].nombre}
      </text>
    );
  };

  const formatoX = (f) => (semanal ? `Semana del ${formatFecha(f)}` : formatFecha(f));

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const fila = payload[0].payload;
    return (
      <div style={{ background: '#FFFFFF', border: '2px solid #1a1a2e', borderRadius: '10px', padding: '10px 14px', color: TINTA, fontSize: '13px', fontWeight: 700, minWidth: '170px' }}>
        <p style={{ margin: '0 0 6px', fontWeight: 800 }}>{semanal ? `Semana del ${fechaCompleta(label)}` : fechaCompleta(label)}</p>
        {claves.filter(k => fila[`s_${k}`] != null).map(k => (
          <p key={k} style={{ margin: '3px 0', color: estilos[k].color }}>{estilos[k].nombre}: <strong>{fila[`s_${k}`]}</strong></p>
        ))}
        {fila.promedio != null && <p style={{ margin: '3px 0' }}>Promedio: <strong>{fila.promedio}</strong></p>}
        <p style={{ margin: '3px 0', color: '#555' }}>{nombreRegistros}: <strong>{fila.registros}</strong></p>
      </div>
    );
  };

  return (
    <TarjetaGrafica titulo="Evolución de síntomas" periodoTxt={periodoTxt} style={style}>
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '14px 10px 8px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <Leyenda claves={claves} estilos={estilos} tituloRegistros={tituloRegistros} />
        <ResponsiveContainer width="100%" height={ALTO}>
          <ComposedChart data={filas} margin={MARGEN}>
            <defs>
              <pattern id={idRayas} width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="8" height="8" fill="#E3E3E3" />
                <line x1="0" y1="0" x2="0" y2="8" stroke="#9A9A9A" strokeWidth="2" />
              </pattern>
            </defs>
            <CartesianGrid stroke="#CCCCCC" strokeDasharray="1 3" vertical={false} />
            <XAxis
              dataKey="fecha"
              tickFormatter={formatoX}
              tick={semanal ? { ...TICK, textAnchor: 'end' } : TICK}
              angle={semanal ? -35 : 0}
              interval="preserveStartEnd"
              minTickGap={semanal ? 18 : 14}
              height={altoEjeX}
              padding={{ left: 14, right: 14 }}
              label={{ value: TITULO_EJE_FECHA, position: 'insideBottom', offset: 0, ...TITULO_EJE }}
            />
            <YAxis
              yAxisId="izq"
              domain={[0, 10]}
              ticks={[0, 2, 4, 6, 8, 10]}
              tick={TICK}
              width={48}
              label={{ value: TITULO_EJE_INTENSIDAD, angle: -90, position: 'insideLeft', offset: 8, style: { textAnchor: 'middle' }, ...TITULO_EJE }}
            />
            <YAxis
              yAxisId="der"
              orientation="right"
              domain={[0, topeDerecho]}
              allowDecimals={false}
              tick={TICK}
              width={48}
              label={{ value: tituloRegistros, angle: 90, position: 'insideRight', offset: 8, style: { textAnchor: 'middle' }, ...TITULO_EJE }}
            />
            <Tooltip content={<Tip />} />
            <Bar yAxisId="der" dataKey="registros" name={nombreRegistros} fill={`url(#${idRayas})`} stroke="#8A8A8A" strokeWidth={1}
              maxBarSize={48} isAnimationActive={animar} />
            {claves.map(k => (
              <Line
                key={k}
                yAxisId="izq"
                type="linear"
                dataKey={`s_${k}`}
                name={estilos[k].nombre}
                stroke={estilos[k].color}
                strokeWidth={3}
                strokeDasharray={estilos[k].trazo || undefined}
                dot={crearPunto(estilos[k].forma, estilos[k].color, 5)}
                activeDot={{ r: 7 }}
                connectNulls
                label={etiquetaFinal(k)}
                isAnimationActive={animar}
              />
            ))}
            <Line
              yAxisId="izq"
              type="linear"
              dataKey="promedio"
              name="Promedio"
              stroke="#000000"
              strokeWidth={4}
              strokeDasharray="2 5"
              strokeLinecap="round"
              dot={crearPunto('circulo', '#000000', 4, '#FFFFFF')}
              activeDot={{ r: 6 }}
              connectNulls
              isAnimationActive={animar}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </TarjetaGrafica>
  );
}
