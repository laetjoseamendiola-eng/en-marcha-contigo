import { useState } from 'react'
import axios from 'axios'
import '../styles/RegistroSintomasPage.css'

const TIPOS_SINTOMAS = [
    'Temblor',
    'Rigidez muscular',
    'Bradicinesia (lentitud)',
    'Inestabilidad postural',
    'Congelamiento de marcha',
    'Discinesia (movimientos involuntarios)',
    'Problemas de sueño',
    'Depresión/Ansiedad',
    'Problemas cognitivos',
    'Otro'
]

const LOCALIZACIONES = [
    'Mano derecha',
    'Mano izquierda',
    'Brazo derecho',
    'Brazo izquierdo',
    'Pierna derecha',
    'Pierna izquierda',
    'Cara',
    'Cuello',
    'Torso',
    'General'
]

export default function RegistroSintomasPage({ usuarioId, onSintomaRegistrado }) {
    const [formData, setFormData] = useState({
        tipo: '',
        intensidad: 3,
        duracion: 0,
        localizacion: '',
        notas: ''
    })

    const [loading, setLoading] = useState(false)
    const [mensaje, setMensaje] = useState({ tipo: '', texto: '' })
    const [historial, setHistorial] = useState([])
    const [verHistorial, setVerHistorial] = useState(false)

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData({
            ...formData,
            [name]: name === 'intensidad' || name === 'duracion' ? parseInt(value) : value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!formData.tipo) {
            setMensaje({ tipo: 'error', texto: 'Selecciona un tipo de síntoma' })
            return
        }

        if (formData.intensidad < 1 || formData.intensidad > 5) {
            setMensaje({ tipo: 'error', texto: 'La intensidad debe estar entre 1 y 5' })
            return
        }

        setLoading(true)
        setMensaje({ tipo: '', texto: '' })

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/sintomas`,
                {
                    usuario_id: usuarioId,
                    tipo: formData.tipo,
                    intensidad: formData.intensidad,
                    duracion: formData.duracion,
                    localizacion: formData.localizacion,
                    notas: formData.notas
                }
            )

            if (response.data.status === 'success') {
                setMensaje({
                    tipo: 'exito',
                    texto: '✅ Síntoma registrado exitosamente'
                })

                setFormData({
                    tipo: '',
                    intensidad: 3,
                    duracion: 0,
                    localizacion: '',
                    notas: ''
                })

                if (onSintomaRegistrado) {
                    onSintomaRegistrado(response.data.sintoma)
                }

                cargarHistorial()
            }
        } catch (error) {
            const mensajeError = error.response?.data?.message || 'Error al registrar síntoma'
            setMensaje({ tipo: 'error', texto: `❌ ${mensajeError}` })
        } finally {
            setLoading(false)
        }
    }

    const cargarHistorial = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_API_URL}/api/sintomas/${usuarioId}`
            )

            if (response.data.status === 'success') {
                setHistorial(response.data.sintomas)
            }
        } catch (error) {
            console.error('Error cargando historial:', error)
        }
    }

    const handleVerHistorial = () => {
        if (!verHistorial) {
            cargarHistorial()
        }
        setVerHistorial(!verHistorial)
    }

    const handleEliminar = async (sintomaId) => {
        if (!window.confirm('¿Eliminar este registro de síntoma?')) return

        try {
            const response = await axios.delete(
                `${import.meta.env.VITE_API_URL}/api/sintomas/${sintomaId}`
            )

            if (response.data.status === 'success') {
                setMensaje({ tipo: 'exito', texto: '✅ Síntoma eliminado' })
                cargarHistorial()
            }
        } catch (error) {
            setMensaje({ tipo: 'error', texto: '❌ Error al eliminar síntoma' })
        }
    }

    return (
        <div className="registro-sintomas-container">
            <div className="sintomas-header">
                <h2>📋 Registro de Síntomas</h2>
                <p>Registra cómo te sientes hoy (1-5)</p>
            </div>

            <div className="form-section">
                <form onSubmit={handleSubmit} className="sintomas-form">
                    <div className="form-group">
                        <label htmlFor="tipo">Tipo de Síntoma *</label>
                        <select
                            id="tipo"
                            name="tipo"
                            value={formData.tipo}
                            onChange={handleChange}
                            required
                        >
                            <option value="">Selecciona un síntoma...</option>
                            {TIPOS_SINTOMAS.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                    {tipo}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="intensidad">
                            Intensidad: <span className="intensidad-valor">{formData.intensidad}/5</span>
                        </label>
                        <input
                            id="intensidad"
                            type="range"
                            name="intensidad"
                            min="1"
                            max="5"
                            value={formData.intensidad}
                            onChange={handleChange}
                            className="slider"
                        />
                        <div className="slider-labels">
                            <span>Leve</span>
                            <span>Severo</span>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="duracion">Duración (minutos)</label>
                        <input
                            id="duracion"
                            type="number"
                            name="duracion"
                            min="0"
                            max="480"
                            value={formData.duracion}
                            onChange={handleChange}
                            placeholder="0"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="localizacion">Localización</label>
                        <select
                            id="localizacion"
                            name="localizacion"
                            value={formData.localizacion}
                            onChange={handleChange}
                        >
                            <option value="">Selecciona área del cuerpo...</option>
                            {LOCALIZACIONES.map((loc) => (
                                <option key={loc} value={loc}>
                                    {loc}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label htmlFor="notas">Notas adicionales</label>
                        <textarea
                            id="notas"
                            name="notas"
                            value={formData.notas}
                            onChange={handleChange}
                            placeholder="Ej: Aumentó después de café, desapareció con medicamento..."
                            rows="3"
                            maxLength="500"
                        />
                        <small>{formData.notas.length}/500</small>
                    </div>

                    <div className="form-buttons">
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-guardar"
                        >
                            {loading ? 'Guardando...' : '💾 Guardar Síntoma'}
                        </button>
                        <button
                            type="button"
                            onClick={handleVerHistorial}
                            className="btn-historial"
                        >
                            {verHistorial ? '📖 Ocultar Historial' : '📖 Ver Historial'}
                        </button>
                    </div>
                </form>

                {mensaje.texto && (
                    <div className={`mensaje ${mensaje.tipo}`}>
                        {mensaje.texto}
                    </div>
                )}
            </div>

            {verHistorial && (
                <div className="historial-section">
                    <h3>📊 Historial de Síntomas</h3>

                    {historial.length === 0 ? (
                        <p className="sin-datos">No hay síntomas registrados aún</p>
                    ) : (
                        <div className="historial-tabla">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Fecha</th>
                                        <th>Síntoma</th>
                                        <th>Intensidad</th>
                                        <th>Duración</th>
                                        <th>Localización</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.map((sintoma) => (
                                        <tr key={sintoma.id}>
                                            <td className="fecha">
                                                {new Date(sintoma.fecha_registro).toLocaleDateString('es-MX')}
                                            </td>
                                            <td>{sintoma.tipo}</td>
                                            <td>
                                                <span className={`intensidad-badge intensidad-${sintoma.intensidad}`}>
                                                    {sintoma.intensidad}/5
                                                </span>
                                            </td>
                                            <td>{sintoma.duracion > 0 ? `${sintoma.duracion} min` : '-'}</td>
                                            <td>{sintoma.localizacion || '-'}</td>
                                            <td>
                                                <button
                                                    onClick={() => handleEliminar(sintoma.id)}
                                                    className="btn-eliminar"
                                                    title="Eliminar"
                                                >
                                                    🗑️
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            {historial.length > 0 && (
                                <div className="historial-stats">
                                    <p>📈 Total registros: <strong>{historial.length}</strong></p>
                                    <p>⚠️ Intensidad promedio: <strong>
                                        {(historial.reduce((sum, s) => sum + s.intensidad, 0) / historial.length).toFixed(1)}/5
                                    </strong></p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}