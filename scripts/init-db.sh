#!/bin/bash
set -e

# Only run if using local docker postgres
if [ -n "$POSTGRES_DB" ]; then
    echo "Waiting for Postgres to start..."
    until pg_isready -h bloodchain-db -U "$POSTGRES_USER"; do
        sleep 2
    done

    echo "Running Prisma Migrations..."
    npx prisma migrate deploy

    echo "Seeding Database..."
    npx prisma db seed
fi