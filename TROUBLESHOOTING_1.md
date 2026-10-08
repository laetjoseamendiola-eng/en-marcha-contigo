# TROUBLESHOOTING - En Marcha Contigo MVP

## Guía de Solución de Problemas Comunes

Problemas frecuentes durante desarrollo y configuración de En Marcha Contigo, con soluciones paso a paso.

---

## PROBLEMAS BACKEND PYTHON

### PROBLEMA 1: Error de Política de Ejecución en PowerShell

#### Síntomas:
```
PowerShell: No se puede cargar el archivo porque la ejecución de scripts está deshabilitada
en este sistema. Para obtener más información
```

#### Causa:
Windows PowerShell tiene políticas de seguridad que impiden ejecutar scripts por defecto.

#### Solución Rápida:
```bash
venv\Scripts\activate.bat
```

#### Solución Permanente (Recomendada):
```bash
# 1. Abrir PowerShell como Administrador
# 2. Ejecutar:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
# 3. Responder: S (Sí)
# 4. Cerrar y reabrir PowerShell
```

#### Alternativa: Usar cmd.exe
```bash
# En lugar de PowerShell, abrir cmd.exe
# Los comandos funcionan igual
```

---

### PROBLEMA 2: "No se encuentra el módulo" en Python

#### Síntomas:
```
ModuleNotFoundError: No module named 'flask'
```

#### Causas Posibles:
1. Entorno virtual no activado
2. requirements.txt no instalado
3. Pip instaló en Python global en lugar de venv

#### Soluciones:

**Opción A - Verificar venv activo:**
```bash
# Debería mostrar (venv) al inicio de la línea
(venv) C:\Users\josea\PROYECTOS\en-marcha-contigo\backend>

# Si no muestra (venv), activar:
venv\Scripts\activate.bat
```

**Opción B - Reinstalar dependencias:**
```bash
# Asegurar que venv está activo
venv\Scripts\activate.bat

# Ver qué está instalado
pip list

# Reinstalar requirements
pip install -r requirements.txt
```

**Opción C - Recrear venv completo:**
```bash
# Eliminar venv anterior
rmdir /s venv

# Crear nuevo
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
python app.py
```

---

### PROBLEMA 3: "Address already in use" en puerto 5000

#### Síntomas:
```
OSError: [WinError 10048] Solo se puede asignar una dirección
socket a un protocolo y una dirección de red
```

#### Causas:
1. Backend ya está corriendo en otra terminal
2. Otro programa usa puerto 5000
3. Proceso anterior no cerró correctamente

#### Soluciones:

**Opción A - Encontrar y matar proceso:**
```bash
# Buscar qué está en puerto 5000
netstat -ano | findstr :5000

# Verás algo como:
# TCP    127.0.0.1:5000    0.0.0.0:0    LISTENING    1234

# Matar proceso (reemplazar 1234 con PID)
taskkill /PID 1234 /F

# Luego intentar iniciar backend nuevamente
python app.py
```

**Opción B - Cambiar puerto en app.py:**
```python
# En backend/app.py, al final:
if __name__ == '__main__':
    app.run(debug=True, port=5001)  # Cambiar de 5000 a 5001
```

**Opción C - Esperar y reintentar:**
```bash
# Esperar 30-60 segundos
# El SO libera el puerto después de un tiempo
timeout /t 60
python app.py
```

---

### PROBLEMA 4: Error de Base de Datos SQLite

#### Síntomas:
```
sqlite3.OperationalError: database is locked
```

#### Causas:
1. Otro proceso accede simultáneamente a la BD
2. Conexión no cerrada correctamente
3. Archivos de bloqueo corruptos

#### Soluciones:

**Opción A - Detener y reiniciar:**
```bash
# 1. Parar backend (Ctrl+C en terminal)
# 2. Esperar 10 segundos
# 3. Reiniciar: python app.py
```

**Opción B - Eliminar archivos de bloqueo:**
```bash
# En carpeta data/
del app.db-journal
del app.db-wal
del app.db-shm

# Luego reiniciar backend
python app.py
```

**Opción C - Recrear base de datos:**
```bash
# 1. Parar backend
# 2. Eliminar base de datos
cd data
del app.db

# 3. Reiniciar backend (recreará automáticamente)
cd ..
python app.py
```

---

