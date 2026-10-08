# DESARROLLO_ROADMAP - En Marcha Contigo MVP

## Visión General
Roadmap de desarrollo para el MVP y expansión futura de En Marcha Contigo, aplicación de acompañamiento para personas con Parkinson.

**Estado Actual:** MVP Fase 1 Completada (Backend + Frontend básico)
**Próxima Fase:** Autenticación y Módulo de Síntomas

---

## Fase 1: MVP Inicial (✅ COMPLETADA)

### Duración: Semana 1
### Objetivos Alcanzados:
- ✅ Setup inicial backend Flask
- ✅ Setup inicial frontend React/Vite
- ✅ Estructura de carpetas definida
- ✅ Interfaz visual básica funcionando
- ✅ API health check operativa
- ✅ Base de datos SQLite conectada

### Componentes Entregados:
- Backend: API REST en `http://localhost:5000`
- Frontend: Interfaz en `http://localhost:5173`
- Database: SQLite en `data/app.db`
- Documentación: SETUP_COMPLETO.md + PROCEDIMIENTOS.md

### Tecnologías Implementadas:
```
Backend:     Flask 2.3.3, Flask-CORS, Python-dotenv, SQLite
Frontend:    React 18.2.0, Vite 5.0.0, Axios 1.6.0
Database:    SQLite (archivo local)
DevTools:    VS Code, Git, npm, pip
```

---

## Fase 2: Autenticación y Control de Acceso (Estimado: 1-2 semanas)

### 2.1 Módulo de Autenticación Backend
**Objetivo:** Sistema seguro de login/registro

#### Tareas:
- [ ] Instalar Flask-Login y Flask-JWT-Extended
- [ ] Crear modelo Usuario en SQLite
  ```python
  class Usuario(db.Model):
      id = Column(Integer, primary_key=True)
      email = Column(String(120), unique=True, nullable=False)
      nombre = Column(String(120), nullable=False)
      password_hash = Column(String(255), nullable=False)
      fecha_registro = Column(DateTime, default=datetime.now)
      estado = Column(String(20), default='activo')
  ```
- [ ] Implementar endpoints:
  - `POST /api/auth/registro` - Crear nuevo usuario
  - `POST /api/auth/login` - Autenticar usuario
  - `POST /api/auth/logout` - Cerrar sesión
  - `GET /api/auth/perfil` - Obtener datos usuario
  - `PUT /api/auth/perfil` - Actualizar perfil

#### Hash de Contraseñas:
```python
from werkzeug.security import generate_password_hash, check_password_hash

password_hash = generate_password_hash(password)
is_correct = check_password_hash(password_hash, password)
```

### 2.2 Componentes Frontend Autenticación
**Objetivo:** Interfaz de login/registro

#### Archivos a Crear:
```
frontend/src/
├── pages/
│   ├── LoginPage.jsx       (Formulario de login)
│   ├── RegisterPage.jsx    (Formulario de registro)
│   └── ProfilePage.jsx     (Perfil de usuario)
├── components/
│   ├── LoginForm.jsx       (Componente formulario)
│   ├── ProtectedRoute.jsx  (Ruta protegida)
│   └── Navbar.jsx          (Navegación con usuario)
└── context/
    └── AuthContext.jsx     (Estado global de autenticación)
```

#### Flujo de Autenticación:
1. Usuario ingresa email y contraseña en LoginPage
2. Frontend envía POST a `/api/auth/login`
3. Backend valida y retorna JWT token
4. Frontend almacena token en localStorage/sessionStorage
5. Solicitudes posteriores incluyen token en header Authorization
6. AuthContext proporciona estado global

### 2.3 Seguridad
- [ ] Implementar HTTPS en producción
- [ ] Validar contraseñas fuertes (mínimo 8 caracteres)
- [ ] Rate limiting en endpoints de autenticación
- [ ] CORS configurado correctamente
- [ ] JWT tokens con expiración (15 min access, 7 días refresh)

---

## Fase 3: Módulo de Síntomas (Estimado: 2-3 semanas)

### 3.1 Modelo de Datos Síntomas Backend
**Objetivo:** Capturar y registrar síntomas del usuario

#### Estructura:
```python
class Sintoma(db.Model):
    id = Column(Integer, primary_key=True)
    usuario_id = Column(Integer, ForeignKey('usuario.id'), nullable=False)
    tipo = Column(String(50), nullable=False)  # tremor, rigidez, bradicinesia, etc
    intensidad = Column(Integer, default=0)    # 0-10
    duracion = Column(Integer, default=0)      # en minutos
    localizacion = Column(String(100))         # área del cuerpo
    fecha_registro = Column(DateTime, default=datetime.now)
    notas = Column(Text)
```

