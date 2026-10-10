import React, { useState, useEffect, useCallback } from 'react';

// Escala 0-4 igual a MDS-UPDRS
// 0 = normal / sin problema
// 1 = leve
// 2 = moderado
// 3 = marcado
// 4 = severo

const PREGUNTAS = [
  {
    id: 'energia',
    emoji: '⚡',
    titulo: 'Energía / Fatiga',
    pregunta: '¿Cómo está tu energía hoy?',
    opciones: [
      { valor: 0, label: 'Sin fatiga', desc: 'Me siento con energía normal' },
      { valor: 1, label: 'Fatiga leve', desc: 'Me canso un poco más de lo normal' },
      { valor: 2, label: 'Fatiga moderada', desc: 'Tuve que descansar más de lo usual' },
      { valor: 3, label: 'Fatiga marcada', desc: 'La fatiga limitó mis actividades' },
      { valor: 4, label: 'Fatiga severa', desc: 'Apenas pude hacer algo por el cansancio' },
    ],
    color: '#F39C12',
  },
  {
    id: 'calidad_sueno',
    emoji: '🌙',
    titulo: 'Sueño nocturno',
    pregunta: '¿Cómo dormiste anoche?',
    opciones: [
      { valor: 0, label: 'Dormí bien', desc: 'Sueño reparador, sin interrupciones' },
      { valor: 1, label: 'Leve interrupción', desc: 'Me desperté una o dos veces' },
      { valor: 2, label: 'Sueño fragmentado', desc: 'Varios despertares, no descansé bien' },
      { valor: 3, label: 'Noche difícil', desc: 'Pocas horas de sueño continuo' },
      { valor: 4, label: 'Casi no dormí', desc: 'Noche muy mala, apenas dormí' },
    ],
    color: '#8E44AD',
  },
  {
    id: 'somnolencia',
    emoji: '😴',
    titulo: 'Somnolencia de día',
    pregunta: '¿Tuviste sueño durante el día?',
    opciones: [
      { valor: 0, label: 'Sin somnolencia', desc: 'Estuve alerta todo el día' },
      { valor: 1, label: 'Somnolencia leve', desc: 'Un poco de sueño pero sin dificultad' },
      { valor: 2, label: 'Somnolencia moderada', desc: 'Tuve que hacer esfuerzo para mantenerme despierto' },
      { valor: 3, label: 'Somnolencia marcada', desc: 'Me quedé dormido brevemente en actividades' },
      { valor: 4, label: 'Somnolencia severa', desc: 'Me dormí varias veces en momentos inapropiados' },
    ],
    color: '#2980B9',
  },
  {
    id: 'animo',
    emoji: '🧠',
    titulo: 'Ánimo',
    pregunta: '¿Cómo está tu ánimo hoy?',
    opciones: [
      { valor: 0, label: 'Buen ánimo', desc: 'Me siento bien emocionalmente' },
      { valor: 1, label: 'Ánimo algo bajo', desc: 'Un poco triste o sin motivación' },
      { valor: 2, label: 'Ánimo moderado bajo', desc: 'Tristeza notable pero puedo funcionar' },
      { valor: 3, label: 'Ánimo marcadamente bajo', desc: 'Tristeza que afecta mis actividades' },
      { valor: 4, label: 'Ánimo muy bajo', desc: 'Tristeza intensa, dificultad para hacer cualquier cosa' },
    ],
    color: '#27AE60',
  },
  {
    id: 'ansiedad',
    emoji: '😰',
    titulo: 'Ansiedad',
    pregunta: '¿Sentiste ansiedad hoy?',
    opciones: [
      { valor: 0, label: 'Tranquilo', desc: 'Sin ansiedad' },
      { valor: 1, label: 'Ansiedad leve', desc: 'Un poco de nerviosismo' },
      { valor: 2, label: 'Ansiedad moderada', desc: 'Ansiedad notable pero manejable' },
      { valor: 3, label: 'Ansiedad marcada', desc: 'Ansiedad difícil de controlar' },
      { valor: 4, label: 'Ansiedad severa', desc: 'Ansiedad intensa que me afectó mucho' },
    ],
    color: '#E74C3C',
  },
  {
    id: 'digestion',
    emoji: '🫁',
    titulo: 'Digestión',
    pregunta: '¿Cómo estuvo tu digestión?',
    opciones: [
      { valor: 0, label: 'Normal', desc: 'Sin problemas digestivos' },
      { valor: 1, label: 'Leve dificultad', desc: 'Algo irregular, sin mucha molestia' },
      { valor: 2, label: 'Moderada dificultad', desc: 'Estreñimiento o malestar notable' },
      { valor: 3, label: 'Dificultad marcada', desc: 'Estreñimiento importante' },
      { valor: 4, label: 'Grave', desc: 'Sin ir al baño desde hace días / dolor' },
    ],
    color: '#795548',
  },
  {
    id: 'nauseas',
    emoji: '🤢',
    titulo: 'Náuseas',
    pregunta: '¿Tuviste náuseas hoy?',
    opciones: [
      { valor: 0, label: 'Sin náuseas', desc: 'Sin ninguna molestia' },
      { valor: 1, label: 'Náuseas leves', desc: 'Un poco de asco pasajero' },
      { valor: 2, label: 'Náuseas moderadas', desc: 'Náuseas molestas pero pude comer' },
      { valor: 3, label: 'Náuseas marcadas', desc: 'Dificultad para comer por las náuseas' },
      { valor: 4, label: 'Náuseas severas', desc: 'Vómitos o no pude comer nada' },
    ],
    color: '#00796B',
  },
  {
    id: 'dolor',
    emoji: '🩹',
    titulo: 'Dolor',
    pregunta: '¿Tuviste dolor o molestias hoy?',
    opciones: [
      { valor: 0, label: 'Sin dolor', desc: 'Sin molestias' },
      { valor: 1, label: 'Dolor leve', desc: 'Molestia menor, apenas perceptible' },
      { valor: 2, label: 'Dolor moderado', desc: 'Dolor presente pero puedo funcionar' },
      { valor: 3, label: 'Dolor marcado', desc: 'Dolor que limitó mis actividades' },
      { valor: 4, label: 'Dolor severo', desc: 'Dolor intenso, muy difícil de ignorar' },
    ],
    color: '#D32F2F',
  },
];

