# PROCEDIMIENTOS - En Marcha Contigo MVP

## Resumen de Procedimientos Comunes
Guía de comandos, procedimientos y flujos de trabajo diarios para el desarrollo de En Marcha Contigo.

---

## 1. Iniciar Ambiente de Desarrollo

### 1.1 Abrir Proyecto en VS Code
```bash
cd C:\Users\josea\PROYECTOS\en-marcha-contigo
code .
```

### 1.2 Abrir Dos Terminales en VS Code
**Terminal 1 - Backend (Posición izquierda):**
```bash
cd backend
venv\Scripts\activate.bat
python app.py
```

**Salida esperada:**
```
✅ Base de datos inicializada
🚀 En Marcha Contigo Backend iniciado
📍 http://localhost:5000
```

**Terminal 2 - Frontend (Posición derecha):**
```bash
cd frontend
npm run dev
```

**Salida esperada:**
```
VITE v5.0.0  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 1.3 Verificar Ambos Servicios
**Backend - En Terminal 1:**
```bash
curl http://localhost:5000/health
```

**Respuesta esperada:**
```json
{"status":"ok","message":"En Marcha Contigo API v0.1"}
```

**Frontend - En Navegador:**
```
http://localhost:5173
```

Debería mostrar interfaz con título "🚀 En Marcha Contigo" y botón contador funcional.

---

## 2. Desarrollo Frontend React

### 2.1 Hot Reload (Recarga Automática)
Vite detecta automáticamente cambios en archivos:
- Editar archivo en `frontend/src/` 
- Guardar (Ctrl+S)
- Navegador recarga automáticamente sin reiniciar servidor

**No es necesario:**
- Parar y reiniciar npm run dev
- Recargar manualmente en navegador
- Reiniciar VS Code

### 2.2 Estructura de Componentes React
```
frontend/src/
├── main.jsx          (Punto de entrada - NO EDITAR)
├── App.jsx          (Componente principal)
├── App.css          (Estilos de App)
├── index.css        (Estilos globales)
├── components/      (Próxima fase: componentes reutilizables)
│   ├── Navbar.jsx
│   ├── Sidebar.jsx
│   └── ...
└── pages/           (Próxima fase: páginas)
    ├── Dashboard.jsx
    ├── Login.jsx
    └── ...
```

### 2.3 Crear Nuevo Componente React
```jsx
// frontend/src/components/NombreComponente.jsx
function NombreComponente({ prop1, prop2 }) {
  return (
    <div className="componente">
      <h2>{prop1}</h2>
      <p>{prop2}</p>
    </div>
  )
}

export default NombreComponente
```

### 2.4 Importar Componente en App.jsx
```jsx
import NombreComponente from './components/NombreComponente'

function App() {
  return (
    <div className="container">
      <NombreComponente prop1="Valor1" prop2="Valor2" />
    </div>
  )
}
```

---

## 3. Desarrollo Backend Python

### 3.1 Estructura de Directorios Backend
```
backend/
├── app.py           (Aplicación Flask principal)
├── venv/            (Entorno virtual - NO EDITAR)
├── requirements.txt (Dependencias)
└── data/
    └── app.db       (Base de datos SQLite - creada automáticamente)
```

### 3.2 Agregar Nuevas Rutas en app.py
```python
@app.route('/api/nueva-ruta', methods=['GET', 'POST'])
def nueva_ruta():
    if request.method == 'POST':
        datos = request.get_json()
        # Procesar datos
        return {'status': 'success', 'data': datos}
    else:
        return {'status': 'ok', 'message': 'GET request'}
```

### 3.3 Instalar Nuevas Dependencias Python
```bash
# Terminal con venv activado
pip install nombre-paquete
pip freeze > requirements.txt
```

**Ejemplo - Instalar SQLAlchemy:**
```bash
pip install SQLAlchemy
pip freeze > requirements.txt
```

### 3.4 Ver Log de Base de Datos
```bash
# En Terminal 1 (Backend) aparecen consultas ejecutadas
# Ejemplo de log esperado:
2026-10-07 14:32:15 - Inicializando base de datos
2026-10-07 14:32:15 - Conexión exitosa a SQLite
```

---

## 4. Variables de Entorno

### 4.1 Crear Archivo .env
```bash
# Raíz del proyecto: C:\Users\josea\PROYECTOS\en-marcha-contigo\.env
```

### 4.2 Contenido de .env
```
# Backend Configuration
FLASK_ENV=development
FLASK_DEBUG=True
API_URL=http://localhost:5000

# Frontend Configuration
VITE_API_URL=http://localhost:5000

# AI Services
GEMINI_API_KEY=tu_clave_aqui
OPENAI_API_KEY=tu_clave_aqui

# Google Calendar (Próxima Fase)
GOOGLE_CALENDAR_API_KEY=tu_clave_aqui

# Database
DATABASE_URL=sqlite:///data/app.db
```

### 4.3 Usar Variables de Entorno

**En Backend (Python):**
```python
import os
from dotenv import load_dotenv

