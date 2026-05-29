# 2026-05-29 故障排查记录

> 触发：5月29日打开管理后台发现日期月份异常 + 小程序无法加载日历面板
> 状态：日期月份 ✅ 已修复 | 小程序网络 ❌ ICP 备案中

---

## 问题 1：管理后台日期/月份显示错误

### 现象

- 5月29日打开管理后台，Dashboard 数据总览的"今日预约"、"本月订单"统计异常
- 排期管理日历月份显示不对
- 订单管理页面显示订单日期正常（不经过 `toISOString()` 的地方不受影响）

### 根因

**两层问题叠加：**

#### 1a. DashboardView — `toISOString()` 返回 UTC 时间

```js
// 原代码（DashboardView.vue 第118、153行）
const today = new Date().toISOString().slice(0, 10);
```

`toISOString()` 返回 UTC 时间。在 UTC+8 环境下：

| 本地时间 | `toISOString()` 结果 | `today` 值 | 实际日期 |
|----------|---------------------|-----------|---------|
| 5月29日 10:00 | `2026-05-29T02:00:00.000Z` | `2026-05-29` | ✅ 碰巧对了 |
| 5月1日 01:00 | `2026-04-30T17:00:00.000Z` | `2026-04-30` | ❌ 错月！ |
| 5月1日 08:00 | `2026-04-31T00:00:00.000Z` | `2026-04-31` | ❌ 错月！ |

导致：
- "今日预约" 查的是昨天（凌晨时段）
- "本月订单" 查的是上个月（月初凌晨时段）
- `thisMonth` 变量错误，所有基于月份的统计全部偏移

#### 1b. `new Date('YYYY-MM-DD')` 跨平台行为不一致

```js
// DashboardView / ScheduleView / DayCell 中多处使用
new Date('2026-06-01').getDate()   // 不同 JS 引擎行为不同
new Date(d).getDate()               // 同上
```

根据 ECMAScript 规范：
- 日期格式 `YYYY-MM-DD`（无时间部分）→ 解析为 **UTC 午夜**
- 日期格式 `YYYY-MM-DDTHH:mm:ss`（无时区）→ 解析为 **本地时间**

在 UTC+8 环境下，`new Date('2026-06-01')` 创建的是 `2026-05-31T16:00:00 UTC`，虽然 `.getDate()` 在本地返回 1（碰巧正确），但不同 mini program 容器/WebView 引擎可能行为不一致。

### 修复

| 文件 | 改动 |
|------|------|
| `apps/admin/src/views/DashboardView.vue` | 2处 `toISOString()` → 本地时间 `getFullYear()/getMonth()/getDate()` |
| `apps/admin/src/views/ScheduleView.vue` | `new Date(d).getDate()` → `dayjs(d).date()` |
| `apps/miniprogram/src/components/calendar/DayCell.vue` | 同上，添加 `import dayjs` |

核心替换：

```js
// DashboardView — 2处
- const today = new Date().toISOString().slice(0, 10);
+ const now = new Date();
+ const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

// ScheduleView + DayCell — 日期数字提取
- String(new Date(d).getDate())
+ dayjs(d).date().toString()
```

### 验证

```bash
# 管理后台类型检查
cd apps/admin && npx vue-tsc --noEmit

# 服务端测试
cd packages/server && npx jest --no-cache
# → 2 suites, 17 tests passed
```

---

## 问题 2：小程序日历面板无法加载

### 现象

- 小程序"预约"Tab 打开后日历显示"加载中..."，无任何日期格子
- 真机和开发者工具模拟器均如此
- 管理后台浏览器访问 `https://pixbook.top` 也打不开

### 排查过程

| 步骤 | 操作 | 结果 |
|------|------|------|
| 1 | `nslookup pixbook.top` | ✅ DNS 正常 → `120.55.96.207` |
| 2 | `curl -v https://pixbook.top` | ❌ `Recv failure: Connection was reset` — TLS 握手失败 |
| 3 | `curl -v http://pixbook.top` | ❌ 返回 **403 "Non-compliance ICP Filing"** |
| 4 | `curl http://120.55.96.207:3000/api/...` | ❌ 连接超时 — API 端口被防火墙拦截 |
| 5 | `openssl s_client -connect pixbook.top:443` | ✅ 证书有效（Let's Encrypt R12，2026-05-26 ~ 2026-08-24） |
| 6 | 检查 HTTP 80 端口响应 | ❌ 阿里云返回 ICP 合规拦截页（`Server: Beaver`） |

### 根因

