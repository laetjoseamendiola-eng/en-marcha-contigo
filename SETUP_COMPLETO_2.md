# SETUP COMPLETO - En Marcha Contigo MVP

## Resumen Ejecutivo
Instalación y configuración de la stack de desarrollo para "En Marcha Contigo": backend Python Flask + frontend React/Vite en Windows 10/11.

**Resultado Final:**
- Backend: http://localhost:5000 (Flask API)
- Frontend: http://localhost:5173 (React/Vite)
- Base de datos: SQLite local en `data/app.db`

---

## Fase 1: Preparación

### 1.1 Estructura de Carpetas
```
C:\Users\josea\PROYECTOS\en-marcha-contigo\
├── backend/
│   ├── venv/
│   ├── app.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
├── data/
│   └── app.db (se crea automáticamente)
├── .env.example
├── .gitignore
├── README.md
└── PRIMEROS_PASOS.md
```

### 1.2 Software Requerido
- Python 3.11+ (verificar con `python --version`)
- Node.js 24.21.0 LTS (incluye npm 11.19.0+)
- VS Code (o editor de preferencia)
- Git (para control de versiones)

---

## Fase 2: Setup Backend Python

### 2.1 Abrir VS Code
```
File > Open Folder > Selecciona: C:\Users\josea\PROYECTOS\en-marcha-contigo
```

### 2.2 Crear Entorno Virtual
```bash
cd backend
python -m venv venv
```

### 2.3 Activar Entorno Virtual (Windows)
**Problema Común:** Error de políticas de ejecución en PowerShell
**Solución:**
```bash
venv\Scripts\activate.bat
```
O usar cmd.exe en lugar de PowerShell.

### 2.4 Instalar Dependencias
```bash
pip install -r requirements.txt
```

**Dependencias instaladas:**
- Flask==2.3.3
- flask-cors==4.0.0
- python-dotenv==1.0.0

### 2.5 Ejecutar Backend
```bash
python app.py
```

**Salida esperada:**
```
✅ Base de datos inicializada
🚀 En Marcha Contigo Backend iniciado
📍 http://localhost:5000
```

**Verificación:**
```bash
curl http://localhost:5000/health
```

**Respuesta esperada:**
```json
{"status":"ok","message":"En Marcha Contigo API v0.1"}
```

---

## Fase 3: Setup Frontend Node.js

### 3.1 Problema: Norton Antivirus
**Error:** "Failed to find real location of C:\Program Files\nodejs\python.exe"
**Causa:** Norton CyberCapture/Sandbox bloquea Python y npm
**Solución:**
1. Abrir Norton Security
2. Seguridad Avanzada > Sandbox
3. Desactivar "Auto-Protect" temporalmente
4. Reinstalar Node.js o continuar con npm

### 3.2 Instalar Node.js
**Descargar desde:** https://nodejs.org/es/
**Versión recomendada:** LTS (v24.21.0)
**Pasos:**
1. Ejecutar instalador .msi
2. Siguiente > Siguiente > Instalar
3. **IMPORTANTE:** Reiniciar VS Code completamente
4. Verificar instalación:
```bash
node --version
npm --version
```

### 3.3 Problema: PowerShell Execution Policy
**Error:** "la ejecución de scripts está deshabilitada en este sistema"
**Solución Opción A - Cambiar Política (Recomendado):**
```bash
# Abrir PowerShell como Administrador
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# Responder: S (Sí)
```

**Solución Opción B - Usar cmd.exe:**
- Cierra PowerShell
- Abre cmd.exe como administrador
- Ejecuta los comandos npm desde ahí

### 3.4 Instalar Dependencias Frontend
```bash
cd frontend
npm install
```

**Dependencias instaladas:**
- react@18.2.0
- react-dom@18.2.0
- vite@5.0.0
- @vitejs/plugin-react@4.0.0
- axios@1.6.0

### 3.5 Ejecutar Frontend
```bash
npm run dev
```

