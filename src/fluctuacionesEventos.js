// HZ-REG-01: lógica pura de la bitácora de fluctuaciones (sin React ni red).
// Horas en formato local de la zona del reloj: 'AAAA-MM-DDTHH:MM'.
import { hora12 } from './zonaReloj';

export const MINUTOS_EXTEMPORANEO = 30;
export const DIAS_VENTANA = 7;

export const ESTADOS_EVENTO = ['ON', 'OFF', 'ON_DISC_LEVE', 'ON_DISC_GRAVE', 'DORMIDO'];

// Bloques de 30 min del día de la gráfica: 06:00 a 23:30
export function generarBloques() {
  const bloques = [];
  for (let h = 6; h < 24; h++) {
    bloques.push(`${String(h).padStart(2, '0')}:00`);
    bloques.push(`${String(h).padStart(2, '0')}:30`);
  }
  return bloques;
}

// Bloque (HH:MM) al que pertenece una hora local 'AAAA-MM-DDTHH:MM'
export function bloqueDeHora(local) {
  const hh = local.slice(11, 13);
  const mm = Number(local.slice(14, 16)) < 30 ? '00' : '30';
  return `${hh}:${mm}`;
}

// Diferencia en minutos (a - b) entre dos horas locales. Ignora el cambio de horario (solo para mostrar).
export function diferenciaMinutos(a, b) {
  const ms = Date.parse(`${a}:00Z`) - Date.parse(`${b}:00Z`);
  return Math.round(ms / 60000);
}

