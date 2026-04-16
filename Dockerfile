FROM node:18-alpine AS builder

WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./
RUN npm ci --only=production

# Copia código fonte
COPY . .

# Build do projeto
RUN npm run build

# Estágio de produção
FROM node:18-alpine

WORKDIR /app

# Instala apenas dependências de produção
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copia build do estágio anterior
COPY --from=builder /app/dist ./dist

# Cria usuário não-root
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Muda para usuário não-root
USER nodejs

# Expõe porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node scripts/healthcheck.js || exit 1

# Inicia aplicação
CMD ["node", "dist/backend/server.js"]