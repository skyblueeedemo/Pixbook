# 错误记录 · Mistakes

## Phase 0

_项目初始化阶段较顺利，无重大错误记录。_

---

## Phase 1

### M001 · `as never` TypeScript 类型错误

**日期：** 2026-05-24
**错误描述：** `auth.guard.ts` 中 `req.user = payload` 报类型错误
**根因：** Express `Request` 类型上不存在 `user` 属性
**修正：** `(req as any).user = payload`

---

### M002 · `dayjs` import 方式错误

**日期：** 2026-05-24
**错误描述：** `import dayjs from 'dayjs'` 在 CJS 模式下报错
**根因：** NestJS 默认使用 CommonJS，`dayjs` 的默认导出不兼容
**修正：** `import * as dayjs from 'dayjs'`

---

### M003 · config key 驼峰/蛇形混用

**日期：** 2026-05-24
**错误描述：** schedule service 查询 `restDaysOfWeek` 返回 undefined
**根因：** seed 数据用蛇形 `rest_days_of_week`，代码用驼峰
**修正：** 统一改为 `rest_days_of_week`

---

### M004 · ConfigModule 未导入 AuthModule

**日期：** 2026-05-24
**错误描述：** ConfigController 的 `@UseGuards(AuthGuard)` 报依赖注入失败
**根因：** AuthGuard 依赖 JwtService，但 ConfigModule 未 import AuthModule
**修正：** `ConfigModule.imports = [AuthModule]`

---

### M005 · 日期时区偏移

**日期：** 2026-05-24
**错误描述：** 查询 `2026-05-25` 的 schedule 返回空
**根因：** `dayjs('2026-05-25').toDate()` 在 UTC+8 → `2026-05-24T16:00:00Z`
**修正：** 使用 `new Date('2026-05-25T00:00:00.000Z')` UTC 零点

---

### M006 · INSERT IGNORE 缺时间戳

**日期：** 2026-05-24
**错误描述：** raw SQL INSERT IGNORE 报 date 列错误
**根因：** Prisma `@default(now())` 在 raw SQL 中不生效，MySQL 严格模式拒绝 `0000-00-00`
**修正：** 显式 `created_at = NOW(), updated_at = NOW()`

---

### M007 · pnpm CLI 二进制找不到

**日期：** 2026-05-24
**错误描述：** `pnpm --filter server prisma migrate dev` 报 `prisma: command not found`
**根因：** pnpm 不 hoist 子包 devDeps 的二进制
**修正：** `.npmrc` 加 `shamefully-hoist=true`

---

## Phase 2

### M008 · uni-app 依赖版本混用

**日期：** 2026-05-24
**错误描述：** v2 `uni-cli-shared` + v3 alpha `vite-plugin-uni` → `global.uniPlugin undefined`
**根因：** uni-app 版本号中日期编码决定 API 兼容性，混用不同批次必定崩溃
**修正：** 采用官方模板 `3.0.0-4080420251103001` 全套统一版本

---

### M009 · CSS 三大坑 — scoped / rpx / flexbox

**日期：** 2026-05-24
**错误描述：** 日历格子文字塌成竖线、输入框文字半截
**根因：** 微信原生组件不支持完整的 CSS
**修正：** 放弃 scoped/rpx/flexbox，改用全局 style + px + inline-block

---

### M010 · 输入框 padding 无效

**日期：** 2026-05-24
**错误描述：** 表单 input 文字只显示上半截
**根因：** 微信 `input` 是原生组件，不认 `padding`
**修正：** 外层 `view` 画边框 + 内层 `input` 无边框 + `height:44px`

---

### M011 · 成功页修图张数显示错误

**日期：** 2026-05-24
**错误描述：** 成功页"修图张数"显示的是剩余名额，不是用户填的张数
**根因：** `onSuccess` 传了 `selectedDate.availableSlots` 而不是 `form.photoCount`
**修正：** BookingForm emit 增加 photoCount，index 页正确传递

---

### M012 · 返回首页日历不刷新

**日期：** 2026-05-24
**错误描述：** 提交后返回，日历格子刷新了但"已选日期余几单"文字没更新
**根因：** `selectedDate` 仍指向旧对象，refresh 未同步
**修正：** refresh 后 `days.find()` 重新绑定 selectedDate

---

## Phase 3

### M013 · NestJS Query DTO 类型转换失败

**日期：** 2026-05-24
**错误描述：** `GET /api/admin/orders?page=1` 返回 400 "page must be an integer"
**根因：** 查询参数始终是 string，`@IsInt()` + `transform: true` 不会隐式转换
**修正：** `transformOptions: { enableImplicitConversion: true }`

---

### M014 · admin dev 端口冲突

**日期：** 2026-05-24
**错误描述：** 旧进程占 5173，新 admin 换到 5174
**修正：** 通知用户新端口，后续加上 `--strictPort` kill old

---

### M015 · 管理端日期筛选用本地时区导致查询为空

**日期：** 2026-05-24
**错误描述：** `listOrders` 中 `new Date(query.dateFrom)` 在 UTC+8 产生偏移，日期范围漏掉数据（五月订单查询返回 0）
**根因：** JS `new Date('2026-05-01')` = 本地时间 5 月 1 日 00:00，在 UTC+8 变成 4 月 30 日 16:00
**修正：** `new Date(query.dateFrom + 'T00:00:00.000Z')` + `dateTo + 'T23:59:59.999Z'`

---

### M016 · MySQL INSERT IGNORE 产生 `0000-00-00` 崩 Prisma

**日期：** 2026-05-24
**错误描述：** 手动 `INSERT IGNORE INTO config` 无 `updated_at`，MySQL 填入零值日期，Prisma 读取报 "Value out of range"
**根因：** Prisma 不支持 `0000-00-00` 日期
**修正：** 删除坏行，统一使用 Service 层 `upsert`
