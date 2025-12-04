#!/bin/sh
set -e

echo "🚀 Starting Bloodchain Production Entrypoint..."

# 1. Run Database Migrations
# This ensures the DB schema is up to date with the code before the app starts.
# In a clustered environment, you might want to run this as a separate 'job',
# but for a single OCI instance, this is the safest place.
echo "🔄 Running Prisma Migrations..."
npx prisma migrate deploy

# 2. Seed Database (Optional - only if empty or required)
# Uncomment the line below if you want to seed data on every startup (idempotency required)
# echo "🌱 Seeding Database..."
# npx prisma db seed

# 3. Start the Application
echo "✅ Starting Next.js Server..."
exec npm start