# ─────────────────────────────────────────────
# Stage 1: build Angular
# ─────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app

# Copia primero solo package.json para cachear npm install.
# Si el código cambia pero las dependencias no, esta capa se reutiliza.
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

COPY . .

# ng build usa la configuración production por defecto (definido en angular.json)
RUN npx ng build --configuration production

# ─────────────────────────────────────────────
# Stage 2: runtime — Nginx sirve los estáticos
# ─────────────────────────────────────────────
FROM nginx:1.27-alpine AS runtime

# Elimina la config por defecto de Nginx
RUN rm /etc/nginx/conf.d/default.conf

COPY nginx.conf /etc/nginx/conf.d/app.conf

# Angular 21 con @angular/build:application genera los archivos en browser/
COPY --from=builder /app/dist/TailwindAdmin/browser /usr/share/nginx/html

# Nginx ya corre con usuario 'nginx' (no root) en la imagen alpine oficial
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
