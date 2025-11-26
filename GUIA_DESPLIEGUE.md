# 🚀 Guía Paso a Paso - Despliegue en VPS

Esta guía te explica cómo subir y configurar tu aplicación Dashboard en un servidor VPS.

---

## 📋 Requisitos Previos

Antes de empezar, asegúrate de tener:

1. **Un VPS** con Ubuntu 20.04+ o Debian
2. **Acceso SSH** al servidor
3. **Un dominio** apuntando a la IP de tu VPS (opcional pero recomendado)
4. **Base de datos PostgreSQL** (puedes usar Neon.tech gratis o instalar en tu VPS)

---

## Paso 1: Conectar a tu VPS

Abre una terminal y conéctate a tu servidor:

```bash
ssh usuario@IP_DE_TU_VPS
```

Ejemplo:
```bash
ssh root@123.45.67.89
```

---

## Paso 2: Instalar Node.js

Ejecuta estos comandos uno por uno:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar curl
sudo apt install curl -y

# Instalar Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install nodejs -y

# Verificar instalación
node -v    # Debe mostrar v20.x.x
npm -v     # Debe mostrar 10.x.x
```

---

## Paso 3: Instalar PM2 y Nginx

```bash
# Instalar PM2 (mantiene la app corriendo)
sudo npm install -g pm2

# Instalar Nginx (servidor web)
sudo apt install nginx -y

# Iniciar Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## Paso 4: Subir tu proyecto al VPS

### Opción A: Usando Git (recomendado)

En tu VPS:
```bash
# Ir a la carpeta donde quieres el proyecto
cd /var/www

# Clonar tu repositorio
git clone https://github.com/TU_USUARIO/TU_REPO.git dashboard
cd dashboard
```

### Opción B: Subir archivos manualmente

Desde tu ordenador local (NO en el VPS):
```bash
# Comprimir el proyecto (sin node_modules)
cd /ruta/a/tu/proyecto
tar --exclude='node_modules' --exclude='.next' --exclude='.git' -czvf dashboard.tar.gz .

# Subir al VPS
scp dashboard.tar.gz usuario@IP_VPS:/var/www/
```

En el VPS:
```bash
cd /var/www
mkdir dashboard
cd dashboard
tar -xzvf ../dashboard.tar.gz
rm ../dashboard.tar.gz
```

---

## Paso 5: Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con nano
nano .env
```

**Contenido del archivo `.env`:**

```env
# Base de datos PostgreSQL
# Si usas Neon.tech, copia el connection string de tu dashboard
DATABASE_URL="postgresql://usuario:password@host:5432/database?sslmode=require"

# NextAuth - MUY IMPORTANTE
# Genera un secreto con: openssl rand -base64 32
NEXTAUTH_SECRET="PEGA_AQUI_TU_SECRETO_GENERADO"

# URL de tu aplicación
# Si tienes dominio: https://tudominio.com
# Si no tienes dominio: http://IP_DE_TU_VPS:3000
NEXTAUTH_URL="https://tudominio.com"

# Google OAuth (opcional, déjalo vacío si no lo usas)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# Entorno
NODE_ENV="production"
```

**Para generar NEXTAUTH_SECRET:**
```bash
openssl rand -base64 32
```
Copia el resultado y pégalo en el archivo .env.

**Guardar y salir de nano:** `Ctrl+X`, luego `Y`, luego `Enter`

---

## Paso 6: Instalar Dependencias y Construir

```bash
# Instalar dependencias
npm ci

# Generar cliente de Prisma
npx prisma generate

# Aplicar migraciones a la base de datos
npx prisma migrate deploy

# Construir la aplicación
npm run build
```

Si todo funciona, verás un mensaje de éxito al final.

---

## Paso 7: Iniciar la Aplicación con PM2

```bash
# Iniciar la aplicación
pm2 start ecosystem.config.js

# Ver que está corriendo
pm2 status

# Ver logs (para verificar que no hay errores)
pm2 logs dashboard

# Guardar configuración para que inicie automáticamente
pm2 save
pm2 startup
```

El último comando te dará un comando para copiar y ejecutar. Hazlo.

---

## Paso 8: Configurar Nginx como Proxy

```bash
# Crear archivo de configuración
sudo nano /etc/nginx/sites-available/dashboard
```

**Pega este contenido (cambia `tudominio.com` por tu dominio o IP):**

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

**Guardar:** `Ctrl+X`, `Y`, `Enter`

```bash
# Activar el sitio
sudo ln -s /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/

# Eliminar configuración por defecto (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Si dice "ok", reiniciar Nginx
sudo systemctl restart nginx
```

---

## Paso 9: Configurar SSL (HTTPS) - RECOMENDADO

Si tienes un dominio:

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

Sigue las instrucciones en pantalla. Certbot configurará todo automáticamente.

---

## Paso 10: Configurar Firewall

```bash
# Permitir SSH, HTTP y HTTPS
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'

# Activar firewall
sudo ufw enable

# Ver estado
sudo ufw status
```

---

## ✅ ¡Listo!

Tu aplicación debería estar funcionando en:
- **Con dominio:** `https://tudominio.com`
- **Sin dominio:** `http://IP_DE_TU_VPS`

---

## 🔧 Comandos Útiles

### Ver estado de la aplicación
```bash
pm2 status
```

### Ver logs en tiempo real
```bash
pm2 logs dashboard
```

### Reiniciar aplicación
```bash
pm2 restart dashboard
```

### Detener aplicación
```bash
pm2 stop dashboard
```

### Actualizar después de cambios
```bash
cd /var/www/dashboard
git pull                      # Si usas git
npm ci                        # Instalar nuevas dependencias
npx prisma migrate deploy     # Aplicar migraciones
npm run build                 # Reconstruir
pm2 restart dashboard         # Reiniciar
```

---

## 🔥 Solución de Problemas

### La página no carga
```bash
# Ver logs de la aplicación
pm2 logs dashboard --lines 50

# Ver logs de Nginx
sudo tail -f /var/log/nginx/error.log
```

### Error de base de datos
- Verifica que `DATABASE_URL` en `.env` sea correcta
- Si usas Neon, asegúrate de que la conexión incluya `?sslmode=require`

### Error de autenticación / login no funciona
- Verifica que `NEXTAUTH_URL` coincida EXACTAMENTE con tu URL
- Si usas HTTPS, debe ser `https://` no `http://`
- Verifica que `NEXTAUTH_SECRET` esté configurado

### La app se detiene sola
```bash
# Revisar memoria
free -h

# Si hay poca memoria, la app puede cerrarse
# Considera añadir swap:
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

---

## 📁 Estructura de Archivos en el VPS

```
/var/www/dashboard/
├── .env                 # Variables de entorno (NO subir a git)
├── .next/               # Build de producción
├── app/                 # Rutas y API
├── components/          # Componentes React
├── lib/                 # Utilidades
├── prisma/              # Base de datos
├── public/              # Archivos estáticos
├── node_modules/        # Dependencias
├── ecosystem.config.js  # Configuración PM2
└── package.json         # Dependencias del proyecto
```

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs: `pm2 logs dashboard`
2. Revisa la configuración de `.env`
3. Verifica que Nginx esté corriendo: `sudo systemctl status nginx`
4. Verifica que PM2 esté corriendo: `pm2 status`
