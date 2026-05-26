#!/bin/bash
# ============================================================
# Pixbook 域名 + SSL + Nginx 一键配置
# 系统：Ubuntu
# 用法: bash setup-domain.sh pixbook.top
# ============================================================
set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN="${1:-}"

if [ -z "$DOMAIN" ]; then
  echo -n "请输入域名（如 pixbook.top）: "
  read -r DOMAIN
fi

if [ -z "$DOMAIN" ]; then
  echo -e "${RED}✗ 域名不能为空${NC}"
  exit 1
fi

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} Pixbook 域名配置: ${DOMAIN}${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""

# ── 前置检查：阿里云安全组 ─────────────────────
echo -e "${YELLOW}⚠ 请确认阿里云 ECS 安全组已开放以下入方向端口：${NC}"
echo "   协议: TCP  端口: 80   来源: 0.0.0.0/0"
echo "   协议: TCP  端口: 443  来源: 0.0.0.0/0"
echo "   协议: TCP  端口: 22   来源: 0.0.0.0/0"
echo ""
echo -n "安全组已确认开放？(y/n): "
read -r CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
  echo "请先开放端口后再运行此脚本。"
  exit 1
fi

# ── 1. 安装依赖 ──────────────────────────────────
echo ""
echo "📦 安装 certbot + 依赖..."
sudo apt update -qq
sudo apt install -y -qq nginx certbot python3-certbot-nginx

# ── 2. 开放本地防火墙 ────────────────────────────
echo "🔓 开放 iptables 80/443..."
sudo iptables -I INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || true
sudo iptables -I INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || true
sudo ufw allow 80/tcp 2>/dev/null || true
sudo ufw allow 443/tcp 2>/dev/null || true

# ── 3. 确保 Nginx 运行 ───────────────────────────
echo "🌐 启动 Nginx..."
sudo systemctl start nginx 2>/dev/null || true
sudo systemctl enable nginx 2>/dev/null || true

# ── 4. 创建 Nginx 配置（反向代理 + 管理后台） ─────
echo "📝 写入 Nginx 配置..."
sudo tee /etc/nginx/sites-available/pixbook > /dev/null <<NGINX
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN};
    return 301 https://\$host\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name ${DOMAIN} www.${DOMAIN};

    ssl_certificate     /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        root /var/www/pixbook-admin;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
}
NGINX

# ── 5. 启用配置 ───────────────────────────────────
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/pixbook /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# ── 6. 申请 SSL 证书 ─────────────────────────────
echo ""
echo "🔐 申请 SSL 证书..."
sudo certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}" --non-interactive --agree-tos --email "admin@${DOMAIN}" --redirect 2>/dev/null || \
sudo certbot --nginx -d "${DOMAIN}" -d "www.${DOMAIN}"

# ── 7. 创建管理后台目录 ──────────────────────────
sudo mkdir -p /var/www/pixbook-admin

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN} ✅ 域名配置完成${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "🔗 访问地址:"
echo "   https://${DOMAIN}          ← 管理后台"
echo "   https://${DOMAIN}/api      ← 后端 API"
echo ""
echo "📋 下一步:"
echo "   1. 部署管理后台: pnpm build:admin && sudo cp -r apps/admin/dist/* /var/www/pixbook-admin/"
echo "   2. 微信公众平台 → 开发设置 → request合法域名: https://${DOMAIN}"
echo "   3. SSL 90 天自动续期（certbot renew 已自动配置）"
