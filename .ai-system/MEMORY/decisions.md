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

---

## 2026-05-24 · Phase 1 实施决策

### D006 · Monorepo CLI 解析：`shamefully-hoist=true`

**决策：** 添加 `.npmrc` 配置 `shamefully-hoist=true`，使 pnpm monorepo 中子包的 CLI 二进制（如 `prisma`）可被直接调用

**理由：**
- pnpm 默认不 hoist 子包依赖的二进制，导致 `pnpm --filter @pixbook/server prisma migrate dev` 找不到 `prisma` 命令
- `shamefully-hoist=true` 将所有包提升到根 node_modules，解决此问题
- 相比在根 package.json 重复安装 devDeps，此方案更简洁

**替代方案：** 在根 `package.json` 中重复安装 `prisma` 作为 devDep — 重复声明，容易版本不一致

---

### D007 · 日历查询：UTC 零点 ISO 字符串

**决策：** 排期日历的日期范围查询使用 `new Date('2026-05-25T00:00:00.000Z')` 而非 `dayjs().toDate()`

**理由：**
- `dayjs('2026-05-25').toDate()` 在 UTC+8 时区创建的是 `2026-05-24T16:00:00.000Z`
- Prisma 对 `@db.Date` 列提取 UTC 日期部分 → 变成 5 月 24 日，导致当天数据查不到
- 使用 UTC 零点 ISO 字符串确保日期部分正确

**替代方案：** 使用 `prisma.$queryRaw` 原始 SQL — 失去 Prisma 类型安全

---

### D008 · INSERT IGNORE：显式填充时间戳

**决策：** raw SQL `INSERT IGNORE` 必须显式设置 `created_at = NOW(), updated_at = NOW()`

**理由：**
- Prisma schema 中 `@default(now())` 和 `@updatedAt` 仅在 Prisma Client 操作时生效
- raw SQL 执行时，MySQL 默认值可能为 `0000-00-00 00:00:00`，触发 `sql_mode` 严格模式报错
- 显式填充避免此问题

**替代方案：** 为 MySQL 列设置 DEFAULT CURRENT_TIMESTAMP — 但 Prisma migration 不生成此 DDL

---

### D009 · 日历缓存策略：`calendar:*` 通配删除

**决策：** 订单提交成功后，使用 `DEL calendar:*` 通配删除所有日历缓存 key

**理由：**
- 日历有多个变体（不同 startDate + days 组合），无法精确定位受影响的 key
- TTL 只有 60s，通配删除简单可控
- 写操作频率低（预约场景非高频写），不会造成 Redis 性能问题

**替代方案：** 按具体日期删除 `calendar:2026-05-25:*` — 但仍需通配，Redis 通配删除 O(N) 不可避免

---

## 2026-05-24 · Phase 2 实施决策

### D010 · 小程序样式：放弃 scoped + rpx + flexbox

**决策：** 小程序组件全部使用全局 `<style>` + 纯 `px` 单位 + `inline-block` 布局

**理由：**
- uni-app 编译后 `scoped` 样式存在数据属性残留，部分样式不生效
- `rpx` 单位在线性布局中计算异常，导致文字渲染崩溃
- `flexbox` 在微信原生渲染中与 web 表现不一致
- `inline-block` + 固定百分比宽度兼容所有微信基础库版本

**替代方案：** WeUI 组件库 — 引入体积大，定制困难

---

### D011 · 日历查询：从 API 起始日改为每月 1 号

**决策：** 日历组件请求固定从每月 1 号开始的天数月视图，而非从明天起连续 N 天

**理由：**
- 从明天起的连续列表导致跨月断裂，用户困惑
- 月度视图是业界标准（iOS 日历、cal.com）
- 增加 `prevMonth/nextMonth` 切换 + `onShow` 返回刷新

**替代方案：** 周视图 — 客户预约更适合月视图

---

### D012 · 输入框：外层 view 画边框

**决策：** 微信 `input`/`textarea` 外层用 `view.fd-ib` 画边框，内层 `input` 去除所有边框样式

