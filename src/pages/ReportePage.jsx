import React, { useState, useEffect, useCallback, useRef } from 'react';

const COLOR_ESTADO = {
  ON: { color: '#27AE60', label: 'ON', emoji: '🟢' },
  OFF: { color: '#E74C3C', label: 'OFF', emoji: '🔴' },
  ON_DISC_LEVE: { color: '#F39C12', label: 'ON c/mov.', emoji: '🟡' },
  ON_DISC_GRAVE: { color: '#E67E22', label: 'ON c/discinesia', emoji: '🟠' },
  DORMIDO: { color: '#4A5568', label: 'Dormido', emoji: '😴' },
};

const NO_MOTOR_LABELS = {
  energia: { emoji: '⚡', label: 'Fatiga/Energía' },
  calidad_sueno: { emoji: '🌙', label: 'Sueño nocturno' },
  somnolencia: { emoji: '😴', label: 'Somnolencia de día' },
  animo: { emoji: '🧠', label: 'Ánimo' },
  ansiedad: { emoji: '😰', label: 'Ansiedad' },
  digestion: { emoji: '🫁', label: 'Digestión' },
  nauseas: { emoji: '🤢', label: 'Náuseas' },
  dolor: { emoji: '🩹', label: 'Dolor' },
  apetito: { emoji: '🍽️', label: 'Apetito' },
};

const COLOR_PROMEDIO = (v) => {
  if (v === null || v === undefined) return '#555';
  if (v <= 0.5) return '#27AE60';
  if (v <= 1.5) return '#8BC34A';
  if (v <= 2.5) return '#FFC107';
  if (v <= 3.5) return '#FF7043';
  return '#D32F2F';
};

const LABEL_PROMEDIO = (v) => {
  if (v === null || v === undefined) return 'Sin datos';
  if (v <= 0.5) return 'Sin problema';
  if (v <= 1.5) return 'Leve';
  if (v <= 2.5) return 'Moderado';
  if (v <= 3.5) return 'Marcado';
  return 'Severo';
};

function BarraAdherencia({ pct }) {
  const color = pct >= 80 ? '#27AE60' : pct >= 60 ? '#FFC107' : '#E74C3C';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>Adherencia al tratamiento</span>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color }}>{pct}%</span>
      </div>
      <div style={{ height: '10px', background: 'rgba(255,255,255,0.08)', borderRadius: '5px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: color,
          borderRadius: '5px',
          transition: 'width 1s ease',
        }} />
      </div>
    </div>
  );
}

const plural = (n, singular, pluralTxt) => `${n} ${n === 1 ? singular : pluralTxt}`;

