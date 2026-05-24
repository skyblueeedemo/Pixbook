# Phase 1 · 核心后端

> 时间：第 2–3 周
> 目标：实现全部 P0 级 API，并发安全，可独立通过接口测试
> 状态：🟢 已完成（2026-05-24）

---

## 模块拆解

### 模块 1：配置服务 ✅

| 任务 | 说明 | 状态 |
|------|------|:--:|
| `GET /api/admin/config` | 返回全局配置 | ✅ |
| `GET /api/admin/config` (auth) | JWT Guard 保护 | ✅ |
| PUT 更新配置 | ConfigService.updateConfig() | ⚪ 代码已写，未测试 |
| 特定日期名额覆盖 | — | ⚪ 未实现 |

### 模块 2：排期日历 API ✅

| 任务 | 说明 | 状态 |
|------|------|:--:|
| `GET /api/schedule/calendar` | 生成未来 N 天状态数组 | ✅ |
| 5 种状态判定 | available / almost_full / full / unavailable / rest | ✅ |
| Redis 缓存层 | TTL 60s，写操作 `DEL calendar:*` 主动失效 | ✅ |
| 时区修复 | UTC 零点 ISO 字符串，避免时区偏移 | ✅ |
| 单元测试 | 10 个测试覆盖 | ✅ |

### 模块 3：订单提交 API ✅

| 任务 | 说明 | 状态 |
|------|------|:--:|
| `POST /api/order/submit` | 乐观锁 + 幂等提交 | ✅ |
| INSERT IGNORE | 确保 schedule 行存在 | ✅ |
| 乐观锁 UPDATE | `WHERE version = ? AND booked_slots < max_slots` | ✅ |
| 并发冲突重试 | 自动重试 1 次 | ✅ |
| 幂等键 | 同一 key 重复请求返回原订单 | ✅ |
| 重复手机号检测 | 同手机号同日期拒绝 | ✅ |
| 并发压测 | 10 并发，零超卖 ✅ | ✅ |
| 单元测试 | 7 个测试覆盖 | ✅ |
| `PATCH /api/order/.../cancel` | 取消释放名额 | ✅ |

### 模块 4：微信登录 ⚪

| 任务 | 说明 | 状态 |
|------|------|:--:|
| `POST /api/wechat/login` | code → openid → session_key | ⚪ 代码已写，待真机联调 |
| users 表创建/查询 | openid 自动建档 | ⚪ 同上 |

### 模块 5：管理员鉴权 ✅

| 任务 | 说明 | 状态 |
|------|------|:--:|
| `POST /api/admin/login` | 账号密码 → JWT | ✅ |
| JWT Guard | 保护 `/api/admin/*` | ✅ |

---

## Bug 修复记录

| # | 问题 | 修复 | 影响范围 |
|---|------|------|---------|
| 1 | `as never` TypeScript 类型错误 | → `(req as any).user` | auth.guard.ts |
| 2 | `dayjs` import CJS 不兼容 | → `import * as dayjs` | schedule.service.ts |
| 3 | config key 驼峰/蛇形混用 | → `rest_days_of_week` | schedule.service.ts |
| 4 | ConfigModule 未导入 AuthModule | → `imports: [AuthModule]` | config.module.ts |
| 5 | 日历查询 Date 时区偏移一天 | → UTC 零点 ISO 字符串 | schedule.service.ts |
| 6 | INSERT IGNORE 缺 `created_at`/`updated_at` | → 显式填充 `NOW()` | order.service.ts |
| 7 | `pnpm --filter` 脚本名冒号冲突 | → 重命名为 `db:*` | package.json |

---

## 交付物

| 交付物 | 验收标准 | 状态 |
|--------|---------|:--:|
| 全部 P0 API | curl 测试全部通过 | ✅ (6/6) |
| 单元测试 | ≥ 70% 覆盖（service 层） | ✅ (17 tests) |
| 并发测试报告 | 零超卖 | ✅ (10 并发) |
| 类型检查 | `tsc --noEmit` 零错误 | ✅ |
| Postman Collection | — | ⬜ 延后 |
