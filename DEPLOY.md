# 🚀 Guía de Despliegue en VPS

## Requisitos Previos

- **Node.js** 18+ (`node -v`)
- **npm** o **yarn**
- **PostgreSQL** (puede usar Neon, Supabase, o instalación local)
- **PM2** (opcional, para mantener la app corriendo)

## Pasos de Instalación

### 1. Clonar o subir el proyecto

```bash
# Opción A: Git
git clone <tu-repositorio> dashboard
cd dashboard

# Opción B: SCP/SFTP
# Subir los archivos al servidor
```

### 2. Configurar variables de entorno

```bash
# Copiar el archivo de ejemplo
cp .env.example .env

# Editar con tus valores
nano .env
```

**Variables requeridas:**

```env
# Base de datos PostgreSQL
DATABASE_URL="postgresql://usuario:password@host:5432/basedatos"

# NextAuth - IMPORTANTE: Cambiar en producción
NEXTAUTH_SECRET="genera-con-openssl-rand-base64-32"
NEXTAUTH_URL="https://tudominio.com"

# Google OAuth (opcional)
GOOGLE_CLIENT_ID="tu-client-id"
GOOGLE_CLIENT_SECRET="tu-client-secret"

# Entorno
NODE_ENV="production"
```

**Generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```

### 3. Ejecutar el script de despliegue

```bash
chmod +x deploy.sh
./deploy.sh
```

O manualmente:

```bash
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build
```

### 4. Iniciar la aplicación

**Opción A: Directamente**
```bash
npm start
```

**Opción B: Con PM2 (recomendado)**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar con PM2
pm2 start ecosystem.config.js

# Ver logs
pm2 logs dashboard

# Guardar configuración para reinicio automático
pm2 save
pm2 startup
```

### 5. Configurar Nginx (opcional pero recomendado)

Crear archivo de configuración:

```bash
sudo nano /etc/nginx/sites-available/dashboard
```

Contenido:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Activar sitio:

```bash
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. Configurar SSL con Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

---

## Comandos Útiles

```bash
# Ver estado de la app
pm2 status

# Ver logs
pm2 logs dashboard

# Reiniciar
pm2 restart dashboard

# Detener
pm2 stop dashboard

# Actualizar después de cambios
git pull
npm ci
npx prisma migrate deploy
npm run build
pm2 restart dashboard
```

## Solución de Problemas

### Error de conexión a base de datos
- Verificar que `DATABASE_URL` sea correcta
- Verificar que el servidor PostgreSQL esté corriendo
- Verificar reglas de firewall

### Error de autenticación
- Verificar que `NEXTAUTH_URL` coincida exactamente con tu dominio
- Verificar que `NEXTAUTH_SECRET` esté configurado
- Si usas HTTPS, asegurar que `NEXTAUTH_URL` use `https://`

### La app no inicia
```bash
# Ver logs detallados
pm2 logs dashboard --lines 100

# O ejecutar directamente para ver errores
npm start
```

---

## Estructura del Proyecto

```
├── app/                 # Rutas y API de Next.js
├── components/          # Componentes React
├── lib/                 # Utilidades y configuración
├── prisma/              # Schema y migraciones
├── public/              # Archivos estáticos
├── .env                 # Variables de entorno (NO subir a git)
├── deploy.sh            # Script de despliegue
└── ecosystem.config.js  # Configuración de PM2
```
