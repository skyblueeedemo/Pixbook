#!/bin/bash
# ============================================================
# Pixbook 环境安装脚本
# 系统：Ubuntu 22.04 / 24.04
# 用法: bash setup-env.sh
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} Pixbook 环境安装 · Ubuntu${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# ── 0. apt update ───────────────────────────────────
echo "🔄 apt update..."
sudo apt update -qq
echo ""

# ── 1. Git ──────────────────────────────────────────
echo -n "Git ... "
if command -v git &>/dev/null; then
  echo -e "${GREEN}✓ $(git --version | awk '{print $NF}')${NC}"
else
  echo -e "${YELLOW}未安装 → 正在安装...${NC}"
  sudo apt install -y -qq git
  echo -e "${GREEN}✓ $(git --version | awk '{print $NF}')${NC}"
fi

# ── 2. Node.js 24+ ──────────────────────────────────
echo -n "Node.js ... "
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 24 ]; then
    echo -e "${GREEN}✓ $(node -v)${NC}"
  else
    echo -e "${RED}✗ $(node -v)（需要 ≥24）${NC}"
    echo "  升级: curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
  fi
else
  echo -e "${YELLOW}未安装 → 正在安装...${NC}"
  curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
  sudo apt install -y -qq nodejs
  echo -e "${GREEN}✓ $(node -v)${NC}"
fi

# ── 3. pnpm ─────────────────────────────────────────
echo -n "pnpm ... "
if command -v pnpm &>/dev/null; then
  echo -e "${GREEN}✓ $(pnpm -v)${NC}"
else
  echo -e "${YELLOW}未安装 → 正在安装...${NC}"
  npm install -g pnpm
  echo -e "${GREEN}✓ pnpm $(pnpm -v)${NC}"
fi

# ── 4. MySQL 8 ──────────────────────────────────────
echo -n "MySQL ... "
if command -v mysql &>/dev/null; then
  echo -e "${GREEN}✓ $(mysql --version | awk '{print $3}')${NC}"
else
  echo -e "${YELLOW}未安装 → 正在安装...${NC}"
  sudo apt install -y -qq mysql-server
  sudo systemctl enable mysql
  sudo systemctl start mysql
  echo -e "${GREEN}✓ 已安装${NC}"
fi

# ── 4.1 确保 MySQL 运行 + 初始化 ──────────────────
echo "🔧 确保 MySQL 运行中..."
sudo systemctl start mysql 2>/dev/null || true
sleep 1

# ── 4.2 找可用的 MySQL 登录方式 ──────────────────
MYSQL_CMD=""
if sudo mysql -e "SELECT 1" &>/dev/null; then
  # Ubuntu 22.04+ auth_socket
  MYSQL_CMD="sudo mysql"
elif [ -f /etc/mysql/debian.cnf ]; then
  # Ubuntu 20.04 debian-sys-maint
  MYSQL_CMD="mysql --defaults-file=/etc/mysql/debian.cnf"
elif mysql -u root -ppixbook_root -e "SELECT 1" &>/dev/null; then
  MYSQL_CMD="mysql -u root -ppixbook_root"
fi

if [ -z "$MYSQL_CMD" ]; then
  echo -e "  ${RED}✗ 无法连接 MySQL。请手动重置 root 密码后重试。${NC}"
  echo "     sudo mysqld_safe --skip-grant-tables --skip-networking &"
  echo "     mysql -u root  →  ALTER USER 'root'@'localhost' IDENTIFIED BY 'pixbook_root';"
  exit 1
fi

echo "🔧 配置 MySQL 用户 + 数据库..."
MYSQL_PW="pixbook_dev"
if [ -f packages/server/.env ]; then
  ENV_PW=$(grep DATABASE_URL packages/server/.env 2>/dev/null | grep -oP '://[^:]+:\K[^@]+' || echo "")
  [ -n "$ENV_PW" ] && MYSQL_PW="$ENV_PW"