**理由：**
- 微信原生 `input` 组件不支持 `padding` 和 `border` 完整渲染
- 外层容器统一处理边框 + 圆角，内层 `input` 仅设 `height:44px` + `line-height`
- 这是微信社区广泛采用的 workaround

**替代方案：** 使用 `adjust-position` 属性 — 仅影响键盘避让，不解决样式

---

### D013 · 订单查询：双模式（姓名+手机号 或 姓名+订单号）

**决策：** 查询页支持姓名必填 + 手机号/订单号二选一

**理由：**
- 用户可能忘记订单号但记得手机号，反之亦然
- 姓名作为必须项提供额外安全层
- 后端 `findFirst` + `createdAt: desc` 返回最新一条匹配订单

**替代方案：** 仅手机号查询 — 安全性差（任意手机号可查他人订单）

---

## 2026-05-24 · Phase 3 实施决策

### D014 · 管理端接口：独立 Admin Controller

**决策：** 管理端订单接口使用独立 `OrderAdminController`（路径 `/api/admin/orders`），而非挂在用户端 Controller 下

**理由：**
- 管理端需要完整列表 + 筛选 + 分页，用户端只需要双因子单条查询
- `@UseGuards(AuthGuard)` 在 Controller 级别统一保护所有管理接口
- 路径层级清晰：`/api/admin/*` vs `/api/order/*`

### D015 · Query DTO 隐式类型转换

**决策：** ValidationPipe 开启 `transformOptions: { enableImplicitConversion: true }`

**理由：**
- 查询参数始终是字符串，DTO 中 `@IsInt()` 需要先转为 number
- 不用在每个 DTO 字段上加 `@Type(() => Number)` 装饰器
- 全局生效，减少样板代码

---

## 2026-05-24 · Phase 3 后续决策

### D016 · 新增「已确认」状态

**决策：** 在"待确认"和"修图中"之间插入"已确认"状态，原 1-4 全部向后偏移

**新的状态流转：**
```
待确认(0) → 已确认(1) → 修图中(2) → 待交付(3) → 已完成(4)
    │            │            │
    └─── 已取消(5) ←────────────┘
```

### D017 · 可预约天数约束

**决策：** `booking_days` 在客户端日历强制生效，超出范围标记 unavailable

---

## 2026-05-25 · Phase 5 伪上线决策

### D018 · 自定义表单字段：JSON 配置 + JSON 存储

**决策：** 预约表单的自定义字段采用「config 定义字段 schema + Order.customFields JSON 存储用户值」模式

**理由：**
- 管理员可随时增删字段，无需 DB migration
- 字段定义集中在一个 config key (`booking_form_fields`)，便于管理
- 用户填写的值以 JSON 存储在 Order 行内，查询时一并返回
- 支持三种字段类型（select / multi_select / text）覆盖当前需求

**替代方案：** 为每种字段新增 DB 列 — 每次加字段都要 migration，管理端需要改 UI，灵活性差。

### D019 · snake_case → camelCase 映射层放 Controller

**决策：** 前端 snake_case 到后端 camelCase 的映射放在 Controller 层，而非前端改发送格式

**理由：**
- 前端已有上线版本，改前端 key 名会导致存量用户请求失败
- Controller 映射层集中处理，不影响 Service 层的类型安全
- 后续可逐步统一前端也改为 camelCase，映射层到时移除即可

**替代方案：** 前端全改 — 需同步发版，风险高。

### D020 · PM2 配置入库

**决策：** 将 PM2 配置 (`ecosystem.config.js`) 和部署脚本 (`deploy.sh`) 纳入版本控制

**理由：**
- 部署流程可复现，不再依赖口头传递的命令
- 新服务器环境一键部署
- 脚本中 `cwd` 参数解决了之前的 .env 路径问题

**替代方案：** 手动 PM2 start + 文档记录 — 容易遗忘参数，每次部署不稳定。

---

### D021 · 联系方式升为硬字段

**决策：** 将"联系方式"和"联系号码"从自定义表单字段中移除，作为 Order 表的独立列（`contactMethod` + `contactValue`）

