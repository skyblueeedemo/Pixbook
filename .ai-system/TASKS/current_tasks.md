# 当前任务 · Current Tasks

> 阶段：Phase 0 — 项目初始化
> 最后更新：2026-05

---

## 基础工程

- [ ] 初始化 pnpm monorepo（pnpm workspace）
- [ ] 创建 `apps/miniprogram`（uni-app）、`apps/admin`（Vue 3 Web）、`packages/server`（NestJS）
- [ ] uni-app 项目初始化：`npx degit dcloudio/uni-preset-vue#vite-ts miniprogram`
- [ ] 微信公众平台注册小程序，获取 AppID / AppSecret
- [ ] 配置 ESLint + Prettier + TypeScript 严格模式
- [ ] 配置 GitHub Actions：PR 自动 lint + 类型检查

## 数据库

- [ ] 编写 Prisma schema（schedules / orders / config / users 四张表）
- [ ] 编写初始 seed 数据（默认配置项）
- [ ] 本地 Docker Compose：MySQL 8 + Redis 7

## 规范约定

- [ ] Git 分支策略：`main`（生产）/ `dev`（集成）/ `feat/*`（功能）
- [ ] Commit message 规范：`feat(orders): ...` / `fix(calendar): ...`
- [ ] PR 模板：变更说明 + 自测检查项 + 截图（UI 变更时）

---

## 本周目标

完成以上全部任务，所有人能本地跑通 Hello World。
