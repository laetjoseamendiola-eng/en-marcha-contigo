import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(160deg, #0F2640 0%, #1B3A5C 40%, #2AACB0 100%)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          color: 'white', padding: '32px', textAlign: 'center',
          fontFamily: "'Segoe UI', sans-serif"
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
          <h2 style={{ marginBottom: '12px' }}>Algo salió mal</h2>
          <pre style={{
            background: 'rgba(0,0,0,0.4)', borderRadius: '12px',
            padding: '16px', fontSize: '12px', textAlign: 'left',
            maxWidth: '500px', overflowX: 'auto', color: '#ff6b6b'
          }}>
            {this.state.error?.message}
          </pre>
          <button onClick={() => window.location.reload()} style={{
            marginTop: '20px', padding: '12px 28px',
            background: '#2AACB0', border: 'none', borderRadius: '24px',
            color: 'white', fontSize: '15px', cursor: 'pointer'
          }}>
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
