import React from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList
} from 'recharts';
import {
  ESTILO_TARJETA, GraficasPorGrupos, prepararDatos, lunesDe, formatFecha, fechaCompleta
} from './GraficasEvolucion';

// Secciones del Reporte resumido. Todo en tinta negra, distinguible sin color (patrones, formas y números)
// y legible al imprimir en blanco y negro.

const TINTA = '#1a1a2e';
const TICK = { fill: TINTA, fontWeight: 600, fontSize: 12 };
const TITULO_EJE = { fill: TINTA, fontWeight: 600, fontSize: 12 };

// ─── Piezas comunes ──────────────────────────────────────────────
export function SeccionReporte({ titulo, nota, children, style }) {
  return (
    <div className="tarjeta-reporte seccion-reporte" style={{
      background: 'rgba(255,255,255,0.04)', border: '2px solid #FFC107', borderRadius: '16px',
      padding: '20px', marginBottom: '14px', ...style
    }}>
      <div className="tit-sec" style={{ fontSize: '14px', fontWeight: '600', color: '#00A7A7', marginBottom: nota ? '4px' : '12px' }}>{titulo}</div>
      {nota && <div className="subtexto-reporte tit-sec" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.93)', marginBottom: '12px', lineHeight: 1.6 }}>{nota}</div>}
      {children}
    </div>
  );
}

