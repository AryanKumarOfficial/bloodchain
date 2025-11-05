#!/bin/bash

# Bloodchain Setup Script
# Complete setup automation

echo "🚀 Bloodchain Setup Script"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Node.js
echo -e "${YELLOW}Checking Node.js...${NC}"
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

# Check npm
echo -e "${YELLOW}Checking npm...${NC}"
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm $(npm -v)${NC}"

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Setup environment
echo -e "${YELLOW}Setting up environment...${NC}"
if [ ! -f .env.local ]; then
    cp .env.local.example .env.local
    echo -e "${GREEN}✓ .env.local created${NC}"
else
    echo -e "${YELLOW}! .env.local already exists${NC}"
fi

# Start Docker services
echo -e "${YELLOW}Starting Docker services...${NC}"
docker-compose up -d
echo -e "${GREEN}✓ Docker services started${NC}"

# Wait for database
echo -e "${YELLOW}Waiting for database...${NC}"
sleep 10

# Run Prisma migrations
echo -e "${YELLOW}Running database migrations...${NC}"
npm run prisma:migrate
echo -e "${GREEN}✓ Database migrations completed${NC}"

# Train ML model
echo -e "${YELLOW}Training ML model...${NC}"
npm run ml:train
echo -e "${GREEN}✓ ML model trained${NC}"

echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}✓ Setup completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open: http://localhost:3000"
echo ""
