# 🚀 Deploy Frontend + Backend - Fase 3

Todo está listo. Solo necesitas 3 clics en el navegador.

## ✅ Lo que YA está hecho:
- ✅ Repo Git inicializado y commiteado
- ✅ Backend requirements.txt actualizado
- ✅ vercel.json configurado
- ✅ Frontend con VITE_API_URL env var listo

## 📋 PASO 1: Push a GitHub (2 min)

### 1.1 Crear repo en GitHub
1. Ve a https://github.com/new
2. Nombre: `en-marcha-contigo`
3. Click **Create repository**

### 1.2 Conectar desde tu compu
En VS Code Terminal (en backend):
```bash
cd C:\Users\josea\PROYECTOS\en-marcha-contigo
git remote add origin https://github.com/TU_USERNAME/en-marcha-contigo.git
git branch -M main
git push -u origin main
```

## 📋 PASO 2: Deploy Frontend a Vercel (2 min)

1. Ve a https://vercel.com/new
2. Click **Import Project**
3. Pega: `https://github.com/TU_USERNAME/en-marcha-contigo`
4. Click **Import**
5. Espera 2-3 minutos
6. ¡Listo! Te da una URL tipo: `https://en-marcha-contigo.vercel.app`

## 📋 PASO 3: Deploy Backend a Railway (3 min)

1. Ve a https://railway.app
2. Click **New Project** → **Deploy from GitHub**
3. Selecciona: `en-marcha-contigo` repo
4. Selecciona carpeta: `backend`
5. Click **Deploy**
6. Espera 2-3 minutos
7. Copia la URL de Railway (ej: `https://backend-xyz.railway.app`)

## 📋 PASO 4: Actualizar VITE_API_URL (1 min)

1. En Vercel, ve a **Settings** → **Environment Variables**
2. Crea una nueva:
   - Key: `VITE_API_URL`
   - Value: `https://backend-xyz.railway.app` (la URL que copiaste en Paso 3)
3. Click **Save**
4. Redeploy automático

## ✅ ¡LISTO!

Ahora tu app funciona desde celular:
- Frontend: `https://en-marcha-contigo.vercel.app`
- Backend: Conectado desde Vercel ✅

---

## 🆘 Si algo falla:

**Error "404 en /api":**
- Verifica que VITE_API_URL esté bien en Vercel
- Redeploy manual

**Backend no responde:**
- Verifica que Railway esté running
- Checkea logs en Railway dashboard

**Preguntas:**
- Usa F12 (DevTools) → Network tab para ver requests
