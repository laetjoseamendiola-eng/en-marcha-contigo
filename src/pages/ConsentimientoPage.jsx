import React, { useState } from 'react';
import { URL_AVISO_INTEGRAL } from '../legal.js';
import { CORREO_AYUDA } from '../ayuda.js';

const FUENTE = "'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, sans-serif";

const ConsentimientoPage = ({ token, onAceptado, onCancelar }) => {
  const [salud, setSalud] = useState(false);
  const [whatsapp, setWhatsapp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiUrl = import.meta.env.VITE_API_URL || '';

  const aceptar = async () => {
    if (!salud || loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${apiUrl}/api/auth/consentimiento`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ salud: true, whatsapp, origen: 'primer_inicio' })
      });
      let data = {};
      try {
        data = await response.json();
      } catch (err) {
        data = {};
      }
      if (!response.ok) {
        setError(data.error || 'No se pudo registrar el consentimiento. Inténtalo de nuevo.');
        return;
      }
      onAceptado();
    } catch (err) {
      setError('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const estiloCasilla = {
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    marginBottom: '16px',
    cursor: 'pointer',
    lineHeight: 1.45,
    fontSize: '15px'
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0D2C4D',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      color: 'white',
      fontFamily: FUENTE
    }}>
      <div style={{
        maxWidth: 520,
        width: '100%',
        background: 'rgba(255,255,255,0.08)',
        borderRadius: '16px',
        padding: '32px 28px',
        color: 'white',
        fontFamily: FUENTE
      }}>
        <h1 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 700, color: 'white' }}>
          Antes de continuar
        </h1>
        <p style={{ margin: '0 0 20px', lineHeight: 1.5, fontSize: '16px', color: 'white' }}>
          En En Marcha Contigo guardamos tus síntomas y tus medicamentos. Necesitamos tu permiso para tratar esos datos de salud.
        </p>

        <label style={estiloCasilla}>
          <input
            type="checkbox"
            checked={salud}
            onChange={(e) => setSalud(e.target.checked)}
            style={{ marginTop: '4px', width: '18px', height: '18px', flexShrink: 0 }}
          />
          <span>
            Acepto que En Marcha Contigo trate mis datos de salud (síntomas, medicamentos y tomas) para mostrarme mi seguimiento. (Obligatorio)
          </span>
        </label>

        <label style={estiloCasilla}>
          <input
            type="checkbox"
            checked={whatsapp}
            onChange={(e) => setWhatsapp(e.target.checked)}
            style={{ marginTop: '4px', width: '18px', height: '18px', flexShrink: 0 }}
          />
          <span>Quiero recibir avisos por WhatsApp. (Opcional)</span>
        </label>

        <p style={{ margin: '8px 0 16px', fontSize: '14px', lineHeight: 1.45 }}>
          {URL_AVISO_INTEGRAL ? (
            <a
              href={URL_AVISO_INTEGRAL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'white', textDecoration: 'underline' }}
            >
              Aviso de privacidad integral
            </a>
          ) : (
            <span>Aviso de privacidad integral: próximamente.</span>
          )}
        </p>

        <p style={{ margin: '0 0 20px', fontSize: '14px', lineHeight: 1.45 }}>
          Para pedir tus datos o borrar tu cuenta, escribe a{' '}
          <a href={`mailto:${CORREO_AYUDA}`} style={{ color: 'white', textDecoration: 'underline' }}>
            {CORREO_AYUDA}
          </a>
        </p>

        {error && (
          <p role="alert" style={{ color: '#ffb4b4', margin: '0 0 16px', fontSize: '14px', lineHeight: 1.45 }}>
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={aceptar}
          disabled={!salud || loading}
          style={{
            width: '100%',
            padding: '14px 16px',
            border: 'none',
            borderRadius: '10px',
            background: salud ? '#007A7A' : '#5b6b7a',
            color: 'white',
            fontSize: '16px',
            fontWeight: 600,
            cursor: !salud || loading ? 'not-allowed' : 'pointer',
            fontFamily: FUENTE
          }}
        >
          Aceptar y continuar
        </button>

        <button
          type="button"
          onClick={onCancelar}
          style={{
            display: 'block',
            margin: '16px auto 0',
            background: 'none',
            border: 'none',
            color: 'white',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontFamily: FUENTE,
            fontSize: '14px',
            padding: 0
          }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
};

export default ConsentimientoPage;