function PanelBlanco({ children, style }) {
  return (
    <div className="panel-reporte" style={{ background: '#FFFFFF', borderRadius: '12px', padding: '12px 10px 8px', color: TINTA,
      WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact', ...style }}>
      {children}
    </div>
  );
}

function SubTitulo({ children }) {
  return <div style={{ fontSize: '13px', fontWeight: 800, color: TINTA, margin: '0 0 6px 4px' }}>{children}</div>;
}

// Muestra de patrón para leyendas
function Muestra({ tipo }) {
  const props = { width: 22, height: 16, viewBox: '0 0 22 16', 'aria-hidden': true };
  const marco = { stroke: TINTA, strokeWidth: 1.5 };
  if (tipo === 'solido') return <svg {...props}><rect x="1" y="1" width="20" height="14" fill={TINTA} {...marco} /></svg>;
  if (tipo === 'vacio') return <svg {...props}><rect x="1" y="1" width="20" height="14" fill="#FFFFFF" {...marco} /></svg>;
  if (tipo === 'rayas') return <svg {...props}><rect x="1" y="1" width="20" height="14" fill="#FFFFFF" {...marco} /><path d="M1 15 L15 1 M7 15 L21 1 M13 15 L21 7 M1 9 L9 1" stroke={TINTA} strokeWidth="1.5" /></svg>;
  return <svg {...props}><rect x="1" y="1" width="20" height="14" fill="#FFFFFF" {...marco} />{[5, 11, 17].flatMap(x => [4, 8, 12].map(y => <circle key={`${x}${y}`} cx={x} cy={y} r="1.3" fill={TINTA} />))}</svg>;
}

function LeyendaPatrones({ items }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', margin: '4px 0 6px 4px', fontSize: '12px', fontWeight: 700, color: TINTA }}>
      {items.map(it => (
        <span key={it.texto} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <Muestra tipo={it.patron} />{it.texto}
        </span>
      ))}
    </div>
  );
}

// Definición de patrones para gráficas de recharts (id único por gráfica)
function Patrones({ id }) {
  return (
    <defs>
      <pattern id={`${id}-rayas`} width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="7" height="7" fill="#FFFFFF" /><line x1="0" y1="0" x2="0" y2="7" stroke={TINTA} strokeWidth="2.2" />
      </pattern>
    </defs>
  );
}

// Duraciones: 24 h o más = «X días Y h»; menos de 24 h = «Y h Z min».
export function formatoDuracion(minutos) {
  const m = Math.max(0, Math.round(minutos));
  if (m >= 1440) {
    const d = Math.floor(m / 1440);
    const h = Math.floor((m % 1440) / 60);
    return `${d} ${d === 1 ? 'día' : 'días'} ${h} h`;
  }
  return `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`;
}

const celda = { padding: '6px 8px', borderTop: '1px solid #999999', color: TINTA, fontSize: '13px' };
const cab = { padding: '6px 8px', textAlign: 'left', color: TINTA, fontSize: '12px', fontWeight: 800, borderBottom: '2px solid #1a1a2e' };
const num = { textAlign: 'right', whiteSpace: 'nowrap' };

// ─── 2. Adherencia ───────────────────────────────────────────────
export function AdherenciaSeccion({ adherencia, periodo, BarraAdherencia }) {
  const porFecha = adherencia.por_fecha || {};
  const porMed = adherencia.por_medicamento || {};
  const semanal = periodo.dias > 14;
  const cubos = {};
  Object.entries(porFecha).forEach(([f, r]) => {
    const clave = semanal ? lunesDe(f) : f;
    if (!cubos[clave]) cubos[clave] = { programadas: 0, tomadas: 0 };
    cubos[clave].programadas += r.programadas;
    cubos[clave].tomadas += r.tomadas;
  });
  const datos = Object.keys(cubos).sort().map(f => ({
    fecha: f, pct: cubos[f].programadas ? Math.round(cubos[f].tomadas / cubos[f].programadas * 100) : 0,
    tomadas: cubos[f].tomadas, programadas: cubos[f].programadas
  }));
  const meds = Object.entries(porMed).map(([nombre, r]) => ({
    nombre, pct: r.programadas ? Math.round(r.tomadas / r.programadas * 100) : 0, tomadas: r.tomadas, programadas: r.programadas
  })).sort((a, b) => b.programadas - a.programadas || a.nombre.localeCompare(b.nombre));
  const formatoX = f => (semanal ? `Semana del ${formatFecha(f)}` : formatFecha(f));
  const cifras = [
    { label: 'Tomas programadas', valor: adherencia.total_programadas },
    { label: 'Tomadas', valor: adherencia.tomadas },
    { label: 'Omitidas', valor: adherencia.omitidas },
    { label: 'Sin registro', valor: adherencia.sin_registro ?? 0 },
    ...((adherencia.pendientes ?? 0) > 0 ? [{ label: 'Pendientes (aún en plazo)', valor: adherencia.pendientes }] : []),
    { label: 'Registro extemporáneo', valor: adherencia.extemporaneas ?? 0 },
  ];
  const Tip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const d = payload[0].payload;
    return (
      <div style={{ background: '#FFF', border: '2px solid #1a1a2e', borderRadius: '10px', padding: '8px 12px', color: TINTA, fontSize: '13px', fontWeight: 700 }}>
        <div>{d.nombre || (semanal ? `Semana del ${fechaCompleta(label)}` : fechaCompleta(label))}</div>
        <div>{d.pct}% tomadas ({d.tomadas} de {d.programadas})</div>
      </div>
    );
  };
  return (
    <SeccionReporte titulo="💊 Adherencia al Tratamiento">
      {BarraAdherencia}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cifras.length}, 1fr)`, gap: '10px', margin: '14px 0' }}>
        {cifras.map(c => (
          <div key={c.label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '10px', padding: '10px', textAlign: 'center' }}>
            <div className="texto-reporte" style={{ fontSize: '22px', fontWeight: 'bold', color: 'rgba(255,255,255,0.95)' }}>{c.valor}</div>
            <div className="subtexto-reporte" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.93)', marginTop: '2px' }}>{c.label}</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '10px' }}>
      {datos.length > 0 && (
        <PanelBlanco>
          <SubTitulo>{semanal ? 'Tomas tomadas por semana (%)' : 'Tomas tomadas por día (%)'}</SubTitulo>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={datos} margin={{ top: 18, right: 10, bottom: 4, left: 4 }}>
              <Patrones id="adh" />
              <CartesianGrid stroke="#BBBBBB" strokeDasharray="1 3" vertical={false} />
              <XAxis dataKey="fecha" tickFormatter={formatoX} tick={TICK} height={semanal ? 76 : 40}
                angle={semanal ? -30 : 0} textAnchor={semanal ? 'end' : 'middle'}
                padding={{ left: semanal ? 30 : 8, right: 8 }}
                interval={Math.max(0, Math.ceil(datos.length / (semanal ? 7 : 8)) - 1)}
                label={{ value: 'Fecha', position: 'insideBottom', offset: 0, ...TITULO_EJE }} />
              <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={TICK} width={46}
                label={{ value: '% de tomas tomadas', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' }, ...TITULO_EJE }} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="pct" fill="url(#adh-rayas)" stroke={TINTA} strokeWidth={1.5} isAnimationActive={false} maxBarSize={44}>
                <LabelList dataKey="pct" position="top" formatter={v => `${v}%`} style={{ fill: TINTA, fontWeight: 700, fontSize: 11 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PanelBlanco>
      )}
      {meds.length > 0 && (
        <PanelBlanco>
          <SubTitulo>Tomas tomadas por medicamento (%)</SubTitulo>
          <ResponsiveContainer width="100%" height={Math.max(80, meds.length * 32 + 44)}>
            <BarChart data={meds} layout="vertical" margin={{ top: 4, right: 40, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#BBBBBB" strokeDasharray="1 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={TICK}
                label={{ value: '% de tomas tomadas', position: 'insideBottom', offset: -2, ...TITULO_EJE }} height={42} />
              <YAxis type="category" dataKey="nombre" tick={{ ...TICK, fontSize: 10 }} width={110} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="pct" fill={TINTA} isAnimationActive={false} barSize={18}>
                <LabelList dataKey="pct" position="right" formatter={v => `${v}%`} style={{ fill: TINTA, fontWeight: 700, fontSize: 12 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </PanelBlanco>
      )}
      </div>
    </SeccionReporte>
  );
}

// ─── 3. Tomas: resumen por medicamento ───────────────────────────
export function TomasResumenSeccion({ adherencia }) {
  const filas = Object.entries(adherencia.por_medicamento || {})
    .map(([nombre, r]) => ({ nombre, ...r }))
    .sort((a, b) => b.programadas - a.programadas || a.nombre.localeCompare(b.nombre));
  const total = filas.reduce((t, f) => ({
    programadas: t.programadas + f.programadas, tomadas: t.tomadas + f.tomadas, omitidas: t.omitidas + f.omitidas,
    sin_registro: t.sin_registro + (f.sin_registro || 0), pendientes: t.pendientes + (f.pendientes || 0),
    a_tiempo: t.a_tiempo + f.a_tiempo, extemporaneas: t.extemporaneas + f.extemporaneas
  }), { programadas: 0, tomadas: 0, omitidas: 0, sin_registro: 0, pendientes: 0, a_tiempo: 0, extemporaneas: 0 });
  const hayPend = total.pendientes > 0;
  const colsNum = ['programadas', 'tomadas', 'omitidas', 'sin_registro', ...(hayPend ? ['pendientes'] : []), 'a_tiempo', 'extemporaneas'];
  const titulosCol = { programadas: 'Programadas', tomadas: 'Tomadas', omitidas: 'Omitidas', sin_registro: 'Sin registro', pendientes: 'Pendientes', a_tiempo: 'A tiempo', extemporaneas: 'Extemporáneas' };
  return (
    <SeccionReporte titulo="🕒 Tomas por medicamento"
      nota="A tiempo: tomada dentro de 30 minutos de su hora. Extemporánea: capturada más de 30 minutos después de tomarla (solo se mide desde el 11/10/2026). Sin registro: pasó el plazo (el día de la toma y el siguiente) y no se marcó tomada ni omitida. Programadas = tomadas + omitidas + sin registro. El detalle toma por toma está en el Anexo A.">
      <PanelBlanco>
        {filas.length === 0 ? <div style={{ fontSize: '13px', padding: '8px' }}>Sin tomas en el período.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={cab}>Medicamento</th>
                {colsNum.map(k => <th key={k} style={{ ...cab, ...num }}>{titulosCol[k]}</th>)}
              </tr>
            </thead>
            <tbody>
              {filas.map(f => (
                <tr key={f.nombre}>
                  <td style={{ ...celda, fontWeight: 700 }}>{f.nombre}</td>
                  {colsNum.map(k => <td key={k} style={{ ...celda, ...num }}>{f[k] || 0}</td>)}
                </tr>
              ))}
              <tr>
                <td style={{ ...celda, fontWeight: 800, borderTop: '2px solid #1a1a2e' }}>Total</td>
                {colsNum.map(k => (
                  <td key={k} style={{ ...celda, ...num, fontWeight: 800, borderTop: '2px solid #1a1a2e' }}>{total[k]}</td>
                ))}
              </tr>
            </tbody>
          </table>
        )}
      </PanelBlanco>
    </SeccionReporte>
  );
}

// ─── 4. Dosis vigente + línea de tiempo de cambios ───────────────
function hora12(hhmm) {
  if (!hhmm) return '';
  const [h, m] = String(hhmm).split(':').map(Number);
  if (Number.isNaN(h)) return hhmm;
  return new Date(2000, 0, 1, h, Number.isNaN(m) ? 0 : m).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}
const textoHorarios = hs => (hs && hs.length ? hs.map(hora12).join(' y ') : 'sin horario');

const h24 = hhmm => String(hhmm || '').slice(0, 5);
const lista24 = hs => (hs && hs.length ? hs.map(h24).join(', ') : 'sin horario');

// Cambios dentro del período (desde..hasta), agrupados por fecha y solo con lo que cambió.
export function cambiosDeDosis(historial, desdePeriodo, hastaPeriodo) {
  const porMed = {};
  historial.forEach(h => { (porMed[h.medicamento] = porMed[h.medicamento] || []).push(h); });
  const porFecha = {};
  const poner = (fecha, texto) => {
    if (fecha < desdePeriodo || (hastaPeriodo && fecha > hastaPeriodo)) return;
    (porFecha[fecha] = porFecha[fecha] || []).push(texto);
  };
  Object.entries(porMed).forEach(([med, filas]) => {
    filas.sort((a, b) => (a.desde < b.desde ? -1 : 1));
    filas.forEach((h, i) => {
      const fecha = h.desde.slice(0, 10);
      if (i === 0) { poner(fecha, `${med}: inicio ${h.dosis} a las ${lista24(h.horarios)}`); return; }
      const p = filas[i - 1];
      const partes = [];
      if (p.dosis !== h.dosis) partes.push(`${p.dosis}→${h.dosis}`);
      const hp = p.horarios || [], hn = h.horarios || [];
      if (JSON.stringify(hp) !== JSON.stringify(hn)) {
        if (hp.length === hn.length) {
          const pares = hp.map((x, j) => (x !== hn[j] ? `${h24(x)}→${h24(hn[j])}` : null)).filter(Boolean);
          partes.push(pares.join(', '));
        } else partes.push(`horarios ${lista24(hp)}→${lista24(hn)}`);
      }
      if (partes.length) poner(fecha, `${med}: ${partes.join('; ')}`);
    });
  });
  return Object.keys(porFecha).sort().map(fecha => ({ fecha, texto: porFecha[fecha].join(' · ') }));
}

export function DosisSeccion({ historial, periodo }) {
  // Todo se corta en la fecha final del período: nada posterior se muestra como vigente ni como cambio.
  const hastaIso = periodo.hasta;
  const hastaPeriodo = historial.filter(h => h.desde.slice(0, 10) <= hastaIso);
  const porMed = {};
  hastaPeriodo.forEach(h => {
    if (!porMed[h.medicamento] || h.desde > porMed[h.medicamento].desde) porMed[h.medicamento] = h;
  });
  const vigentes = Object.values(porMed);
  const eventos = cambiosDeDosis(hastaPeriodo, periodo.desde, hastaIso);
  return (
    <SeccionReporte titulo="💊 Dosis y horarios vigentes"
      nota="Dosis vigente al final del período y cambios dentro del período. El historial completo está en el Anexo B.">
      <PanelBlanco>
        {vigentes.length === 0 ? <div style={{ fontSize: '13px', padding: '8px' }}>Sin registros de dosis en el período.</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><th style={cab}>Medicamento</th><th style={cab}>Dosis vigente</th><th style={cab}>Horarios</th><th style={cab}>Vigente desde</th></tr>
            </thead>
            <tbody>
              {vigentes.map(h => (
                <tr key={h.medicamento}>
                  <td style={{ ...celda, fontWeight: 700 }}>{h.medicamento}</td>
                  <td style={celda}>{h.dosis}</td>
                  <td style={celda}>{textoHorarios(h.horarios)}</td>
                  <td style={{ ...celda, whiteSpace: 'nowrap' }}>{fechaCompleta(h.desde.slice(0, 10))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <SubTitulo><span style={{ display: 'block', marginTop: '12px' }}>Cambios en el período</span></SubTitulo>
        {eventos.length === 0 ? (
          <div style={{ fontSize: '13px', padding: '0 8px 6px' }}>Sin cambios de dosis ni de horarios en el período.</div>
        ) : (
          <ol style={{ listStyle: 'none', margin: '0 0 4px', padding: '0 0 0 14px', borderLeft: '3px solid #1a1a2e' }}>
            {eventos.map((e, i) => (
              <li key={i} style={{ position: 'relative', padding: '2px 0 2px 12px', fontSize: '12px', color: TINTA }}>
                <span style={{ position: 'absolute', left: '-22px', top: '7px', width: '10px', height: '10px', background: TINTA, borderRadius: '50%', border: '2px solid #FFFFFF' }} />
                <strong>{formatFecha(e.fecha)}</strong> · {e.texto}
              </li>
            ))}
          </ol>
        )}
      </PanelBlanco>
    </SeccionReporte>
  );
}

// ─── 5. Diario de Hauser: barra horizontal por día ───────────────
const GRUPOS_HAUSER = [
  { id: 'ON', texto: 'ON', patron: 'vacio', estados: ['ON'] },
  { id: 'MOV', texto: 'ON con movimientos', patron: 'rayas', estados: ['ON_DISC_LEVE', 'ON_DISC_GRAVE'] },
  { id: 'OFF', texto: 'OFF', patron: 'solido', estados: ['OFF'] },
  { id: 'DORM', texto: 'Dormido', patron: 'puntos', estados: ['DORMIDO'] },
];
const ESTADOS_TODOS = ['ON', 'ON_DISC_LEVE', 'ON_DISC_GRAVE', 'OFF', 'DORMIDO'];

export function HauserSeccion({ estadoMotor, periodo, COLOR_ESTADO }) {
  const exactos = estadoMotor.episodios_exactos || {};
  const mf = exactos.minutos_por_fecha || {};
  const bf = estadoMotor.bloques_por_fecha || {};
  const fechas = [...new Set([...Object.keys(mf), ...Object.keys(bf)])].sort();
  const semanal = periodo.dias > 31;
  const cubos = {};
  fechas.forEach(f => {
    const k = semanal ? lunesDe(f) : f;
    if (!cubos[k]) cubos[k] = { dias: 0, min: {} };
    cubos[k].dias += 1;
    ESTADOS_TODOS.forEach(e => { cubos[k].min[e] = (cubos[k].min[e] || 0) + ((mf[f] || {})[e] || 0) + ((bf[f] || {})[e] || 0); });
  });
  const filas = Object.keys(cubos).sort().map(k => {
    const c = cubos[k];
    const g = {};
    GRUPOS_HAUSER.forEach(gr => { g[gr.id] = gr.estados.reduce((s, e) => s + (c.min[e] || 0), 0) / (semanal ? c.dias : 1); });
    return { fecha: k, g };
  });
  const horas = estadoMotor.horas || {};
  const totalH = ESTADOS_TODOS.reduce((s, e) => s + (horas[e] || 0), 0);
  const largo = exactos.sin_cierre_largo || [];
  const hayHoras = totalH > 0;
  const nEpisodios = (exactos.total ?? 0) || (largo.length + (exactos.sin_cierre || 0));

  // Dibujo SVG
  const W = 640, X0 = 78, X1 = 622, FILA = 13, TOP = 20, BASE = 38;
  const barW = X1 - X0;
  const alto = TOP + filas.length * FILA + BASE;
  const px = min => (Math.min(min, 1440) / 1440) * barW;
  return (
    <SeccionReporte titulo="🌡️ Estado Motor — Diario de Hauser"
      nota={`Cada barra es un ${semanal ? 'promedio por día con registro, por semana' : 'día'}, de 0 a 24 horas. Lo que queda en blanco sin patrón es tiempo sin registro. El detalle de episodios está en el Anexo D.`}>
      <PanelBlanco>
        <LeyendaPatrones items={GRUPOS_HAUSER.map(g => ({ texto: g.texto, patron: g.patron }))} />
        {!hayHoras && nEpisodios > 0 ? (
          <div style={{ fontSize: '13px', padding: '8px' }}>Hay {nEpisodios} {nEpisodios === 1 ? 'episodio' : 'episodios'}, pero ninguno tiene duración calculable (ver Anexo D).</div>
        ) : filas.length === 0 ? <div style={{ fontSize: '13px', padding: '8px' }}>Sin registros de estado motor en el período.</div> : (
          <svg viewBox={`0 0 ${W} ${alto}`} width="100%" role="img" aria-label="Horas por estado motor en cada día">
            <defs>
              <pattern id="hz-rayas" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="6" height="6" fill="#FFFFFF" /><line x1="0" y1="0" x2="0" y2="6" stroke={TINTA} strokeWidth="2" />
              </pattern>
              <pattern id="hz-puntos" width="6" height="6" patternUnits="userSpaceOnUse">
                <rect width="6" height="6" fill="#FFFFFF" /><circle cx="3" cy="3" r="1.3" fill={TINTA} />
              </pattern>
            </defs>
            {[0, 6, 12, 18, 24].map(h => (
              <g key={h}>
                <line x1={X0 + (h / 24) * barW} x2={X0 + (h / 24) * barW} y1={TOP - 4} y2={TOP + filas.length * FILA} stroke="#BBBBBB" strokeDasharray="1 3" />
                <text x={X0 + (h / 24) * barW} y={TOP + filas.length * FILA + 14} textAnchor="middle" fontSize="11" fontWeight="600" fill={TINTA}>{h} h</text>
              </g>
            ))}
            <text x={(X0 + X1) / 2} y={alto - 6} textAnchor="middle" fontSize="11" fontWeight="600" fill={TINTA}>Horas del día (0 a 24)</text>
            <text x="2" y="12" fontSize="11" fontWeight="600" fill={TINTA}>{semanal ? 'Semana del' : 'Fecha'}</text>
            {filas.map((f, i) => {
              let x = X0;
              const y = TOP + i * FILA;
              return (
                <g key={f.fecha}>
                  <text x={X0 - 6} y={y + 10} textAnchor="end" fontSize="10" fontWeight="600" fill={TINTA}>{formatFecha(f.fecha)}</text>
                  {GRUPOS_HAUSER.map(gr => {
                    const w = px(f.g[gr.id]);
                    if (w < 0.5) return null;
                    const rect = (
                      <rect key={gr.id} x={x} y={y + 2} width={w} height={FILA - 4}
                        fill={gr.patron === 'solido' ? TINTA : gr.patron === 'rayas' ? 'url(#hz-rayas)' : gr.patron === 'puntos' ? 'url(#hz-puntos)' : '#FFFFFF'}
                        stroke={TINTA} strokeWidth="1" />
                    );
                    x += w;
                    return rect;
                  })}
                </g>
              );
            })}
          </svg>
        )}
      </PanelBlanco>
      {hayHoras && <PanelBlanco style={{ marginTop: '10px' }}>
        <SubTitulo>Horas por estado en el período</SubTitulo>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr><th style={cab}>Estado</th><th style={{ ...cab, ...num }}>Tiempo</th><th style={{ ...cab, ...num }}>%</th></tr></thead>
          <tbody>
            {ESTADOS_TODOS.filter(e => (horas[e] || 0) > 0).map(e => (
              <tr key={e}>
                <td style={{ ...celda, fontWeight: 700 }}>{COLOR_ESTADO[e].label}</td>
                <td style={{ ...celda, ...num }}>{formatoDuracion(horas[e] * 60)}</td>
                <td style={{ ...celda, ...num }}>{totalH > 0 ? Math.round(horas[e] / totalH * 100) : 0}%</td>
              </tr>
            ))}
            <tr>
              <td style={{ ...celda, fontWeight: 800, borderTop: '2px solid #1a1a2e' }}>Total con registro</td>
              <td style={{ ...celda, ...num, fontWeight: 800, borderTop: '2px solid #1a1a2e' }}>{formatoDuracion(totalH * 60)}</td>
              <td style={{ ...celda, ...num, fontWeight: 800, borderTop: '2px solid #1a1a2e' }}>100%</td>
            </tr>
          </tbody>
        </table>
      </PanelBlanco>}
      {(largo.length > 0 || exactos.sin_cierre > 0) && (
        <PanelBlanco style={{ marginTop: '10px' }}>
          <SubTitulo>Episodios sin cierre conocido (no suman horas)</SubTitulo>
          {largo.length > 0 && (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr><th style={cab}>Inicio del episodio</th><th style={cab}>Estado</th><th style={{ ...cab, ...num }}>Tiempo sin registro</th></tr></thead>
              <tbody>
                {largo.map((l, i) => (
                  <tr key={i}>
                    <td style={{ ...celda, whiteSpace: 'nowrap' }}>{fechaCompleta(l.fecha)} {l.hora}</td>
                    <td style={{ ...celda, fontWeight: 700 }}>{COLOR_ESTADO[l.estado]?.label || l.estado}</td>
                    <td style={{ ...celda, ...num, fontWeight: 700 }}>{formatoDuracion(l.minutos_transcurridos != null ? l.minutos_transcurridos : l.horas_transcurridas * 60)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div style={{ fontSize: '11px', color: TINTA, padding: '6px 8px 2px', lineHeight: 1.5 }}>
            Pasaron más de 16 horas hasta el siguiente registro, así que no se sabe cuánto duró el estado.
            {exactos.sin_cierre > 0 && <> Además, {exactos.sin_cierre} {exactos.sin_cierre === 1 ? 'episodio no tiene' : 'episodios no tienen'} otro registro después, y por eso tampoco {exactos.sin_cierre === 1 ? 'tiene' : 'tienen'} duración.</>}
          </div>
        </PanelBlanco>
      )}
    </SeccionReporte>
  );
}

// ─── 6. Franjas del día ──────────────────────────────────────────
export function FranjasSeccion({ franjas, FRANJAS }) {
  const datos = FRANJAS.map(f => ({
    franja: f.label,
    off: franjas?.estado_motor_off?.[f.key] ?? 0,
    sint: franjas?.sintomas_reportados?.[f.key] ?? 0,
  }));
  const Tip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div style={{ background: '#FFF', border: '2px solid #1a1a2e', borderRadius: '10px', padding: '8px 12px', color: TINTA, fontSize: '13px', fontWeight: 700 }}>
        <div>{label}</div>
        <div>Estado OFF: {payload[0].payload.off}</div>
        <div>Síntomas: {payload[0].payload.sint}</div>
      </div>
    );
  };
  return (
    <SeccionReporte titulo="🕐 Franjas del día"
      nota="Estado OFF: se cuenta por la hora exacta del episodio. Síntomas reportados: se cuentan por la hora en que se capturaron, no por la hora del síntoma.">
      <PanelBlanco>
        <LeyendaPatrones items={[{ texto: 'Estado OFF (episodios)', patron: 'solido' }, { texto: 'Síntomas reportados', patron: 'rayas' }]} />
        <ResponsiveContainer width="100%" height={190}>
          <BarChart data={datos} margin={{ top: 18, right: 10, bottom: 4, left: 4 }} barGap={4}>
            <Patrones id="fr" />
            <CartesianGrid stroke="#BBBBBB" strokeDasharray="1 3" vertical={false} />
            <XAxis dataKey="franja" tick={{ ...TICK, fontSize: 11 }} height={44} interval={0}
              label={{ value: 'Franja del día', position: 'insideBottom', offset: 0, ...TITULO_EJE }} />
            <YAxis allowDecimals={false} tick={TICK} width={46}
              label={{ value: 'Cantidad de registros', angle: -90, position: 'insideLeft', offset: 10, style: { textAnchor: 'middle' }, ...TITULO_EJE }} />
            <Tooltip content={<Tip />} />
            <Bar dataKey="off" name="Estado OFF" fill={TINTA} stroke={TINTA} strokeWidth={1.5} isAnimationActive={false} maxBarSize={46}>
              <LabelList dataKey="off" position="top" style={{ fill: TINTA, fontWeight: 700, fontSize: 12 }} />
            </Bar>
            <Bar dataKey="sint" name="Síntomas" fill="url(#fr-rayas)" stroke={TINTA} strokeWidth={1.5} isAnimationActive={false} maxBarSize={46}>
              <LabelList dataKey="sint" position="top" style={{ fill: TINTA, fontWeight: 700, fontSize: 12 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </PanelBlanco>
    </SeccionReporte>
  );
}

// ─── 8. No motores: barras 0 a 4 + evolución ─────────────────────
export function datosEvolucionNoMotor(noMotor, periodo, NO_MOTOR_LABELS) {
  const claves = Object.keys(NO_MOTOR_LABELS);
  const registros = (noMotor.registros || []).slice().sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
  const serie = registros.map(r => {
    const fila = { fecha: r.fecha, total_registros: 1, intensidad_promedio: 0 };
    claves.forEach(k => { if (r[k] != null) { fila[`intensidad_${k}`] = r[k]; fila[`n_${k}`] = 1; } });
    return fila;
  });
  const cuenta = k => serie.filter(f => f[`intensidad_${k}`] != null).length;
  const orden = claves.filter(k => cuenta(k) > 0)
    .sort((a, b) => cuenta(b) - cuenta(a) || (noMotor.promedios[b] ?? 0) - (noMotor.promedios[a] ?? 0) || a.localeCompare(b));
  const { filas, semanal } = prepararDatos(serie, orden, periodo.dias);
  return { serie, orden, filas, semanal };
}

export function NoMotorSeccion({ noMotor, periodo, NO_MOTOR_LABELS, LABEL_PROMEDIO, fin = 1 }) {
  const claves = Object.keys(NO_MOTOR_LABELS);
  const filasProm = claves.filter(k => noMotor.promedios?.[k] != null).map(k => ({ k, v: noMotor.promedios[k] }));
  const { serie, orden, filas, semanal } = datosEvolucionNoMotor(noMotor, periodo, NO_MOTOR_LABELS);
  const periodoTxt = `Período: ${fechaCompleta(periodo.desde)} al ${fechaCompleta(periodo.hasta)}`;
  if (!noMotor.dias_registrados) {
    return (
      <SeccionReporte titulo="🌿 Síntomas No Motores — Promedio del Período">
        <PanelBlanco><div style={{ fontSize: '13px', padding: '8px' }}>Sin registros en el período.</div></PanelBlanco>
      </SeccionReporte>
    );
  }
  return (
    <SeccionReporte titulo="🌿 Síntomas No Motores — Promedio del Período"
      nota={`Escala 0–4 · 0 = sin problema · 4 = severo · Basado en ${noMotor.dias_registrados} ${noMotor.dias_registrados === 1 ? 'día' : 'días'} con registro. El registro por fecha está en el Anexo C.`}>
      <PanelBlanco>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px', padding: '2px 4px' }}>
          {filasProm.map(({ k, v }) => (
            <div key={k} style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 26%) 1fr minmax(96px, 22%)', alignItems: 'center', gap: '8px', fontSize: '12px', color: TINTA }}>
              <span style={{ fontWeight: 700 }}>{NO_MOTOR_LABELS[k].label}</span>
              <div style={{ position: 'relative', height: '14px', border: '1.5px solid #1a1a2e', background: '#FFFFFF' }}>
                <div style={{ height: '100%', width: `${(v / 4) * 100}%`, background: TINTA }} />
                {[1, 2, 3].map(t => <div key={t} style={{ position: 'absolute', left: `${t * 25}%`, top: 0, bottom: 0, borderLeft: '1px dotted #888888' }} />)}
              </div>
              <span style={{ fontWeight: 700 }}>{v} — {LABEL_PROMEDIO(v)}</span>
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(110px, 26%) 1fr minmax(96px, 22%)', gap: '8px', fontSize: '11px', color: TINTA }}>
            <span />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
              {[0, 1, 2, 3, 4].map(n => <span key={n}>{n}</span>)}
            </div>
            <span />
          </div>
          <div style={{ textAlign: 'center', fontSize: '11px', fontWeight: 600, color: TINTA }}>Promedio (0 a 4)</div>
        </div>
      </PanelBlanco>
      <div style={{ marginTop: '10px' }}>
        {serie.length < 2 ? (
          <PanelBlanco><div style={{ fontSize: '13px', padding: '6px' }}>
            {serie.length === 0 ? 'Sin registros diarios en el período.' : 'Con un solo día no hay evolución que graficar.'}
          </div></PanelBlanco>
        ) : (
          <div style={{ margin: '0 -20px' }}>
            <GraficasPorGrupos filas={filas} semanal={semanal} claves={orden}
              titulo="Evolución de síntomas no motores" periodoTxt={periodoTxt} animar={false} fin={fin}
              nombreDe={k => NO_MOTOR_LABELS[k].label} maximo={4} ticks={[0, 1, 2, 3, 4]} tituloY="Nivel (0 a 4)" alto={190} etiquetas={false}
              style={{ background: 'transparent', border: 'none', padding: '0 20px', marginBottom: 0 }} />
          </div>
        )}
      </div>
    </SeccionReporte>
  );
}
