# En Marcha Contigo

**Sistema de acompañamiento neurológico para personas con Parkinson**

## 📋 Descripción

En Marcha Contigo es una aplicación que permite:
- 📝 Registrar síntomas y cambios
- 📊 Mantener un historial organizado
- 💊 Registrar medicamentos y citas médicas
- 🤖 Recibir sugerencias de ejercicios basadas en síntomas
- 👥 Compartir información con familia y cuidadores
- 🏥 Sincronizar citas con tu calendario

## 🏗️ Estructura del Proyecto

```
en-marcha-contigo/
├── backend/              # Servidor Python (Flask)
│   ├── app.py           # Aplicación principal
│   └── requirements.txt  # Dependencias Python
│
├── frontend/            # Interfaz (React)
│   ├── src/
│   └── package.json
│
├── data/                # Base de datos (SQLite)
│   └── app.db
│
└── README.md            # Este archivo
```

## 🚀 Instalación Rápida

### 1. Backend (Python)

```bash
# Navega a la carpeta backend
cd backend

# Crea un entorno virtual
python -m venv venv

# Activa el entorno (Windows)
venv\Scripts\activate

# Instala dependencias
pip install -r requirements.txt

# Ejecuta el servidor
python app.py
```

El servidor estará en: **http://localhost:5000**

### 2. Frontend (React)

```bash
# Navega a la carpeta frontend
cd frontend

# Instala dependencias
npm install

# Ejecuta el frontend
npm run dev
```

La interfaz estará en: **http://localhost:5173**

## 📚 API Endpoints (MVP)

### Usuarios
- `POST /api/usuarios` - Crear usuario
- `POST /api/usuarios/login` - Login

### Síntomas
- `POST /api/sintomas` - Registrar síntoma
- `GET /api/sintomas/<usuario_id>` - Obtener historial

### Health
- `GET /health` - Verificar servidor

## 🛠️ Tecnologías

- **Backend**: Python, Flask, SQLite
- **Frontend**: React, Vite
- **IA**: Gemini/ChatGPT para sugerencias
- **Hosting**: Vercel (frontend) + Railway (backend)

## 📝 Pasos Siguientes

- [ ] Crear interfaz básica en React
- [ ] Integrar IA para sugerencias de ejercicios
- [ ] Implementar compartir con familia
- [ ] Conectar con Google Calendar
- [ ] Deploy a Vercel + Railway

## 🤝 Notas

- La app **NO diagnostica**
- **NO prescribe** medicamentos
- **NO sustituye** atención médica profesional
- Siempre consulta con tu neurólogo

---

**Proyecto en desarrollo** | octubre 2026
