import React from 'react';
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
  lentitud: 'Bradicinesia',
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

// "dolor_de_cabeza" -> "Dolor de cabeza"
const NOMBRES_CONOCIDOS = { distonia: 'Distonía', bradicinesia: 'Bradicinesia', discinesia: 'Discinesia', disfagia: 'Disfagia' };
export function nombreSintoma(tipo) {
  const k = String(tipo).toLowerCase();
  if (ETIQUETAS_TIPO[k]) return ETIQUETAS_TIPO[k];
  if (NOMBRES_CONOCIDOS[k]) return NOMBRES_CONOCIDOS[k];
  const t = String(tipo).replace(/_/g, ' ').trim();
  return t.charAt(0).toUpperCase() + t.slice(1);
}

// Las 5 posiciones de cada gráfica: cada una se dibuja distinto, para distinguirlas sin color.
export const REPRESENTACIONES = [
  { id: 'linea',    texto: 'línea continua con círculos',      forma: 'circulo',   tipoLinea: 'linear',    trazo: '',      linea: true },
  { id: 'curva',    texto: 'curva suave con cuadrados',        forma: 'cuadrado',  tipoLinea: 'monotone',  trazo: '6 4',   linea: true },
  { id: 'puntos',   texto: 'puntos de dispersión (triángulos)', forma: 'triangulo', tipoLinea: 'linear',    trazo: '',      linea: false },
  { id: 'palitos',  texto: 'palitos con rombo',                forma: 'rombo',     tipoLinea: 'linear',    trazo: '',      linea: false, palitos: true },
  { id: 'escalon',  texto: 'escalones de guiones con estrellas', forma: 'estrella',  tipoLinea: 'stepAfter', trazo: '8 5',   linea: true },
];
export const SINTOMAS_POR_GRAFICA = 5;

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
export function lunesDe(fechaStr) {
  const [a, m, d] = fechaStr.split('-').map(Number);
  const f = new Date(a, m - 1, d, 12);
  const dif = (f.getDay() + 6) % 7; // lunes = 0
  f.setDate(f.getDate() - dif);
  const p2 = n => String(n).padStart(2, '0');
  return `${f.getFullYear()}-${p2(f.getMonth() + 1)}-${p2(f.getDate())}`;
}

const DIAS_MAX_DIARIO = 31; // si el periodo es más largo, se agrupa por semana

const conteoDe = (fila, t) => (fila[`n_${t}`] != null ? fila[`n_${t}`] : (fila[`intensidad_${t}`] != null ? 1 : 0));

// Síntomas del periodo, de más a menos registros (empates: orden alfabético).
export function ordenarSintomas(serie, tipos) {
  const total = {};
  tipos.forEach(t => { total[t] = serie.reduce((s, f) => s + conteoDe(f, t), 0); });
  return [...tipos].sort((a, b) => total[b] - total[a] || a.localeCompare(b));
}

// Datos de la tabla: registros, intensidad promedio y máxima de cada síntoma (en todo el periodo).
export function resumenPorSintoma(serie, tipos) {
  const filas = ordenarSintomas(serie, tipos).map(t => {
    let n = 0, suma = 0, max = null;
    serie.forEach(f => {
      const v = f[`intensidad_${t}`];
      if (v == null) return;
      const c = conteoDe(f, t);
      n += c; suma += v * c;
      const m = f[`max_${t}`] != null ? f[`max_${t}`] : v;
      if (max === null || m > max) max = m;
    });
    return { tipo: t, nombre: nombreSintoma(t), registros: n, promedio: n ? Math.round(suma / n * 10) / 10 : null, maximo: max };
  });
  return filas;
}

