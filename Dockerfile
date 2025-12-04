# Dockerfile

FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
# PATCH: Install OpenSSL for Prisma if needed
RUN apk add --no-cache openssl
RUN npm ci

# Copy source code
COPY . .

# PATCH: Generate Prisma Client BEFORE build
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

ENV NODE_ENV=production

# Install OpenSSL in production image as well
RUN apk add --no-cache openssl

# Copy built application
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
# Copy trained models if they exist, or create dir
COPY --from=builder /app/ml-models ./ml-models

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]