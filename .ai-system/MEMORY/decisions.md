# 技术决策记录 · Decisions

> 格式：日期 | 决策 | 理由 | 替代方案

---

## 2026-05 · 项目启动决策

### D001 · 前端框架：uni-app

**决策：** 使用 uni-app (Vue 3 + TypeScript) 开发微信小程序客户端

**理由：**
- 微信小程序原生开发维护成本高，uni-app 支持一套代码多端编译
- Vue 3 Composition API 与 PRD 中的 composable 设计（useCalendar / useBooking）天然匹配
- 生态成熟，uni-ui 组件库可直接使用

**替代方案：** Taro (React) — 团队更熟悉 Vue，且 cal.com 的 hook 设计在 Vue 3 composable 中迁移更自然

---

### D002 · 后端框架：NestJS

**决策：** 使用 NestJS (Node.js) 构建后端

**理由：**
- 模块化架构天然支持 PRD 中的 schedule / order / config / auth / wechat 五大模块拆分
- Prisma ORM 集成成熟，TypeScript 类型安全
- 依赖注入 + Guard 机制适合 JWT 鉴权场景

**替代方案：** Express + Prisma — 轻量但缺少模块化约束，多模块项目后期维护成本高

---

### D003 · 并发控制：乐观锁

**决策：** 采用乐观锁 + 数据库事务（非 Redis 分布式锁）

**理由：**
- 修图预约场景并发冲突率低（非秒杀场景），乐观锁性能更好
- 无需引入 Redis 锁的复杂性和单点故障风险
- `UPDATE ... WHERE version = ? AND booked_slots < max_slots` 一条 SQL 原子完成

**替代方案：** Redis 分布式锁 — 重且过度设计；悲观锁 (SELECT ... FOR UPDATE) — 高并发下性能差

---

### D004 · 日历组件：借鉴 cal.com Booker

**决策：** 日历组件的状态管理借鉴 cal.com 的 `useAvailableSlots` hook 设计

**理由：**
- cal.com 的 slot state 映射（available / almost_full / full / unavailable）与 PRD 5 种状态高度对应
- 将可用性计算与 UI 渲染解耦，composable 可独立测试

**替代方案：** 从零设计 — 无需重新发明轮子

---

### D005 · 后端排期算法：借鉴 Easy!Appointments

**决策：** 排期可用性算法借鉴 Easy!Appointments 的 availability generation 思路

**理由：**
- Easy!Appointments 的 working plan 检查 + 已预约扣减逻辑成熟可靠
- 本项目将其从时间段制简化为名额制，核心思路不变

**替代方案：** 自行设计 — 边界场景容易遗漏
