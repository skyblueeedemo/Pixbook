# 项目状态 · Project State

> 最后更新：2026-05-24
> 当前阶段：Phase 1 核心后端 ✅ → Phase 2 小程序

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

**Phase 1 — 核心后端（已完成）**

## 当前模块

后端 5 个模块全部编码完成并测试通过：
- `schedule` — 排期日历 API（5 种状态 / 休息日 / Redis 缓存）
- `order` — 订单提交（乐观锁 / 幂等 / 并发安全）
- `wechat` — 微信登录（code → openid）
- `config` — 管理后台配置 CRUD
- `auth` — JWT 鉴权 Guard

## 测试覆盖

| 层级 | 结果 |
|------|------|
| 单元测试 | 17 个全过（OrderService 7 + ScheduleService 10） |
| 并发压测 | 10 并发，零超卖 ✅ |
| API 验证 | 6 个核心端点全部通过 curl 测试 |
| TypeScript | 零类型错误 |

## 当前活跃任务

- [x] 后端模块 scaffold（5 个模块 controller/service/DTO）
- [x] 乐观锁并发控制（INSERT IGNORE + UPDATE WHERE version）
- [x] 日历 API（时区修复 / UTC 零点 / Redis 缓存）
- [x] 管理后台登录 + JWT 鉴权
- [x] 订单取消 + 名额释放
- [x] 单元测试 + 并发压测
- [ ] ESLint + GitHub Actions CI（仍待配置）
- [ ] 微信登录真机联调（需微信开发者工具）
- [ ] 管理后台前端开发
- [ ] 小程序编译 + 真机预览

## 近期决策

1. **D001** — uni-app (Vue 3/TS) 全家桶
2. **D002** — NestJS 模块化后端
3. **D003** — 乐观锁并发控制（非 Redis 锁）
4. **D004** — 日历借鉴 cal.com Booker 的可用性状态机
5. **D005** — 排期算法借鉴 Easy!Appointments
6. **D006** — pnpm `shamefully-hoist=true` 解决 monorepo CLI 二进制问题
7. **D007** — 日历查询使用 UTC 零点 ISO 字符串避免时区偏移
8. **D008** — raw SQL INSERT IGNORE 需显式填充 `created_at`/`updated_at`

## 下一步计划

Phase 2 — 小程序客户端开发（第 4–5 周）
