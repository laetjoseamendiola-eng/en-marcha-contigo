import { zonaReloj, hora12 } from '../zonaReloj';
import React, { useState, useEffect, useCallback } from 'react';
import {
  reglasTiempoReal, construirDia, textoCuandoOcurrio, ahoraLocal, restarDias,
  esExtemporaneo, horaPermitida, eventosDelDia, bloqueDeHora, diasDeVentana,
  textoTrazabilidad, periodosDelDia, historicosCruzados, textoDuracion,
  propuestaDuracion, ajusteDuracionUsuario, DURACION_MAX_MIN
} from '../fluctuacionesEventos';

// Estados del Diario de Hauser (los cinco estados aprobados)
const ESTADOS = [
  { id: 'ON', label: 'ON', emoji: '🟢', descripcion: 'Me siento bien, activo',
    color: '#27AE60', colorFondo: 'rgba(39,174,96,0.15)', colorBorde: 'rgba(39,174,96,0.5)' },
  { id: 'OFF', label: 'OFF', emoji: '🔴', descripcion: 'Síntomas presentes, lento',
    color: '#E74C3C', colorFondo: 'rgba(231,76,60,0.15)', colorBorde: 'rgba(231,76,60,0.5)' },
  { id: 'ON_DISC_LEVE', label: 'ON con movimientos', emoji: '🟡',
    descripcion: 'Activo pero con movimientos involuntarios leves',
    color: '#F39C12', colorFondo: 'rgba(243,156,18,0.15)', colorBorde: 'rgba(243,156,18,0.5)' },
  { id: 'ON_DISC_GRAVE', label: 'ON con movimientos graves', emoji: '🟠',
    descripcion: 'Activo pero con movimientos involuntarios intensos',
    color: '#E67E22', colorFondo: 'rgba(230,126,34,0.15)', colorBorde: 'rgba(230,126,34,0.5)' },
  { id: 'DORMIDO', label: 'Dormido', emoji: '😴', descripcion: 'Dormido / descansando',
    color: '#8E9EAB', colorFondo: 'rgba(142,158,171,0.1)', colorBorde: 'rgba(142,158,171,0.3)' }
];

const COLOR_POR_ESTADO = {
  ON: '#27AE60', OFF: '#E74C3C', ON_DISC_LEVE: '#F39C12',
  ON_DISC_GRAVE: '#E67E22', DORMIDO: '#4A5568', vacio: 'rgba(255,255,255,0.06)'
};

const def = id => ESTADOS.find(e => e.id === id);
const SEGUNDOS_CONFIRMAR = 5;

// Celda de la gráfica Hauser
function CeldaBloque({ bloque, esActual }) {
  const color = COLOR_POR_ESTADO[bloque.estado] || COLOR_POR_ESTADO.vacio;
  const estilo = { position: 'relative', borderRadius: '6px', height: '36px', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: '11px',
    border: esActual ? '2px solid white' : '1px solid rgba(255,255,255,0.08)' };
  const nombre = def(bloque.estado)?.label || '';
  let titulo = `${hora12(bloque.hora)} — Sin registro`;

  if (bloque.tipo === 'evento') {
    estilo.background = color;
    titulo = `${hora12(bloque.hora)} — ${nombre}${bloque.extemporaneo ? ' (registro extemporáneo)' : ''}`;
  } else if (bloque.tipo === 'historico') {
    estilo.background = color;
    estilo.opacity = 0.8;
    titulo = `${hora12(bloque.hora)} — ${nombre} (histórico por bloque)`;
  } else if (bloque.tipo === 'continua') {
    estilo.background = color + '40';
    estilo.border = `1px dashed ${color}`;
    titulo = `${hora12(bloque.hora)} — ${nombre} (continúa el último estado)`;
  } else {
    estilo.background = COLOR_POR_ESTADO.vacio;
  }

  return (
    <div title={titulo} style={estilo}>
      {bloque.tipo === 'continua' && <span style={{ color: 'white', opacity: 0.85 }}>→</span>}
      {bloque.tipo === 'evento' && bloque.extemporaneo && (
        <span style={{ position: 'absolute', top: '1px', right: '3px', fontSize: '9px' }} aria-label="Registro extemporáneo">🕒</span>
      )}
      {esActual && (
        <div style={{ position: 'absolute', bottom: '3px', width: '5px', height: '5px', borderRadius: '50%', background: 'white' }} />
      )}
    </div>
  );
}

