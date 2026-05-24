# Phase 0 · 项目初始化

> 时间：第 1 周
> 目标：搭建工程骨架，统一开发环境，所有成员能本地跑通 Hello World
> 状态：🔴 进行中

---

## 任务清单

### 基础工程
- [ ] 初始化 pnpm monorepo（pnpm workspace）
- [ ] 创建 `apps/miniprogram`（uni-app）、`apps/admin`（Vue 3 Web）、`packages/server`（NestJS）
- [ ] uni-app 初始化：`npx degit dcloudio/uni-preset-vue#vite-ts miniprogram`
- [ ] 微信公众平台注册小程序，获取 AppID / AppSecret，填入 `manifest.json`
- [ ] 配置 ESLint + Prettier + TypeScript 严格模式
- [ ] 配置 GitHub Actions：PR 自动 lint + 类型检查

### 数据库
- [ ] 编写 Prisma schema（schedules / orders / config / users 四张表）
- [ ] 编写初始 seed 数据（默认配置项）
- [ ] 本地 Docker Compose：MySQL 8 + Redis 7

### 规范约定
- [ ] Git 分支策略：`main`（生产）/ `dev`（集成）/ `feat/*`（功能）
- [ ] Commit message 规范：`feat(orders): ...` / `fix(calendar): ...`
- [ ] PR 模板：变更说明 + 自测检查项 + 截图

---

## 交付物

| 交付物 | 验收标准 |
|--------|---------|
| 可运行的空项目骨架 | `pnpm dev` 三端均启动无报错 |
| docker-compose.yml | `docker compose up -d` MySQL + Redis 可用 |
| Prisma schema + migration | `pnpm prisma migrate dev` 建表成功 |
| 微信开发者工具预览 | 空白小程序可预览 |
| README.md | 包含本地启动步骤 |

---

## 技术参考

- [Dev Spec § Phase 0](dev-rpd-md/修图约-Pixbook_Dev_V1.0_小程序版.md)
- [PRD § 技术架构建议](dev-rpd-md/修图约-Pixbook_PRD_V1.0.md)
