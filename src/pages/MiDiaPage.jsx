import React, { useState, useEffect, useCallback } from 'react';

// Zona horaria del paciente: la que eligió a mano en Configuración, o la del dispositivo.
function zonaDelPaciente() {
  try {
    const cfg = JSON.parse(localStorage.getItem('cfg_reloj') || 'null');
    if (cfg && cfg.modo === 'manual' && cfg.zonaManual) return cfg.zonaManual;
  } catch (e) { /* sin configuración guardada */ }
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch (e) {
    return 'UTC';
  }
}

// Estado visual por toma
const ESTADO_ICONS = {
  pendiente: '⏳',
  tomada: '✅',
  omitida: '❌',
  futura: '🕐'
};

// Ventana de ayuno en minutos antes y después de cada toma
const AYUNO_MINUTOS = 60;

function horaAMinutos(hora) {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

function ahora() {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

function formatHora(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

function getEstadoBloque(tomas, horario) {
  // Si alguna toma del bloque fue tomada
  if (tomas.some(t => t.tomada)) return 'tomada';
  if (tomas.some(t => t.omitida)) return 'omitida';
  const minutosHorario = horaAMinutos(horario);
  const minutosAhora = ahora();
  if (minutosAhora < minutosHorario - 5) return 'futura';
  return 'pendiente';
}

function VentanaAyuno({ horario, estado }) {
  const minHorario = horaAMinutos(horario);
  const inicio = minHorario - AYUNO_MINUTOS;
  const fin = minHorario + AYUNO_MINUTOS;

  const fmtMin = (m) => {
    const h = Math.floor(((m % 1440) + 1440) % 1440 / 60);
    const min = ((m % 1440) + 1440) % 1440 % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  const activa = estado === 'pendiente' || estado === 'tomada';

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      color: activa ? 'rgba(255,193,7,0.9)' : 'rgba(255,255,255,0.3)',
      marginTop: '4px'
    }}>
      <span>🍽️</span>
      <span>Ayuno {fmtMin(inicio)} – {fmtMin(fin)}</span>
    </div>
  );
}

function TarjetaToma({ bloque, onTomar, onOmitir, cargando }) {
  const { horario, tomas = [] } = bloque;
  const [panelHora, setPanelHora] = useState(false);       // "¿A qué hora la tomó?"
  const [confirmarOmitir, setConfirmarOmitir] = useState(false);
  const [hr, setHr] = useState(horaAhoraEnZona());
  // Medicamentos del bloque, tomados de cada toma (nombre y sustancia activa)
  const medicamentos = tomas.map(t => ({
    id: t.id,
    nombre: t.medicamento_nombre,
    dosis: t.medicamento_dosis,
    principio_activo: t.principio_activo,
    separacion_comida_min: t.separacion_comida_min
  }));
  const estado = getEstadoBloque(tomas, horario);
  const tomaHora = tomas.find(t => t.tomada)?.fecha_toma_real;
  // Ids de las tomas que aún no están marcadas (cada toma tiene su propio id)
  const idsPendientes = tomas.filter(t => !t.tomada && !t.omitida).map(t => t.id);
  const tieneAyuno = medicamentos.some(m => (m.separacion_comida_min || 0) > 0);

  const colorBorde = {
    tomada: 'rgba(40,167,69,0.5)',
    omitida: 'rgba(220,53,69,0.4)',
    pendiente: 'rgba(42,172,176,0.5)',
    futura: 'rgba(255,255,255,0.1)'
  }[estado];

  const colorFondo = {
    tomada: 'rgba(40,167,69,0.08)',
    omitida: 'rgba(220,53,69,0.06)',
    pendiente: 'rgba(42,172,176,0.08)',
    futura: 'rgba(255,255,255,0.03)'
  }[estado];

  return (
    <div style={{
      background: colorFondo,
      border: `1px solid ${colorBorde}`,
      borderRadius: '16px',
      padding: '18px 20px',
      marginBottom: '14px',
      transition: 'all 0.3s ease'
    }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '28px', fontWeight: 'bold', color: 'white' }}>{horario}</span>
            <span style={{ fontSize: '22px' }}>{ESTADO_ICONS[estado]}</span>
          </div>
          {/* Lista de medicamentos */}
          <div style={{ marginTop: '8px' }}>
            {medicamentos.map((med, i) => (
              <div key={i} style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.85)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '2px'
              }}>
                <span>💊</span>
                <span style={{ fontWeight: '500' }}>{med.nombre}</span>
                <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>{med.dosis}</span>
              </div>
            ))}
          </div>

          {/* Hora real de toma */}
          {estado === 'tomada' && tomaHora && (
            <div style={{ fontSize: '12px', color: 'rgba(40,167,69,0.9)', marginTop: '6px' }}>
              ✓ Tomado a las {formatHora(tomaHora)}
            </div>
          )}

          {/* Toma antes de su hora: se pide la hora real */}
          {panelHora && (
            <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
              <div style={{ fontSize: '13px', marginBottom: '6px' }}>¿A qué hora la tomó?</div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <label style={{ fontSize: '12px' }}>Hora
                  <select style={campoEstilo} value={hr.h} onChange={e => setHr({ ...hr, h: e.target.value })}>
                    {HORAS_12.map(v => <option key={v} value={v} style={opcionEstilo}>{v}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: '12px' }}>Minutos
                  <select style={campoEstilo} value={hr.m} onChange={e => setHr({ ...hr, m: e.target.value })}>
                    {MINUTOS.map(v => <option key={v} value={v} style={opcionEstilo}>{v}</option>)}
                  </select>
                </label>
                <label style={{ fontSize: '12px' }}>AM / PM
                  <select style={campoEstilo} value={hr.ap} onChange={e => setHr({ ...hr, ap: e.target.value })}>
                    <option value="AM" style={opcionEstilo}>AM</option>
                    <option value="PM" style={opcionEstilo}>PM</option>
                  </select>
                </label>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button disabled={cargando} onClick={() => { setPanelHora(false); onTomar(idsPendientes, aHora24(hr)); }}
                  style={{ background: '#2AACB0', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontFamily: 'inherit', cursor: 'pointer' }}>
                  Guardar toma
                </button>
                <button onClick={() => setPanelHora(false)}
                  style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 14px', fontFamily: 'inherit', cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Omitir una toma que aún no llega: confirmar */}
          {confirmarOmitir && (
            <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', background: 'rgba(220,53,69,0.15)' }}>
              <div style={{ fontSize: '13px', marginBottom: '8px' }}>¿Omitir esta toma de {horario}?</div>
              <button disabled={cargando} onClick={() => { setConfirmarOmitir(false); onOmitir(idsPendientes); }}
                style={{ background: '#dc3545', color: 'white', border: 'none', borderRadius: '8px', padding: '8px 14px', fontFamily: 'inherit', cursor: 'pointer' }}>
                Sí, omitir
              </button>{' '}
              <button onClick={() => setConfirmarOmitir(false)}
                style={{ background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', padding: '8px 14px', fontFamily: 'inherit', cursor: 'pointer' }}>
                No
              </button>
            </div>
          )}

          {/* Ventana de ayuno: sólo si el medicamento lo requiere (dato de su registro) */}
          {tieneAyuno && (
            <VentanaAyuno horario={horario} estado={estado} />
          )}
        </div>

        {/* Botones acción */}
        {(estado === 'pendiente' || estado === 'futura') && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginLeft: '12px' }}>
            <button
              onClick={() => (estado === 'futura' ? setPanelHora(true) : onTomar(idsPendientes))}
              disabled={cargando}
              style={{
                background: '#2AACB0',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 20px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                minWidth: '90px',
                fontFamily: 'inherit',
                transition: 'opacity 0.2s'
              }}
            >
              Tomé ✓
            </button>
            <button
              onClick={() => (estado === 'futura' ? setConfirmarOmitir(true) : onOmitir(idsPendientes))}
              disabled={cargando}
              style={{
                background: 'transparent',
                color: 'rgba(255,255,255,0.75)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '12px',
                padding: '8px 16px',
                fontSize: '13px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              Omitir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Resumen de adherencia del día
function ResumenDia({ tomas }) {
  const tomadas = tomas.filter(t => t.tomada).length;
  const total = tomas.filter(t => !t.futura).length;
  const pct = total > 0 ? Math.round((tomadas / total) * 100) : 0;

  if (total === 0) return null;

  return (
    <div style={{
      background: 'rgba(42,172,176,0.08)',
      border: '1px solid rgba(42,172,176,0.2)',
      borderRadius: '12px',
      padding: '14px 18px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    }}>
      <div>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '2px' }}>
          Adherencia hoy
        </div>
        <div style={{ fontSize: '22px', fontWeight: 'bold', color: pct >= 80 ? '#28a745' : '#ffc107' }}>
          {pct}%
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', marginBottom: '2px' }}>
          Tomas
        </div>
        <div style={{ fontSize: '18px', color: 'white' }}>
          {tomadas}/{total} <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>completadas</span>
        </div>
      </div>
    </div>
  );
}

// Menú único de medicamentos: ver, agregar, modificar y eliminar
// Hora actual en la zona del paciente, en formato de 12 horas.
function horaAhoraEnZona() {
  try {
    const txt = new Date().toLocaleTimeString('en-GB', { timeZone: zonaDelPaciente(), hour: '2-digit', minute: '2-digit', hour12: false });
    const [hh, mm] = txt.split(':').map(Number);
    return { h: String(hh % 12 === 0 ? 12 : hh % 12), m: String(mm).padStart(2, '0'), ap: hh >= 12 ? 'PM' : 'AM' };
  } catch (e) {
    return { h: '8', m: '00', ap: 'AM' };
  }
}

// Horarios en formato de 12 horas: hora (1-12), minutos (00-59) y AM/PM.
const HORAS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1));
const MINUTOS = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const horarioVacio = () => ({ h: '8', m: '00', ap: 'AM' });
// Opciones con fondo oscuro para que se lean sobre el panel.
const opcionEstilo = { background: '#14304f', color: 'white' };

// Pasa de 12 horas a "HH:MM" (24 horas), que es lo que guarda el servidor.
const aHora24 = ({ h, m, ap }) => {
  const hora = (Number(h) % 12) + (ap === 'PM' ? 12 : 0);
  return `${String(hora).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

// Pasa de "HH:MM" (24 horas) a 12 horas para mostrar en el formulario.
const desdeHora24 = (txt) => {
  const [hh, mm] = String(txt).split(':').map(Number);
  return { h: String(hh % 12 === 0 ? 12 : hh % 12), m: String(mm).padStart(2, '0'), ap: hh >= 12 ? 'PM' : 'AM' };
};

const campoEstilo = {
  width: '100%', padding: '10px', borderRadius: '8px', marginTop: '4px',
  border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)',
  color: 'white', fontFamily: 'inherit', fontSize: '14px', boxSizing: 'border-box'
};

function MenuMedicamentos({ token, apiUrl, onCerrar, onCambio }) {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');
  const [editando, setEditando] = useState(null);     // id del medicamento en edición
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);
  const [agregando, setAgregando] = useState(false);
  const vacio = {
    principio_activo: '', dosis: '',
    horarios: [horarioVacio()],          // uno o varios, en 12 horas
    separa: false, sepH: '0', sepM: '00', // separación de la comida: horas y minutos
  };
  const [form, setForm] = useState(vacio);

  // Datos que se envían al servidor, a partir del formulario.
  const cuerpoDesdeForm = () => {
    const horarios = [...new Set(form.horarios.map(aHora24))].sort();
    const separacion = form.separa ? (Number(form.sepH) || 0) * 60 + (Number(form.sepM) || 0) : 0;
    return { principio_activo: form.principio_activo, dosis: form.dosis, horarios, separacion_comida_min: separacion };
  };

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  const cargar = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/medicamentos`, { headers });
      const data = await res.json();
      setLista(Array.isArray(data) ? data : []);
    } catch (e) {
      setMensaje('No se pudo cargar la lista');
    } finally {
      setCargando(false);
    }
  }, [apiUrl, token]);

  useEffect(() => { cargar(); }, [cargar]);

  const guardarNuevo = async () => {
    setMensaje('');
    if (form.separa && !(Number(form.sepH) || Number(form.sepM))) {
      setMensaje('Indique cuántas horas y minutos antes y después de la comida');
      return;
    }
    const body = cuerpoDesdeForm();
    const res = await fetch(`${apiUrl}/api/medicamentos`, { method: 'POST', headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      setForm(vacio); setAgregando(false); setMensaje('Medicamento agregado');
      await cargar(); onCambio && onCambio();
    } else {
      setMensaje(data.error || 'No se pudo agregar');
    }
  };

  const guardarEdicion = async (id) => {
    setMensaje('');
    if (form.separa && !(Number(form.sepH) || Number(form.sepM))) {
      setMensaje('Indique cuántas horas y minutos antes y después de la comida');
      return;
    }
    const body = cuerpoDesdeForm();
    const res = await fetch(`${apiUrl}/api/medicamentos/${id}`, { method: 'PUT', headers, body: JSON.stringify(body) });
    const data = await res.json();
    if (res.ok) {
      setEditando(null); setMensaje('Cambios guardados');
      await cargar(); onCambio && onCambio();
    } else {
      setMensaje(data.error || 'No se pudo guardar');
    }
  };

  const eliminar = async (id) => {
    const res = await fetch(`${apiUrl}/api/medicamentos/${id}`, { method: 'DELETE', headers });
    const data = await res.json();
    setConfirmarEliminar(null);
    setMensaje(res.ok ? (data.mensaje || 'Medicamento eliminado') : (data.error || 'No se pudo eliminar'));
    await cargar(); onCambio && onCambio();
  };

  const boton = (color) => ({
    background: color, color: 'white', border: 'none', borderRadius: '8px',
    padding: '8px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit'
  });

  // Tres datos por medicamento: sustancia activa, dosis y horarios
  const formulario = (onGuardar, onCancelar, esNuevo) => (
    <div style={{ marginTop: '10px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.04)' }}>
      <label style={{ display: 'block', fontSize: '13px' }}>Sustancia activa
        <input style={campoEstilo} value={form.principio_activo} placeholder="Ej. Levodopa 250 mg / Carbidopa 25 mg" onChange={e => setForm({ ...form, principio_activo: e.target.value })} />
      </label>
      <label style={{ display: 'block', fontSize: '13px', marginTop: '8px' }}>Dosis
        <input style={campoEstilo} value={form.dosis} placeholder="Ej. 1 tableta" onChange={e => setForm({ ...form, dosis: e.target.value })} />
      </label>
      <fieldset style={{ border: 'none', padding: 0, margin: '12px 0 0' }}>
        <legend style={{ fontSize: '13px', marginBottom: '4px' }}>Horarios</legend>
        {form.horarios.map((hr, i) => (
          <div key={i} style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '6px' }}>
            <label style={{ fontSize: '12px' }}>Hora
              <select style={campoEstilo} value={hr.h} onChange={e => setForm({ ...form, horarios: form.horarios.map((x, j) => j === i ? { ...x, h: e.target.value } : x) })}>
                {HORAS_12.map(v => <option key={v} value={v} style={opcionEstilo}>{v}</option>)}
              </select>
            </label>
            <label style={{ fontSize: '12px' }}>Minutos
              <select style={campoEstilo} value={hr.m} onChange={e => setForm({ ...form, horarios: form.horarios.map((x, j) => j === i ? { ...x, m: e.target.value } : x) })}>
                {MINUTOS.map(v => <option key={v} value={v} style={opcionEstilo}>{v}</option>)}
              </select>
            </label>
            <label style={{ fontSize: '12px' }}>AM / PM
              <select style={campoEstilo} value={hr.ap} onChange={e => setForm({ ...form, horarios: form.horarios.map((x, j) => j === i ? { ...x, ap: e.target.value } : x) })}>
                <option value="AM" style={opcionEstilo}>AM</option>
                <option value="PM" style={opcionEstilo}>PM</option>
              </select>
            </label>
            {form.horarios.length > 1 && (
              <button type="button" style={{ ...boton('transparent'), marginTop: '14px' }}
                aria-label={`Quitar horario ${i + 1}`}
                onClick={() => setForm({ ...form, horarios: form.horarios.filter((_, j) => j !== i) })}>Quitar</button>
            )}
          </div>
        ))}
        <button type="button" style={{ ...boton('transparent'), marginTop: '8px', border: '1px solid #2AACB0' }}
          onClick={() => setForm({ ...form, horarios: [...form.horarios, horarioVacio()] })}>+ Agregar otro horario</button>
      </fieldset>

      <label style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', marginTop: '12px' }}>
        <input type="checkbox" checked={form.separa} onChange={e => setForm({ ...form, separa: e.target.checked })} />
        Requiere separarse de la comida
      </label>
      {form.separa && (
        <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
          <label style={{ fontSize: '12px' }}>Horas
            <select style={campoEstilo} value={form.sepH} onChange={e => setForm({ ...form, sepH: e.target.value })}>
              {Array.from({ length: 13 }, (_, i) => String(i)).map(v => <option key={v} value={v} style={opcionEstilo}>{v}</option>)}
            </select>
          </label>
          <label style={{ fontSize: '12px' }}>Minutos
            <select style={campoEstilo} value={form.sepM} onChange={e => setForm({ ...form, sepM: e.target.value })}>
              {MINUTOS.map(v => <option key={v} value={v} style={opcionEstilo}>{v}</option>)}
            </select>
          </label>
        </div>
      )}
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button style={boton('#2AACB0')} onClick={onGuardar}>Guardar</button>
        <button style={boton('transparent')} onClick={onCancelar}>Cancelar</button>
      </div>
    </div>
  );

  return (
    <div role="dialog" aria-label="Mis medicamentos" style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px'
    }}>
      <div style={{
        background: '#14304f', borderRadius: '16px', padding: '20px', width: '100%',
        maxWidth: '520px', maxHeight: '90vh', overflowY: 'auto', color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0 }}>Mis medicamentos</h3>
          <button style={boton('transparent')} onClick={onCerrar}>Cerrar</button>
        </div>

        {mensaje && <p style={{ fontSize: '13px', color: '#5dde83', margin: '10px 0 0' }}>{mensaje}</p>}
        {cargando && <p style={{ fontSize: '14px' }}>Cargando...</p>}
        {!cargando && lista.length === 0 && !agregando && (
          <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)' }}>Aún no tienes medicamentos registrados.</p>
        )}

        {lista.map(m => (
          <div key={m.id} style={{ marginTop: '12px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)' }}>
            <div style={{ fontWeight: 600 }}>{m.principio_activo || 'Sin sustancia registrada'}</div>
            <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)' }}>
              {m.dosis} · {(m.horarios || []).join(', ')}
            </div>

            {editando === m.id ? (
              <>
                {formulario(() => guardarEdicion(m.id), () => setEditando(null), false)}
              </>
            ) : confirmarEliminar === m.id ? (
              <div style={{ marginTop: '10px', padding: '10px', borderRadius: '8px', background: 'rgba(220,53,69,0.15)' }}>
                <p style={{ fontSize: '13px', margin: '0 0 8px' }}>
                  Vas a quitar <strong>{m.principio_activo || 'este medicamento'}</strong> de tu lista. Su historial se conserva. ¿Confirmas?
                </p>
                <button style={boton('#dc3545')} onClick={() => eliminar(m.id)}>Sí, quitar</button>{' '}
                <button style={boton('transparent')} onClick={() => setConfirmarEliminar(null)}>No</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button style={boton('#2AACB0')} onClick={() => {
                  setEditando(m.id);
                  const sep = m.separacion_comida_min || 0;
                  setForm({
                    ...vacio,
                    principio_activo: m.principio_activo || '',
                    dosis: m.dosis || '',
                    horarios: (m.horarios && m.horarios.length ? m.horarios : ['08:00']).map(desdeHora24),
                    separa: sep > 0,
                    sepH: String(Math.floor(sep / 60)),
                    sepM: String(sep % 60).padStart(2, '0'),
                  });
                  setMensaje('');
                }}>Editar</button>
                <button style={boton('#dc3545')} onClick={() => setConfirmarEliminar(m.id)}>Quitar</button>
              </div>
            )}
          </div>
        ))}

        {agregando ? (
          <>
            <h4 style={{ margin: '16px 0 0' }}>Nuevo medicamento</h4>
            {formulario(guardarNuevo, () => { setAgregando(false); setForm(vacio); }, true)}
          </>
        ) : (
          <button
            aria-label="Agregar un espacio para medicamento"
            title="Agregar medicamento"
            onClick={() => { setAgregando(true); setForm(vacio); setMensaje(''); }}
            style={{
              width: '48px', height: '48px', borderRadius: '50%', marginTop: '16px',
              background: '#2AACB0', color: 'white', border: 'none', fontSize: '26px',
              lineHeight: '48px', cursor: 'pointer', display: 'block', marginLeft: 'auto', marginRight: 'auto', padding: 0
            }}
          >
            +
          </button>
        )}
      </div>
    </div>
  );
}