// Filas para graficar: una por día (o por semana si el periodo pasa de 31 días).
// Cada síntoma solo tiene valor donde tiene registros; en los demás, null.
export function prepararDatos(serie, tipos, dias) {
  const semanal = dias > DIAS_MAX_DIARIO;
  const cubos = new Map();
  serie.forEach(f => {
    const clave = semanal ? lunesDe(f.fecha) : f.fecha;
    if (!cubos.has(clave)) cubos.set(clave, { clave, por: {} });
    const c = cubos.get(clave);
    tipos.forEach(t => {
      const v = f[`intensidad_${t}`];
      const n = conteoDe(f, t);
      if (v == null || n === 0) return;
      if (!c.por[t]) c.por[t] = { suma: 0, n: 0 };
      c.por[t].suma += v * n;
      c.por[t].n += n;
    });
  });
  const redondea = x => Math.round(x * 10) / 10;
  const filas = [...cubos.values()]
    .sort((a, b) => (a.clave < b.clave ? -1 : 1))
    .map(c => {
      const fila = { fecha: c.clave };
      tipos.forEach(t => {
        fila[`s_${t}`] = c.por[t] && c.por[t].n > 0 ? redondea(c.por[t].suma / c.por[t].n) : null;
      });
      return fila;
    });
  return { filas, semanal };
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


const TINTA = '#1a1a2e';

// ─── Leyenda de una gráfica: representación + nombre ─────────────
function MuestraRep({ rep }) {
  return (
    <svg width="44" height="20" viewBox="0 0 44 20" aria-hidden="true">
      {rep.linea && (
        <path d={rep.tipoLinea === 'monotone' ? 'M2 14 C 12 2, 20 2, 22 10 S 34 18, 42 6'
          : rep.tipoLinea === 'stepAfter' ? 'M2 14 H14 V6 H30 V12 H42' : 'M2 12 L22 8 L42 12'}
          fill="none" stroke={TINTA} strokeWidth="2.5" strokeDasharray={rep.trazo || undefined} />
      )}
      {rep.palitos && <line x1="22" y1="18" x2="22" y2="8" stroke={TINTA} strokeWidth="3" />}
      <Forma forma={rep.forma} cx={22} cy={rep.palitos ? 8 : 10} r={5} color={TINTA} borde="#FFFFFF" />
    </svg>
  );
}

function Leyenda({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 18px', marginBottom: '8px', fontSize: '13px', fontWeight: 700, color: TINTA }}>
      {items.map(({ rep, nombre }) => (
        <span key={nombre} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <MuestraRep rep={rep} />
          {nombre}
        </span>
      ))}
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

// ─── Una gráfica con hasta 5 síntomas ────────────────────────────
const TICK = { fill: TINTA, fontWeight: 600, fontSize: 12 };
const TITULO_EJE = { fill: TINTA, fontWeight: 600, fontSize: 12 };
const ALTO = 340;
const MARGEN = { top: 12, right: 14, bottom: 4, left: 4 };

function GraficaCinco({ filas, semanal, grupo, titulo, periodoTxt, animar, style,
  nombreDe = nombreSintoma, maximo = 10, ticks = [0, 2, 4, 6, 8, 10], tituloY = TITULO_EJE_INTENSIDAD, alto = ALTO, etiquetas = true }) {
  const altoEjeX = semanal ? 86 : 44;
  const altoPlot = alto - MARGEN.top - MARGEN.bottom - altoEjeX;
  const pxPorUnidad = altoPlot / maximo;

  // Último punto de cada síntoma: ahí se escribe su nombre, separado de los demás.
  const ultimo = {};
  grupo.forEach(k => {
    for (let i = filas.length - 1; i >= 0; i--) {
      if (filas[i][`s_${k}`] != null) { ultimo[k] = { i, v: filas[i][`s_${k}`] }; break; }
    }
  });
  // Las etiquetas van encima de su último punto; si chocan, se apilan hacia arriba.
  const GAP = 14;
  const posEtiqueta = {};
  let yPrevio = null;
  grupo.filter(k => ultimo[k])
    .sort((a, b) => ultimo[a].v - ultimo[b].v)
    .forEach(k => {
      const yIdeal = (maximo - ultimo[k].v) * pxPorUnidad - 14;
      const y = yPrevio === null ? yIdeal : Math.min(yIdeal, yPrevio - GAP);
      posEtiqueta[k] = y;
      yPrevio = y;
    });
  // Si algún nombre es largo o ya no cabe al apilarlos, no se escriben en la gráfica: quedan solo en la leyenda.
  const cabenEtiquetas = etiquetas
    && grupo.every(k => nombreDe(k).length <= 18)
    && Object.values(posEtiqueta).every(y => y >= -4);
  const etiquetaFinal = (k) => (props) => {
    const { x, y, index } = props;
    if (!cabenEtiquetas || !ultimo[k] || index !== ultimo[k].i || x == null || y == null) return null;
    const yIdeal = (maximo - ultimo[k].v) * pxPorUnidad - 14;
    return (
      <text key={`e-${k}`} x={x + 4} y={y + (posEtiqueta[k] - yIdeal) - 14} textAnchor="end"
        fill={TINTA} fontSize={12} fontWeight={800}
        stroke="#FFFFFF" strokeWidth={3} paintOrder="stroke">
        {nombreDe(k)}
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
        {grupo.filter(k => fila[`s_${k}`] != null).map(k => (
          <p key={k} style={{ margin: '3px 0' }}>{nombreDe(k)}: <strong>{fila[`s_${k}`]}</strong></p>
        ))}
      </div>
    );
  };

  const puntos = (rep) => crearPunto(rep.forma, TINTA, rep.id === 'puntos' ? 6 : 5);

  return (
    <TarjetaGrafica titulo={titulo} periodoTxt={periodoTxt} style={style}>
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '14px 10px 8px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <Leyenda items={grupo.map((k, i) => ({ rep: REPRESENTACIONES[i], nombre: nombreDe(k) }))} />
        <ResponsiveContainer width="100%" height={alto}>
          <ComposedChart data={filas} margin={MARGEN}>
            <CartesianGrid stroke="#BBBBBB" strokeDasharray="1 3" vertical={false} />
            <XAxis
              dataKey="fecha"
              tickFormatter={formatoX}
              tick={semanal ? { ...TICK, textAnchor: 'end' } : TICK}
              angle={semanal ? -35 : 0}
              interval={Math.max(0, Math.ceil(filas.length / (semanal ? 6 : 8)) - 1)}
              height={altoEjeX}
              padding={{ left: semanal ? 36 : 14, right: 14 }}
              label={{ value: TITULO_EJE_FECHA, position: 'insideBottom', offset: 0, ...TITULO_EJE }}
            />
            <YAxis
              domain={[0, maximo]}
              ticks={ticks}
              tick={TICK}
              width={48}
              label={{ value: tituloY, angle: -90, position: 'insideLeft', offset: 8, style: { textAnchor: 'middle' }, ...TITULO_EJE }}
            />
            <Tooltip content={<Tip />} />
            {grupo.map((k, i) => {
              const rep = REPRESENTACIONES[i];
              const comunes = { dataKey: `s_${k}`, name: nombreDe(k), isAnimationActive: animar };
              if (rep.palitos) {
                return [
                  <Bar key={`b-${k}`} {...comunes} barSize={3} fill={TINTA} stroke="none" />,
                  <Line key={`l-${k}`} {...comunes} stroke="none" strokeWidth={0} dot={puntos(rep)} activeDot={{ r: 7 }}
                    legendType="none" label={etiquetaFinal(k)} />
                ];
              }
              return (
                <Line key={`l-${k}`} {...comunes}
                  type={rep.tipoLinea}
                  stroke={rep.linea ? TINTA : 'none'}
                  strokeWidth={rep.linea ? 3 : 0}
                  strokeDasharray={rep.trazo || undefined}
                  dot={puntos(rep)}
                  activeDot={{ r: 7 }}
                  connectNulls
                  label={etiquetaFinal(k)} />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </TarjetaGrafica>
  );
}

// ─── Tabla con TODOS los síntomas ────────────────────────────────
export function TablaSintomas({ serie, tipos, periodoTxt, style }) {
  const filas = resumenPorSintoma(serie, tipos);
  const celda = { padding: '8px 10px', borderTop: '1px solid #999999', color: TINTA, fontSize: '13px' };
  const cab = { padding: '8px 10px', textAlign: 'left', color: TINTA, fontSize: '12px', fontWeight: 800, borderBottom: '2px solid #1a1a2e' };
  const num = { textAlign: 'right', whiteSpace: 'nowrap' };
  return (
    <TarjetaGrafica titulo="Síntomas del período" periodoTxt={periodoTxt} style={style}>
      <div style={{ background: '#FFFFFF', borderRadius: '12px', padding: '6px 4px', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={cab}>Síntoma</th>
              <th style={{ ...cab, ...num }}>Registros</th>
              <th style={{ ...cab, ...num }}>Intensidad promedio</th>
              <th style={{ ...cab, ...num }}>Intensidad máxima</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(f => (
              <tr key={f.tipo}>
                <td style={{ ...celda, fontWeight: 700 }}>{f.nombre}</td>
                <td style={{ ...celda, ...num }}>{f.registros}</td>
                <td style={{ ...celda, ...num }}>{f.promedio != null ? f.promedio.toFixed(1) : '—'}</td>
                <td style={{ ...celda, ...num }}>{f.maximo != null ? Number(f.maximo).toFixed(1) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ fontSize: '11px', color: '#444444', padding: '6px 10px 2px' }}>
          Intensidad en escala de 0 a 10. De más a menos registros.
        </div>
      </div>
    </TarjetaGrafica>
  );
}

// ─── Grupos de 5 a partir de filas ya preparadas ─────────────────
export function GraficasPorGrupos({ filas, semanal, claves, titulo, periodoTxt, animar = true, inicio = 0, fin = Infinity, ...resto }) {
  const grupos = [];
  for (let i = 0; i < claves.length; i += SINTOMAS_POR_GRAFICA) grupos.push(claves.slice(i, i + SINTOMAS_POR_GRAFICA));
  return (
    <>
      {grupos.map((grupo, i) => (i < inicio || i >= fin) ? null : (
        <GraficaCinco key={i} filas={filas} semanal={semanal} grupo={grupo} animar={animar} periodoTxt={periodoTxt}
          titulo={grupos.length > 1 ? `${titulo} (${i + 1} de ${grupos.length})` : titulo} {...resto} />
      ))}
    </>
  );
}

export function numeroDeGraficas(serie, tipos) {
  return Math.ceil(tipos.length / SINTOMAS_POR_GRAFICA);
}

// ─── Todo junto: N gráficas de 5 síntomas + tabla ────────────────
// inicio/fin: qué gráficas mostrar (0 = la primera). conTabla: si va la tabla de todos los síntomas.
export function GraficaUnificada({ serie, tipos, dias, periodoTxt, animar = true, style, inicio = 0, fin = Infinity, conTabla = true, alto }) {
  const ordenados = ordenarSintomas(serie, tipos);
  const { filas, semanal } = prepararDatos(serie, ordenados, dias);
  return (
    <>
      <GraficasPorGrupos filas={filas} semanal={semanal} claves={ordenados} titulo="Evolución de síntomas"
        periodoTxt={periodoTxt} animar={animar} inicio={inicio} fin={fin} style={style} alto={alto} />
      {conTabla && <TablaSintomas serie={serie} tipos={ordenados} periodoTxt={periodoTxt} style={style} />}
    </>
  );
}
