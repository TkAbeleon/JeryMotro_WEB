#!/bin/bash
set -e

# Get project directory automatically from script location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

echo "=== Working in: $PROJECT_DIR ==="

# Step 1: Pull latest changes
echo "=== Pulling latest code from Git ==="
git pull origin main

# Step 2: Install dependencies
echo "=== Installing dependencies ==="
pnpm install --frozen-lockfile

# Step 3: Build everything
echo "=== Building all packages ==="
pnpm run build

# Step 4: Start services with PM2
echo "=== Starting services with PM2 ==="

# Cleanup old processes
pm2 stop jerymotro-frontend || true
pm2 delete jerymotro-frontend || true
pm2 stop jerymotro-backend || true
pm2 delete jerymotro-backend || true

# Start frontend
pm2 start "pnpm dev" --name "jerymotro-frontend" --cwd "$PROJECT_DIR/artifacts/jerymotro"

# Start backend (optional, if you want to run both on same server)
# Uncomment if needed:
# pm2 start "pnpm dev" --name "jerymotro-backend" --cwd "$PROJECT_DIR/artifacts/api-server"

echo "=== Deployment complete! ==="
pm2 status