### PROBLEMA 5: Error al importar dotenv

#### Síntomas:
```
ModuleNotFoundError: No module named 'dotenv'
```

#### Causa:
Falta instalar python-dotenv

#### Solución:
```bash
# Activar venv
venv\Scripts\activate.bat

# Instalar
pip install python-dotenv

# Actualizar requirements
pip freeze > requirements.txt

# Reiniciar backend
python app.py
```

---

## PROBLEMAS FRONTEND NODE.JS

### PROBLEMA 6: Error de Norton Antivirus con npm

#### Síntomas:
```
Failed to find real location of C:\Program Files\nodejs\python.exe
npm ERR! code ENOENT
```

#### Causa:
Norton CyberCapture/Sandbox bloquea acceso a ejecutables de Node.js

#### Soluciones:

**Opción A - Desactivar Norton temporalmente (RECOMENDADO):**
```
1. Abrir Norton Security
2. Ir a Seguridad Avanzada > Sandbox
3. Desactivar "Auto-Protect"
4. Intentar npm install nuevamente
5. IMPORTANTE: Reactivar Norton después
```

**Opción B - Reinstalar Node.js con Norton desactivado:**
```
1. Desactivar Norton Auto-Protect (ver Opción A)
2. Descargar Node.js desde nodejs.org
3. Ejecutar instalador .msi
4. Completar instalación
5. Reiniciar VS Code
6. Reactivar Norton
```

**Opción C - Agregar Node.js a excepciones de Norton:**
```
1. Norton Security > Configuración
2. Excepciones > Archivos y carpetas
3. Agregar: C:\Program Files\nodejs\
4. Agregar: C:\Program Files\npm\
5. Reintentar npm install
```

---

### PROBLEMA 7: npm command not recognized

#### Síntomas:
```
'npm' is not recognized as an internal or external command
```

#### Causas:
1. Node.js no instalado
2. VS Code no recargó PATH después de instalación
3. Instalación de Node.js incompleta

#### Soluciones:

**Opción A - Verificar instalación:**
```bash
# Probar
node --version
npm --version

# Si muestra versiones, está bien
# Si no, ver Opción B
```

**Opción B - Reiniciar VS Code:**
```
1. Cerrar VS Code completamente
2. Esperar 5 segundos
3. Reabrir VS Code
4. Abrir terminal nueva
5. Intentar npm --version
```

**Opción C - Reinstalar Node.js:**
```
1. Descargar https://nodejs.org/es/ (LTS v24.21.0)
2. Ejecutar instalador .msi
3. Siguiente > Siguiente > Instalar
4. Reiniciar Windows completamente
5. Reiniciar VS Code
```

---

### PROBLEMA 8: npm install falla o cuelga

#### Síntomas:
```
npm ERR! code ECONNREFUSED
npm ERR! errno ECONNREFUSED
npm ERR! Cannot connect to registry
```

#### Causas:
1. Sin conexión a internet
2. Registro npm no disponible
3. Proxy/firewall bloquea conexión

#### Soluciones:

**Opción A - Verificar conexión:**
```bash
# Probar conexión a internet
ping google.com

# Probar conexión a npm registry
npm ping
```

**Opción B - Limpiar caché de npm:**
```bash
# Limpiar caché
npm cache clean --force

# Reintentar install
cd frontend
npm install
```

**Opción C - Cambiar registro npm:**
```bash
# Ver registro actual
npm config get registry

# Cambiar a registro alternativo
npm config set registry https://registry.npm.taobao.org

# O volver a oficial
npm config set registry https://registry.npmjs.org/

# Reintentar
npm install
```

**Opción D - Reinstalar node_modules:**
```bash
# Eliminar carpeta
cd frontend
rmdir /s node_modules
del package-lock.json

# Reinstalar
npm install
```

---

### PROBLEMA 9: Frontend no carga en localhost:5173

#### Síntomas:
```
ERR_CONNECTION_REFUSED
No se puede acceder a localhost:5173
```

#### Causas:
1. `npm run dev` no se ejecutó
2. Puerto 5173 en uso por otro programa
3. Vite no compiló correctamente

#### Soluciones:

**Opción A - Iniciar Vite:**
```bash
cd frontend
npm run dev

# Esperar a que muestre:
# ➜  Local:   http://localhost:5173/
```