export default function MiDiaPage({ token, apiUrl }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [bloques, setBloques] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [accionCargando, setAccionCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  const cargarTomas = useCallback(async () => {
    try {
      const res = await fetch(`${apiUrl}/api/tomas/hoy?zona=${encodeURIComponent(zonaDelPaciente())}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setBloques(data.bloques || []);
      } else if (res.status === 404) {
        // No hay medicamentos configurados
        setBloques([]);
      }
    } catch (e) {
      console.error('Error cargando tomas:', e);
    } finally {
      setCargando(false);
    }
  }, [apiUrl, token]);

  useEffect(() => {
    cargarTomas();
  }, [cargarTomas]);

  // Marca cada toma del bloque (una petición por toma). Si alguna falla, lo dice.
  const marcarTomas = async (ids, accion, horaReal) => {
    if (!ids || ids.length === 0) return false;
    setAccionCargando(true);
    let todoBien = true;
    try {
      for (const id of ids) {
        const cuerpo = accion === 'tomar'
          ? { zona: zonaDelPaciente(), hora_real: horaReal || undefined }
          : undefined;
        const res = await fetch(`${apiUrl}/api/tomas/${id}/${accion}`, {
          method: 'POST',
          headers,
          body: cuerpo ? JSON.stringify(cuerpo) : undefined
        });
        if (!res.ok) todoBien = false;
      }
      await cargarTomas();
    } catch (e) {
      todoBien = false;
    } finally {
      setAccionCargando(false);
    }
    return todoBien;
  };

  const handleTomar = async (ids, horaReal) => {
    const ok = await marcarTomas(ids, 'tomar', horaReal);
    setMensaje(ok ? '✓ Toma registrada' : 'Error al registrar la toma');
    setTimeout(() => setMensaje(''), 2500);
  };

  const handleOmitir = async (ids) => {
    const ok = await marcarTomas(ids, 'omitir');
    setMensaje(ok ? 'Toma marcada como omitida' : 'Error al omitir la toma');
    setTimeout(() => setMensaje(''), 2500);
  };

  const hoy = new Date().toLocaleDateString('es-MX', {
    weekday: 'long', day: 'numeric', month: 'long'
  });

  // Aplanar tomas de todos los bloques para el resumen
  const todasLasTomas = bloques.flatMap(b => b.tomas || []);

  if (cargando) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.75)' }}>
        Cargando plan de tomas...
      </div>
    );
  }

  // Sin medicamentos registrados: se pide registrarlos (ya no se carga ninguna receta fija)
  if (bloques.length === 0) {
    return (
      <div style={{ padding: '24px 16px', maxWidth: '600px', margin: '0 auto' }}>
        <div style={{
          background: 'rgba(42,172,176,0.08)',
          border: '1px solid rgba(42,172,176,0.3)',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
          <h3 style={{ color: '#2AACB0', margin: '0 0 12px' }}>Aún no hay medicamentos registrados</h3>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', lineHeight: '1.6' }}>
            Agrega tus medicamentos, dosis y horarios para ver tus tomas del día.
          </p>
          <button
            onClick={() => setMenuAbierto(true)}
            style={{
              background: '#2AACB0', color: 'white', border: 'none', borderRadius: '12px',
              padding: '12px 24px', fontSize: '15px', fontWeight: '600', cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Editar medicamentos
          </button>
        </div>
        {menuAbierto && (
          <MenuMedicamentos
            token={token}
            apiUrl={apiUrl}
            onCerrar={() => setMenuAbierto(false)}
            onCambio={cargarTomas}
          />
        )}
      </div>
    );
  }

  // Sustancias activas del día (para el pie de la ventana de ayuno), sin nombres comerciales
  const sustanciasAyuno = [...new Set(
    bloques.flatMap(b => (b.tomas || []))
      .filter(t => (t.separacion_comida_min || 0) > 0 && t.principio_activo)
      .map(t => t.principio_activo)
  )];

  return (
    <div style={{ padding: '16px 16px 32px', maxWidth: '600px', margin: '0 auto', color: 'white' }}>

      {/* Fecha */}
      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.75)', textTransform: 'capitalize' }}>
          {hoy}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginTop: '2px' }}>
          <div style={{ fontSize: '20px', fontWeight: '600', color: 'white' }}>
            Mi plan de tomas
          </div>
          <button
            onClick={() => setMenuAbierto(true)}
            style={{
              background: 'transparent', color: '#2AACB0', border: '1px solid #2AACB0',
              borderRadius: '8px', padding: '6px 12px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit'
            }}
          >
            Editar
          </button>
        </div>
      </div>

      {menuAbierto && (
        <MenuMedicamentos
          token={token}
          apiUrl={apiUrl}
          onCerrar={() => setMenuAbierto(false)}
          onCambio={cargarTomas}
        />
      )}

      {/* Mensaje de feedback */}
      {mensaje && (
        <div style={{
          background: mensaje.includes('Error') ? 'rgba(220,53,69,0.15)' : 'rgba(40,167,69,0.15)',
          border: `1px solid ${mensaje.includes('Error') ? 'rgba(220,53,69,0.4)' : 'rgba(40,167,69,0.4)'}`,
          borderRadius: '10px',
          padding: '10px 16px',
          marginBottom: '16px',
          fontSize: '14px',
          color: mensaje.includes('Error') ? '#ff6b6b' : '#5dde83'
        }}>
          {mensaje}
        </div>
      )}

      {/* Resumen adherencia */}
      <ResumenDia tomas={todasLasTomas} />

      {/* Bloques de toma (la rutina del día la escribe cada persona; ya no hay texto fijo) */}
      {bloques.map((bloque) => (
        <TarjetaToma
          key={bloque.horario}
          bloque={bloque}
          onTomar={handleTomar}
          onOmitir={handleOmitir}
          cargando={accionCargando}
        />
      ))}

      {/* Nota informativa: sustancia activa, no nombre comercial */}
      {sustanciasAyuno.length > 0 && (
        <div style={{
          marginTop: '8px',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.75)',
          textAlign: 'center',
          lineHeight: '1.6'
        }}>
          🍽️ Ventana de ayuno: 1 hora antes y 1 hora después de cada toma de {sustanciasAyuno.join(', ')}
        </div>
      )}
    </div>
  );
}