#### Tipos de Síntomas:
```
- Temblor
- Rigidez muscular
- Bradicinesia (lentitud)
- Inestabilidad postural
- Congelamiento de marcha
- Discinesia (movimientos involuntarios)
- Problemas de sueño
- Depresión/Ansiedad
- Problemas cognitivos
```

### 3.2 Endpoints Backend
- [ ] `POST /api/sintomas` - Registrar nuevo síntoma
- [ ] `GET /api/sintomas` - Obtener historial del usuario
- [ ] `GET /api/sintomas/<id>` - Obtener detalle específico
- [ ] `PUT /api/sintomas/<id>` - Actualizar síntoma
- [ ] `DELETE /api/sintomas/<id>` - Eliminar registro

### 3.3 Formulario React Frontend
**Archivo:** `frontend/src/pages/RegistroSintomasPage.jsx`

#### Campos:
```jsx
- Tipo de síntoma (dropdown)
- Intensidad (slider 0-10)
- Duración (input minutos)
- Localización (campo texto)
- Notas (textarea)
- Botón Guardar
- Botón Cancelar
```

#### Validación:
- Tipo de síntoma es obligatorio
- Intensidad entre 0-10
- Duración positiva
- Máximo 500 caracteres en notas

### 3.4 Integración Gemini AI
**Objetivo:** Análisis automático de síntomas

#### Flujo:
1. Usuario registra síntoma
2. Frontend envía datos a `/api/gemini/analizar`
3. Backend consulta Google Gemini API
4. Gemini retorna análisis y sugerencias
5. Frontend muestra resultado al usuario

```python
# Backend endpoint
@app.route('/api/gemini/analizar', methods=['POST'])
def analizar_sintomas():
    datos = request.get_json()
    
    # Consultar Gemini API
    respuesta = gemini_client.generate_content(
        f"Analiza estos síntomas de Parkinson: {datos}"
    )
    
    return {
        'status': 'success',
        'analisis': respuesta.text,
        'sugerencias': extraer_sugerencias(respuesta.text)
    }
```

---

## Fase 4: Dashboard y Reportes (Estimado: 2-3 semanas)

### 4.1 Vista Dashboard Principal
**Archivo:** `frontend/src/pages/DashboardPage.jsx`

#### Componentes:
```
┌─────────────────────────────────────┐
│  Bienvenida: Hola, [Nombre]         │
├─────────────────────────────────────┤
│ Síntomas Hoy     │ Últimos 7 Días   │
│ ─────────────    │ ──────────────── │
│ • Temblor  7/10  │ Gráfico línea    │
│ • Rigidez  5/10  │ Intensidad prom  │
├─────────────────────────────────────┤
│ Historial Reciente                  │
│ ─────────────────────────────────── │
│ Hoy 14:30 - Temblor (7/10)          │
│ Ayer 10:15 - Rigidez (5/10)         │
└─────────────────────────────────────┘
```

### 4.2 Gráficos y Estadísticas
- [ ] Gráfico línea: Intensidad síntomas por día
- [ ] Gráfico barras: Síntomas más frecuentes
- [ ] Tabla: Historial completo con filtros
- [ ] Tarjetas resumen: Síntomas por semana/mes

**Librería:** Chart.js o Recharts

### 4.3 Reportes Exportables
- [ ] Exportar a PDF (últimos 7 días)
- [ ] Exportar a CSV para Excel
- [ ] Reporte semanal automático por email
- [ ] Resumen mensual para médico

---

## Fase 5: Integración Google Calendar (Estimado: 1-2 semanas)

### 5.1 Conexión Google Calendar API
**Objetivo:** Sincronizar citas médicas con calendario

#### Configuración:
- [ ] Crear Google Cloud Project
- [ ] Habilitar Google Calendar API
- [ ] Configurar OAuth 2.0 credentials
- [ ] Instalación de `google-auth-oauthlib`

### 5.2 Funcionalidades:
- [ ] Listar próximas citas
- [ ] Crear nueva cita en Google Calendar
- [ ] Recibir recordatorios de citas
- [ ] Registrar síntomas después de cita médica

```python
# Backend - Crear evento en Google Calendar
def crear_evento_calendario(usuario_id, titulo, fecha):
    service = build('calendar', 'v3', credentials=creds)
    evento = {
        'summary': titulo,
        'start': {'dateTime': fecha},
        'end': {'dateTime': fecha + timedelta(hours=1)},
        'reminders': {'useDefault': True}
    }
    return service.events().insert(calendarId='primary', body=evento).execute()
```

---

## Fase 6: Red de Apoyo Familiar (Estimado: 2-3 semanas)

### 6.1 Invitar Familiares
**Objetivo:** Permitir que familia cercana vea progreso

