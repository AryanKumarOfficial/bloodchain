# Dockerfile

FROM node:20-alpine AS builder

WORKDIR /app

# PATCH: Install libc6-compat (Critical for Prisma on Alpine)
RUN apk add --no-cache openssl libc6-compat

# Install pnpm
RUN npm install -g pnpm

# Copy dependency files first
COPY package.json pnpm-lock.yaml ./

# PATCH: Install dependencies ignoring scripts first, then force install prisma engines
# This ensures the Linux binaries are downloaded regardless of the Windows lockfile
RUN pnpm install --frozen-lockfile
# Explicitly add the linux engine if missing (fallback safety)
RUN pnpm add -D @prisma/engines

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Build Next.js
RUN pnpm run build

# --- Production Stage ---
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# PATCH: Install libc6-compat in production too
RUN apk add --no-cache openssl libc6-compat
RUN npm install -g pnpm

# Copy built artifacts
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/ml-models ./ml-models
COPY --from=builder /app/scripts ./scripts

EXPOSE 3000

RUN chmod +x ./scripts/entrypoint.sh
CMD ["./scripts/entrypoint.sh"]