**Opción B - Puerto 5173 en uso:**
```bash
# Encontrar proceso en 5173
netstat -ano | findstr :5173

# Matar proceso
taskkill /PID [PID] /F

# Reintentar
npm run dev
```

**Opción C - Forzar recompilación:**
```bash
# Parar Vite (Ctrl+C)
# Eliminar caché
rmdir /s node_modules\.vite

# Limpiar archivos de construcción
rmdir /s dist

# Reiniciar
npm run dev
```

---

### PROBLEMA 10: Error "Failed to resolve import"

#### Síntomas:
```
[vite] failed to resolve import "./App"
```

#### Causas:
1. Archivo no existe
2. Nombre de archivo incorrecto (mayúsculas/minúsculas)
3. Ruta de importación incorrecta

#### Soluciones:

**Verificar estructura:**
```
frontend/src/
├── main.jsx       (verificar nombre exacto)
├── App.jsx        (verificar nombre exacto)
├── App.css
├── index.css
└── index.html
```

**Verificar importes en main.jsx:**
```jsx
// Correcto:
import App from './App.jsx'
import './index.css'

// INCORRECTO (no se encuentra):
import App from './app.jsx'        // minúsculas
import App from './App'             // sin extensión
import App from './components/App'  // ruta incorrecta
```

**Solucionarlo:**
```jsx
// En main.jsx, verificar:
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'         // Exactamente así
import './index.css'
```

---

### PROBLEMA 11: Botón no funciona (no incrementa contador)

#### Síntomas:
```
Botón visible pero no responde al click
Contador no aumenta
```

#### Causa:
Componente no está usando React correctamente

#### Solución - Verificar App.jsx:
```jsx
import { useState } from 'react'      // IMPORTANTE
import './App.css'

function App() {
  const [count, setCount] = useState(0)  // Estado

  return (
    <div className="container">
      <button onClick={() => setCount(count + 1)}>  {/* onClick handler */}
        Contador: {count}
      </button>
    </div>
  )
}

export default App
```

Si no funciona aún:
1. Abrir DevTools (F12)
2. Ver Console para errores rojos
3. Verificar que useState está importado
4. Guardar archivo y esperar hot reload

---

### PROBLEMA 12: Estilos CSS no se aplican

#### Síntomas:
```
Página se ve sin estilo (feo, colores mal)
CSS ignorado
```

#### Causas:
1. archivo CSS no existe
2. Ruta de importación incorrecta
3. Sintaxis CSS incorrecto

#### Soluciones:

**Verificar estructura CSS:**
```
frontend/src/
├── App.css        (debe existir)
├── index.css      (debe existir)
└── App.jsx
```

**Verificar importes en App.jsx:**
```jsx
import './App.css'      // Debe estar
```

**Verificar importes en main.jsx:**
```jsx
import './index.css'    // Debe estar
```

**Verificar sintaxis CSS:**
```css
/* Correcto: */
.container {
  background: white;
  padding: 40px;
}

/* INCORRECTO: */
.container
background: white;     /* Falta { */

/* INCORRECTO: */
.container {
  background white;    /* Falta : */
}
```

Si aún no funciona:
1. Limpiar navegador cache (Ctrl+Shift+Delete)
2. F5 para recargar completo
3. Cerrar Vite (Ctrl+C) y reiniciar: `npm run dev`

---

## PROBLEMAS DE COMUNICACIÓN BACKEND-FRONTEND

### PROBLEMA 13: Frontend no se conecta a Backend

#### Síntomas:
```
Error CORS
Error en console: Network request failed
Backend conectado pero frontend no ve
```

#### Causas:
1. Backend no está corriendo
2. CORS no configurado
3. URL de API incorrecta

#### Soluciones:

**Opción A - Verificar Backend corriendo:**
```bash
# Terminal 1 debe mostrar:
✅ Base de datos inicializada
🚀 En Marcha Contigo Backend iniciado
📍 http://localhost:5000

# En navegador ir a:
http://localhost:5000/health
```

**Opción B - Verificar CORS en Backend:**
```python
# En backend/app.py, debe tener:
from flask_cors import CORS
app = Flask(__name__)
CORS(app)  # ESTO ES IMPORTANTE

# Sin CORS, frontend no puede conectar
```

