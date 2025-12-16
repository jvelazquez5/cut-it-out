# Usa la imagen oficial de Node.js como base
FROM node:20-alpine

# Establece el directorio de trabajo
WORKDIR /app

# Copia el package.json y package-lock.json (si existe)
COPY package*.json ./

# Instala las dependencias
RUN npm install

# Copia el resto de la aplicación
COPY . .

# Compila el proyecto
RUN npm run build

# Expone el puerto que usa la aplicación
EXPOSE 4173

# Comando para iniciar el servidor en modo preview
CMD ["npm", "run", "preview"]