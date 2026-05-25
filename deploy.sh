#!/bin/bash
# ============================================================
# Pixbook 一键部署脚本
# 用法: ./deploy.sh [prod|dev]
# ============================================================
set -e

ENV="${1:-prod}"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

echo "📦 Pixbook Deploy — env=$ENV"
echo ""

# ── 1. Pull latest code ────────────────────────────
echo "🔽 git pull..."
git pull origin main

# ── 2. Install deps ────────────────────────────────
echo "📦 pnpm install..."
pnpm install --frozen-lockfile

# ── 3. Database migration ──────────────────────────
echo "🗄️  prisma migrate..."
pnpm --filter @pixbook/server db:generate
pnpm --filter @pixbook/server db:migrate

# ── 4. Build ───────────────────────────────────────
echo "🔨 build:server..."
pnpm build:server

echo "🔨 build:admin..."
pnpm build:admin

if [ "$ENV" = "prod" ]; then
  echo "🔨 build:mp..."
  pnpm build:mp
fi

# ── 5. Restart backend ─────────────────────────────
if command -v pm2 &> /dev/null; then
  if pm2 list | grep -q pixbook-api; then
    echo "🔄 pm2 restart pixbook-api..."
    pm2 restart pixbook-api
  else
    echo "🚀 pm2 start pixbook-api..."
    pm2 start ecosystem.config.js
  fi
  pm2 save
else
  echo "⚠️  PM2 not found. Start manually: node packages/server/dist/main.js"
fi

echo ""
echo "✅ Deploy complete!"
echo "   API:    http://localhost:3000"
echo "   Admin:  http://localhost (nginx)"
