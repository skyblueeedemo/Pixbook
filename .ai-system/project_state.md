# 项目状态 · Project State

> 最后更新：2026-05
> 当前阶段：Phase 0 — 项目初始化

---

## 基本信息

| 字段 | 值 |
|------|-----|
| 项目名称 | 修图约 · Pixbook |
| 项目根路径 | `E:\SkyblueeeDemo\Pixbook` |
| 仓库地址 | `git@github.com:skyblueeedemo-0215/Pixbook.git` |
| 技术栈 | uni-app (Vue 3/TS) + NestJS (Node.js) + Prisma + MySQL + Redis |
| 部署方式 | 本地开发 → 微信开发者工具预览 → 微信公众平台审核上线 |

---

## 当前阶段

**Phase 0 — 项目初始化**

## 当前模块

项目骨架搭建（monorepo + uni-app + NestJS + Prisma + Docker Compose）

## 当前活跃任务

- [x] 初始化 pnpm monorepo 工程 (`pnpm-workspace.yaml` + root `package.json`)
- [x] 创建 `apps/miniprogram`（uni-app）、`apps/admin`（Vue 3 Web）、`packages/server`（NestJS）
- [ ] 微信公众平台注册小程序，获取 AppID / AppSecret（需开发者自行注册）
- [x] 编写 Prisma schema（schedules / orders / config / users 四张表 + seed）
- [x] 配置 Docker Compose（MySQL 8 + Redis 7）
- [x] 配置 Prettier + TypeScript（ESLint 待 `pnpm install` 后配置）

## 阻断项

- 微信 AppID / AppSecret 尚未获取：`apps/miniprogram/src/manifest.json` 中 `wxREPLACE_ME` 和 `.env.example` 中 `WX_APP_ID` / `WX_APP_SECRET` 需替换为真实值

## 近期决策

1. 前端日历组件借鉴 cal.com Booker 的 `useAvailableSlots` 设计模式
2. 后端排期算法借鉴 Easy!Appointments 的 availability generation 思路
3. 并发控制采用乐观锁 + 数据库事务方案（非 Redis 分布式锁）

## 下一步计划

完成 Phase 0 工程骨架 → 进入 Phase 1 核心后端开发
