import { useState, useEffect } from 'react'
import LoginPage from './pages/LoginPage'
import RegistroSintomasPage from './pages/RegistroSintomasPage'
import './App.css'

function App() {
  const [usuario, setUsuario] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const usuarioGuardado = localStorage.getItem('usuario')
    if (usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado))
    }
    setLoading(false)
  }, [])

  const handleLoginSuccess = (usuarioData) => {
    setUsuario(usuarioData)
    localStorage.setItem('usuario', JSON.stringify(usuarioData))
  }

  const handleLogout = () => {
    setUsuario(null)
    localStorage.removeItem('usuario')
  }

  if (loading) {
    return (
      <div className="container">
        <h1>Cargando...</h1>
      </div>
    )
  }

  if (!usuario) {
    return <LoginPage onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-content">
          <h1>🚀 En Marcha Contigo</h1>
          <div className="user-menu">
            <span className="welcome">Bienvenido, {usuario.nombre}</span>
            <button className="logout-btn" onClick={handleLogout}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      <main className="main-content">
        <div className="container">
          <h2>Dashboard Principal</h2>
          <p>Aplicación de acompañamiento para personas con Parkinson</p>

          <div className="user-info">
            <h3>Tu Información</h3>
            <p><strong>Nombre:</strong> {usuario.nombre}</p>
            <p><strong>Email:</strong> {usuario.email}</p>
            <p><strong>ID Usuario:</strong> {usuario.id}</p>
          </div>

          <div className="status">
            <p>✅ Backend conectado en: http://localhost:5000</p>
            <p>✅ Frontend corriendo en: http://localhost:5173</p>
            <p>✅ Usuario autenticado</p>
          </div>

          <div style={{ marginBottom: '30px', marginTop: '30px' }}>
            <RegistroSintomasPage usuarioId={usuario.id} />
          </div>
        </div>
      </main>
    </div>
  )
}

export default App