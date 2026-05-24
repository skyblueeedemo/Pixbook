# 当前任务 · Current Tasks

> 阶段：Phase 1 核心后端（已完成） → Phase 2 小程序
> 最后更新：2026-05-24

---

## ✅ 已完成（Phase 0 + 1）

### 基础工程
- [x] 初始化 pnpm monorepo（pnpm workspace）
- [x] 创建 `apps/miniprogram`（uni-app）、`apps/admin`（Vue 3 Web）、`packages/server`（NestJS）
- [x] 微信公众平台注册小程序，获取 AppID / AppSecret，已填入 env
- [x] 配置 Prettier + TypeScript 严格模式
- [ ] ESLint + GitHub Actions（延后）
- [ ] PR 模板（单人项目延后）

### 数据库
- [x] 编写 Prisma schema（schedules / orders / config / users 四张表）
- [x] 编写初始 seed 数据（默认配置项）
- [x] 本地 Docker Compose：MySQL 8 + Redis 7
- [x] Migration + seed 执行成功

### 后端 API（Phase 1）
- [x] `GET /api/schedule/calendar` — 排期日历，5 种状态，Redis 缓存
- [x] `POST /api/order/submit` — 乐观锁 + 幂等提交，并发安全
- [x] `PATCH .../cancel` — 订单取消，释放名额
- [x] `POST /api/admin/login` — JWT 鉴权
- [x] `GET /api/admin/config` — 管理后台配置
- [x] 单元测试 17 个（OrderService 7 + ScheduleService 10）
- [x] 并发压测 10 并发零超卖

---

## 🔴 待完成（Phase 2 — 小程序）

### 用户端小程序
- [ ] 微信开发者工具编译 `dist/dev/mp-weixin`
- [ ] 日历组件 UI（`pages/index`）
- [ ] 预约表单页面（表单校验 + 提交）
- [ ] 预约成功页（`pages/success`）
- [ ] 订单查询页（`pages/query`）
- [ ] 微信登录按钮 + 授权流程
- [ ] 真机预览（iOS + Android）

### 管理后台 Web
- [ ] 登录页 UI
- [ ] 订单列表 + 筛选
- [ ] 订单详情 + 状态流转
- [ ] 配置管理页面

---

## 本周目标（Phase 2 启动）

- [ ] `pnpm dev:mp` 编译通过
- [ ] 微信开发者工具打开项目
- [ ] 日历页面渲染
- [ ] 完成预约表单前端逻辑
