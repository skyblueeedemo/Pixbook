# 经验教训 · Learnings

> 记录开发过程中的技术发现和最佳实践

---

## 项目启动阶段

### L001 · PRD 先行的重要性

**发现：** 本项目先完成完整 PRD + 开发实施文档再开始编码，技术决策有理有据

**教训：** 需求文档不是"写完就丢"的产物 — Dev Spec 中的 API 设计、数据库 schema、组件树结构直接指导编码，减少架构返工

---

## Phase 1 后端开发

### L002 · pnpm monorepo 的 CLI 二进制陷阱

**发现：** 在 pnpm workspace 中，子包的 `devDependencies` 中的 CLI 工具（如 `prisma`）不会被 hoist 到根 `node_modules/.bin`。`pnpm --filter pkg script` 执行时找不到命令。

**解决：** 添加 `.npmrc` 配置 `shamefully-hoist=true`，或使用 `npx prisma` 代替 `prisma`。

**教训：** 在 monorepo 根目录直接跑 `pnpm exec <cmd>` 而非 `pnpm --filter pkg <cmd>`，避免二进制路径问题。

---

### L003 · `@db.Date` 的时区坑

**发现：** Prisma 的 `@db.Date`（MySQL DATE 类型）在比较 `dayjs().toDate()` 时，会因为本地时区（UTC+8）产生 8 小时偏移，导致日期查不到相邻日期的数据。

**解决：** 使用 UTC 零点 ISO 字符串构建 Date：`new Date('2026-05-25T00:00:00.000Z')`。

**教训：** 涉及 DATE 类型的 `gte`/`lte` 查询，始终使用 UTC 零点，避免时区隐式转换。

---

### L004 · Prisma `@default` 和 `@updatedAt` 不适用于 raw SQL

**发现：** Prisma schema 中定义的 `@default(now())` 和 `@updatedAt` 只在 Prisma Client 操作时生效。raw SQL（`$executeRaw`）不会触发这些，导致 `created_at`/`updated_at` 列可能为无效日期值。

**解决：** raw SQL 中显式写入 `NOW()`。

**教训：** 使用 raw SQL 时，所有 Prisma 自动字段必须手动处理。

---

### L005 · NestJS Guard 依赖注入要求导入提供模块

**发现：** 在 Controller 上使用 `@UseGuards(AuthGuard)` 时，如果 AuthGuard 依赖 `JwtService`，当前 Module 必须导入提供 `JwtService` 的 `AuthModule`（或 `JwtModule`），否则 NestJS 无法解析 Guard 的依赖。

**解决：** `ConfigModule` 显式 `imports: [AuthModule]`。

**教训：** Guard 不是完全解耦的 — 它的 DI 依赖需要在使用方模块的 import 链上可达。

---

## 待记录

_随着开发推进，在此记录：_
- 小程序开发踩坑（wx.login / openid / 订阅消息 / 审核）
- uni-app 兼容性问题
- 并发测试调优经验
