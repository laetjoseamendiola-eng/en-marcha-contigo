import { useState } from 'react'
import axios from 'axios'
import '../styles/LoginPage.css'

function LoginPage({ onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    email: '',
    nombre: '',
    password: ''
  })
  const [message, setMessage] = useState({ type: '', text: '' })
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/registro'
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : formData

      const response = await axios.post(
        `http://localhost:5000${endpoint}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      )

      if (response.data.status === 'success') {
        setMessage({ type: 'success', text: response.data.message })
        
        // Guardar usuario en localStorage si es login
        if (isLogin) {
          localStorage.setItem('usuario', JSON.stringify({
            id: response.data.usuario_id,
            email: response.data.email,
            nombre: response.data.nombre
          }))
          
          // Notificar al componente padre
          if (onLoginSuccess) {
            onLoginSuccess({
              id: response.data.usuario_id,
              email: response.data.email,
              nombre: response.data.nombre
            })
          }
        } else {
          // Si es registro, limpiar formulario y mostrar éxito
          setFormData({ email: '', nombre: '', password: '' })
          setTimeout(() => {
            setIsLogin(true)
            setMessage({ type: 'info', text: 'Registrado exitosamente. Inicia sesión con tus credenciales.' })
          }, 2000)
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Error al procesar solicitud'
      setMessage({ type: 'error', text: errorMessage })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🚀 En Marcha Contigo</h1>
        <p className="subtitle">Acompañamiento para Parkinson</p>

        <div className="form-toggle">
          <button
            className={`toggle-btn ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
            type="button"
          >
            Iniciar Sesión
          </button>
          <button
            className={`toggle-btn ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
            type="button"
          >
            Registrarse
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <input
            type="email"
            name="email"
            placeholder="Correo electrónico"
            value={formData.email}
            onChange={handleChange}
            required
          />

          {!isLogin && (
            <input
              type="text"
              name="nombre"
              placeholder="Nombre completo"
              value={formData.nombre}
              onChange={handleChange}
              required={!isLogin}
            />
          )}

          <input
            type="password"
            name="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="submit-btn"
          >
            {loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
          </button>
        </form>

        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {isLogin && (
          <p className="help-text">
            ¿No tienes cuenta? Haz clic en "Registrarse"
          </p>
        )}
      </div>
    </div>
  )
}

export default LoginPage
