import React, { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage.jsx'
import RegistroSintomasPage from './pages/RegistroSintomasPage.jsx'

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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px',
        fontFamily: '-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif'
      }}>
        Cargando...
      </div>
    );
  }

  // Si no hay sesión, mostrar login
  if (!usuario || !token) {
    return <LoginPage onLoginExitoso={handleLoginExitoso} />;
  }

  // Si hay sesión, mostrar la app
  return (
    <div>
      <RegistroSintomasPage
        usuario={usuario}
        token={token}
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App
