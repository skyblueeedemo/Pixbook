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

## V1.0.1 伪上线

### L013 · NestJS `ConfigModule.forRoot()` 时序问题

**发现：** `ConfigModule.forRoot()` 中的 `dotenv.config()` 在模块初始化阶段执行，但 `auth.service.ts` 中模块级常量 `ADMIN_ACCOUNT` 在文件被 `require` 时就已读取 `process.env`。如果 `.env` 路径不正确（PM2 CWD 不匹配），管理员密码回退到代码默认值。

**解决：** 在 `main.ts` 顶部最早期显式调用 `dotenv.config()`，确保在任何业务模块加载前 `process.env` 已就绪。

**教训：** `.env` 加载应是最早执行的代码，不依赖框架模块的初始化顺序。

### L014 · 小程序真机强制 HTTPS

**发现：** 微信小程序真机预览时，即使勾选「不校验合法域名」，对非本地（非 localhost/127.0.0.1）的 HTTP 请求仍会拦截，报 `request:fail`。

**解决：** 开发阶段用局域网 IP（HTTP）仅限模拟器；真机测试必须走 HTTPS 或 ngrok 隧道。

**教训：** 上了服务器就要配 HTTPS，别无选择。`request:fail` 不是域名白名单问题，是协议问题。

### L015 · snake_case → camelCase 静默失败

**发现：** 前端发送 `default_max_slots` (snake_case)，TypeScript 接口定义 `defaultMaxSlots` (camelCase)。没有 DTO 映射层时，`partial.defaultMaxSlots` 永远是 `undefined`，所有 upsert 静默跳过。API 返回 200 但啥也没改。

**解决：** 在 Controller 层加 `mapSnakeToCamel()` 映射函数，处理 key 名转换 + 类型转换（string→number、逗号分隔→数组）。

**教训：** TypeScript 类型不提供运行时安全网。前后端 key 名不一致是常见坑，要么统一命名规范，要么在边界加映射。

---

---

### L016 · 表单字段从"灵活"到"硬编码"的折返回

**发现：** 最初将联系方式放在自定义表单字段中（灵活），后发现每个订单都有联系方式，放在 JSON 里查询不便，最终升为数据库硬字段

**解决：**
- Order 表加 `contactMethod` + `contactValue` 列
- 自定义表单字段只保留修图偏好（档位/角色/附加项目）
- 小程序表单中将联系方式放在姓名下方第一位置

**教训：** "灵活"不等于"好"。如果是每个订单都有的核心字段，应该一开始就规划为数据库列，而不是藏在 JSON 里。

---

## 生产上线（2026-05-26）

### L017 · certbot 验证需要 80 端口公网可达

**发现：** certbot HTTP-01 挑战需要 Let's Encrypt 服务器通过 80 端口访问 `/.well-known/acme-challenge`。即使 Nginx 监听 80，阿里云安全组未开 80 也会 Timeout。

**解决：** 先确认安全组开放 TCP 80 + 443，再运行 certbot。

**教训：** 云服务器有两层防火墙：云厂商安全组（控制台配）和 OS 级 iptables（命令行配），两层都要放行。

### L018 · iptables 规则重启后丢失

**发现：** 服务器重启后 iptables 规则清空，80/443 端口又被 DROP。之前 `iptables -I INPUT -p tcp --dport 80 -j ACCEPT` 只在内存中生效。

**解决：** setup-domain.sh 中每次都执行 `iptables -I INPUT`，并提示用户开放安全组。

**教训：** 生产脚本中的防火墙操作应该是幂等的，每次都跑一次 `iptables -I` 不依赖上次状态。

### L019 · Ubuntu 20.04 vs 22.04 MySQL 认证差异

**发现：** Ubuntu 22.04 MySQL root 使用 `auth_socket`（`sudo mysql` 免密），Ubuntu 20.04 使用 `caching_sha2_password`（需要 debian.cnf 文件）。同一套 `sudo mysql` 在 20.04 上报 1045。

**解决：** 三级回退：`sudo mysql` → `mysql --defaults-file=/etc/mysql/debian.cnf` → `mysql -u root -p密码`。

**教训：** 不要假设所有 Ubuntu 版本的 MySQL 默认认证方式一致。debian.cnf 是 Ubuntu 20.04 最可靠的备用入口。

---

## Bug 修复（2026-07-29）

### L020 · D007 的时区决策需要修正：本地日期 ≠ UTC 零点

**发现：** D007 当初的决策"使用 UTC 零点 ISO 字符串确保日期部分正确"解决了 `dayjs().toDate()` 的偏移问题，但引入了另一个方向的问题：将本地时区的日期字符串拼上 `.000Z` 后缀，导致在非 UTC 服务器上查询边界偏移。

具体：`new Date("2026-07-01T00:00:00.000Z")` 在 UTC+8 是 `2026-07-01 08:00:00`，比 MySQL DATE `2026-07-01 00:00:00` 晚了 8 小时，导致每月 1 号被排除出结果。

**解决：** 去掉 `.000Z` 后缀，使用 `new Date(dateStr + 'T00:00:00')`（本地时区零点）。本地日期配本地零点才是正确的语义。同时在 `schedule.service.ts` 和 `order.service.ts` 中添加 `toLocalDate()` helper 集中处理，避免散落各处。

**教训：** 
- 时区问题的本质是"什么时区的日期就应该配什么时区的零点"，混搭必出 bug
- D007 当时把两个问题混在一起了：(1) `dayjs().toDate()` 的偏移 ≠ (2) 如何构建本地日期对应的 Date 对象
- 代码审查时如果发现 `+ 'T00:00:00'` 后面有 `Z`，应该立刻追问"这个日期字符串是什么时区？"

### L021 · `new Date("YYYY-MM-DD")` 的隐式行为不稳定

**发现：** `new Date("2026-07-26")` 在不同 ECMAScript 版本下行为不同 — ES5 当 UTC 零点、ES6+ 当本地零点。虽然现代 Node.js 都是 ES6+，但显式拼接 `T00:00:00` 更安全。

**解决：** 所有日期构造统一使用 `new Date(dateStr + 'T00:00:00')` 或 `toLocalDate()` helper。

---

## 待记录

- 小程序审核经验
- 多租户改造