**Opción C - Verificar URL en Frontend:**
```jsx
// En componentes React:
const apiUrl = 'http://localhost:5000'  // Correcto

// INCORRECTO:
const apiUrl = 'http://localhost:3000'  // Puerto equivocado
const apiUrl = 'localhost:5000'         // Falta http://
```

**Opción D - Hacer petición de prueba:**
```jsx
// En App.jsx o componente:
useEffect(() => {
  fetch('http://localhost:5000/health')
    .then(r => r.json())
    .then(d => console.log('Backend OK:', d))
    .catch(e => console.error('Backend error:', e))
}, [])
```

Si funciona, verás en console: `Backend OK: {status: 'ok'}`

---

### PROBLEMA 14: Error "No 'Access-Control-Allow-Origin' header"

#### Síntomas:
```
CORS policy: No 'Access-Control-Allow-Origin' header is present
```

#### Causa:
CORS no configurado correctamente en Flask

#### Solución:
```python
# En backend/app.py:
from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Agregar esta línea

@app.route('/health', methods=['GET'])
def health():
    return {'status':'ok'}

if __name__ == '__main__':
    app.run(debug=True)
```

---

## PROBLEMAS GENERALES

### PROBLEMA 15: Git error: "fatal: not a git repository"

#### Síntomas:
```
fatal: not a git repository
```

#### Solución:
```bash
# Ir a raíz del proyecto
cd C:\Users\josea\PROYECTOS\en-marcha-contigo

# Inicializar git
git init

# Configurar usuario
git config user.name "José Antonio Mendiola"
git config user.email "laet.jose.a.mendiola@gmail.com"

# Crear primer commit
git add .
git commit -m "Inicial: Setup MVP"
```

---

### PROBLEMA 16: VS Code no reconoce Python

#### Síntomas:
```
Python interpreter not found
```

#### Solución:
```
1. Abrir VS Code
2. Ctrl+Shift+P (Paleta de comandos)
3. Escribir: Python: Select Interpreter
4. Elegir: ./venv/Scripts/python
5. Verificar en esquina inferior que dice: Python [venv]
```

---

### PROBLEMA 17: Terminal no muestra colores ni emojis

#### Síntomas:
```
Símbolos extraños en lugar de emojis
Texto sin colores
```

#### Causa:
Terminal no soporta UTF-8 o ANSI colors

#### Solución:
En VS Code Settings:
```json
{
  "terminal.integrated.automationProfile.windows": "PowerShell",
  "terminal.integrated.defaultProfile.windows": "PowerShell",
  "terminal.integrated.environmentVarimentVariables": {
    "TERM": "xterm-256color"
  }
}
```

O simplemente usar cmd.exe que maneja mejor esto.

---

## CHECKLIST: Verificación Rápida

Cuando algo no funcione, seguir este orden:

- [ ] ¿Backend corriendo? → Terminal 1: `python app.py` → debe ver ✅
- [ ] ¿Frontend corriendo? → Terminal 2: `npm run dev` → debe ver ➜
- [ ] ¿Navegador muestra http://localhost:5173? → Si no, ver PROBLEMA 9
- [ ] ¿Página tiene título "En Marcha Contigo"? → Si no, ver PROBLEMA 10
- [ ] ¿Botón contador funciona? → Si no, ver PROBLEMA 11
- [ ] ¿Estilos se ven bien? → Si no, ver PROBLEMA 12
- [ ] ¿Backend health check funciona? → curl http://localhost:5000/health
- [ ] ¿Console (F12) sin errores rojos? → Si hay, leer mensaje

Si aún no funciona:
1. Parar todo (Ctrl+C en ambas terminales)
2. Esperar 30 segundos
3. Reiniciar en orden: backend primero, frontend después
4. Recargar navegador (F5)

---

## Contacto para Problemas

Si un problema no está aquí:

1. **Verificar SETUP_COMPLETO.md** - Revisar configuración inicial
2. **Verificar PROCEDIMIENTOS.md** - Revisar comandos correctos
3. **Buscar en Google** - "Error message aquí" + "Python Flask" o "+ React Vite"
4. **Foros:**
   - Stack Overflow
   - GitHub Issues (Flask, React, Vite)
   - Reddit r/learnprogramming

---

**Troubleshooting Versión:** 1.0
**Última Actualización:** 2026-10-07
**Próxima Actualización:** Según problemas nuevos encontrados
