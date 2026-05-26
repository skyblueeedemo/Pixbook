# 部署指南 · Deployment Guide

## 概述

本项目提供三个脚本，从新服务器到上线三步完成：

```
setup-env.sh  →  setup-domain.sh  →  deploy.sh
  环境安装         域名+SSL+Nginx       代码部署
```

---

## 前置条件

- 云服务器（推荐 Ubuntu 22.04/24.04，2C4G）
- 一个域名（如 `pixbook.top`），DNS A 记录已指向服务器 IP
- 阿里云/腾讯云安全组已开放 80 / 443 端口（脚本会提示确认）

---

## 第一步：环境安装

```bash
git clone <仓库地址> && cd Pixbook
bash setup-env.sh
```

自动安装：Git / Node.js 24 / pnpm / MySQL 8 / Redis / Nginx / PM2，并自动创建数据库和用户。

## 第二步：域名 + HTTPS

```bash
bash setup-domain.sh 你的域名.com
```

自动完成：
- Nginx 反向代理（`/api` → NestJS:3000）
- 管理后台静态文件（`/` → `/var/www/pixbook-admin`）
- Let's Encrypt SSL 证书（90 天自动续期）
- HTTP → HTTPS 强制跳转
- iptables/ufw 端口开放

## 第三步：代码部署

```bash
# 配置 .env
cp .env.example packages/server/.env
vim packages/server/.env   # 改 DATABASE_URL / JWT_SECRET / WX_APP_ID 等

# 部署
bash deploy.sh
```

## 第四步：部署管理后台

```bash
pnpm build:admin
sudo cp -r apps/admin/dist/* /var/www/pixbook-admin/
```

## 第五步：小程序配置

1. 微信公众平台 → 开发设置 → request合法域名 → `https://你的域名`
2. 本地 `git pull && pnpm build:mp`
3. 微信开发者工具打开 `apps/miniprogram/dist/build/mp-weixin` → 上传

---

## 常见问题

### 阿里云安全组端口不通

症状：`curl http://域名` 超时。  
确认 ECS 控制台 → 安全组 → 入方向规则包含 TCP 80/443。

### MySQL `sha256_password` 认证失败

`setup-env.sh` 已自动处理（`mysql_native_password`），如果手动安装 MySQL 后再跑一次即可修复。

### certbot 验证超时

80 端口被阿里云安全组拦截，开放后重跑 `setup-domain.sh`。

### PM2 找不到 script

`ecosystem.config.js` 中 `cwd` 已设为 `packages/server`，`script` 相对路径为 `dist/main.js`，不可叠加。

---

## 部署脚本清单

| 脚本 | 用途 | 运行频率 |
|------|------|--------|
| `setup-env.sh` | 新服务器环境安装 | 一次性 |
| `setup-domain.sh` | 域名 + SSL + Nginx | 一次性 |
| `deploy.sh` | 代码更新部署 | 每次发布 |