**Salida esperada:**
```
VITE v5.0.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

---

## Fase 4: Crear Estructura React

### 4.1 Archivos Creados
**En VS Code Explorer:**

#### index.html (raíz de frontend)
```html
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>En Marcha Contigo</title>
</head>
<body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
</body>
</html>
```

#### src/main.jsx
```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

#### src/App.jsx
```jsx
import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="container">
      <h1>🚀 En Marcha Contigo</h1>
      <p>Aplicación de acompañamiento para personas con Parkinson</p>
      <div className="card">
        <button onClick={() => setCount(count + 1)}>
          Contador: {count}
        </button>
      </div>
      <p className="status">✅ Backend conectado en: http://localhost:5000</p>
      <p className="status">✅ Frontend corriendo en: http://localhost:5173</p>
    </div>
  )
}

export default App
```

#### src/App.css
```css
:root {
  --primary: #4CAF50;
  --secondary: #2196F3;
  --danger: #f44336;
  --light: #f5f5f5;
  --dark: #333;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.container {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

h1 {
  color: var(--primary);
  margin-bottom: 10px;
  font-size: 2.5em;
}

p {
  color: var(--dark);
  margin-bottom: 20px;
  font-size: 1.1em;
}

.card {
  background: var(--light);
  padding: 30px;
  border-radius: 8px;
  margin: 20px 0;
}

button {
  background: var(--primary);
  color: white;
  border: none;
  padding: 12px 30px;
  font-size: 1em;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.3s;
}

button:hover {
  background: #45a049;
}

.status {
  font-size: 0.9em;
  color: #666;
  margin-top: 15px;
}
```

#### src/index.css
```css
html {
  font-size: 16px;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

#root {
  width: 100%;
  min-height: 100vh;
}
```

---

## Fase 5: Verificación Final

### 5.1 Checklist de Funcionamiento
- [ ] Backend corriendo en http://localhost:5000
- [ ] Frontend corriendo en http://localhost:5173
- [ ] Interfaz visible en navegador con título "En Marcha Contigo"
- [ ] Botón "Contador" funciona (incrementa número)
- [ ] Mensajes de status confirman conexión

### 5.2 URLs Funcionales
- Backend Health: http://localhost:5000/health
- Frontend: http://localhost:5173

---

## Notas Importantes

### Reactivar Norton After Setup
Después de completar el setup, **reactivar Norton CyberCapture:**
1. Seguridad Avanzada > Sandbox
2. Auto-Protect = ON

### Hot Reload en Vite
Vite detecta cambios automáticamente:
```
[vite] page reload index.html (x2)
```
No necesita reinicio manual. Recarga automática en navegador.

### Mantener Terminals Abiertas
**NO cerrar mientras desarrollas:**
- Terminal 1: `python app.py` (Backend)
- Terminal 2: `npm run dev` (Frontend)

Puedes cerrar Terminal 3 (donde hiciste npm install).

### Variables de Entorno
Crear archivo `.env` en raíz del proyecto:
```
# Backend
FLASK_ENV=development
FLASK_DEBUG=True
API_URL=http://localhost:5000

# Frontend
VITE_API_URL=http://localhost:5000

# IA / APIs
GEMINI_API_KEY=tu_clave_aqui
OPENAI_API_KEY=tu_clave_aqui

# Google Calendar (después)
GOOGLE_CALENDAR_API_KEY=tu_clave_aqui

# Base de datos
DATABASE_URL=sqlite:///data/app.db
```

---

## Próximos Pasos

1. **Login/Registro** - Sistema de autenticación
2. **Formulario de Síntomas** - Captura de datos
3. **Integración Gemini** - Sugerencias de ejercicios
4. **Dashboard** - Visualización de historial
5. **Google Calendar** - Integración de citas médicas

---

**Fecha de Setup:** 2026-10-07
**Versiones Instaladas:**
- Python 3.11+
- Node.js v24.21.0
- npm v11.19.0
- Flask 2.3.3
- React 18.2.0
- Vite 5.0.0