**理由：**
- 联系方式是每个订单的核心信息，不应与修图偏好（如档位、角色）混在同一层级
- 硬字段可索引、可搜索，查询性能优于 JSON 字段遍历
- 替代原先的"手机号必填"：QQ/微信号作为主要联系方式，手机号改为选填
- 去重逻辑从 `phone + date` 改为 `contactValue + date`

**关联改动：**
- Prisma Order 模型新增 `contactMethod` `contactValue`，`customerPhone` 改为可选
- 小程序表单重排：姓名 → 联系方式 → 联系号码 → 手机号（下移，选填）
- 查询页增加联系方式搜索
- 种子数据移除 contact_method/contact_value（已升为硬字段）

**替代方案：** 保持 phone 必填 + customFields 存 QQ/微信 — 但 phone 作为必填项对 QQ/微信用户不友好

---

## 2026-05-26 · 生产上线决策

### D022 · SSL：Let's Encrypt + certbot

**决策：** 使用 certbot (Let's Encrypt) 免费 SSL 证书，而非阿里云/腾讯云付费证书

**理由：**
- 永久免费，90 天自动续期，零运维成本
- certbot 自动修改 Nginx 配置，HTTPS 一键就绪
- 微信小程序只验证证书有效性，不区分 CA 品牌

**替代方案：** 阿里云免费 DV 证书 — 需要手动下载 + 手动配 Nginx + 每年手动续期。

### D023 · Nginx 反向代理 /api → NestJS:3000

**决策：** Nginx 处理 HTTPS + 反向代理，不暴露 NestJS 的 3000 端口到公网

**理由：**
- Nginx 处理 SSL termination，NestJS 无需配置证书
- `/api` 反向代理到 `127.0.0.1:3000`，端口不对外暴露
- `/` 直接 serve 管理后台静态文件，无需额外 HTTP 服务

## 2026-07-29 · Bug 修复决策

### D025 · 日期边界：从 UTC 零点改为本地时区零点

**决策：** 所有 DATE 列查询边界从 `new Date(dateStr + 'T00:00:00.000Z')` 改为 `new Date(dateStr + 'T00:00:00')`，并添加 `toLocalDate()` helper

**理由：**
- `dateStr` 来自 `dayjs.format('YYYY-MM-DD')`，是本地时区日期（如 `"2026-07-01"`）
- 拼接 `.000Z` 后缀将其解释为 UTC 零点，在 UTC+8 服务器上实际是早上 8:00
- MySQL DATE 列 `2026-07-01` = 本地 00:00:00，小于 08:00:00 → 被排除出查询结果
- D007 的原始决策（"使用 UTC 零点确保日期部分正确"）在当时理解上有偏差 — `dayjs().toDate()` 确实有问题，但 `new Date(本地日期 + 'T00:00:00.000Z')` 走的是另一个极端
- 正确做法：本地日期配本地零点 `T00:00:00`，不添加 Z 后缀

**替代方案：** 使用 Prisma 的 `$queryRaw` + MySQL `DATE()` 函数 — 但失去 ORM 类型安全。

### D026 · 小程序 API 地址：环境变量代替硬编码

**决策：** 移除 `IS_PROD = true` 硬编码，改用构建时环境变量 `VITE_API_BASE` + `NODE_ENV` 自动判断

**理由：**
- 硬编码导致开发/生产切换需要改源码
- 环境变量方案让 CI/CD 可配置，本地开发自动走局域网 IP
- 添加启动日志 `console.log('[Pixbook] API base:', BASE_URL)` 方便诊断

---

### D024 · setup-domain.sh 一键脚本

**决策：** 将域名 + SSL + Nginx 配置抽象为独立脚本，与代码部署分离

**理由：**
- 域名配置是一次性操作，不应与每次代码发布耦合
- 新服务器只需 `setup-env.sh → setup-domain.sh → deploy.sh` 三步
- 包含 iptables 开放 + 安全组提示，减少外部排查步骤

**替代方案：** 手动操作 — 今晚实际踩坑证明手动操作至少需要 4 轮反复排查防火墙/安全组/certbot。