// Gráfica del día
function GrillaDia({ bloques, bloqueActualStr }) {
  const extemporaneos = bloques.filter(b => b.tipo === 'evento' && b.extemporaneo);
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '6px' }}>
        {bloques.map(b => (
          <CeldaBloque key={b.hora} bloque={b} esActual={b.hora === bloqueActualStr} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '4px', marginBottom: '12px' }}>
        {['6h', '7h', '8h', '9h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h',
          '18h', '19h', '20h', '21h', '22h', '23h'].map(h => (
          <div key={h} style={{ fontSize: '9px', color: 'rgba(255,255,255,0.93)', textAlign: 'center' }}>{h}</div>
        ))}
      </div>

      {extemporaneos.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          {extemporaneos.map(b => (
            <div key={b.hora} style={{ fontSize: '11px', color: 'rgba(255,255,255,0.93)', marginBottom: '2px' }}>
              🕒 {hora12(b.hora)} — Registro extemporáneo
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {ESTADOS.map(e => (
          <div key={e.id} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: e.color }} />
            <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.93)' }}>{e.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'rgba(255,255,255,0.15)' }} />
          <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.93)' }}>Continúa el último estado →</span>
        </div>
      </div>
    </div>
  );
}

export default function FluctuacionesPage({ token, apiUrl }) {
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [vistaActiva, setVistaActiva] = useState('ahora'); // 'ahora' | 'hoy'
  const [diaSeleccionado, setDiaSeleccionado] = useState(null); // 'AAAA-MM-DD' (null = hoy)
  const [formulario, setFormulario] = useState(null);     // { modo, id, estado, ocurrio }
  const [confirmarEliminar, setConfirmarEliminar] = useState(null); // { id, restantes }
  const [confirmado, setConfirmado] = useState(false);
  const [duracionEdit, setDuracionEdit] = useState(null); // { id, texto, error } (duración aproximada)
  const [mensaje, setMensaje] = useState('');
  const [exito, setExito] = useState(false);

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/fluctuaciones-eventos?dias=8&historial=1&zona=${encodeURIComponent(zonaReloj())}`, { headers });
      if (res.ok) setDatos(await res.json());
    } catch (e) {
      console.error('Error cargando fluctuaciones:', e);
    } finally {
      setCargando(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    cargar();
    const t = setInterval(cargar, 60000);
    return () => clearInterval(t);
  }, [cargar]);

  // Cuenta regresiva de 5 s antes de habilitar «Sí, eliminar»
  useEffect(() => {
    if (!confirmarEliminar || confirmarEliminar.restantes <= 0) return;
    const t = setTimeout(() => {
      setConfirmarEliminar(c => (c ? { ...c, restantes: c.restantes - 1 } : c));
    }, 1000);
    return () => clearTimeout(t);
  }, [confirmarEliminar]);

  const ahora = datos?.ahora || ahoraLocal(zonaReloj());
  const fechaHoy = ahora.slice(0, 10);
  const eventos = datos?.eventos || [];
  const historicos = datos?.historicos || [];
  const ultimo = datos?.ultimo_estado || null;
  const reglas = reglasTiempoReal(ultimo);
  const bloqueActual = bloqueDeHora(ahora);
  const dias = diasDeVentana(ahora);
  const dia = diaSeleccionado && dias.some(d => d.fecha === diaSeleccionado) ? diaSeleccionado : fechaHoy;
  const bloques = construirDia({ eventos, historicos, fecha: dia, ahora });
  const listaDia = eventosDelDia(eventos, dia);
  const periodos = periodosDelDia(eventos, dia);
  const cruzados = historicosCruzados(historicos, periodos, dia);
  // Duración de un periodo: se busca en cualquiera de sus registros (no solo en el primero).
  // Así, al entrar un registro anterior del mismo estado, la duración guardada sigue visible
  // y se edita en el mismo registro, sin crear una segunda duración para el mismo periodo.
  const registroConDuracion = p => p.ids.map(id => eventos.find(e => e.id === id)).find(e => e?.duracion_aproximada) || null;
  const idDuracion = p => registroConDuracion(p)?.id ?? p.ids[0];
  const duracionDePeriodo = p => registroConDuracion(p)?.duracion_aproximada || null;
  const historial = datos?.historial || [];
  const porId = Object.fromEntries(historial.map(h => [h.id, h]));
  const cambios = historial
    .filter(h => h.motivo_anulacion)
    .sort((a, b) => (b.anulado_en_local || '').localeCompare(a.anulado_en_local || '') || b.id - a.id);

  const enviar = async (ruta, cuerpo) => {
    const res = await fetch(`${apiUrl}${ruta}?zona=${encodeURIComponent(zonaReloj())}`, {
      method: 'POST', headers, body: JSON.stringify(cuerpo || {})
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || 'No se pudo guardar');
    return data;
  };

  const avisar = (texto, ok) => {
    setMensaje(texto);
    setExito(ok);
    setTimeout(() => setMensaje(''), 3000);
  };

  // Registro en tiempo real (hora del servidor)
  const registrarAhora = async (estadoId) => {
    setEnviando(true);
    try {
      await enviar('/api/fluctuaciones-eventos', { estado: estadoId });
      setConfirmado(true);
      await cargar();
      setTimeout(() => setConfirmado(false), 2000);
    } catch (e) {
      avisar(e.message, false);
    } finally {
      setEnviando(false);
    }
  };

  const abrirAlta = () => setFormulario({ modo: 'alta', id: null, estado: null,
    ocurrio: dia === fechaHoy ? ahora : `${dia}T12:00` });
  const abrirCorregir = (ev) => setFormulario({ modo: 'corregir', id: ev.id, estado: ev.estado, ocurrio: ev.ocurrio_en });

  const guardarFormulario = async () => {
    if (!formulario.estado) return avisar('Elige un estado', false);
    if (!formulario.ocurrio) return avisar('Indica la hora', false);
    if (!horaPermitida(formulario.ocurrio, ahora)) {
      return avisar('Solo se puede registrar o corregir hasta 7 días atrás, y no en el futuro.', false);
    }
    setEnviando(true);
    try {
      if (formulario.modo === 'alta') {
        await enviar('/api/fluctuaciones-eventos', { estado: formulario.estado, ocurrio_en: formulario.ocurrio });
        avisar('Registro guardado', true);
      } else {
        await enviar(`/api/fluctuaciones-eventos/${formulario.id}/corregir`, { estado: formulario.estado, ocurrio_en: formulario.ocurrio });
        avisar('Episodio corregido', true);
      }
      setFormulario(null);
      await cargar();
    } catch (e) {
      avisar(e.message, false);
    } finally {
      setEnviando(false);
    }
  };

  const eliminar = async (id) => {
    setEnviando(true);
    try {
      await enviar(`/api/fluctuaciones-eventos/${id}/eliminar`);
      setConfirmarEliminar(null);
      avisar('Registro eliminado (se conserva en el historial)', true);
      await cargar();
    } catch (e) {
      avisar(e.message, false);
    } finally {
      setEnviando(false);
    }
  };

  // Duración aproximada: dato aparte; no cambia la hora del episodio ni los periodos exactos
  const guardarDuracion = async (eventoId, minutos, origen) => {
    setEnviando(true);
    try {
      await enviar(`/api/fluctuaciones-eventos/${eventoId}/duracion`, { minutos, origen });
      setDuracionEdit(null);
      avisar('Duración aproximada guardada', true);
      await cargar();
    } catch (e) {
      avisar(e.message, false);
    } finally {
      setEnviando(false);
    }
  };

  const abrirDuracion = (p) => {
    const guardada = duracionDePeriodo(p);
    setDuracionEdit({ id: idDuracion(p), texto: guardada ? String(guardada.minutos) : '', error: '' });
  };

  const guardarAjusteUsuario = () => {
    const r = ajusteDuracionUsuario(duracionEdit.texto);
    if (r.error) return setDuracionEdit({ ...duracionEdit, error: r.error });
    guardarDuracion(duracionEdit.id, r.valor, r.origen);
  };

  const estiloBtn = (activo) => ({
    padding: '8px 16px', borderRadius: '20px',
    border: `1px solid ${activo ? '#2AACB0' : 'rgba(255,255,255,0.15)'}`,
    background: activo ? '#2AACB0' : 'transparent', color: 'white',
    fontSize: '13px', fontWeight: activo ? '600' : '400', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.2s'
  });

  const estiloTarjeta = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(42,172,176,0.45)',
    borderRadius: '16px', padding: '20px', marginBottom: '16px'
  };

  const estiloBtnPequeno = {
    background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.35)',
    borderRadius: '10px', padding: '6px 10px', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit'
  };

  const mensajeVisual = mensaje && (
    <div role="status" style={{ textAlign: 'center', padding: '12px', fontSize: '14px',
      color: exito ? '#7DDFA0' : '#ff6b6b' }}>
      {mensaje}
    </div>
  );

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={() => setVistaActiva('ahora')} style={estiloBtn(vistaActiva === 'ahora')}>⚡ Ahora</button>
        <button onClick={() => setVistaActiva('hoy')} style={estiloBtn(vistaActiva === 'hoy')}>📅 Mi día</button>
      </div>

        {/* Formulario: hora anterior o corrección */}
        {formulario && (
          <div style={estiloTarjeta}>
            <h3 style={{ margin: '0 0 12px', fontSize: '15px', color: '#2AACB0' }}>
              {formulario.modo === 'alta' ? '¿A qué hora ocurrió?' : 'Corregir episodio'}
            </h3>
            <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.93)', marginBottom: '6px' }}>
              Fecha y hora
            </label>
            <input
              type="datetime-local"
              value={formulario.ocurrio}
              min={restarDias(ahora, 7)}
              max={ahora}
              onChange={e => setFormulario({ ...formulario, ocurrio: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.35)',
                background: 'rgba(255,255,255,0.06)', color: 'white', fontFamily: 'inherit', marginBottom: '12px', boxSizing: 'border-box' }}
            />
            {formulario.ocurrio && esExtemporaneo(formulario.ocurrio, ahora) && (
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.93)', marginBottom: '12px' }}>
                🕒 Registro extemporáneo
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
              {ESTADOS.map(e => (
                <button key={e.id} onClick={() => setFormulario({ ...formulario, estado: e.id })}
                  style={{ ...estiloBtnPequeno, background: formulario.estado === e.id ? e.colorFondo : 'transparent',
                    border: `1px solid ${formulario.estado === e.id ? e.color : 'rgba(255,255,255,0.25)'}` }}>
                  {e.emoji} {e.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={guardarFormulario} disabled={enviando}
                style={{ ...estiloBtnPequeno, flex: 1, background: '#2AACB0', fontWeight: 600 }}>
                Guardar
              </button>
              <button onClick={() => setFormulario(null)} disabled={enviando}
                style={{ ...estiloBtnPequeno, flex: 1 }}>
                Cancelar
              </button>
            </div>
          </div>
        )}

      {/* ── VISTA AHORA ───────────────────────────────────── */}
      {vistaActiva === 'ahora' && (
        <>
          {/* Último estado registrado (cronológico, aunque sea de ayer) */}
          <div style={{ ...estiloTarjeta, textAlign: 'center' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.93)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Último estado registrado
            </div>
            {cargando ? (
              <div style={{ color: 'rgba(255,255,255,0.93)' }}>Cargando...</div>
            ) : ultimo ? (
              <>
                <div style={{ fontSize: '20px', fontWeight: 'bold', color: def(ultimo.estado)?.color }}>
                  {def(ultimo.estado)?.emoji} {def(ultimo.estado)?.label}
                </div>
                <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.93)', marginTop: '4px' }}>
                  {textoCuandoOcurrio(ultimo.ocurrio_en, ahora)}
                  {ultimo.extemporaneo && ' · 🕒 Registro extemporáneo'}
                </div>
              </>
            ) : (
              <div style={{ color: 'rgba(255,255,255,0.93)' }}>Aún no hay registros</div>
            )}
          </div>

          {/* Bloque actual */}
          <div style={{ ...estiloTarjeta, textAlign: 'center', paddingBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.93)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Ahora
            </div>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: 'white' }}>
              {hora12(bloqueActual)}
            </div>
          </div>

          {confirmado && (
            <div style={{ textAlign: 'center', padding: '20px', fontSize: '48px' }}>
              ✓
              <div style={{ fontSize: '16px', color: 'rgba(255,255,255,0.93)', marginTop: '8px' }}>Registrado</div>
            </div>
          )}

          {/* Registro en tiempo real: ON/OFF se bloquean según el último estado */}
          {!confirmado && !formulario && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {ESTADOS.map(estado => {
                const bloqueado = reglas[estado.id];
                return (
                  <button
                    key={estado.id}
                    onClick={() => registrarAhora(estado.id)}
                    disabled={enviando || bloqueado}
                    aria-disabled={bloqueado}
                    style={{
                      background: 'rgba(255,255,255,0.04)',
                      border: `2px solid ${estado.colorBorde}`,
                      borderRadius: '16px', padding: '20px 24px', color: 'white',
                      cursor: bloqueado ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                      display: 'flex', alignItems: 'center', gap: '16px',
                      textAlign: 'left', width: '100%',
                      opacity: bloqueado ? 0.75 : 1, transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ fontSize: '32px', flexShrink: 0 }}>{estado.emoji}</span>
                    <div>
                      <div style={{ fontSize: '20px', fontWeight: '600', color: estado.color }}>{estado.label}</div>
                      <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.93)', marginTop: '2px' }}>
                        {bloqueado ? `Tu último estado ya es ${estado.label}` : estado.descripcion}
                      </div>
                    </div>
                  </button>
                );
              })}
              <button onClick={abrirAlta} style={{ ...estiloBtnPequeno, padding: '12px', fontSize: '14px', marginTop: '4px' }}>
                🕒 Registrar una hora anterior
              </button>
            </div>
          )}

          {mensajeVisual}

          <div style={{ marginTop: '20px', fontSize: '12px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', lineHeight: '1.6' }}>
            Registra cómo te sientes en este momento.<br />
            Puedes registrar una hora anterior hasta 7 días atrás.
          </div>
        </>
      )}

      {/* ── VISTA MI DÍA ──────────────────────────────────── */}
      {vistaActiva === 'hoy' && (
        <>
          {/* Selector de día: hoy y los siete días anteriores */}
          <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '8px', marginBottom: '12px' }}>
            {dias.map(d => (
              <button key={d.fecha} onClick={() => setDiaSeleccionado(d.fecha)}
                style={{ ...estiloBtnPequeno, whiteSpace: 'nowrap', flexShrink: 0,
                  background: d.fecha === dia ? '#2AACB0' : 'transparent',
                  borderColor: d.fecha === dia ? '#2AACB0' : 'rgba(255,255,255,0.25)',
                  fontWeight: d.fecha === dia ? 600 : 400 }}>
                {d.etiqueta}
              </button>
            ))}
          </div>

          <div style={estiloTarjeta}>
            <h3 style={{ margin: '0 0 16px', fontSize: '15px', color: '#2AACB0' }}>
              {dias.find(d => d.fecha === dia)?.etiqueta} — {new Date(`${dia}T12:00:00Z`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' })}
            </h3>
            {cargando ? (
              <div style={{ textAlign: 'center', padding: '30px', color: 'rgba(255,255,255,0.93)' }}>Cargando...</div>
            ) : (
              <GrillaDia bloques={bloques} bloqueActualStr={dia === fechaHoy ? bloqueActual : null} />
            )}
          </div>

          <div style={estiloTarjeta}>
            <h3 style={{ margin: '0 0 8px', fontSize: '15px', color: '#2AACB0' }}>Periodos del día</h3>
            {!cargando && periodos.length === 0 && (
              <div style={{ textAlign: 'center', padding: '12px', color: 'rgba(255,255,255,0.93)', fontSize: '14px' }}>
                Sin periodos registrados este día.
              </div>
            )}
            {periodos.map(p => {
              const d = def(p.estado);
              const guardada = duracionDePeriodo(p);
              const sugerida = propuestaDuracion(p.minutosExactos);
              const editando = duracionEdit?.id === idDuracion(p);
              return (
                <div key={p.ids[0]} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 0' }}>
                  <div style={{ fontSize: '15px', color: d?.color, fontWeight: 600 }}>
                    {d?.emoji} {d?.label}
                    {p.ids.length > 1 && <span style={{ fontSize: '12px', fontWeight: 400, color: 'rgba(255,255,255,0.93)' }}> · {p.ids.length} registros unidos</span>}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.93)' }}>
                    {hora12(p.inicio.slice(11, 16))} – {p.fin ? hora12(p.fin.slice(11, 16)) : 'sin cierre registrado'}
                    {' · '}{textoDuracion(p.minutosExactos)}
                    {p.extemporaneo && ' · 🕒 extemporáneo'}
                  </div>

                  {guardada && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.85)', marginTop: '4px' }}>
                      Duración aproximada: ≈ {textoDuracion(guardada.minutos)}
                      {guardada.origen === 'usuario' ? ' (ajustada por ti)' : ' (sugerencia elegida)'}
                    </div>
                  )}

                  {!editando && (
                    <button onClick={() => abrirDuracion(p)} disabled={enviando}
                      style={{ ...estiloBtnPequeno, marginTop: '6px', fontSize: '11px' }}>
                      {guardada ? 'Cambiar duración aproximada' : 'Anotar duración aproximada'}
                    </button>
                  )}

                  {editando && (
                    <div style={{ marginTop: '8px', padding: '10px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.93)', marginBottom: '8px' }}>
                        {sugerida
                          ? `Sugerencia: ${textoDuracion(sugerida)} (redondeo a 15 min). Es aproximada; no cambia las horas.`
                          : 'Sin cierre registrado: escribe cuánto duró, si lo sabes. Es aproximada.'}
                      </div>
                      {sugerida && (
                        <button onClick={() => guardarDuracion(idDuracion(p), sugerida, 'sugerencia')} disabled={enviando}
                          style={{ ...estiloBtnPequeno, width: '100%', marginBottom: '8px' }}>
                          Usar sugerencia: {textoDuracion(sugerida)}
                        </button>
                      )}
                      <label htmlFor={`dur-${idDuracion(p)}`} style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.93)', marginBottom: '4px' }}>
                        Minutos (ajuste libre, 1 a {DURACION_MAX_MIN})
                      </label>
                      <input id={`dur-${idDuracion(p)}`} type="number" inputMode="numeric" min={1} max={DURACION_MAX_MIN} step={1}
                        value={duracionEdit.texto}
                        aria-invalid={!!duracionEdit.error}
                        onChange={e => setDuracionEdit({ ...duracionEdit, texto: e.target.value, error: '' })}
                        style={{ width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.35)',
                          background: 'rgba(255,255,255,0.06)', color: 'white', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: '8px' }} />
                      {duracionEdit.error && (
                        <div role="alert" style={{ fontSize: '12px', color: '#ff6b6b', marginBottom: '8px' }}>{duracionEdit.error}</div>
                      )}
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={guardarAjusteUsuario} disabled={enviando}
                          style={{ ...estiloBtnPequeno, flex: 1, background: '#2AACB0', fontWeight: 600 }}>
                          Guardar ajuste
                        </button>
                        <button onClick={() => setDuracionEdit(null)} disabled={enviando}
                          style={{ ...estiloBtnPequeno, flex: 1 }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {cruzados.length > 0 && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.93)' }}>
                No se suman en el total {cruzados.length} bloques históricos que se cruzan con un periodo de hora exacta.
              </div>
            )}
          </div>

          <div style={estiloTarjeta}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '15px', color: '#2AACB0' }}>Registros del día</h3>
              <button onClick={abrirAlta} disabled={enviando} style={estiloBtnPequeno}>+ Registrar</button>
            </div>
            {listaDia.length === 0 && (
              <div style={{ textAlign: 'center', padding: '12px', color: 'rgba(255,255,255,0.93)', fontSize: '14px' }}>
                Sin registros en este día.
              </div>
            )}
            {listaDia.map(ev => (
              <div key={ev.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                  <div>
                    <div style={{ fontSize: '15px', color: def(ev.estado)?.color, fontWeight: 600 }}>
                      {def(ev.estado)?.emoji} {def(ev.estado)?.label}
                    </div>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.93)' }}>
                      {hora12(ev.ocurrio_en.slice(11, 16))}
                      {ev.extemporaneo && ' · 🕒 Registro extemporáneo'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => abrirCorregir(ev)} disabled={enviando} style={estiloBtnPequeno}>Corregir</button>
                    <button onClick={() => setConfirmarEliminar({ id: ev.id, restantes: SEGUNDOS_CONFIRMAR })}
                      disabled={enviando} style={{ ...estiloBtnPequeno, borderColor: 'rgba(231,76,60,0.6)' }}>
                      Eliminar
                    </button>
                  </div>
                </div>

                {confirmarEliminar?.id === ev.id && (
                  <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', background: 'rgba(231,76,60,0.1)' }}>
                    <div style={{ fontSize: '13px', marginBottom: '10px' }}>
                      ¿Eliminar este registro? Dejará de contar en la gráfica y en el último estado. Se conserva en el historial.
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => eliminar(ev.id)} disabled={confirmarEliminar.restantes > 0 || enviando}
                        style={{ ...estiloBtnPequeno, flex: 1, background: confirmarEliminar.restantes > 0 ? 'transparent' : '#E74C3C' }}>
                        {confirmarEliminar.restantes > 0 ? `Sí, eliminar (${confirmarEliminar.restantes})` : 'Sí, eliminar'}
                      </button>
                      <button onClick={() => setConfirmarEliminar(null)} style={{ ...estiloBtnPequeno, flex: 1 }}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Trazabilidad: corregidos y eliminados, nunca como vigentes */}
          <div style={estiloTarjeta}>
            <h3 style={{ margin: '0 0 6px', fontSize: '15px', color: '#2AACB0' }}>Cambios de los últimos 7 días</h3>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.93)', marginBottom: '10px' }}>
              Episodios corregidos o eliminados. No cuentan en la gráfica ni en el reporte.
            </div>
            {cambios.length === 0 && (
              <div style={{ textAlign: 'center', padding: '10px', color: 'rgba(255,255,255,0.93)', fontSize: '14px' }}>
                Sin cambios en este periodo.
              </div>
            )}
            {cambios.map(h => {
              const t = textoTrazabilidad(h, ahora, porId);
              return (
                <div key={h.id} style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '10px 0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: h.motivo_anulacion === 'eliminacion' ? '#E74C3C' : '#F39C12' }}>
                    {t.titulo} · {t.cuando}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.93)', marginTop: '2px' }}>{t.detalle}</div>
                  {h.duracion_aproximada && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.93)', marginTop: '2px' }}>
                      Duración aproximada anotada en este episodio: ≈ {textoDuracion(h.duracion_aproximada.minutos)}. No se pasó al episodio que lo reemplaza.
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {mensajeVisual}
        </>
      )}
    </div>
  );
}
