# 修图约 · Pixbook

> 修图服务预约排期系统 — 微信小程序版

## 项目简介

面向个人修图师和小型工作室的在线预约排期系统，解决人工排期混乱、超额接单、沟通成本高等痛点。

## 文档

| 文档 | 路径 |
|------|------|
| 产品需求文档 (PRD) | `dev-rpd-md/修图约-Pixbook_PRD_V1.0.md` |
| 开发实施文档 | `dev-rpd-md/修图约-Pixbook_Dev_V1.0_小程序版.md` |
| 客户端原型 | `dev-rpd-md/app_prototype_client_screens.html` |
| 管理端原型 | `dev-rpd-md/app_prototype_admin_screens.html` |

## 技术栈

| 层 | 技术 |
|----|------|
| 客户端小程序 | uni-app + Vue 3 + TypeScript |
| 管理后台 | Vue 3 + Vite + TypeScript + Tailwind CSS |
| 后端 | NestJS + Prisma ORM + MySQL 8 + Redis 7 |
| 部署 | Docker Compose / Nginx + PM2 |

## 快速开始

```bash
# 1. 安装依赖
pnpm install

# 2. 启动本地环境 (MySQL + Redis)
docker compose up -d

# 3. 初始化数据库
cd packages/server
pnpm prisma migrate dev
pnpm prisma db seed

# 4. 启动开发服务器
pnpm dev          # 后端 (http://localhost:3000)
pnpm dev:admin    # 管理后台 (http://localhost:5173)
pnpm dev:mp       # 小程序 (微信开发者工具打开 dist/dev/mp-weixin)
```

## 项目状态

🔴 **Phase 0 — 项目初始化**

详见 [`.ai-system/project_state.md`](.ai-system/project_state.md)

## 仓库

`git@github.com:skyblueeedemo-0215/Pixbook.git`
