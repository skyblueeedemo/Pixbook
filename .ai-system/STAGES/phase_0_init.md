# Phase 0 · 项目初始化

> 时间：第 1 周
> 目标：搭建工程骨架，统一开发环境，所有成员能本地跑通 Hello World
> 状态：🟢 已完成（2026-05-24）

---

## 任务清单

### 基础工程
- [x] 初始化 pnpm monorepo（pnpm workspace）
- [x] 创建 `apps/miniprogram`（uni-app）、`apps/admin`（Vue 3 Web）、`packages/server`（NestJS）
- [ ] uni-app 初始化：`npx degit dcloudio/uni-preset-vue#vite-ts miniprogram` — 改为手动创建文件
- [x] 微信公众平台注册小程序，获取 AppID / AppSecret，填入 `manifest.json`
- [x] 配置 Prettier + TypeScript 严格模式
- [ ] ESLint + GitHub Actions（延后到 Phase 2）
- [ ] PR 模板（单人项目暂不需要）

### 数据库
- [x] 编写 Prisma schema（schedules / orders / config / users 四张表）
- [x] 编写初始 seed 数据（默认配置项）
- [x] 本地 Docker Compose：MySQL 8 + Redis 7

### 规范约定
- [x] Git 分支策略：`master`（单分支开发）
- [x] Commit message 规范：`feat:` / `fix:` / `test:` / `docs:` / `chore:`
- [ ] PR 模板

---

## 交付物

| 交付物 | 验收标准 | 状态 |
|--------|---------|:--:|
| 可运行的项目骨架 | `pnpm dev` 三端启动无报错 | ✅ |
| docker-compose.yml | `docker compose up -d` MySQL + Redis 可用 | ✅ |
| Prisma schema + migration | `pnpm db:migrate` 建表成功 | ✅ |
| 后端 API 可访问 | `GET /api/schedule/calendar` 返回数据 | ✅ |
| 管理后台可访问 | `http://localhost:5173` 渲染页面 | ✅ |

> 注：基本完成了 Phase 1 的核心后端编码，实际进度超前于原计划。