const COLOR_VALOR = {
  0: '#27AE60',
  1: '#8BC34A',
  2: '#FFC107',
  3: '#FF7043',
  4: '#D32F2F',
};

function TarjetaPregunta({ pregunta, valor, onChange }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(42,172,176,0.15)',
      borderRadius: '16px',
      padding: '18px 20px',
      marginBottom: '14px',
    }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
        <span style={{ fontSize: '24px' }}>{pregunta.emoji}</span>
        <div>
          <div style={{ fontSize: '15px', fontWeight: '600', color: 'white' }}>{pregunta.titulo}</div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>{pregunta.pregunta}</div>
        </div>
        {valor !== null && valor !== undefined && (
          <div style={{
            marginLeft: 'auto',
            background: COLOR_VALOR[valor] + '22',
            border: `1px solid ${COLOR_VALOR[valor]}`,
            borderRadius: '20px',
            padding: '3px 12px',
            fontSize: '12px',
            color: COLOR_VALOR[valor],
            fontWeight: '600',
            flexShrink: 0,
          }}>
            {valor}/4
          </div>
        )}
      </div>

      {/* Opciones */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {pregunta.opciones.map(op => {
          const seleccionada = valor === op.valor;
          return (
            <button
              key={op.valor}
              onClick={() => onChange(op.valor)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                background: seleccionada ? COLOR_VALOR[op.valor] + '22' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${seleccionada ? COLOR_VALOR[op.valor] : 'rgba(255,255,255,0.08)'}`,
                borderRadius: '10px',
                padding: '10px 14px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{
                width: '20px', height: '20px',
                borderRadius: '50%',
                border: `2px solid ${seleccionada ? COLOR_VALOR[op.valor] : 'rgba(255,255,255,0.2)'}`,
                background: seleccionada ? COLOR_VALOR[op.valor] : 'transparent',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {seleccionada && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white' }} />}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: seleccionada ? '600' : '400', color: seleccionada ? 'white' : 'rgba(255,255,255,0.7)' }}>
                  {op.label}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '1px' }}>
                  {op.desc}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MiniRadar({ registro }) {
  // Indicador visual rápido de los 8 dominios
  const dominios = PREGUNTAS.map(p => ({
    label: p.emoji,
    titulo: p.titulo,
    valor: registro?.[p.id] ?? null,
  }));

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: '8px',
      marginBottom: '20px',
    }}>
      {dominios.map(d => (
        <div key={d.label} style={{
          background: d.valor !== null ? COLOR_VALOR[d.valor] + '18' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${d.valor !== null ? COLOR_VALOR[d.valor] + '60' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: '10px',
          padding: '8px',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '20px' }}>{d.label}</div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
            {d.titulo.split(' ')[0]}
          </div>
          {d.valor !== null ? (
            <div style={{ fontSize: '14px', fontWeight: 'bold', color: COLOR_VALOR[d.valor], marginTop: '2px' }}>
              {d.valor}
            </div>
          ) : (
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>—</div>
          )}
        </div>
      ))}
    </div>
  );
}

export default function RegistroDiarioPage({ token, apiUrl }) {
  const [vista, setVista] = useState('hoy'); // 'hoy' | 'historial'
  const [respuestas, setRespuestas] = useState({});
  const [notaDia, setNotaDia] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [registroExistente, setRegistroExistente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [historial, setHistorial] = useState([]);

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const cargarHoy = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/registro-diario/hoy`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setRegistroExistente(data);
          const r = {};
          PREGUNTAS.forEach(p => {
            if (data[p.id] !== null && data[p.id] !== undefined) r[p.id] = data[p.id];
          });
          setRespuestas(r);
          setNotaDia(data.nota_dia || '');
        }
      }
    } catch (e) {
      console.error('Error cargando registro:', e);
    } finally {
      setCargando(false);
    }
  }, [apiUrl, token]);

  const cargarHistorial = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/registro-diario/historial?dias=14`, { headers });
      if (res.ok) {
        const data = await res.json();
        setHistorial(data);
      }
    } catch (e) {
      console.error('Error cargando historial:', e);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    cargarHoy();
  }, [cargarHoy]);

  useEffect(() => {
    if (vista === 'historial') cargarHistorial();
  }, [vista, cargarHistorial]);

  const handleRespuesta = (id, valor) => {
    setRespuestas(prev => ({ ...prev, [id]: valor }));
  };

  const handleGuardar = async () => {
    const totalRespondidas = Object.keys(respuestas).length;
    if (totalRespondidas === 0) {
      setMensaje('Responde al menos una pregunta para guardar');
      setTimeout(() => setMensaje(''), 3000);
      return;
    }

    setGuardando(true);
    try {
      const payload = { ...respuestas, nota_dia: notaDia };
      const res = await fetch(`${apiUrl}/api/registro-diario`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setRegistroExistente(data);
        setMensaje(`✓ Registro guardado (${totalRespondidas}/8 dominios)`);
        setTimeout(() => setMensaje(''), 3000);
      } else {
        const err = await res.json();
        setMensaje(`Error: ${err.error}`);
      }
    } catch (e) {
      setMensaje('Error de conexión');
    } finally {
      setGuardando(false);
    }
  };

  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  const estiloBtn = (activo) => ({
    padding: '8px 18px',
    borderRadius: '20px',
    border: `1px solid ${activo ? '#2AACB0' : 'rgba(255,255,255,0.15)'}`,
    background: activo ? '#2AACB0' : 'transparent',
    color: 'white',
    fontSize: '13px',
    fontWeight: activo ? '600' : '400',
    cursor: 'pointer',
    fontFamily: 'inherit',
    transition: 'all 0.2s',
  });

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.75)' }}>
        Cargando...
      </div>
    );
  }

  return (
    <div style={{ padding: '16px 16px 40px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>

      {/* Selector vista */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button style={estiloBtn(vista === 'hoy')} onClick={() => setVista('hoy')}>
          📋 Registro de hoy
        </button>
        <button style={estiloBtn(vista === 'historial')} onClick={() => setVista('historial')}>
          📅 Últimas 2 semanas
        </button>
      </div>

      {/* ── VISTA HOY ─────────────────────────────── */}
      {vista === 'hoy' && (
        <>
          {/* Encabezado */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>
              {hoy}
            </div>
            <div style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginTop: '2px' }}>
              ¿Cómo te sientes hoy?
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '4px', lineHeight: '1.5' }}>
              Escala 0–4 · 0 = sin problema · 4 = muy grave
            </div>
          </div>

          {/* Mini resumen si ya hay registro */}
          {registroExistente && (
            <div style={{
              background: 'rgba(42,172,176,0.08)',
              border: '1px solid rgba(42,172,176,0.25)',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '16px',
              fontSize: '13px',
              color: 'rgba(255,255,255,0.6)',
            }}>
              ✓ Ya tienes un registro para hoy · puedes actualizarlo
            </div>
          )}

          {/* Resumen visual */}
          {Object.keys(respuestas).length > 0 && (
            <MiniRadar registro={respuestas} />
          )}

          {/* Mensaje */}
          {mensaje && (
            <div style={{
              background: mensaje.includes('Error') ? 'rgba(220,53,69,0.15)' : 'rgba(40,167,69,0.15)',
              border: `1px solid ${mensaje.includes('Error') ? 'rgba(220,53,69,0.4)' : 'rgba(40,167,69,0.4)'}`,
              borderRadius: '10px',
              padding: '10px 16px',
              marginBottom: '16px',
              fontSize: '13px',
              color: mensaje.includes('Error') ? '#ff6b6b' : '#5dde83',
            }}>
              {mensaje}
            </div>
          )}

          {/* Preguntas */}
          {PREGUNTAS.map(p => (
            <TarjetaPregunta
              key={p.id}
              pregunta={p}
              valor={respuestas[p.id] ?? null}
              onChange={(v) => handleRespuesta(p.id, v)}
            />
          ))}

          {/* Nota libre */}
          <div style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(42,172,176,0.15)',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '20px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '20px' }}>📝</span>
              <span style={{ fontSize: '14px', color: 'white', fontWeight: '500' }}>Nota del día</span>
            </div>
            <textarea
              value={notaDia}
              onChange={e => setNotaDia(e.target.value)}
              placeholder="¿Algo especial que pasó hoy? ¿Algo que quieras recordar para contarle al médico..."
              rows={3}
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '10px',
                padding: '10px 12px',
                color: 'white',
                fontFamily: 'inherit',
                fontSize: '13px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Botón guardar */}
          <button
            onClick={handleGuardar}
            disabled={guardando}
            style={{
              width: '100%',
              background: guardando ? 'rgba(42,172,176,0.5)' : '#2AACB0',
              color: 'white',
              border: 'none',
              borderRadius: '14px',
              padding: '16px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: guardando ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'all 0.2s',
            }}
          >
            {guardando ? 'Guardando...' : (registroExistente ? 'Actualizar registro' : 'Guardar registro del día')}
          </button>

          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', textAlign: 'center', marginTop: '14px', lineHeight: '1.6' }}>
            Puedes responder solo las preguntas que apliquen.<br/>
            Este registro es tuyo — ayuda a ver patrones con el tiempo.
          </div>
        </>
      )}

      {/* ── VISTA HISTORIAL ───────────────────────── */}
      {vista === 'historial' && (
        <>
          <div style={{ marginBottom: '16px', fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>
            Últimas 2 semanas de registros diarios
          </div>
          {historial.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px 20px',
              color: 'rgba(255,255,255,0.75)',
              fontSize: '14px',
            }}>
              Sin registros aún.<br/>
              <span style={{ fontSize: '12px' }}>Usa "Registro de hoy" para empezar.</span>
            </div>
          ) : (
            historial.map(r => {
              const fecha = new Date(r.fecha + 'T12:00:00');
              const dominiosRespondidos = PREGUNTAS.filter(p => r[p.id] !== null && r[p.id] !== undefined);
              const promedio = dominiosRespondidos.length > 0
                ? (dominiosRespondidos.reduce((s, p) => s + r[p.id], 0) / dominiosRespondidos.length).toFixed(1)
                : null;

              return (
                <div key={r.id} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(42,172,176,0.12)',
                  borderRadius: '14px',
                  padding: '14px 16px',
                  marginBottom: '10px',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: 'white' }}>
                        {fecha.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>
                        {dominiosRespondidos.length}/8 dominios registrados
                      </div>
                    </div>
                    {promedio !== null && (
                      <div style={{
                        background: COLOR_VALOR[Math.round(promedio)] + '22',
                        border: `1px solid ${COLOR_VALOR[Math.round(promedio)]}`,
                        borderRadius: '20px',
                        padding: '4px 12px',
                        fontSize: '13px',
                        fontWeight: '600',
                        color: COLOR_VALOR[Math.round(promedio)],
                      }}>
                        Prom. {promedio}
                      </div>
                    )}
                  </div>

                  {/* Mini grid de dominios */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {PREGUNTAS.map(p => {
                      const v = r[p.id];
                      if (v === null || v === undefined) return null;
                      return (
                        <div key={p.id} style={{
                          background: COLOR_VALOR[v] + '18',
                          border: `1px solid ${COLOR_VALOR[v] + '50'}`,
                          borderRadius: '8px',
                          padding: '4px 8px',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: 'rgba(255,255,255,0.7)',
                        }}>
                          <span>{p.emoji}</span>
                          <span style={{ color: COLOR_VALOR[v], fontWeight: '600' }}>{v}</span>
                        </div>
                      );
                    })}
                  </div>

                  {r.nota_dia && (
                    <div style={{
                      marginTop: '10px',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.75)',
                      fontStyle: 'italic',
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      paddingTop: '8px',
                    }}>
                      📝 {r.nota_dia}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </>
      )}
    </div>
  );
}
