# --- ETAPA 1: Dependencias y Build (Builder) ---
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias y schema de Prisma
COPY package*.json ./
COPY prisma ./prisma/

# Instalamos TODAS las dependencias (necesarias para TypeScript y compilar)
RUN npm ci

# Generamos el motor de Prisma y cliente TS
RUN npx prisma generate

# Copiamos todo el código fuente del proyecto
COPY . .

# Compilamos el proyecto de NestJS (generará la carpeta 'dist')
RUN --mount=type=secret,id=env_file,target=./.env npm run build

#RUN npm run build

# --- ETAPA 2: Dependencias de Producción (Lean deps) ---
FROM node:22-alpine AS production-deps

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Instalamos SOLO las dependencias de producción, omitiendo herramientas como ESLint, TypeScript, etc.
RUN npm ci --omit=dev

# Nos aseguramos de generar el schema configurado en producción
#RUN --mount=type=secret,id=env_file,target=./.env npx prisma generate

RUN npx prisma generate

# --- ETAPA 3: Entorno de Ejecución (Runtime final) ---
FROM node:22-alpine

# Actualizar paquetes base para solucionar la vulnerabilidad CVE-2026-22184 (zlib)
RUN apk upgrade --no-cache zlib

# Etiquetamos nuestra imagen
LABEL description="Backend EnrutApp NestJS" \
    version="1.0" \
    maintainer="haderrenteria"

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Creación de usuario 'node' o custom (no-root) para mejorar la seguridad
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copiamos las dependencias estrictas de producción de la etapa 2
COPY --from=production-deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Mantenemos prisma y package.json para poder acceder a comandos de ejecución si se necesitase
COPY --from=builder --chown=appuser:appgroup /app/prisma ./prisma
COPY --from=builder --chown=appuser:appgroup /app/package.json ./package.json

# Copiamos exclusivamente la carpeta de compilación 'dist'
COPY --from=builder --chown=appuser:appgroup /app/dist ./dist

# Creamos la carpeta de "uploads" para evitar errores de permisos 'EACCES mkdir'
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads

# Eliminar npm global para borrar las vulnerabilidades (MEDIUM) provenientes de sus subdependencias (picomatch, brace-expansion)
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx /opt/yarn*

USER appuser

EXPOSE 3000

ENV DATABASE_URL=" "

# Comando de arranque del servidor optimizado
CMD ["node", "dist/src/main.js"]
