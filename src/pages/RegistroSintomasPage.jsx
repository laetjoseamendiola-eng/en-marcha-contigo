import { zonaReloj, hora12, diaClave } from '../zonaReloj';
import React, { useState, useEffect, useRef } from 'react';
import './RegistroSintomasPage.css';
import EvolucionPage from './EvolucionPage.jsx';
import MiDiaPage from './MiDiaPage.jsx';
import FluctuacionesPage from './FluctuacionesPage.jsx';
import RegistroDiarioPage from './RegistroDiarioPage.jsx';
import ReportePage from './ReportePage.jsx';
import ConfiguracionPage from './ConfiguracionPage.jsx';
import BarraHora from './BarraHora.jsx';

const VentanaSintomas = ({ onCerrar, catalogoVisible, catalogoOculto, sinClasificar, onCrear, onCambiar, errorVentana }) => {
  const [nombre, setNombre] = useState('');
  const [clasificacion, setClasificacion] = useState('');
  const [explicacion, setExplicacion] = useState('');
  const dialogo = useRef(null);

  useEffect(() => {
    const previo = document.activeElement;
    const primero = dialogo.current && dialogo.current.querySelector('input');
    if (primero) primero.focus();
    const tecla = (e) => {
      if (e.key === 'Escape') { onCerrar(); return; }
      if (e.key !== 'Tab' || !dialogo.current) return;
      const focos = Array.from(dialogo.current.querySelectorAll('button, input, textarea, select')).filter(el => !el.disabled);
      if (!focos.length) return;
      const inicio = focos[0];
      const fin = focos[focos.length - 1];
      if (e.shiftKey && document.activeElement === inicio) { e.preventDefault(); fin.focus(); }
      else if (!e.shiftKey && document.activeElement === fin) { e.preventDefault(); inicio.focus(); }
    };
    document.addEventListener('keydown', tecla);
    return () => {
      document.removeEventListener('keydown', tecla);
      if (previo && previo.focus) previo.focus();
    };
  }, []);

  const enviar = async () => {
    const ok = await onCrear({ nombre, clasificacion, explicacion });
    if (ok) { setNombre(''); setClasificacion(''); setExplicacion(''); }
  };

  const botonFila = { padding: '8px 10px', borderRadius: '6px', border: '2px solid #FFFFFF', background: 'transparent', color: '#FFFFFF', fontSize: '14px', fontFamily: 'inherit', cursor: 'pointer', marginRight: '6px', marginTop: '6px' };
  const etiqueta = (c) => (c === 'motor' ? '🚶 Motor' : '🧠 No motor');
  const filaSintoma = (c, accion, textoAccion) => (
    <div key={c.clave} style={{ borderBottom: '1px solid rgba(255,255,255,0.4)', padding: '8px 0' }}>
      <div style={{ fontSize: '16px', fontWeight: 600 }}>{c.nombre}</div>
      <div style={{ fontSize: '13px', opacity: 0.9 }}>{etiqueta(c.clasificacion)}{c.propio ? ' · propio' : ''}</div>
      <button type="button" onClick={() => accion(c)} style={botonFila}>{textoAccion}</button>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '16px', overflowY: 'auto' }}>
      <div ref={dialogo} role="dialog" aria-modal="true" aria-labelledby="titulo-ventana-sintomas"
        style={{ background: '#0D2C4D', color: '#FFFFFF', border: '2px solid #FFFFFF', borderRadius: '10px', width: '100%', maxWidth: '480px', padding: '18px', marginTop: '24px', boxSizing: 'border-box' }}>
        <h2 id="titulo-ventana-sintomas" style={{ fontSize: '20px', margin: '0 0 12px' }}>＋ Añadir o quitar síntoma</h2>

        <div>
          <h3 style={{ fontSize: '17px', margin: '0 0 8px' }}>Agregar un síntoma propio</h3>
          <label htmlFor="nuevo-sintoma-nombre" style={{ display: 'block', fontSize: '15px' }}>Nombre del síntoma *</label>
          <input id="nuevo-sintoma-nombre" type="text" maxLength={50} value={nombre} onChange={(e) => setNombre(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px', fontSize: '16px', borderRadius: '6px', marginBottom: '10px' }} />
          <fieldset style={{ border: '1px solid #FFFFFF', borderRadius: '6px', padding: '8px', marginBottom: '10px' }}>
            <legend style={{ fontSize: '15px', padding: '0 4px' }}>Clasificación *</legend>
            <label style={{ display: 'block', fontSize: '16px', padding: '6px 0' }}>
              <input type="radio" name="clasificacion-nuevo" value="motor" checked={clasificacion === 'motor'} onChange={() => setClasificacion('motor')} /> 🚶 Motor
            </label>
            <label style={{ display: 'block', fontSize: '16px', padding: '6px 0' }}>
              <input type="radio" name="clasificacion-nuevo" value="no_motor" checked={clasificacion === 'no_motor'} onChange={() => setClasificacion('no_motor')} /> 🧠 No motor
            </label>
          </fieldset>
          <label htmlFor="nuevo-sintoma-explicacion" style={{ display: 'block', fontSize: '15px' }}>Explicación corta (opcional)</label>
          <input id="nuevo-sintoma-explicacion" type="text" maxLength={120} value={explicacion} onChange={(e) => setExplicacion(e.target.value)}
            style={{ width: '100%', boxSizing: 'border-box', padding: '10px', fontSize: '16px', borderRadius: '6px', marginBottom: '10px' }} />
          <button type="button" onClick={enviar} className="btn-submit">Agregar síntoma</button>
        </div>

        {sinClasificar.length > 0 && (
          <div style={{ marginTop: '18px' }}>
            <h3 style={{ fontSize: '17px', margin: '0 0 6px' }}>Sin clasificar</h3>
            <p style={{ fontSize: '14px', margin: '0 0 6px' }}>Nombres de tus registros anteriores. Elige en qué grupo van.</p>
            {sinClasificar.map(n => (
              <div key={n} style={{ borderBottom: '1px solid rgba(255,255,255,0.4)', padding: '8px 0' }}>
                <div style={{ fontSize: '16px', fontWeight: 600 }}>{n}</div>
                <button type="button" onClick={() => onCambiar(n, { clasificacion: 'motor' })} style={botonFila}>🚶 Clasificar como Motor</button>
                <button type="button" onClick={() => onCambiar(n, { clasificacion: 'no_motor' })} style={botonFila}>🧠 Clasificar como No motor</button>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: '18px' }}>
          <h3 style={{ fontSize: '17px', margin: '0 0 6px' }}>Mis síntomas en la lista</h3>
          {catalogoVisible.length === 0 && <p style={{ fontSize: '14px' }}>No hay síntomas en la lista.</p>}
          {catalogoVisible.map(c => filaSintoma(c, (x) => onCambiar(x.clave, { oculto: true }), 'Quitar'))}
        </div>

        {catalogoOculto.length > 0 && (
          <div style={{ marginTop: '18px' }}>
            <h3 style={{ fontSize: '17px', margin: '0 0 6px' }}>Quitados</h3>
            <p style={{ fontSize: '14px', margin: '0 0 6px' }}>Los registros de estos síntomas se conservan.</p>
            {catalogoOculto.map(c => filaSintoma(c, (x) => onCambiar(x.clave, { oculto: false }), 'Volver a agregar'))}
          </div>
        )}

        {errorVentana && <p role="alert" style={{ color: '#FFFFFF', fontWeight: 700, marginTop: '12px' }}>{errorVentana}</p>}

        <button type="button" onClick={onCerrar} className="btn-submit" style={{ marginTop: '16px' }}>Cerrar</button>
      </div>
    </div>
  );
};

const RegistroSintomasPage = ({ usuario, token, onLogout }) => {
  const [pestanaActiva, setPestanaActiva] = useState('midia'); // 'midia' | 'registro' | 'evolucion' | 'historial'
  const [formData, setFormData] = useState({
    tipo: '',
    intensidad: 3,
    duracion: '',
    localizacion: '',
    notas: ''
  });

  const [otroTexto, setOtroTexto] = useState('');
  const [pendientes, setPendientes] = useState([]);
  const [listaPersonal, setListaPersonal] = useState([]);
  const [ventanaSintomas, setVentanaSintomas] = useState(false);
  const [errorVentana, setErrorVentana] = useState('');

  const opcionesDuracion = [
    'Menos de 30 min',
    '30 min a 4 h',
    '4 a 12 h',
    '12 h a 1 día',
    'Más de 1 día',
    'Todavía presente'
  ];

  const actualizarDuracion = async (id, valor) => {
    try {
      const response = await fetch(`${apiUrl}/api/sintomas/${id}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ duracion: valor })
      });
      if (response.ok) {
        cargarSintomas();
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (error) {
      console.error('Error actualizando duración:', error);
    }
  };

  const [sintomas, setSintomas] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [menuTipoAbierto, setMenuTipoAbierto] = useState(false);

  const hoyLocal = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  // Síntomas de días anteriores que siguen marcados como "Todavía presente"
  const sintomasAbiertos = sintomas.filter(
    s => s.duracion === 'Todavía presente' && s.fecha_registro && s.fecha_registro.slice(0, 10) < hoyLocal
  );

  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Headers con autenticación
  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Nombre guardado (key) + nombre visible + definición corta. Las keys de síntomas que ya existían se conservan.
  const TIPOS_MOTORES = [
    { key: 'Bradicinesia', nombre: 'Bradicinesia', descripcion: 'lentitud al moverme' },
    { key: 'Temblor', nombre: 'Temblor en reposo', descripcion: 'temblor cuando estoy quieto' },
    { key: 'Rigidez', nombre: 'Rigidez muscular', descripcion: 'tensión o músculos duros' },
    { key: 'Inestabilidad postural', nombre: 'Inestabilidad postural', descripcion: 'dificultad para mantener el equilibrio' },
    { key: 'Alteración de la marcha', nombre: 'Alteración de la marcha', descripcion: 'pasos cortos o arrastrar pies' },
    { key: 'Congelamiento de la marcha', nombre: 'Congelamiento de la marcha', descripcion: 'pies pegados al suelo' },
    { key: 'Discinesia', nombre: 'Discinesia', descripcion: 'movimientos involuntarios' },
    { key: 'Distonía', nombre: 'Distonía', descripcion: 'contracción o calambre sostenido' },
    { key: 'Hipomimia', nombre: 'Hipomimia', descripcion: 'cara menos expresiva' },
    { key: 'Disartria o hipofonía', nombre: 'Disartria o hipofonía', descripcion: 'voz baja o poco clara' },
    { key: 'Disfagia', nombre: 'Disfagia', descripcion: 'dificultad al tragar' },
    { key: 'Micrografía', nombre: 'Micrografía', descripcion: 'letra pequeña al escribir' }
  ];

  const TIPOS_NO_MOTORES = [
    { key: 'Fatiga', nombre: 'Fatiga', descripcion: 'cansancio profundo' },
    { key: 'Insomnio', nombre: 'Trastornos del sueño nocturno', descripcion: 'dificultad para dormir bien' },
    { key: 'Somnolencia diurna', nombre: 'Somnolencia diurna', descripcion: 'mucho sueño de día' },
    { key: 'Estreñimiento', nombre: 'Estreñimiento', descripcion: 'dificultad para evacuar' },
    { key: 'Ansiedad', nombre: 'Ansiedad', descripcion: 'inquietud o nerviosismo' },
    { key: 'Depresión', nombre: 'Ánimo bajo o depresión', descripcion: 'tristeza o desánimo' },
    { key: 'Apatía', nombre: 'Apatía', descripcion: 'falta de motivación' },
    { key: 'Dolor', nombre: 'Dolor', descripcion: 'en cuerpo o articulaciones' },
    { key: 'Síntomas urinarios', nombre: 'Síntomas urinarios', descripcion: 'urgencia o frecuencia al orinar' },
    { key: 'Hipotensión ortostática', nombre: 'Hipotensión ortostática', descripcion: 'mareo al ponerme de pie' },
    { key: 'Dificultad de atención o memoria', nombre: 'Dificultad de atención o memoria', descripcion: 'cuesta concentrarme o recordar' },
    { key: 'Sialorrea', nombre: 'Sialorrea', descripcion: 'exceso de saliva' },
    { key: 'Alucinaciones', nombre: 'Alucinaciones', descripcion: 'veo o escucho cosas irreales' }
  ];

  const tiposSintomas = [...TIPOS_MOTORES, ...TIPOS_NO_MOTORES];
  const PREFIJO_OTRO = 'Otro: ';
  const LARGO_MAX_TIPO = 50;
  const OTRO = '__otro__';

  // Compara sin mayúsculas, sin acentos y sin espacios sobrantes
  const normalizarTexto = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

  // Si el texto de «Otro» coincide con un síntoma de la lista, se guarda ese síntoma
  const tipoDesdeOtro = (texto) => {
    const limpio = String(texto || '').trim();
    if (!limpio) return '';
    const n = normalizarTexto(limpio);
    const encontrado = tiposSintomas.find(t => normalizarTexto(t.key) === n || normalizarTexto(t.nombre) === n);
    return encontrado ? encontrado.key : PREFIJO_OTRO + limpio;
  };

  // Lista personal: catálogo visible (base sin quitar + propios/clasificados) y quitados
  const catalogoBase = [
    ...TIPOS_MOTORES.map(t => ({ clave: t.key, nombre: t.nombre, clasificacion: 'motor', propio: false, descripcion: t.descripcion })),
    ...TIPOS_NO_MOTORES.map(t => ({ clave: t.key, nombre: t.nombre, clasificacion: 'no_motor', propio: false, descripcion: t.descripcion }))
  ];
  const clavesOcultas = new Set(listaPersonal.filter(x => x.oculto).map(x => x.clave));
  const clavesBase = new Set(catalogoBase.map(c => c.clave));
  const catalogoVisible = [
    ...catalogoBase.filter(c => !clavesOcultas.has(c.clave)),
    ...listaPersonal.filter(x => !x.oculto && x.clasificacion && !clavesBase.has(x.clave))
      .map(x => ({ clave: x.clave, nombre: x.nombre, clasificacion: x.clasificacion, propio: true, descripcion: x.explicacion || '' }))
  ];
  const catalogoOculto = [
    ...catalogoBase.filter(c => clavesOcultas.has(c.clave)),
    ...listaPersonal.filter(x => x.oculto && !clavesBase.has(x.clave))
      .map(x => ({ clave: x.clave, nombre: x.nombre, clasificacion: x.clasificacion || 'no_motor', propio: true, descripcion: x.explicacion || '' }))
  ];
  const conocidas = new Set(listaPersonal.map(x => x.clave));
  const sinClasificar = [...new Set(sintomas.map(x => x.tipo))]
    .filter(t => t && !clavesBase.has(t) && !conocidas.has(t));
  const motoresVisibles = catalogoVisible.filter(c => c.clasificacion === 'motor')
    .map(c => ({ key: c.clave, nombre: c.nombre, descripcion: c.propio ? (c.descripcion ? `propio: ${c.descripcion}` : 'propio') : c.descripcion }));
  const noMotoresVisibles = catalogoVisible.filter(c => c.clasificacion === 'no_motor')
    .map(c => ({ key: c.clave, nombre: c.nombre, descripcion: c.propio ? (c.descripcion ? `propio: ${c.descripcion}` : 'propio') : c.descripcion }));

  const renderGrupoTipos = (titulo, lista) => [
    <li key={`titulo-${titulo}`} role="presentation" style={{ padding: '14px 14px 8px', fontSize: '18px', fontWeight: 800, color: '#FFFFFF', borderTop: '3px solid #FFFFFF', borderBottom: '2px solid #FFFFFF', background: 'rgba(255,255,255,0.08)' }}>{titulo === 'Motores' ? '🚶 Motores' : '🧠 No motores'}</li>,
    ...lista.map(t => (
      <li key={t.key} role="option" aria-selected={formData.tipo === t.key}>
        <button
          type="button"
          onClick={() => {
            setFormData(prev => ({ ...prev, tipo: t.key }));
            setOtroTexto('');
            setMensaje('');
            setMenuTipoAbierto(false);
          }}
          style={{
            width: '100%', textAlign: 'left', padding: '14px',
            background: formData.tipo === t.key ? '#00A7A7' : 'transparent',
            color: '#FFFFFF', border: 'none', borderBottom: '1px solid #FFFFFF',
            fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer', lineHeight: 1.35
          }}
        >
          {t.nombre}{' '}
          <span style={{ fontSize: '13px', opacity: 0.75 }}>({t.descripcion})</span>
        </button>
      </li>
    ))
  ];

  const nombreVisibleTipo = (tipo) => {
    const t = tiposSintomas.find(x => x.key === tipo);
    if (t) return t.nombre;
    return tipo;
  };


  const localizaciones = [
    'Mano izquierda',
    'Mano derecha',
    'Brazo izquierdo',
    'Brazo derecho',
    'Hombro izquierdo',
    'Hombro derecho',
    'Pierna izquierda',
    'Pierna derecha',
    'Rodilla izquierda',
    'Rodilla derecha',
    'Pie izquierdo',
    'Pie derecho',
    'Tobillo izquierdo',
    'Tobillo derecho',
    'Dedos del pie izquierdo',
    'Dedos del pie derecho',
    'Cabeza',
    'Cara',
    'Cuello',
    'Tronco',
    'Generalizado'
  ];

  // Cargar síntomas al montar
  useEffect(() => {
    cargarSintomas();
  }, []);

  const cargarSintomas = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/sintomas?zona=${encodeURIComponent(zonaReloj())}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSintomas(data);
        cargarEstadisticas();
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (error) {
      console.error('Error cargando síntomas:', error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/sintomas/stats?zona=${encodeURIComponent(zonaReloj())}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setEstadisticas(data);
      }
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'intensidad' ? parseInt(value) : value
    }));
  };

  const cargarListaPersonal = async () => {
    try {
      const r = await fetch(`${apiUrl}/api/sintomas/lista`, { headers: authHeaders });
      if (r.ok) setListaPersonal(await r.json());
      else if (r.status === 401) onLogout();
    } catch (error) {
      // Sin lista, el selector muestra solo la lista base
    }
  };

  const abrirVentanaSintomas = () => {
    setErrorVentana('');
    setVentanaSintomas(true);
    cargarListaPersonal();
  };

  const crearSintomaPropio = async ({ nombre, clasificacion, explicacion }) => {
    setErrorVentana('');
    if (!nombre.trim()) { setErrorVentana('Escribe el nombre del síntoma'); return false; }
    if (!clasificacion) { setErrorVentana('Elige si el síntoma es motor o no motor'); return false; }
    try {
      const r = await fetch(`${apiUrl}/api/sintomas/lista`, {
        method: 'POST',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombre.trim(), clasificacion, explicacion: explicacion.trim() })
      });
      const datos = await r.json().catch(() => ({}));
      if (r.status === 401) { onLogout(); return false; }
      if (!r.ok) { setErrorVentana(datos.error || 'No se pudo agregar el síntoma'); return false; }
      setListaPersonal(prev => [...prev.filter(x => x.clave !== datos.clave), datos]);
      return true;
    } catch (error) {
      setErrorVentana(`Error de conexión: ${error.message}`);
      return false;
    }
  };

  const cambiarSintomaLista = async (clave, cambios) => {
    setErrorVentana('');
    try {
      const r = await fetch(`${apiUrl}/api/sintomas/lista/${encodeURIComponent(clave)}`, {
        method: 'PUT',
        headers: { ...authHeaders, 'Content-Type': 'application/json' },
        body: JSON.stringify(cambios)
      });
      const datos = await r.json().catch(() => ({}));
      if (r.status === 401) { onLogout(); return; }
      if (!r.ok) { setErrorVentana(datos.error || 'No se pudo guardar el cambio'); return; }
      setListaPersonal(prev => [...prev.filter(x => x.clave !== datos.clave), datos]);
    } catch (error) {
      setErrorVentana(`Error de conexión: ${error.message}`);
    }
  };

  useEffect(() => {
    cargarListaPersonal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const validarEntrada = (entrada) => {
    if (!entrada.tipo || !entrada.localizacion) {
      return 'Por favor completa todos los campos requeridos';
    }
    if (entrada.intensidad < 1 || entrada.intensidad > 5) {
      return 'La intensidad debe estar entre 1 y 5';
    }
    if (!entrada.duracion) {
      return 'Selecciona la duración';
    }
    return '';
  };

  const entradaActual = () => {
    const tipo = formData.tipo;
    return { ...formData, tipo };
  };

  const limpiarFormulario = () => {
    setFormData({ tipo: '', intensidad: 3, duracion: '', localizacion: '', notas: '' });
    setOtroTexto('');
  };

  const agregarOtroSintoma = () => {
    const entrada = entradaActual();
    if (entrada.tipo.length > LARGO_MAX_TIPO) {
      setMensaje('El nombre del síntoma es demasiado largo (máximo 50 caracteres)');
      return;
    }
    const error = validarEntrada(entrada);
    if (error) {
      setMensaje(error);
      return;
    }
    setPendientes(prev => [...prev, entrada]);
    limpiarFormulario();
    setMensaje('Síntoma agregado a la lista');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const lista = [...pendientes];
    if (formData.tipo || pendientes.length === 0) {
      const entrada = entradaActual();
      if (entrada.tipo.length > LARGO_MAX_TIPO) {
        setMensaje('El nombre del síntoma es demasiado largo (máximo 50 caracteres)');
        return;
      }
      const error = validarEntrada(entrada);
      if (error) {
        setMensaje(error);
        return;
      }
      lista.push(entrada);
    }

    setCargando(true);
    let guardados = 0;
    try {
      for (const entrada of lista) {
        const response = await fetch(`${apiUrl}/api/sintomas?zona=${encodeURIComponent(zonaReloj())}`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            tipo: entrada.tipo,
            intensidad: entrada.intensidad,
            duracion: entrada.duracion,
            localizacion: entrada.localizacion,
            notas: entrada.notas
          })
        });
        if (response.ok) {
          guardados += 1;
        } else if (response.status === 401) {
          onLogout();
          return;
        } else {
          const error = await response.json();
          setPendientes(lista.slice(guardados));
          limpiarFormulario();
          setMensaje(`Se guardaron ${guardados} de ${lista.length}. Error: ${error.error}`);
          cargarSintomas();
          return;
        }
      }
      setPendientes([]);
      limpiarFormulario();
      setMensaje(lista.length === 1 ? 'Síntoma registrado correctamente' : `${lista.length} síntomas registrados correctamente`);
      cargarSintomas();
      setTimeout(() => setMensaje(''), 3000);
    } catch (error) {
      setPendientes(lista.slice(guardados));
      setMensaje(`Error de conexión: ${error.message}`);
    } finally {
      setCargando(false);
    }
  };


  const handleEliminar = async (sintomaId) => {
    if (!window.confirm('¿Está seguro de que desea eliminar este registro?')) {
      return;
    }

    try {
      const response = await fetch(`${apiUrl}/api/sintomas/${sintomaId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        setMensaje('Síntoma eliminado correctamente');
        cargarSintomas();
        setTimeout(() => setMensaje(''), 2000);
      } else if (response.status === 401) {
        onLogout();
      }
    } catch (error) {
      setMensaje(`Error al eliminar: ${error.message}`);
    }
  };

  const getIntensidadColor = (intensidad) => {
    const colores = {
      1: '#28a745',
      2: '#ffc107',
      3: '#ff9800',
      4: '#ff6b6b',
      5: '#d32f2f'
    };
    return colores[intensidad] || '#999';
  };

  const getIntensidadLabel = (intensidad) => {
    const labels = {
      1: 'Muy leve',
      2: 'Leve',
      3: 'Moderado',
      4: 'Intenso',
      5: 'Muy intenso'
    };
    return labels[intensidad] || 'Desconocido';
  };

  const formatearFecha = (fechaStr) => {
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);

    if (diaClave(fecha) === diaClave(hoy)) {
      return `Hoy a las ${fecha.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', timeZone: zonaReloj() })}`;
    } else if (diaClave(fecha) === diaClave(ayer)) {
      return `Ayer a las ${fecha.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', timeZone: zonaReloj() })}`;
    }
    return fecha.toLocaleDateString('es-MX', { timeZone: zonaReloj() }) + ' ' + fecha.toLocaleTimeString('es-MX', { hour: 'numeric', minute: '2-digit', timeZone: zonaReloj() });
  };

  // Estilos de pestañas inline para no tocar el CSS existente
  const estiloPestana = (activa) => ({
    padding: '10px 20px',
    border: 'none',
    borderBottom: activa ? '3px solid #00A7A7' : '3px solid transparent',
    background: 'transparent',
    color: activa ? '#00A7A7' : 'rgba(255,255,255,0.75)',
    fontSize: '15px',
    fontWeight: activa ? '600' : '400',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'inherit',
    whiteSpace: 'nowrap'
  });

  return (
    <div className="registro-sintomas-container">
      {/* Barra de usuario */}
      <div className="user-bar">
        <div className="user-info">
          <img
            src="/assets/logo_negativo_sombra.png"
            alt="En Marcha Contigo"
            className="user-bar-logo"
            style={{ background: 'transparent' }}
          />
          <span className="user-greeting">Hola, {usuario.nombre}</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => setPestanaActiva('config')}
            className="btn-logout"
            style={pestanaActiva === 'config' ? { outline: '2px solid #FFC107', outlineOffset: '2px' } : undefined}
          >
            ⚙️ Configuración
          </button>
          <button onClick={onLogout} className="btn-logout">
            Cerrar sesión
          </button>
        </div>
      </div>

      {/* Hora que usa la app */}
      <BarraHora />

      {/* Recordatorio de síntomas abiertos de días anteriores */}
      {sintomasAbiertos.length > 0 && (
        <div style={{ margin: '12px 16px', padding: '12px', borderRadius: '8px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0, 167, 167,0.4)' }}>
          <p style={{ margin: '0 0 8px 0' }}>
            Tienes {sintomasAbiertos.length} síntoma(s) de días anteriores marcados como "Sigue presente". ¿Cuánto duró?
          </p>
          {sintomasAbiertos.map(s => (
            <div key={s.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '6px' }}>
              <span>{s.tipo} ({s.fecha_registro.slice(0, 10)})</span>
              <select
                defaultValue=""
                onChange={(e) => e.target.value && actualizarDuracion(s.id, e.target.value)}
              >
                <option value="">Selecciona</option>
                {opcionesDuracion.filter(op => op !== 'Todavía presente').map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>
          ))}
        </div>
      )}

      {/* Navegación por pestañas */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(0, 167, 167,0.2)',
        padding: '0 16px',
        overflowX: 'auto',
        background: 'rgba(0,0,0,0.15)',
        gap: '4px'
      }}>
        <button style={estiloPestana(pestanaActiva === 'midia')} onClick={() => setPestanaActiva('midia')}>
          💊 Mi Día
        </button>
        <button style={estiloPestana(pestanaActiva === 'registro')} onClick={() => setPestanaActiva('registro')}>
          ✏️ Síntomas motores
        </button>
        <button style={estiloPestana(pestanaActiva === 'evolucion')} onClick={() => setPestanaActiva('evolucion')}>
          📈 Mi evolución
        </button>
        <button style={estiloPestana(pestanaActiva === 'fluctuaciones')} onClick={() => setPestanaActiva('fluctuaciones')}>
          🌡️ Estado motor
        </button>
        <button style={estiloPestana(pestanaActiva === 'historial')} onClick={() => setPestanaActiva('historial')}>
          📋 Mis registros
        </button>
        <button style={estiloPestana(pestanaActiva === 'diario')} onClick={() => setPestanaActiva('diario')}>
          🌿 Bienestar diario
        </button>
        <button style={estiloPestana(pestanaActiva === 'reporte')} onClick={() => setPestanaActiva('reporte')}>
          📄 Reporte
        </button>
      </div>

      {/* Pestaña Reporte */}
      {pestanaActiva === 'config' && (
        <ConfiguracionPage token={token} apiUrl={apiUrl} />
      )}

      {pestanaActiva === 'reporte' && (
        <ReportePage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} fechaRegistro={usuario?.fecha_registro} />
      )}

      {/* Pestaña Diario síntomas no motores */}
      {pestanaActiva === 'diario' && (
        <RegistroDiarioPage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} />
      )}

      {/* Pestaña Mi Día */}
      {pestanaActiva === 'midia' && (
        <MiDiaPage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} />
      )}

      {/* Pestaña Fluctuaciones */}
      {pestanaActiva === 'fluctuaciones' && (
        <FluctuacionesPage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} />
      )}

      {/* Pestaña Evolución */}
      {pestanaActiva === 'evolucion' && (
        <div style={{ padding: '0 16px', maxWidth: '900px', margin: '0 auto' }}>
          <EvolucionPage token={token} apiUrl={import.meta.env.VITE_API_URL || ''} />
        </div>
      )}

      {/* Pestaña Historial */}
      {pestanaActiva === 'historial' && (
        <div className="historial-section" style={{ padding: '20px 16px' }}>
          <h2>Historial de Síntomas</h2>
          {sintomas.length === 0 ? (
            <div className="sin-datos">
              <p>Aún no hay síntomas registrados</p>
            </div>
          ) : (
            <div className="sintomas-list">
              {sintomas.map(sintoma => (
                <div key={sintoma.id} className="sintoma-card">
                  <div className="sintoma-header">
                    <span className="sintoma-tipo">{sintoma.tipo}</span>
                    <span className="intensidad-badge" style={{ backgroundColor: getIntensidadColor(sintoma.intensidad) }}>
                      {sintoma.intensidad}/5
                    </span>
                  </div>
                  <div className="sintoma-details">
                    <div className="detail-item">
                      <span className="detail-label">Localización:</span>
                      <span className="detail-value">{sintoma.localizacion}</span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Duración:</span>
                      <span className="detail-value">{sintoma.duracion}</span>
                    </div>
                    {sintoma.notas && (
                      <div className="detail-item">
                        <span className="detail-label">Notas:</span>
                        <span className="detail-value">{sintoma.notas}</span>
                      </div>
                    )}
                    <div className="detail-item">
                      <span className="detail-label">Fecha:</span>
                      <span className="detail-value">{formatearFecha(sintoma.fecha_registro)}</span>
                    </div>
                  </div>
                  <button onClick={() => handleEliminar(sintoma.id)} className="btn-eliminar">
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pestaña Registro (contenido existente) */}
      {pestanaActiva === 'registro' && (
      <div className="registro-sintomas-wrapper">
        {/* Sección del formulario */}
        <div className="registro-form-section">
          <h1>Mi Seguimiento</h1>
          <p className="subtitle">Documenta tus síntomas y tomas para tu seguimiento neurológico</p>

          {mensaje && (
            <div className={`mensaje ${mensaje.includes('Error') ? 'error' : 'exito'}`}>
              {mensaje}
            </div>
          )}

          <form onSubmit={handleSubmit} className="registro-form">
            {/* Tipo de síntoma */}
            <div className="form-group">
              <label htmlFor="tipo">Tipo de síntoma *</label>
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  id="tipo"
                  aria-haspopup="listbox"
                  aria-expanded={menuTipoAbierto}
                  onClick={() => setMenuTipoAbierto(!menuTipoAbierto)}
                  style={{
                    width: '100%', textAlign: 'left', padding: '12px 14px',
                    background: '#0D2C4D', color: '#FFFFFF',
                    border: '2px solid #FFFFFF', borderRadius: '8px',
                    fontSize: '16px', fontFamily: 'inherit', cursor: 'pointer'
                  }}
                >
                  {(() => {
                    const seleccionado = tiposSintomas.find(t => t.key === formData.tipo);
                    if (!seleccionado) return 'Selecciona un síntoma';
                    return (
                      <>
                        {seleccionado.nombre}{' '}
                        <span style={{ fontSize: '13px', opacity: 0.75 }}>({seleccionado.descripcion})</span>
                      </>
                    );
                  })()}
                </button>
                {menuTipoAbierto && (
                  <ul
                    role="listbox"
                    style={{
                      position: 'absolute', zIndex: 20, left: 0, right: 0, top: '100%',
                      margin: '4px 0 0', padding: 0, listStyle: 'none',
                      background: '#0D2C4D', border: '2px solid #FFFFFF', borderRadius: '8px',
                      maxHeight: '60vh', overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.25)'
                    }}
                  >
                    {renderGrupoTipos('Motores', motoresVisibles)}
                    {renderGrupoTipos('No motores', noMotoresVisibles)}
                  </ul>
                )}
              </div>
              {formData.tipo === 'Disfunción visual' && (
                <p className="subtitle" style={{ fontSize: '14px', marginTop: '6px' }}>
                  Anota aquí la sintomatología específica en Notas adicionales.
                </p>
              )}
            </div>

            <div className="form-group">
              <button type="button" onClick={abrirVentanaSintomas} className="btn-submit">＋ Añadir o quitar síntoma</button>
            </div>

            {ventanaSintomas && (
              <VentanaSintomas
                onCerrar={() => { setVentanaSintomas(false); setErrorVentana(''); }}
                catalogoVisible={catalogoVisible}
                catalogoOculto={catalogoOculto}
                sinClasificar={sinClasificar}
                onCrear={crearSintomaPropio}
                onCambiar={cambiarSintomaLista}
                errorVentana={errorVentana}
              />
            )}

            {/* Intensidad */}
            <div className="form-group">
              <label htmlFor="intensidad">
                Intensidad: {formData.intensidad} — {getIntensidadLabel(formData.intensidad)} *
              </label>
              <div className="intensidad-container">
                <input
                  type="range"
                  id="intensidad"
                  name="intensidad"
                  min="1"
                  max="5"
                  value={formData.intensidad}
                  onChange={handleChange}
                  className="intensidad-slider"
                  style={{
                    background: `linear-gradient(to right, #28a745 0%, #ffc107 25%, #ff9800 50%, #ff6b6b 75%, #d32f2f 100%)`
                  }}
                />
                <div className="intensidad-labels">
                  <span>1</span>
                  <span>2</span>
                  <span>3</span>
                  <span>4</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            {/* Duración */}
            <div className="form-group">
              <label htmlFor="duracion">Duración *</label>
              <select
                id="duracion"
                name="duracion"
                value={formData.duracion}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una duración</option>
                {opcionesDuracion.map(op => (
                  <option key={op} value={op}>{op}</option>
                ))}
              </select>
            </div>

            {/* Localización */}
            <div className="form-group">
              <label htmlFor="localizacion">Localización *</label>
              <select
                id="localizacion"
                name="localizacion"
                value={formData.localizacion}
                onChange={handleChange}
                required
              >
                <option value="">Selecciona una localización</option>
                {localizaciones.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Notas */}
            <div className="form-group">
              <label htmlFor="notas">Notas adicionales</label>
              <textarea
                id="notas"
                name="notas"
                value={formData.notas}
                onChange={handleChange}
                placeholder="Ej: Síntoma apareció después de tomar medicamento..."
                rows="3"
              />
            </div>

            <button type="button" onClick={agregarOtroSintoma} disabled={cargando} className="btn-submit" style={{ marginBottom: '10px' }}>
              + Agregar otro síntoma
            </button>

            {pendientes.length > 0 && (
              <div style={{ marginBottom: '12px', fontSize: '14px' }}>
                <p style={{ margin: '0 0 6px' }}>Síntomas en la lista ({pendientes.length}):</p>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  {pendientes.map((p, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>
                      {nombreVisibleTipo(p.tipo)}, intensidad {p.intensidad}, {p.duracion}, {p.localizacion}{' '}
                      <button type="button" onClick={() => setPendientes(prev => prev.filter((_, j) => j !== i))} style={{ marginLeft: '6px' }}>
                        Quitar
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <button type="submit" disabled={cargando} className="btn-submit">
              {cargando ? 'Registrando...' : 'Registrar síntoma'}
            </button>
          </form>
        </div>

        {/* Sección de estadísticas */}
        {estadisticas && (
          <div className="estadisticas-section">
            <h2>Estadísticas</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{estadisticas.total}</div>
                <div className="stat-label">Registros totales</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{estadisticas.promedio_intensidad}</div>
                <div className="stat-label">Intensidad promedio</div>
              </div>
              <div className="stat-card">
                <div className="stat-number-small">{estadisticas.duracion_frecuente || '—'}</div>
                <div className="stat-label">Duración más frecuente</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Síntoma frecuente</div>
                <div className="stat-number-small">{estadisticas.sintoma_mas_frecuente || '—'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
      )} {/* fin pestaña registro */}
    </div>
  );
};

export default RegistroSintomasPage;
