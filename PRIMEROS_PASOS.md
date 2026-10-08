# 🚀 PRIMEROS PASOS - En Marcha Contigo

## ¿QUÉ TENEMOS?

Ya tienes la estructura básica de la app:
- ✅ Backend Python (Flask) - listo para usar
- ✅ Base de datos (SQLite) - lista
- ✅ Estructura Frontend (React) - lista
- ✅ Configuración VS Code - lista

## 📍 UBICACIÓN

Todos los archivos están en:
```
C:\Users\josea\PROYECTOS\en-marcha-contigo\
```

## 🎯 FASE 1: SETUP INICIAL (30 minutos)

### Paso 1: Abre VS Code
```
1. Abre VS Code
2. File > Open Folder
3. Selecciona: C:\Users\josea\PROYECTOS\en-marcha-contigo
4. Abre Terminal Integrada (Ctrl + `)
```

### Paso 2: Instala Python Backend
```bash
# Entra a la carpeta backend
cd backend

# Crea entorno virtual
python -m venv venv

# Activa el entorno (Windows)
venv\Scripts\activate

# Instala dependencias
pip install -r requirements.txt

# Prueba que funciona
python app.py
```

**Deberías ver:**
```
✅ Base de datos inicializada
🚀 En Marcha Contigo Backend iniciado
📍 http://localhost:5000
```

✅ **BACKEND LISTO**

---

### Paso 3: Instala Node.js (si no lo tienes)

Descarga desde: https://nodejs.org/es/

Verifica que esté instalado:
```bash
node --version
npm --version
```

---

### Paso 4: Instala Frontend React
```bash
# Abre OTRA terminal en VS Code (Ctrl + Shift + `)
# Entra a frontend
cd frontend

# Instala dependencias de React
npm install

# Ejecuta el frontend
npm run dev
```

**Deberías ver:**
```
  VITE v5.0.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
```

✅ **FRONTEND LISTO**

---

## 📊 AHORA TIENES DOS SERVIDORES CORRIENDO

| Nombre | URL | Puerto | ¿Qué es? |
|--------|-----|--------|----------|
| Backend | http://localhost:5000 | 5000 | API (datos) |
| Frontend | http://localhost:5173 | 5173 | Interfaz |

---

## 🧪 PRUEBA QUE FUNCIONA

### 1. Prueba el Backend (en otra terminal)
```bash
# Abre terminal nueva y ejecuta:
curl http://localhost:5000/health
```

Deberías obtener:
```json
{"status":"ok","message":"En Marcha Contigo API v0.1"}
```

### 2. Abre el Frontend en navegador
```
http://localhost:5173
```

Deberías ver una página blanca (porque aún no tiene interfaz, pero está corriendo)

---

## 📝 SIGUIENTE PASO

Una vez que todo esté corriendo, avisame y:
1. ✅ Crearemos la interfaz en React (login, formularios)
2. ✅ Conectaremos frontend con backend
3. ✅ Haremos funcionar el registro de síntomas

---

## 🐛 SI ALGO FALLA

### Error: "python no se encuentra"
```bash
# Usa la ruta completa
C:\Users\josea\AppData\Local\Programs\Python\Python311\python.exe app.py
```

### Error: "npm no se encuentra"
- Reinicia VS Code después de instalar Node.js

### Error: "Puerto 5000 ya está en uso"
```bash
# Mata el proceso que usa el puerto
netstat -ano | findstr :5000
taskkill /PID <numero> /F
```

### Error: "venv no se activa"
```bash
# Intenta esto:
.\venv\Scripts\Activate.ps1
```

---

## ✅ CHECKLIST DE SETUP

- [ ] Estructura de carpetas lista en tu SDD
- [ ] Backend Python instalado y corriendo en puerto 5000
- [ ] Frontend React instalado y corriendo en puerto 5173
- [ ] Ambos servidores accesibles desde navegador
- [ ] Base de datos SQLite creada en `data/app.db`

Una vez que todos estén ✅, avisame y continuamos. 🚀