fi

$MYSQL_CMD <<SQL
-- 修正 root 认证插件（兼容 Prisma）
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'pixbook_root';

-- 创建 pixbook 用户（如已存在则修正插件）
CREATE USER IF NOT EXISTS 'pixbook'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PW}';
CREATE USER IF NOT EXISTS 'pixbook'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PW}';
ALTER USER 'pixbook'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PW}';
ALTER USER 'pixbook'@'127.0.0.1' IDENTIFIED WITH mysql_native_password BY '${MYSQL_PW}';

-- 创建数据库
CREATE DATABASE IF NOT EXISTS pixbook CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 授权
GRANT ALL PRIVILEGES ON pixbook.* TO 'pixbook'@'localhost';
GRANT ALL PRIVILEGES ON pixbook.* TO 'pixbook'@'127.0.0.1';
FLUSH PRIVILEGES;
SQL

echo -e "  ${GREEN}✓ 用户 pixbook / 数据库 pixbook / mysql_native_password 全部就绪${NC}"
echo -e "  ${YELLOW}⚠ MySQL root 密码: pixbook_root  |  pixbook 密码: ${MYSQL_PW}${NC}"
echo ""

# ── 5. Redis ────────────────────────────────────────
echo -n "Redis ... "
if command -v redis-cli &>/dev/null; then
  echo -e "${GREEN}✓ $(redis-cli --version | awk '{print $2}')${NC}"
else
  echo -e "${YELLOW}未安装 → 正在安装...${NC}"
  sudo apt install -y -qq redis-server
  sudo systemctl enable redis-server
  sudo systemctl start redis-server
  echo -e "${GREEN}✓ 已安装${NC}"
fi

# ── 6. Nginx ────────────────────────────────────────
echo -n "Nginx ... "
if command -v nginx &>/dev/null; then
  echo -e "${GREEN}✓ $(nginx -v 2>&1 | awk '{print $NF}')${NC}"
else
  echo -e "${YELLOW}未安装 → 正在安装...${NC}"
  sudo apt install -y -qq nginx
  sudo systemctl enable nginx
  sudo systemctl start nginx
  echo -e "${GREEN}✓ 已安装${NC}"
fi

# ── 7. PM2 ──────────────────────────────────────────
echo -n "PM2 ... "
if command -v pm2 &>/dev/null; then
  echo -e "${GREEN}✓ $(pm2 -v)${NC}"
else
  echo -e "${YELLOW}未安装 → 正在安装...${NC}"
  npm install -g pm2
  echo -e "${GREEN}✓ PM2 安装完成${NC}"
fi

# ── 8. PM2 开机自启 ─────────────────────────────────
echo -n "PM2 开机自启 ... "
pm2 startup systemd -u "$USER" --hp "$HOME" 2>/dev/null || true
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} ✅ 环境安装完成${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# ── 下一步指引 ──────────────────────────────────────
echo "📋 接下来手动完成以下步骤:"
echo ""
echo "  1. 克隆项目:"
echo "     git clone <你的仓库地址> && cd Pixbook"
echo ""
echo "  2. 配置 .env:"
echo "     cp .env.example packages/server/.env"
echo "     vim packages/server/.env"
echo ""
echo "     以下占位符必须修改:"
echo "       DATABASE_URL   → MySQL 连接信息（含密码）"
echo "       JWT_SECRET     → openssl rand -hex 32 生成"
echo "       WX_APP_ID      → 微信公众平台 AppID"
echo "       WX_APP_SECRET  → 微信公众平台 AppSecret"
echo "       ADMIN_PASSWORD → 管理后台登录密码"
echo ""
echo "  3. 初始化数据库:"
echo "     pnpm --filter @pixbook/server db:migrate"
echo "     pnpm --filter @pixbook/server db:seed"
echo ""
echo "  4. 一键部署:"
echo "     bash deploy.sh"