// Hora local actual de la zona indicada, en formato 'AAAA-MM-DDTHH:MM'
export function ahoraLocal(zona, d = new Date()) {
  const p = {};
  new Intl.DateTimeFormat('en-CA', {
    timeZone: zona, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(d).forEach(x => { p[x.type] = x.value; });
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

// Resta días a una hora local (solo calendario)
export function restarDias(local, dias) {
  const d = new Date(Date.parse(`${local}:00Z`) - dias * 86400000);
  return d.toISOString().slice(0, 16);
}

// Registro en tiempo real: se deshabilita únicamente el estado igual al último registrado
// (aplica a los cinco estados). En registro extemporáneo no se bloquea ninguno.
export function reglasTiempoReal(ultimoEstado) {
  const reglas = {};
  ESTADOS_EVENTO.forEach(e => { reglas[e] = ultimoEstado?.estado === e; });
  return reglas;
}

// Días de la ventana de siete días, de hoy hacia atrás: [{ fecha, etiqueta }]
export function diasDeVentana(ahora, dias = DIAS_VENTANA + 1) {
  const hoy = ahora.slice(0, 10);
  const ayer = restarDias(`${hoy}T00:00`, 1).slice(0, 10);
  const lista = [];
  for (let i = 0; i < dias; i++) {
    const fecha = restarDias(`${hoy}T00:00`, i).slice(0, 10);
    let etiqueta;
    if (i === 0) etiqueta = 'Hoy';
    else if (fecha === ayer) etiqueta = 'Ayer';
    else etiqueta = new Date(`${fecha}T12:00:00Z`).toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
    lista.push({ fecha, etiqueta });
  }
  return lista;
}

// Texto de trazabilidad para episodios corregidos o eliminados (nunca se muestran como vigentes)
export function textoTrazabilidad(ev, ahora, porId) {
  const cuando = textoCuandoOcurrio(ev.anulado_en_local, ahora);
  if (ev.motivo_anulacion === 'eliminacion') {
    return { titulo: 'Eliminado', detalle: `Estaba registrado: ${etiquetaEstado(ev.estado)} · ${textoCuandoOcurrio(ev.ocurrio_en, ahora)}`, cuando };
  }
  const nuevo = porId[ev.anulado_por_evento];
  const reemplazo = nuevo ? `Reemplazado por: ${etiquetaEstado(nuevo.estado)} · ${textoCuandoOcurrio(nuevo.ocurrio_en, ahora)}` : 'Reemplazado por otro registro';
  return { titulo: 'Corregido', detalle: `Estaba registrado: ${etiquetaEstado(ev.estado)} · ${textoCuandoOcurrio(ev.ocurrio_en, ahora)} · ${reemplazo}`, cuando };
}

const ETIQUETAS = {
  ON: 'ON', OFF: 'OFF', ON_DISC_LEVE: 'ON con movimientos', ON_DISC_GRAVE: 'ON con movimientos graves', DORMIDO: 'Dormido'
};
export function etiquetaEstado(id) { return ETIQUETAS[id] || id; }

// Ventana de captura y corrección: hasta 7 días atrás y nunca en el futuro (tolerancia de 1 min, igual que la base)
export function horaPermitida(ocurrio, ahora) {
  const dif = diferenciaMinutos(ahora, ocurrio);
  return dif >= -1 && dif <= DIAS_VENTANA * 24 * 60;
}

// Un registro es extemporáneo desde 30 minutos inclusive (el servidor lo recalcula)
export function esExtemporaneo(ocurrio, ahora) {
  return diferenciaMinutos(ahora, ocurrio) >= MINUTOS_EXTEMPORANEO;
}

function ordenarCronologico(a, b) {
  if (a.ocurrio_en !== b.ocurrio_en) return a.ocurrio_en < b.ocurrio_en ? -1 : 1;
  return a.id - b.id;
}

// Construye la gráfica Hauser del día.
// Tipos de bloque:
//   'evento'    -> hubo registro en el bloque (se muestra el último ocurrido dentro del bloque)
//   'historico' -> registro histórico por bloque (sin minutos exactos)
//   'continua'  -> sin registro nuevo; continúa el último estado conocido (tenue con flecha)
//   'vacio'     -> sin registros previos ese día, o bloque futuro
export function construirDia({ eventos, historicos = [], fecha, ahora }) {
  const delDia = eventos.filter(e => e.fecha === fecha).sort(ordenarCronologico);
  const historicoDelDia = historicos.filter(h => h.fecha === fecha);
  const esHoy = ahora.slice(0, 10) === fecha;

  return generarBloques().map(hora => {
    const deBloque = delDia.filter(e => e.hora_bloque === hora);
    if (deBloque.length > 0) {
      const ultimo = deBloque[deBloque.length - 1];
      return {
        hora,
        tipo: 'evento',
        estado: ultimo.estado,
        extemporaneo: deBloque.some(e => e.extemporaneo),
        cantidad: deBloque.length
      };
    }

    const hist = historicoDelDia.find(h => h.hora_bloque === hora);
    if (hist) {
      return { hora, tipo: 'historico', estado: hist.estado, extemporaneo: false, cantidad: 1 };
    }

    const previos = delDia.filter(e => e.hora_bloque < hora);
    const dentroDelTiempo = esHoy ? `${fecha}T${hora}` <= ahora : true;
    if (previos.length > 0 && dentroDelTiempo) {
      const continuado = previos[previos.length - 1];
      return { hora, tipo: 'continua', estado: continuado.estado, extemporaneo: false, cantidad: 0 };
    }

    return { hora, tipo: 'vacio', estado: null, extemporaneo: false, cantidad: 0 };
  });
}

// Texto del último estado: "Hoy 1:30 p. m.", "Ayer 11:00 a. m.", o fecha corta
export function textoCuandoOcurrio(local, ahora) {
  const fecha = local.slice(0, 10);
  const hoy = ahora.slice(0, 10);
  const ayer = restarDias(`${hoy}T00:00`, 1).slice(0, 10);
  const hora = hora12(local.slice(11, 16));
  if (fecha === hoy) return `Hoy ${hora}`;
  if (fecha === ayer) return `Ayer ${hora}`;
  const [, mes, dia] = fecha.split('-');
  return `${dia}/${mes} ${hora}`;
}

// Eventos de hoy, en orden cronológico, para la lista de correcciones y eliminaciones
export function eventosDelDia(eventos, fecha) {
  return eventos.filter(e => e.fecha === fecha).sort(ordenarCronologico);
}

// ---------- V4: duración aproximada, ajuste libre y periodos continuos ----------

export const INTERVALO_DURACION_MIN = 15;
export const DURACION_MAX_MIN = 1440;

// Propuesta de la interfaz: redondea hacia arriba a múltiplos de 15 min. No modifica tiempos guardados.
// 1–15 → 15; 16–30 → 30; 31–45 → 45. Sin minutos positivos no hay propuesta (null).
export function propuestaDuracion(minutos) {
  if (minutos == null || !(minutos > 0)) return null;
  return Math.ceil(minutos / INTERVALO_DURACION_MIN) * INTERVALO_DURACION_MIN;
}

// Ajuste libre de la persona: entero entre 1 y 1440. Se marca como origen 'usuario' y se respeta tal cual.
export function ajusteDuracionUsuario(texto) {
  const n = Number(String(texto ?? '').trim());
  if (!Number.isInteger(n) || n < 1 || n > DURACION_MAX_MIN) {
    return { error: `Escribe minutos enteros entre 1 y ${DURACION_MAX_MIN}.` };
  }
  return { valor: n, origen: 'usuario' };
}

// Texto de duración: "30 min", "1 h 45 min", "2 h"
export function textoDuracion(min) {
  if (min == null) return 'duración sin confirmar';
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m} min`;
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')} min`;
}

// Un evento por instante (gana el de mayor id), igual que el cálculo del reporte.
function unicosPorInstante(vigentes) {
  const orden = [...vigentes].sort(ordenarCronologico);
  const salida = [];
  for (const e of orden) {
    if (salida.length && salida[salida.length - 1].ocurrio_en === e.ocurrio_en) salida[salida.length - 1] = e;
    else salida.push(e);
  }
  return salida;
}

// Periodos continuos: eventos consecutivos del mismo estado se unen en un solo periodo.
// Un periodo termina solo cuando hay un evento posterior de otro estado; si no lo hay, no se inventa fin.
// Devuelve los periodos que empiezan en `fecha`. Conserva los ids de los eventos originales.
export function periodosDelDia(eventos, fecha) {
  const cadena = unicosPorInstante(eventos);
  const periodos = [];
  let actual = null;
  for (const e of cadena) {
    if (actual && actual.estado === e.estado) {
      actual.ids.push(e.id);
      actual.extemporaneo = actual.extemporaneo || !!e.extemporaneo;
      continue;
    }
    if (actual) actual.fin = e.ocurrio_en;
    actual = { estado: e.estado, inicio: e.ocurrio_en, fin: null, ids: [e.id], extemporaneo: !!e.extemporaneo };
    periodos.push(actual);
  }
  // Un periodo que cruza medianoche aparece en ambos días, recortado a cada día (tramo).
  // El periodo sigue siendo uno: ids y duración guardada son los mismos. Sin fin, solo aparece en su día de inicio.
  const inicioDia = `${fecha}T00:00`;
  const siguiente = new Date(Date.parse(`${fecha}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);
  const finDia = `${siguiente}T00:00`;
  return periodos
    .filter(p => (p.fin ? p.inicio < finDia && p.fin > inicioDia : p.inicio.slice(0, 10) === fecha))
    .map(p => {
      const ini = p.inicio > inicioDia ? p.inicio : inicioDia;
      const fin = p.fin ? (p.fin < finDia ? p.fin : finDia) : null;
      return { ...p, inicio: ini, fin, minutosExactos: fin ? diferenciaMinutos(fin, ini) : null };
    });
}

// Bloques históricos de 30 min del día que se cruzan con un periodo de duración exacta.
// Esos bloques no se suman al total para no duplicar tiempo.
export function historicosCruzados(historicos, periodos, fecha) {
  const ms = s => Date.parse(`${s}:00Z`);
  const exactos = periodos.filter(p => p.fin).map(p => [ms(p.inicio), ms(p.fin)]);
  return historicos
    .filter(h => h.fecha === fecha)
    .filter(h => {
      const ini = ms(`${fecha}T${h.hora_bloque}`);
      const fin = ini + 30 * 60000;
      return exactos.some(([a, b]) => a < fin && ini < b);
    })
    .map(h => h.hora_bloque);
}