load_dotenv()
gemini_key = os.getenv('GEMINI_API_KEY')
```

**En Frontend (JavaScript):**
```jsx
const apiUrl = import.meta.env.VITE_API_URL
```

---

## 5. Control de Versiones Git

### 5.1 Inicializar Repositorio
```bash
cd C:\Users\josea\PROYECTOS\en-marcha-contigo
git init
git config user.name "José Antonio Mendiola"
git config user.email "laet.jose.a.mendiola@gmail.com"
```

### 5.2 Crear .gitignore
```
# .gitignore (raíz del proyecto)

# Entornos virtuales
venv/
node_modules/

# Archivos de sistema
.DS_Store
Thumbs.db
*.swp

# IDEs
.vscode/
.idea/
*.code-workspace

# Archivos de entorno
.env
.env.local

# Logs
*.log
npm-debug.log*

# Base de datos local
data/app.db

# Cachés
__pycache__/
*.pyc
.pytest_cache/
dist/
build/
```

### 5.3 Commits Diarios
```bash
git add .
git commit -m "Feat: [descripción breve del cambio]"
```

**Ejemplos de mensajes:**
```bash
git commit -m "Feat: crear componente Navbar"
git commit -m "Fix: corregir validación de formulario"
git commit -m "Docs: actualizar README con instrucciones"
```

### 5.4 Ver Historial de Cambios
```bash
git log --oneline
git status
git diff
```

---

## 6. Pruebas y Validación

### 6.1 Probar Ruta Backend con curl
```bash
# GET request
curl http://localhost:5000/api/usuarios

# POST request con datos
curl -X POST http://localhost:5000/api/sintomas ^
  -H "Content-Type: application/json" ^
  -d "{\"tipo\":\"temblor\",\"intensidad\":5}"
```

### 6.2 Probar en Navegador
**Ruta de health check:**
```
http://localhost:5000/health
```

**Frontend completo:**
```
http://localhost:5173
```

### 6.3 Abrir Herramientas de Desarrollador
```
Navegador > Presionar F12
```

**Ver Console para errores de JavaScript:**
```
Console tab > Revisar mensajes rojos
```

**Ver Network para peticiones API:**
```
Network tab > Realizar acción que hace petición
```

---

## 7. Problema: Perder Conexión Terminal

### 7.1 Si Cierras Terminal Accidentalmente
**NO PIERDES los servidores en ejecución.** Necesitas reabrir terminal:

```bash
# Reabrir Terminal > Escribir:
cd backend
venv\Scripts\activate.bat

# Si el servidor ya está corriendo en 5000, aparecerá error
# Si hace falta reiniciar:
python app.py
```

### 7.2 Puerto ya en uso
**Error:** "Address already in use" en puerto 5000 ó 5173

**Solución:**
```bash
# Encontrar proceso en puerto 5000 (Windows)
netstat -ano | findstr :5000

# Matar proceso (si PID es 1234)
taskkill /PID 1234 /F

# O simplemente esperar 30 segundos y reintentar
```

---

## 8. Actualizar Dependencias

### 8.1 Backend - Instalar Nuevos Paquetes
```bash
cd backend
venv\Scripts\activate.bat

# Instalar
pip install flask-sqlalchemy flask-login

# Guardar en requirements.txt
pip freeze > requirements.txt
```

### 8.2 Frontend - Instalar Nuevos Paquetes
```bash
cd frontend

# Instalar
npm install react-router-dom axios

# Automáticamente actualiza package.json y package-lock.json
```

---

## 9. Reiniciar Ambiente Completo

### 9.1 Opción 1: Reinicio Ligero (Recomendado)
```bash
# Solo reiniciar servidores
# Terminal 1 (Backend): Ctrl+C, luego: python app.py
# Terminal 2 (Frontend): Ctrl+C, luego: npm run dev
```

### 9.2 Opción 2: Reinicio Completo
```bash
# Cerrar todas las terminales
# Cerrar VS Code
# Reabrir proyecto:
code C:\Users\josea\PROYECTOS\en-marcha-contigo
# Seguir pasos de Sección 1
```

### 9.3 Opción 3: Reinstalar Dependencias (Solo si hay conflictos)
```bash
# Backend
cd backend
rmdir /s venv
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
python app.py

# Frontend
cd frontend
rmdir node_modules
npm install
npm run dev
```

---

## 10. Recordatorios Importantes

✅ **MANTENER ACTIVAS:**
- Terminal 1: Backend `python app.py` corriendo
- Terminal 2: Frontend `npm run dev` corriendo

⚠️ **ANTES DE HACER PAUSA:**
- Reactivar Norton CyberCapture Auto-Protect
- Si pausas >1 hora, considera hacer backup en GitHub

🔐 **NUNCA COMPARTIR:**
- .env (contiene claves API)
- datos/app.db (información sensible)
- venv/ y node_modules/ (reconstruibles)

🚀 **PRÓXIMAS FASES:**
- Crear componente Login
- Integrar Gemini para análisis de síntomas
- Crear Dashboard de historial
- Integrar Google Calendar

---

**Última actualización:** 2026-10-07
**Versión:** 1.0