#### Features:
- [ ] Generar código de invitación
- [ ] Familiares se registran como "Apoyo"
- [ ] Acceso limitado al historial
- [ ] No pueden editar datos

### 6.2 Notificaciones
- [ ] Familiares reciben notificación si síntomas empeoran
- [ ] Chat privado usuario-familia
- [ ] Recordatorios de citas importantes

---

## Fase 7: Integración Profesionales Salud (Estimado: 3-4 semanas)

### 7.1 Rol de Médico/Especialista
**Tipos de usuarios:**
```
- Paciente (usuario principal)
- Familia (acceso limitado)
- Médico (acceso completo)
- Especialista (acceso parcial)
```

### 7.2 Portal Médico
- [ ] Dashboard específico para doctores
- [ ] Ver historial completo de pacientes
- [ ] Agregar notas médicas
- [ ] Prescribir ejercicios personalizados
- [ ] Chat médico-paciente

### 7.3 Ejercicios Personalizados
**Integración con templates:**
- [ ] Médico asigna rutina de ejercicios
- [ ] Ejercicios basados en síntomas
- [ ] Videos demostrativo de ejercicios
- [ ] Seguimiento de cumplimiento

---

## Fase 8: Aplicación Móvil (Estimado: 4-6 semanas)

### 8.1 Desarrollo Híbrido
**Opciones:**
- React Native (Reutiliza código React)
- Expo (Despliegue rápido a iOS/Android)
- Flutter (Alternativa más performante)

### 8.2 Funcionalidades Móvil
- [ ] Notificaciones push de síntomas
- [ ] Registro rápido de síntomas
- [ ] Acceso offline a historial local
- [ ] Sincronización automática cuando hay conexión
- [ ] Compartir ubicación con familia (opcional)

---

## Timeline General

```
Semana 1:   ✅ MVP Inicial completado
Semana 2-3: Autenticación + Módulo Síntomas
Semana 4-5: Dashboard y Reportes
Semana 6:   Integración Google Calendar
Semana 7-8: Red Familiar
Semana 9+:  Profesionales Salud + Móvil
```

**Total MVP robusto:** 8-10 semanas

---

## Metricas de Éxito

### Por Fase:
| Fase | Métrica | Meta |
|------|---------|------|
| 1 | API operativa | ✅ Completada |
| 2 | Usuarios registrados | 1+ usuario (José) |
| 3 | Registros diarios | 3-5 síntomas/día |
| 4 | Reportes generados | 1+ reporte/semana |
| 5 | Citas sincronizadas | 100% de citas |
| 6 | Familiares invitados | 2-3 familia |
| 7 | Médicos conectados | 1+ especialista |
| 8 | Descargas app | 50+ descargas |

---

## Recursos Necesarios

### Servicios Externos:
```
- Google Cloud (Gemini + Calendar): Nivel FREE tier
- OpenAI (alternativa a Gemini): API key requerida
- SendGrid (emails): FREE tier (100/día)
- AWS S3 (almacenamiento PDF): FREE tier (5GB)
- Vercel (hosting frontend): FREE tier
- Railway/Render (hosting backend): FREE tier
```

### Hardware:
```
- PC Windows (José): ✅ Disponible
- Teléfono Android/iOS: Para pruebas móvil
- Servidor producción: Después MVP robusto
```

### Personal:
```
- Desarrollador: José (parte-time)
- QA/Testing: Familiares
- Médico consultor: 1-2 especialistas Parkinson
- Usuarios beta: Red familiar
```

---

## Riesgos y Mitigación

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|--------|-----------|
| Cambio requisitos | Alta | Medio | Documentación clara, iteración rápida |
| Rendimiento BD | Baja | Alto | Índices SQLite, caché Redis próxima fase |
| Integración API | Media | Medio | Testing exhaustivo, fallback local |
| Adopción usuarios | Media | Alto | UX intuitiva, onboarding guiado |
| Privacidad datos | Media | Alto | HTTPS, encriptación, GDPR compliant |

---

## Próximos Pasos Inmediatos

1. **Esta semana:**
   - [ ] Revisar documentación setup
   - [ ] Verificar todos los servidores funcionan
   - [ ] Hacer backup en GitHub

2. **Próxima semana:**
   - [ ] Comenzar Fase 2 (Autenticación)
   - [ ] Crear modelo Usuario
   - [ ] Implementar endpoints login/registro

3. **Seguimiento:**
   - [ ] Daily standup: ¿Qué hice? ¿Qué haré? ¿Bloqueos?
   - [ ] Semanal: Revisión de progreso
   - [ ] Bisemanal: Demo a familia/médicos

---

**Roadmap Versión:** 1.0
**Última Actualización:** 2026-10-07
**Próxima Revisión:** 2026-10-14
