import React, { useState, useEffect } from 'react';
import './LoginPage.css';

const LoginPage = ({ onLoginExitoso }) => {
  // modos: 'login' | 'registro' | 'recuperar' | 'pregunta' (falta elegir pregunta tras entrar)
  const [modo, setModo] = useState('login');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmarPassword: '',
    codigo: '',
    pregunta_id: '',
    respuesta: '',
    nueva: ''
  });
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);
  const [verConfirmar, setVerConfirmar] = useState(false);
  const [preguntas, setPreguntas] = useState([]);
  const [pasoRec, setPasoRec] = useState('email'); // 'email' | 'respuesta'
  const [preguntaTexto, setPreguntaTexto] = useState('');
  const [pendiente, setPendiente] = useState(null); // { usuario, token }

  const apiUrl = import.meta.env.VITE_API_URL || '';

  useEffect(() => {
    fetch(`${apiUrl}/api/auth/preguntas`)
      .then(r => r.json())
      .then(data => setPreguntas(Array.isArray(data) ? data : []))
      .catch(() => setPreguntas([]));
  }, [apiUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const enviar = async (endpoint, body, headers = {}) => {
    const response = await fetch(`${apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: JSON.stringify(body)
    });
    const data = await response.json();
    return { ok: response.ok, data };
  };

  const cambiarModo = (nuevo) => {
    setModo(nuevo);
    setError('');
    setMensaje('');
    setPasoRec('email');
    setPendiente(null);
    setFormData({
      nombre: '', email: '', password: '', confirmarPassword: '', codigo: '',
      pregunta_id: '', respuesta: '', nueva: ''
    });
  };

  const guardarPreguntaPendiente = async () => {
    if (formData.pregunta_id === '') { setError('Elige una pregunta de seguridad'); return; }
    if (formData.respuesta.trim().length < 3) { setError('La respuesta debe tener al menos 3 caracteres'); return; }
    setCargando(true);
    try {
      const { ok, data } = await enviar(
        '/api/auth/pregunta',
        { pregunta_id: Number(formData.pregunta_id), respuesta: formData.respuesta },
        { Authorization: `Bearer ${pendiente.token}` }
      );
      if (ok) {
        sessionStorage.setItem('token', pendiente.token);
        sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
        onLoginExitoso(data.usuario, pendiente.token);
      } else {
        setError(data.error || 'No se pudo guardar la pregunta');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const pedirPregunta = async () => {
    if (!formData.email.trim()) { setError('Escribe tu correo electrónico'); return; }
    setCargando(true);
    try {
      const { ok, data } = await enviar('/api/auth/recuperar/pregunta', { email: formData.email });
      if (ok) {
        setPreguntaTexto(data.pregunta);
        setPasoRec('respuesta');
      } else {
        setError(data.error || 'No se pudo obtener la pregunta');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const recuperar = async () => {
    if (formData.respuesta.trim().length < 3) { setError('Escribe tu respuesta de seguridad'); return; }
    if (formData.nueva.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres'); return; }
    setCargando(true);
    try {
      const { ok, data } = await enviar('/api/auth/recuperar', {
        email: formData.email,
        respuesta: formData.respuesta,
        password_nueva: formData.nueva
      });
      if (ok) {
        setModo('login');
        setPasoRec('email');
        setError('');
        setMensaje(data.mensaje || 'Contraseña actualizada. Ya puedes iniciar sesión.');
        setFormData({
          nombre: '', email: '', password: '', confirmarPassword: '', codigo: '',
          pregunta_id: '', respuesta: '', nueva: ''
        });
      } else {
        setError(data.error || 'No se pudo cambiar la contraseña');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (modo === 'pregunta') return guardarPreguntaPendiente();
    if (modo === 'recuperar') return pasoRec === 'email' ? pedirPregunta() : recuperar();

    if (!formData.email.trim() || !formData.password) {
      setError('Email y contraseña son requeridos');
      return;
    }

    if (modo === 'registro') {
      if (!formData.nombre.trim()) {
        setError('El nombre es requerido');
        return;
      }
      if (formData.password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres');
        return;
      }
      if (formData.password !== formData.confirmarPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (!formData.codigo.trim()) {
        setError('El código de tester es requerido');
        return;
      }
      if (formData.pregunta_id === '') {
        setError('Elige una pregunta de seguridad');
        return;
      }
      if (formData.respuesta.trim().length < 3) {
        setError('La respuesta de seguridad debe tener al menos 3 caracteres');
        return;
      }
    }

    setCargando(true);

    try {
      const esLogin = modo === 'login';
      const endpoint = esLogin ? '/api/auth/login' : '/api/auth/registro';
      const body = esLogin
        ? { email: formData.email, password: formData.password }
        : {
            nombre: formData.nombre,
            email: formData.email,
            password: formData.password,
            codigo: formData.codigo.trim(),
            pregunta_id: Number(formData.pregunta_id),
            respuesta: formData.respuesta
          };

      const { ok, data } = await enviar(endpoint, body);

      if (ok) {
        if (esLogin && data.requiere_pregunta) {
          // Cuenta sin pregunta de seguridad: se pide antes de entrar
          setPendiente({ usuario: data.usuario, token: data.token });
          setModo('pregunta');
          setFormData(prev => ({ ...prev, pregunta_id: '', respuesta: '' }));
          return;
        }
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('usuario', JSON.stringify(data.usuario));
        onLoginExitoso(data.usuario, data.token);
      } else {
        setError(data.error || 'Error en la operación');
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const renderPassword = (id, label, name, value, placeholder, autocomplete, visible, onToggle) => (
    <div className="login-form-group">
      <label htmlFor={id}>{label}</label>
      <div className="login-pass-wrap">
        <input
          type={visible ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          autoComplete={autocomplete}
        />
        <button
          type="button"
          className="login-toggle-pass"
          onClick={onToggle}
          aria-label={visible ? `Ocultar ${label.toLowerCase()}` : `Mostrar ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? 'Ocultar' : 'Ver'}
        </button>
      </div>
    </div>
  );

  const renderPreguntaSelect = () => (
    <div className="login-form-group">
      <label htmlFor="pregunta_id">Pregunta de seguridad</label>
      <select
        id="pregunta_id"
        name="pregunta_id"
        value={formData.pregunta_id}
        onChange={handleChange}
        className="login-select"
      >
        <option value="">Elige una pregunta</option>
        {preguntas.map(p => (
          <option key={p.id} value={p.id}>{p.texto}</option>
        ))}
      </select>
    </div>
  );

  const renderRespuesta = (label) => (
    <div className="login-form-group">
      <label htmlFor="respuesta">{label}</label>
      <input
        type="text"
        id="respuesta"
        name="respuesta"
        value={formData.respuesta}
        onChange={handleChange}
        placeholder="No distingue mayúsculas"
        autoComplete="off"
      />
    </div>
  );

  const textoBoton = () => {
    if (modo === 'login') return 'Entrar';
    if (modo === 'registro') return 'Crear cuenta';
    if (modo === 'pregunta') return 'Guardar y entrar';
    return pasoRec === 'email' ? 'Continuar' : 'Cambiar contraseña';
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img
            src="/assets/logo-login.png"
            alt="En Marcha Contigo"
            className="login-logo"
          />
        </div>

        {(modo === 'login' || modo === 'registro') && (
          <div className="login-tabs">
            <button
              className={`tab ${modo === 'login' ? 'activo' : ''}`}
              onClick={() => cambiarModo('login')}
              type="button"
              disabled={modo === 'login'}
            >
              Iniciar sesión
            </button>
            <button
              className={`tab ${modo === 'registro' ? 'activo' : ''}`}
              onClick={() => cambiarModo('registro')}
              type="button"
              disabled={modo === 'registro'}
            >
              Registrarse
            </button>
          </div>
        )}

        {modo === 'pregunta' && (
          <p className="login-texto">
            Para proteger tu cuenta, elige una pregunta de seguridad. La usarás si olvidas tu contraseña.
          </p>
        )}

        {modo === 'recuperar' && (
          <p className="login-texto">
            {pasoRec === 'email'
              ? 'Escribe tu correo y te mostraremos tu pregunta de seguridad.'
              : preguntaTexto}
          </p>
        )}

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="login-ok">
            {mensaje}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {modo === 'pregunta' && (
            <>
              {renderPreguntaSelect()}
              {renderRespuesta('Tu respuesta')}
            </>
          )}

          {modo === 'recuperar' && pasoRec === 'email' && (
            <div className="login-form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="tu@correo.com"
                autoComplete="email"
              />
            </div>
          )}

          {modo === 'recuperar' && pasoRec === 'respuesta' && (
            <>
              {renderRespuesta('Tu respuesta')}
              {renderPassword(
                'nueva', 'Nueva contraseña', 'nueva', formData.nueva,
                'Mínimo 6 caracteres', 'new-password',
                verPassword, () => setVerPassword(v => !v)
              )}
            </>
          )}

          {(modo === 'login' || modo === 'registro') && (
            <>
              {modo === 'registro' && (
                <div className="login-form-group">
                  <label htmlFor="nombre">Nombre</label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Tu nombre"
                    autoComplete="name"
                  />
                </div>
              )}

              <div className="login-form-group">
                <label htmlFor="email">Correo electrónico</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="tu@correo.com"
                  autoComplete="email"
                />
              </div>

              {renderPassword(
                'password', 'Contraseña', 'password', formData.password,
                modo === 'registro' ? 'Mínimo 6 caracteres' : 'Tu contraseña',
                modo === 'login' ? 'current-password' : 'new-password',
                verPassword, () => setVerPassword(v => !v)
              )}

              {modo === 'login' && (
                <div className="login-link-row">
                  <button type="button" className="link-btn" onClick={() => cambiarModo('recuperar')}>
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              )}

              {modo === 'registro' && (
                <>
                  {renderPassword(
                    'confirmarPassword', 'Confirmar contraseña', 'confirmarPassword', formData.confirmarPassword,
                    'Repite tu contraseña', 'new-password',
                    verConfirmar, () => setVerConfirmar(v => !v)
                  )}

                  <div className="login-form-group">
                    <label htmlFor="codigo">Código de tester</label>
                    <input
                      type="text"
                      id="codigo"
                      name="codigo"
                      value={formData.codigo}
                      onChange={handleChange}
                      placeholder="Código de 8 caracteres"
                      autoComplete="off"
                      autoCapitalize="none"
                    />
                  </div>

                  {renderPreguntaSelect()}
                  {renderRespuesta('Tu respuesta (para recuperar tu contraseña)')}
                </>
              )}
            </>
          )}

          <button type="submit" className="login-btn" disabled={cargando}>
            {cargando ? 'Procesando...' : textoBoton()}
          </button>
        </form>

        <div className="login-footer">
          {modo === 'login' && (
            <p>¿No tienes cuenta? <button type="button" className="link-btn" onClick={() => cambiarModo('registro')}>Regístrate aquí</button></p>
          )}
          {modo === 'registro' && (
            <p>¿Ya tienes cuenta? <button type="button" className="link-btn" onClick={() => cambiarModo('login')}>Inicia sesión</button></p>
          )}
          {modo === 'recuperar' && (
            <p><button type="button" className="link-btn" onClick={() => cambiarModo('login')}>Volver a iniciar sesión</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