**域名 `pixbook.top` 未完成 ICP 备案，阿里云阻断了所有 HTTP/HTTPS 访问。**

- HTTP 80 端口：阿里云 WAF 直接返回 403 ICP 合规拦截页
- HTTPS 443 端口：TCP 握手成功但 TLS 握手时连接被重置（阿里云层面拦截）
- 直连 3000 端口：服务器防火墙未放行，连接超时

服务器本身的 Nginx + SSL 配置没有问题（`openssl s_client` 能看到完整证书链），问题在阿里云网络层面。

### 影响

- 小程序请求 `https://pixbook.top/api` → 连接被拦截 → `ERR_CONNECTION_RESET` → 日历数据无法加载
- 管理后台浏览器也无法访问
- 所有依赖服务器的功能均不可用

### 已附带修复：小程序错误处理

原代码 `useCalendar.ts` 的 `fetchCalendar` 缺少 `catch` 块，API 失败时 `days` 保持空，用户看到永久"加载中..."无任何提示。

```js
// 修复：添加 catch + toast 提示
} catch (err) {
  console.error('[Pixbook] fetchCalendar failed:', err);
  uni.showToast({ title: '加载排期失败，请下拉刷新', icon: 'none' });
}
```

### 后续操作

| 优先级 | 任务 | 说明 |
|--------|------|------|
| 🔴 P0 | 完成 ICP 备案 | 阿里云备案审核通过后，HTTP/HTTPS 访问自动恢复 |
| 🟡 P1 | 备案通过后验证 | `curl https://pixbook.top/api/schedule/calendar?startDate=2026-06-01&days=5` |
| 🟡 P1 | 重新部署代码 | `git pull && pnpm install && pnpm build:server && pm2 restart pixbook-api` |
| 🟢 P2 | 小程序真机测试 | 确认日历加载、预约提交、订单查询全流程正常 |

备案期间如需临时调试，可选方案：
- 微信开发者工具 → 详情 → 本地设置 → 勾选「不校验合法域名」（仅开发调试用）
- 使用局域网 IP 直连：`VITE_API_BASE=http://192.168.31.191:3000/api` 构建小程序

---

## 关键文件位置

| 文件 | 用途 |
|------|------|
| `apps/admin/src/views/DashboardView.vue` | 管理后台数据总览（已修复 `toISOString`） |
| `apps/admin/src/views/ScheduleView.vue` | 管理后台排期日历（已修复 `dayNum`） |
| `apps/miniprogram/src/components/calendar/DayCell.vue` | 小程序日历日期格子（已修复日期解析） |
| `apps/miniprogram/src/composables/useCalendar.ts` | 小程序日历数据获取（已加错误处理） |
| `apps/miniprogram/src/api/request.ts` | 小程序 API 请求封装 |
| `packages/server/src/modules/schedule/schedule.service.ts` | 后端日历 API（此前已修复 `.000Z`） |
| `packages/server/src/modules/order/order.service.ts` | 后端订单 API（此前已修复 `.000Z`） |

---

## 命令速查

```bash
# 本地验证
npx vue-tsc --noEmit -p apps/admin/tsconfig.json   # 管理后台类型检查
cd packages/server && npx jest --no-cache            # 服务端单元测试

# 服务器验证（备案通过后）
curl -s https://pixbook.top/api/schedule/calendar?startDate=2026-06-01&days=5
curl -s https://pixbook.top/api/config/booking-form | head -c 200

# 部署
git pull && pnpm install && pnpm build:server && pm2 restart pixbook-api

# SSL 证书检查
openssl s_client -connect pixbook.top:443 -servername pixbook.top 2>&1 | grep -E "Cipher|Protocol|verify"
sudo certbot certificates
```

---

## 代码变更汇总

### Commit: 日期/月份修复 + 小程序错误处理

| 文件 | 改动 |
|------|------|
| `apps/admin/src/views/DashboardView.vue` | 2处 `toISOString()` → 本地时间构造 |
| `apps/admin/src/views/ScheduleView.vue` | `new Date(d).getDate()` → `dayjs(d).date()` |
| `apps/miniprogram/src/components/calendar/DayCell.vue` | 同上 + 添加 `import dayjs` |
| `apps/miniprogram/src/composables/useCalendar.ts` | 添加 `catch` + `uni.showToast` 错误提示 |

### 此前 Commit（参考）

| Commit | 说明 |
|--------|------|
| `0a58000` | 修复服务端日期查询 `.000Z` 时区偏移 + 小程序 API 环境变量化 |
| `a3d70da` | 小程序默认走 PROD_URL，不再依赖 NODE_ENV 判断 |