export default function ReportePage({ token, apiUrl }) {
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [dias, setDias] = useState(30);
  const reporteRef = useRef(null);

  const cargarReporte = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const res = await fetch(`${apiUrl}/api/reporte?dias=${dias}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReporte(data);
      } else {
        const err = await res.json();
        setError(err.error || 'Error al cargar el reporte');
      }
    } catch (e) {
      setError('Error de conexión');
    } finally {
      setCargando(false);
    }
  }, [apiUrl, token, dias]);

  useEffect(() => {
    cargarReporte();
  }, [cargarReporte]);

  const handleImprimir = () => {
    window.print();
  };

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.75)' }}>
        Generando reporte...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '24px', color: '#ff6b6b', textAlign: 'center' }}>
        {error}
      </div>
    );
  }

  if (!reporte) return null;

  const { paciente, periodo, adherencia, estado_motor, sintomas_motores, no_motor } = reporte;
  const horas = estado_motor.horas;
  const totalHorasRegistradas = Object.values(horas).reduce((a, b) => a + b, 0);

  return (
    <>
      {/* Estilos de impresión */}
      <style>{`
        @media print {
          html, body { background: white !important; overflow: visible !important; height: auto !important; }
          /* Solo se imprime el reporte: menú, pestañas, botón flotante y barra quedan ocultos */
          body * { visibility: hidden !important; }
          .reporte-contenido, .reporte-contenido * { visibility: visible !important; }
          .reporte-contenido {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: none !important;
            padding: 0 !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          /* Texto oscuro sobre papel blanco para que se lea en blanco y negro */
          .reporte-contenido, .reporte-contenido * {
            color: #1a1a2e !important;
            -webkit-text-fill-color: #1a1a2e !important;
          }
          .tarjeta-reporte {
            border: 1px solid #ddd !important;
            break-inside: avoid;
            background: white !important;
          }
        }
      `}</style>

      <div ref={reporteRef} className="reporte-contenido"
        style={{ padding: '16px 16px 40px', maxWidth: '700px', margin: '0 auto', color: 'white' }}>

        {/* Controles (no imprimir) */}
        <div className="no-print" style={{ display: 'flex', gap: '10px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          <select
            value={dias}
            onChange={e => setDias(Number(e.target.value))}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(42,172,176,0.3)',
              borderRadius: '10px',
              padding: '8px 14px',
              color: 'white',
              fontFamily: 'inherit',
              fontSize: '13px',
            }}
          >
            <option value={7}>Últimos 7 días</option>
            <option value={14}>Últimas 2 semanas</option>
            <option value={30}>Último mes</option>
            <option value={60}>Últimos 2 meses</option>
          </select>
          <button
            onClick={handleImprimir}
            style={{
              background: '#2AACB0',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            🖨️ Imprimir / Guardar PDF
          </button>
        </div>

        {/* ENCABEZADO CON LOGO */}
        <div className="tarjeta-reporte" style={{
          background: 'linear-gradient(135deg, rgba(26,58,92,0.9) 0%, rgba(42,172,176,0.15) 100%)',
          border: '1px solid rgba(42,172,176,0.3)',
          borderRadius: '18px',
          padding: '24px',
          marginBottom: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
        }}>
          <div>
            <div style={{ display: 'inline-block', background: '#ffffff', borderRadius: '999px', padding: '6px 18px', marginBottom: '12px' }}>
              <img
                src="/assets/Logo_En_Marcha_Contigo_Fondo_Transparente.png"
                alt="En Marcha Contigo"
                style={{ height: '76px', display: 'block' }}
                onError={e => { e.target.style.display = 'none'; }}
              />
            </div>
            <div className="texto-reporte" style={{ fontSize: '18px', fontWeight: 'bold', color: 'white' }}>
              Reporte de Seguimiento Neurológico
            </div>
            <div className="subtexto-reporte" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.55)', marginTop: '4px' }}>
              Paciente: <strong style={{ color: 'rgba(255,255,255,0.85)' }}>{paciente.nombre}</strong>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="subtexto-reporte" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>Período analizado</div>
            <div className="texto-reporte" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', fontWeight: '600', marginTop: '2px' }}>
              {new Date(periodo.desde + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}
              {' – '}
              {new Date(periodo.hasta + 'T12:00:00').toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
            <div className="subtexto-reporte" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>
              {periodo.dias} días · {plural(no_motor.dias_registrados, 'día', 'días')} con registro completo
            </div>
          </div>
        </div>

        {/* SECCIÓN: ADHERENCIA */}
        <div className="tarjeta-reporte" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(42,172,176,0.15)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '14px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2AACB0', marginBottom: '14px' }}>
            💊 Adherencia al Tratamiento
          </div>
          <BarraAdherencia pct={adherencia.porcentaje} />
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '10px', marginTop: '14px',
          }}>
            {[
              { label: 'Tomas programadas', valor: adherencia.total_programadas, color: 'rgba(255,255,255,0.6)' },
              { label: 'Tomadas', valor: adherencia.tomadas, color: '#27AE60' },
              { label: 'Omitidas', valor: adherencia.omitidas, color: '#E74C3C' },
            ].map(item => (
              <div key={item.label} style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: '10px',
                padding: '10px',
                textAlign: 'center',
              }}>
                <div className="texto-reporte" style={{ fontSize: '22px', fontWeight: 'bold', color: item.color }}>{item.valor}</div>
                <div className="subtexto-reporte" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginTop: '2px' }}>{item.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* SECCIÓN: ESTADO MOTOR */}
        {totalHorasRegistradas > 0 && (
          <div className="tarjeta-reporte" style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(42,172,176,0.15)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2AACB0', marginBottom: '14px' }}>
              🌡️ Estado Motor — Diario de Hauser
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {Object.entries(COLOR_ESTADO).map(([key, def]) => {
                const h = horas[key] || 0;
                if (h === 0) return null;
                const pct = totalHorasRegistradas > 0 ? Math.round((h / totalHorasRegistradas) * 100) : 0;
                return (
                  <div key={key} style={{
                    background: def.color + '18',
                    border: `1px solid ${def.color + '50'}`,
                    borderRadius: '12px',
                    padding: '12px 16px',
                    flex: '1 1 120px',
                    minWidth: '100px',
                  }}>
                    <div style={{ fontSize: '20px', marginBottom: '4px' }}>{def.emoji}</div>
                    <div className="texto-reporte" style={{ fontSize: '18px', fontWeight: 'bold', color: def.color }}>{h}h</div>
                    <div className="subtexto-reporte" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)' }}>{def.label} · {pct}%</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECCIÓN: SÍNTOMAS NO MOTORES */}
        {no_motor.dias_registrados > 0 && (
          <div className="tarjeta-reporte" style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(42,172,176,0.15)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2AACB0', marginBottom: '14px' }}>
              🌿 Síntomas No Motores — Promedio del Período
            </div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', marginBottom: '12px' }}>
              Escala 0–4 · 0 = sin problema · 4 = severo · Basado en {plural(no_motor.dias_registrados, 'día', 'días')} con registro
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(NO_MOTOR_LABELS).map(([key, def]) => {
                const v = no_motor.promedios?.[key];
                if (v === null || v === undefined) return null;
                const color = COLOR_PROMEDIO(v);
                return (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '18px', width: '24px', flexShrink: 0 }}>{def.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                        <span className="texto-reporte" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>{def.label}</span>
                        <span style={{ fontSize: '12px', fontWeight: '600', color }}>
                          {v} — {LABEL_PROMEDIO(v)}
                        </span>
                      </div>
                      <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(v / 4) * 100}%`,
                          background: color,
                          borderRadius: '3px',
                        }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECCIÓN: SÍNTOMAS MOTORES FRECUENTES */}
        {sintomas_motores.frecuentes.length > 0 && (
          <div className="tarjeta-reporte" style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(42,172,176,0.15)',
            borderRadius: '16px',
            padding: '20px',
            marginBottom: '14px',
          }}>
            <div style={{ fontSize: '14px', fontWeight: '600', color: '#2AACB0', marginBottom: '14px' }}>
              ✏️ Síntomas Reportados ({sintomas_motores.total} en total)
            </div>
            <div style={{ display: 'flex', flex: '1', gap: '8px', flexWrap: 'wrap' }}>
              {sintomas_motores.frecuentes.map(s => (
                <div key={s.tipo} style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '13px',
                  color: 'rgba(255,255,255,0.75)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <span style={{
                    background: '#2AACB0',
                    color: 'white',
                    borderRadius: '10px',
                    padding: '1px 7px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}>{s.conteo}×</span>
                  {s.tipo}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECCIÓN: DOSIS Y HORARIOS VIGENTES EN EL PERÍODO (P62) */}
        <div className="tarjeta-reporte" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(42,172,176,0.15)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '14px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2AACB0', marginBottom: '10px' }}>
            💊 Dosis y horarios vigentes ({(reporte.historial_dosis || []).length})
          </div>
          {(reporte.historial_dosis || []).length === 0 && (
            <div className="subtexto-reporte" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
              Sin registros de dosis en el período.
            </div>
          )}
          {(reporte.historial_dosis || []).map((h, i) => (
            <div key={i} className="texto-reporte" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
              <strong>{h.medicamento}</strong>: {h.dosis}, a las {h.horarios.join(' y ')}
              <div className="subtexto-reporte" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
                Desde {new Date(h.desde).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}{h.hora_utc ? ' UTC' : ''}
                {' · '}{h.hasta
                  ? `hasta ${new Date(h.hasta).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}${h.hora_utc ? ' UTC' : ''}`
                  : 'vigente'}
                {h.hora_utc ? ' · registrado en hora UTC, antes del cambio a hora local' : ''}
              </div>
            </div>
          ))}
        </div>

        {/* SECCIÓN: DOSIS VIGENTE EN CADA TOMA (P62 por toma) */}
        <div className="tarjeta-reporte" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(42,172,176,0.15)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '14px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2AACB0', marginBottom: '10px' }}>
            🕒 Tomas y dosis vigente ({(reporte.tomas_dosis || []).length})
          </div>
          {(reporte.tomas_dosis || []).length === 0 && (
            <div className="subtexto-reporte" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
              Sin tomas programadas en el período.
            </div>
          )}
          {(reporte.tomas_dosis || []).map((t, i) => (
            <div key={i} className="texto-reporte" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '8px' }}>
              <strong>{t.medicamento}</strong> · {t.horario} · {t.tomada ? 'tomada' : t.omitida ? 'omitida' : 'pendiente'}
              <div className="subtexto-reporte" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
                {t.dosis_vigente
                  ? `Dosis vigente: ${t.dosis_vigente}${t.fuente === 'historial' ? '' : ' (dosis actual, sin cambios registrados)'}`
                  : 'Sin registro de dosis para esa hora'}
              </div>
            </div>
          ))}
        </div>

        {/* SECCIÓN: CAMBIOS DE ZONA HORARIA (para interpretar jetlag, dosis de más o de menos) */}
        <div className="tarjeta-reporte" style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(42,172,176,0.15)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '14px',
        }}>
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#2AACB0', marginBottom: '10px' }}>
            🌍 Cambios de zona horaria ({(reporte.cambios_zona || []).length})
          </div>
          {(reporte.cambios_zona || []).length === 0 && (
            <div className="subtexto-reporte" style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)' }}>
              Sin cambios de zona en el período.
            </div>
          )}
          {(reporte.cambios_zona || []).map((c, i) => (
            <div key={i} className="texto-reporte" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.85)', marginBottom: '6px' }}>
              {new Date(c.fecha_local).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
              {' · '}{c.zona_anterior || 'sin dato'} → {c.zona_nueva} ({c.offset_nuevo})
              {' · '}{c.tipo === 'manual' ? 'manual' : 'automático (dispositivo)'}
            </div>
          ))}
        </div>

        {/* PIE */}
        <div style={{
          textAlign: 'center',
          marginTop: '24px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div className="subtexto-reporte" style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', lineHeight: '1.7' }}>
            Reporte generado por <strong style={{ color: '#2AACB0' }}>En Marcha Contigo</strong> · {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}<br/>
            Este documento es informativo. No diagnostica ni prescribe tratamiento.<br/>
            Los datos fueron registrados directamente por el paciente en la aplicación.<br/>
            El Reporte refleja registros compartidos por el usuario de manera manual, diaria y voluntaria. No son producto de análisis clínicos.
          </div>
        </div>

      </div>
    </>
  );
}
