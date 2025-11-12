#!/bin/bash

# BlueRelief - Format All Services
# Runs code formatters and linters across all services

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "🎨 Formatting BlueRelief codebase..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Backend Python
echo -e "\n${BLUE}📦 Backend (Python)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT/server"

if ! command -v black &> /dev/null; then
    echo -e "${YELLOW}⚠️  Black not found. Installing...${NC}"
    pip install black isort ruff
fi

echo "Running Black..."
black --line-length 88 --preview . || echo -e "${RED}❌ Black failed${NC}"

echo "Running isort..."
isort --profile black . || echo -e "${RED}❌ isort failed${NC}"

echo "Running Ruff..."
ruff check --fix . || echo -e "${RED}❌ Ruff failed${NC}"

echo -e "${GREEN}✓ Backend formatted${NC}"

# Frontend Next.js
echo -e "\n${BLUE}🎨 Frontend (Next.js)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT/client"

if ! pnpm list prettier &> /dev/null; then
    echo -e "${YELLOW}⚠️  Prettier not found. Installing...${NC}"
    pnpm add -D prettier prettier-plugin-tailwindcss
fi

echo "Running Prettier..."
pnpm format || echo -e "${RED}❌ Prettier failed${NC}"

echo "Running ESLint..."
pnpm lint:fix || echo -e "${RED}❌ ESLint failed (may have unfixable errors)${NC}"

echo -e "${GREEN}✓ Frontend formatted${NC}"

# Email Service
echo -e "\n${BLUE}📧 Email Service (TypeScript)${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

cd "$PROJECT_ROOT/email-service"

if ! pnpm list prettier &> /dev/null; then
    echo -e "${YELLOW}⚠️  Prettier not found. Installing...${NC}"
    pnpm add -D prettier
fi

echo "Running Prettier..."
pnpm format || echo -e "${RED}❌ Prettier failed${NC}"

echo -e "${GREEN}✓ Email Service formatted${NC}"

# Summary
echo -e "\n${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✨ All services formatted successfully!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Review the changes: git diff"
echo "  2. Stage changes: git add ."
echo "  3. Commit: git commit -m 'style: format code'"
echo ""

