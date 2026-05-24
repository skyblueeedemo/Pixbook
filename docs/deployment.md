# 部署指南 · Deployment Guide

## 前置条件

- 云服务器（推荐 2C4G，Ubuntu 22.04）或本地 Windows/macOS
- 域名 + SSL 证书（或用云服务商提供的免费证书）
- Node.js 24+、pnpm 9+、Docker & Docker Compose

---

## 1. 环境变量配置

### 1.1 后端 `.env`

复制 `packages/server/.env` 并修改：

```env
# ── 数据库（生产环境改密码）
DATABASE_URL="mysql://root:STRONG_PASSWORD@localhost:3306/pixbook"

# ── Redis
REDIS_URL="redis://localhost:6379"

# ── JWT（生成随机 64 字符：openssl rand -hex 32）
JWT_SECRET="<RANDOM_64_CHAR_STRING>"

# ── 微信小程序（从公众平台获取）
WX_APP_ID="wxYOUR_APPID"
WX_APP_SECRET="YOUR_APPSECRET"

# ── 管理员
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="<STRONG_PASSWORD>"

# ── 服务端口
PORT=3000
```

### 1.2 小程序配置

修改 `apps/miniprogram/src/manifest.json`：

```json
{
  "mp-weixin": {
    "appid": "wxYOUR_APPID"
  }
}
```

修改 `apps/miniprogram/src/api/request.ts`：

```ts
const BASE_URL = 'https://api.your-domain.com/api';
```

---

## 2. 数据库初始化

```bash
# 启动 MySQL + Redis
docker compose up -d

# 运行迁移
pnpm --filter @pixbook/server db:migrate

# 种子数据
pnpm --filter @pixbook/server db:seed
```

---

## 3. 构建与启动

### 3.1 后端

```bash
cd packages/server
pnpm build
node dist/main.js
# 或使用 PM2
pm2 start dist/main.js --name pixbook-api
```

### 3.2 管理后台

```bash
cd apps/admin
pnpm build
# 产物在 dist/ 下，部署到 Nginx 静态目录
```

### 3.3 小程序

在微信开发者工具中点击**上传**，提交到微信公众平台审核。

---

## 4. Nginx 反向代理

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate     /etc/ssl/cert.pem;
    ssl_certificate_key /etc/ssl/key.pem;

    # ── 管理后台（静态文件）────────────────────
    location / {
        root /var/www/pixbook-admin;
        try_files $uri $uri/ /index.html;
    }

    # ── API 代理 ──────────────────────────────
    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 5. 微信小程序配置

在微信公众平台 → 开发管理 → 开发设置：

| 配置项 | 值 |
|--------|-----|
| 服务器域名 → request合法域名 | `https://api.your-domain.com` |
| 服务器域名 → socket合法域名 | 同上（如用 WebSocket） |

---

## 6. 检查清单

- [ ] `.env` 中所有 `change-me` / `REPLACE_ME` 已替换
- [ ] JWT_SECRET 为随机强密码
- [ ] WX_APP_SECRET 已配置且不暴露到前端
- [ ] 数据库密码已改为强密码
- [ ] SSL 证书已配置
- [ ] Nginx 已重启
- [ ] 小程序合法域名已配置
- [ ] 管理后台可正常登录
- [ ] 小程序真机访问正常
