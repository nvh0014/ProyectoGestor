# Etapa 1: Build del frontend
FROM node:20-alpine AS builder

# Crear directorio de trabajo
WORKDIR /app

# Copiar archivos necesarios para instalación de dependencias
COPY package.json package-lock.json ./

# Instalar dependencias
RUN npm install

# Copiar todo el resto del código
COPY . .

# Generar build de producción
RUN npm run build

# Etapa 2: Servidor web para producción
FROM node:20-alpine

# Instalar 'serve' para servir archivos estáticos
RUN npm install -g serve

# Crear y usar directorio para app
WORKDIR /app

# Copiar solo la build desde la etapa anterior
COPY --from=builder /app/build ./build

# Exponer puerto (Railway lo asigna dinámicamente pero puedes dejarlo por claridad)
EXPOSE 3000

# Comando para iniciar el servidor
CMD ["serve", "-s", "build", "-l", "3000"]