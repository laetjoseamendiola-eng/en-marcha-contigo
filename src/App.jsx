import React, { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import RegistroSintomasPage from './pages/RegistroSintomasPage.jsx'
import { ErrorBoundary } from './ErrorBoundary.jsx'

function App() {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [verificando, setVerificando] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || '';

  // Verificar sesión guardada al cargar
  useEffect(() => {
    const tokenGuardado = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');

    if (tokenGuardado && usuarioGuardado) {
      // Verificar que el token siga siendo válido
      fetch(`${apiUrl}/api/auth/perfil`, {
        headers: { 'Authorization': `Bearer ${tokenGuardado}` }
      })
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          throw new Error('Token inválido');
        })
        .then(data => {
          setUsuario(data.usuario);
          setToken(tokenGuardado);
        })
        .catch(() => {
          // Token expirado o inválido, limpiar
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
        })
        .finally(() => {
          setVerificando(false);
        });
    } else {
      setVerificando(false);
    }
  }, []);

  const handleLoginExitoso = (usuarioData, tokenData) => {
    setUsuario(usuarioData);
    setToken(tokenData);
  };

  const handleLogout = () => {
    setUsuario(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
  };

  // Pantalla de carga mientras verifica sesión
  if (verificando) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #0F2640 0%, #1B3A5C 40%, #2AACB0 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontFamily: "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif",
        gap: '16px'
      }}>
        <img
          src="/assets/logo-login.png"
          alt="En Marcha Contigo"
          style={{ width: '180px', height: 'auto', opacity: 0.9 }}
        />
        <span style={{ fontSize: '16px', opacity: 0.8, letterSpacing: '0.5px' }}>
          Cargando...
        </span>
      </div>
    );
  }

  // Si no hay sesión, mostrar login
  if (!usuario || !token) {
    return <LoginPage onLoginExitoso={handleLoginExitoso} />;
  }

  // Si hay sesión, mostrar la app
  return (
    <ErrorBoundary>
      <RegistroSintomasPage
        usuario={usuario}
        token={token}
        onLogout={handleLogout}
      />
    </ErrorBoundary>
  );
}

export default App
