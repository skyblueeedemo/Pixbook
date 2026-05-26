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
git pull origin master

# ── 2. Install deps ────────────────────────────────
echo "📦 pnpm install..."
pnpm install --frozen-lockfile

# ── 3. Database migration ──────────────────────────
echo "🗄️  prisma migrate..."

# 3.0 确保 MySQL 运行 + 认证插件兼容 Prisma
sudo systemctl start mysql 2>/dev/null || true
sleep 1

# 找可用的 MySQL 登录方式
if sudo mysql -e "SELECT 1" &>/dev/null; then
  MYSQL_CMD="sudo mysql"
elif [ -f /etc/mysql/debian.cnf ]; then
  MYSQL_CMD="mysql --defaults-file=/etc/mysql/debian.cnf"
else
  MYSQL_CMD="mysql -u root -ppixbook_root"
fi

if command -v mysql &>/dev/null; then
  MYSQL_USER=$(grep DATABASE_URL packages/server/.env 2>/dev/null | grep -oP '://\K[^:]+' || echo "pixbook")
  MYSQL_PW=$(grep DATABASE_URL packages/server/.env 2>/dev/null | grep -oP '://[^:]+:\K[^@]+' || echo "")
  if [ -n "$MYSQL_PW" ]; then
    $MYSQL_CMD -e "
      ALTER USER '${MYSQL_USER}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PW}';
      ALTER USER '${MYSQL_USER}'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PW}';
      FLUSH PRIVILEGES;
    " 2>/dev/null || echo "  ⚠ MySQL 用户修正跳过（可能已正确配置）"
  fi
fi

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
