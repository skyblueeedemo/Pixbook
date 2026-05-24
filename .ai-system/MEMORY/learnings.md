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

## Phase 2 小程序开发

### L006 · uni-app 依赖版本必须全部一致

**发现：** `@dcloudio/uni-*` 系列包版本号格式为 `M.m.p-YYYYMMDDNNNNNNN`，不同次发布的包内部 API 不兼容。混用 v2 和 v3 alpha 版本导致 `global.uniPlugin` undefined 错误。

**解决：** 使用 `npx degit dcloudio/uni-preset-vue#vite-ts` 拉取官方模板，复制其 `package.json` 中的全部精确版本号 (`3.0.0-4080420251103001`)。

**教训：** uni-app 生态不是 semver — 版本号中的日期编码（4080420251103001 = 2025-11-03 build）至关重要。永远整批替换，不单独升级某个包。

---

### L007 · 微信小程序 CSS：scoped / rpx / flexbox 是三大坑

**发现：**
- `scoped` 样式编译后残留 `data-v-xxx` 属性，选择器无法匹配
- `rpx` 单位在 `inline-block` + `%` 宽度的网格中计算异常
- `flexbox` 在微信原生组件中的表现与 web 不一致

**解决：** 全部放弃，改用全局 `<style>` + `px` + `inline-block`。

**教训：** 微信小程序的渲染引擎不是浏览器 — 它是一个简化的 native 渲染层，CSS 支持是子集。用最古老、最简单的 CSS 写法最稳。

---

### L008 · 微信 `input` 是原生组件，不认 padding

**发现：** 微信的 `input`/`textarea` 是原生控件，不是 HTML 元素。`padding`、`border` 等属性渲染不完全，导致输入框内文字显示为半截。

**解决：** 外层 `<view>` 画边框 + padding，内层 `<input>` 设为无边框 + `height:44px` + `line-height:44px`。

**教训：** 凡是碰到输入框样式问题，第一时间想到"原生组件限制"，外层包容器是标准 workaround。

---

### L009 · 真机预览：localhost 在手机上不存在

**发现：** 微信开发者工具模拟器可以 `localhost:3000`，但扫码真机预览时手机的 `localhost` 指向手机自身。

**解决：** 改用电脑的局域网 IP (`192.168.31.191`)，手机和电脑连同一个 WiFi。

**教训：** 开发阶段维护两个 base URL 切换：`localhost`（模拟器）和 `192.168.x.x`（真机）。上线后全部换成正式域名。

---

## Phase 3 管理后台

### L010 · NestJS ValidationPipe 不会自动转换查询参数类型

**发现：** Express 的 `req.query` 中所有值都是字符串。即使 ValidationPipe 开启了 `transform: true`，`@IsInt()` 校验仍会因收到 `"1"` (string) 而非 `1` (number) 而返回 400。

**解决：** 添加 `transformOptions: { enableImplicitConversion: true }`，NestJS 自动将字符串查询参数转为 DTO 声明的类型。

**教训：** 碰到 400 + validation error 但参数明显正确时，先怀疑类型转换。

---

---

### L011 · Prisma 不会接受 MySQL 的 `0000-00-00` 日期

**发现：** INSERT IGNORE 没有显式 `updated_at` → MySQL 填入 `0000-00-00 00:00:00.000` → Prisma 读取时抛出 "Value out of range"。

**解决：** 删除坏行，确保所有 INSERT 都提供 `NOW()`。

**教训：** 不要手动 `INSERT IGNORE` Prisma 管理的表 — 用 Service 层的 `upsert`。

---

### L012 · 多个配置 key 命名不一致导致静默失败

**发现：** `booking_range_days` vs `booking_days` vs `bookingDays` 三处不一致，导致配置页读取空白、预约约束不生效。三个地方各自用各自的命名，没有报错只有静默的数据不匹配。

**解决：** 统一为 `booking_days`，DB key / service field / API field / frontend field 全部对齐。

**教训：** 新增配置项时先 grep 确认 key 的唯一性，在一处定义、多处引用。

---

## 待记录

_随着开发推进，在此记录：_
- 订阅消息推送调试
- 小程序审核经验
- 部署上线流程
