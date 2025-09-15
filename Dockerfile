# Stage 1: Build
FROM node:22-alpine AS builder

RUN apk update && apk upgrade && apk add --no-cache bash python3 make g++ git dumb-init

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer toutes les dépendances (dev + prod)
RUN npm install

# Copier tout le code source
COPY . .

# S'assurer que les scripts sont exécutables
RUN chmod +x ./node_modules/.bin/*

# Construire l'application
RUN npm run build

# Stage 2: Production
FROM node:22-alpine AS production

RUN apk update && apk upgrade && apk add --no-cache dumb-init

# Créer utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copier uniquement les dépendances de production
COPY package*.json ./
RUN npm install --only=production && npm cache clean --force

# Copier le build et le .env
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
# Créer un fichier .env vide si nécessaire pour éviter les erreurs
#RUN touch .env
#COPY --from=builder --chown=nestjs:nodejs /.env ./

# Vérification des permissions
RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/main.js"]