#!/bin/sh
set -e

echo "🚀 Starting Bloodchain Production Entrypoint..."

# 1. Run Database Migrations
echo "🔄 Running Prisma Migrations..."
npx prisma migrate deploy

# 2. Start the Application
echo "✅ Starting Next.js Server..."
exec pnpm start