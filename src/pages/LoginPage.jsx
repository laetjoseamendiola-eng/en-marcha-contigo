import React, { useState } from 'react';
import './LoginPage.css';

const LoginPage = ({ onLoginExitoso }) => {
  const [modo, setModo] = useState('login'); // 'login' o 'registro'
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmarPassword: ''
  });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validaciones
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
    }

    setCargando(true);

    try {
      const endpoint = modo === 'login' ? '/api/auth/login' : '/api/auth/registro';
      const body = modo === 'login'
        ? { email: formData.email, password: formData.password }
        : { nombre: formData.nombre, email: formData.email, password: formData.password };

      const response = await fetch(`${apiUrl}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('usuario', JSON.stringify(data.usuario));
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

  const cambiarModo = () => {
    setModo(modo === 'login' ? 'registro' : 'login');
    setError('');
    setFormData({ nombre: '', email: '', password: '', confirmarPassword: '' });
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
          <h1>En Marcha Contigo</h1>
          <p className="login-subtitle">Ruta de Acompañamiento Neurológico</p>
        </div>

        <div className="login-tabs">
          <button
            className={`tab ${modo === 'login' ? 'activo' : ''}`}
            onClick={() => cambiarModo()}
            type="button"
            disabled={modo === 'login'}
          >
            Iniciar sesión
          </button>
          <button
            className={`tab ${modo === 'registro' ? 'activo' : ''}`}
            onClick={() => cambiarModo()}
            type="button"
            disabled={modo === 'registro'}
          >
            Registrarse
          </button>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          {modo === 'registro' && (
            <div className="login-form-group">
              <label htmlFor="nombre">Nombre completo</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: María García López"
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

          <div className="login-form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder={modo === 'registro' ? 'Mínimo 6 caracteres' : 'Tu contraseña'}
              autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            />
          </div>

          {modo === 'registro' && (
            <div className="login-form-group">
              <label htmlFor="confirmarPassword">Confirmar contraseña</label>
              <input
                type="password"
                id="confirmarPassword"
                name="confirmarPassword"
                value={formData.confirmarPassword}
                onChange={handleChange}
                placeholder="Repite tu contraseña"
                autoComplete="new-password"
              />
            </div>
          )}

          <button type="submit" className="login-btn" disabled={cargando}>
            {cargando
              ? 'Cargando...'
              : modo === 'login'
                ? 'Iniciar sesión'
                : 'Crear cuenta'
            }
          </button>
        </form>

        <div className="login-footer">
          {modo === 'login' ? (
            <p>¿No tienes cuenta? <button type="button" className="link-btn" onClick={cambiarModo}>Regístrate aquí</button></p>
          ) : (
            <p>¿Ya tienes cuenta? <button type="button" className="link-btn" onClick={cambiarModo}>Inicia sesión</button></p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
