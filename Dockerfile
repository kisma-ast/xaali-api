# Stage 1: Build
FROM node:20-alpine AS builder

# Installer outils nécessaires pour build TypeScript et modules natifs
RUN apk add --no-cache bash python3 make g++ git dumb-init

# Créer un utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copier package.json + package-lock.json
COPY package*.json ./

# Installer toutes les dépendances (dev + prod)
RUN npm ci

# Copier le code source
COPY . .

# S'assurer que les scripts sont exécutables
RUN chmod +x ./node_modules/.bin/*

# Construire l'application
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS production

RUN apk add --no-cache dumb-init

# Créer utilisateur non-root
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

WORKDIR /app

# Copier seulement les dépendances de production
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copier le build depuis le stage builder et réorganiser
COPY --from=builder --chown=nestjs:nodejs /app/dist/src ./dist
COPY --from=builder --chown=nestjs:nodejs /app/dist/data-source.js ./dist/
COPY --from=builder --chown=nestjs:nodejs /app/dist/data-source.d.ts ./dist/

# Changer les permissions
RUN chown -R nestjs:nodejs /app

# Passer à l'utilisateur non-root
USER nestjs

# Exposer le port
EXPOSE 3000

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
