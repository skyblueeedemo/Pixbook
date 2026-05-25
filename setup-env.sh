#!/bin/bash
# ============================================================
# Pixbook 环境安装脚本
# 支持：宝塔面板 / Ubuntu 裸机
# 用法: bash setup-env.sh
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} Pixbook 环境检测 & 安装${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# ── 检测是否宝塔环境 ────────────────────────────
IS_BT=false
if [ -f /www/server/panel/data/port.pl ] || command -v bt &>/dev/null; then
  IS_BT=true
  echo -e "${YELLOW}检测到宝塔面板环境${NC}"
else
  echo -e "${YELLOW}检测到 Ubuntu/Debian 裸机环境${NC}"
fi
echo ""

# ── 1. Node.js 24+ ──────────────────────────────────
echo -n "Node.js ... "
if command -v node &>/dev/null; then
  NODE_VER=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VER" -ge 24 ]; then
    echo -e "${GREEN}✓ $(node -v)${NC}"
  else
    echo -e "${RED}✗ $(node -v)（需要 ≥24）${NC}"
    exit 1
  fi
else
  echo -e "${RED}✗ 未安装${NC}"
  echo "  安装: curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash - && sudo apt install -y nodejs"
  exit 1
fi

# ── 2. pnpm ─────────────────────────────────────────
echo -n "pnpm ... "
if command -v pnpm &>/dev/null; then
  echo -e "${GREEN}✓ $(pnpm -v)${NC}"
else
  echo -e "${YELLOW}未安装 → 正在安装...${NC}"
  npm install -g pnpm
  echo -e "${GREEN}✓ pnpm $(pnpm -v) 安装完成${NC}"
fi

# ── 3. MySQL ────────────────────────────────────────
echo -n "MySQL ... "
if command -v mysql &>/dev/null || [ -f /www/server/mysql/bin/mysql ]; then
  echo -e "${GREEN}✓ 已安装${NC}"
  if [ "$IS_BT" = true ]; then
    echo "  宝塔管理 → 数据库 → 创建 pixbook 库"
  fi
else
  echo -e "${RED}✗ 未安装${NC}"
  if [ "$IS_BT" = true ]; then
    echo "  宝塔 → 软件商店 → 搜索 MySQL 8 → 安装"
  else
    echo "  sudo apt install -y mysql-server"
  fi
  exit 1
fi

# ── 4. Redis ────────────────────────────────────────
echo -n "Redis ... "
if command -v redis-cli &>/dev/null || [ -f /www/server/redis/src/redis-cli ]; then
  echo -e "${GREEN}✓ 已安装${NC}"
else
  echo -e "${YELLOW}未安装${NC}"
  if [ "$IS_BT" = true ]; then
    echo "  宝塔 → 软件商店 → 搜索 Redis → 安装"
  else
    echo -n "  正在安装 Redis ... "
    sudo apt update -qq && sudo apt install -y -qq redis-server
    sudo systemctl enable redis-server
    sudo systemctl start redis-server
    echo -e "${GREEN}✓${NC}"
  fi
fi

# ── 5. PM2 ──────────────────────────────────────────
echo -n "PM2 ... "
if command -v pm2 &>/dev/null; then
  echo -e "${GREEN}✓ $(pm2 -v)${NC}"
else
  echo -e "${YELLOW}未安装 → 正在安装...${NC}"
  npm install -g pm2
  echo -e "${GREEN}✓ PM2 安装完成${NC}"
fi

# ── 6. Nginx ────────────────────────────────────────
echo -n "Nginx ... "
if command -v nginx &>/dev/null || [ -f /www/server/nginx/sbin/nginx ]; then
  echo -e "${GREEN}✓ 已安装${NC}"
else
  echo -e "${YELLOW}未安装${NC}"
  if [ "$IS_BT" = true ]; then
    echo "  宝塔 → 软件商店 → 搜索 Nginx → 安装"
  else
    echo -n "  正在安装 Nginx ... "
    sudo apt update -qq && sudo apt install -y -qq nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    echo -e "${GREEN}✓${NC}"
  fi
fi

# ── 7. PM2 开机自启 ─────────────────────────────────
echo -n "PM2 开机自启 ... "
pm2 startup 2>/dev/null || echo -n ""
pm2 save 2>/dev/null || echo -n ""
echo -e "${GREEN}✓${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} ✅ 环境检测完成${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# ── 提示 Git 配置 ──────────────────────────────────
if ! command -v git &>/dev/null; then
  echo -e "${YELLOW}⚠ Git 未安装，请执行: sudo apt install -y git${NC}"
fi

# ── 下一步指引 ──────────────────────────────────────
echo "下一步:"
echo "  1. 克隆项目:"
echo "     git clone <你的仓库地址> && cd Pixbook"
echo ""
echo "  2. 配置环境变量:"
echo "     cp .env.example packages/server/.env"
echo "     vim packages/server/.env"
echo ""
echo "  3. 手动修改 .env 中的以下占位符:"
echo "     · DATABASE_URL    — MySQL 密码"
echo "     · JWT_SECRET      — 运行 openssl rand -hex 32 生成"
echo "     · WX_APP_ID       — 微信公众平台 AppID"
echo "     · WX_APP_SECRET   — 微信公众平台 AppSecret"
echo "     · ADMIN_USERNAME  — 管理后台登录账号"
echo "     · ADMIN_PASSWORD  — 管理后台登录密码"
echo ""
echo "  4. 初始化数据库:"
echo "     pnpm --prefix packages/server db:migrate"
echo "     pnpm --prefix packages/server db:seed"
echo ""
echo "  5. 部署上线:"
echo "     ./deploy.sh"
