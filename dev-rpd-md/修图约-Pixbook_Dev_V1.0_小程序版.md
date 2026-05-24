# 修图约-Pixbook · 开发实施文档

> **文档版本：** Dev-1.0（微信小程序版）
> **对应 PRD：** V1.0
> **技术参考：** Easy!Appointments 后端架构 · cal.com 前端日历组件
> **适用对象：** 全栈开发 / 小程序前端 / 后端 / DevOps

---

## 一、技术选型说明

### 1.1 为什么参考这两个开源项目？

| 项目 | 借鉴点 | 不借鉴点 |
|------|-------|---------|
| **Easy!Appointments** | 预约可用性算法、工作计划（working plan）数据模型、服务端幂等控制、REST API 分层设计 | PHP/CodeIgniter 技术栈（本项目用 Node.js）、多服务商/多服务类型（本项目单修图师）、Google Calendar 同步 |
| **cal.com** | Booker 日历组件的时间槽渲染逻辑、颜色状态映射、`useAvailableSlots` 可用性 hook 设计思路、Prisma Repository 模式 | 会议预约模型（本项目是名额制而非时间段制）、团队多人协作、视频会议集成 |

### 1.2 本项目技术栈

```
客户端小程序   uni-app + Vue 3 语法 + TypeScript
（微信小程序）  uni-ui 组件库
               Day.js（日期处理）
               uni.request 封装（替代 Axios，小程序网络层）
               wx.setStorageSync（替代 localStorage，本地缓存）
               微信登录：wx.login → code2session（获取 openid）

管理后台       Vue 3 + TypeScript + Vite（Web 端，不变）
（Web）        Tailwind CSS
               Axios + 请求拦截器
               Element Plus

后端           Node.js + NestJS（模块化架构，参考 Easy!Appointments 分层）
               Prisma ORM + MySQL 8.0
               Redis 7.x（日历缓存 + 幂等 token）
               JWT（管理员鉴权）
               微信服务端 API（code2session、订阅消息推送）
               Bull（消息队列，P1 阶段通知用）

部署           Nginx + PM2（单机）/ Docker Compose（容器化）
               GitHub Actions（CI/CD）
               微信公众平台：合法域名备案（所有接口域名必须备案）
```

> ⚠️ **小程序域名限制：** 所有 `uni.request` 请求的域名必须在微信公众平台「开发 → 开发管理 → 服务器域名」中添加。本地开发阶段在微信开发者工具勾选「不校验合法域名」即可调试。

---

## 二、项目目录结构

参考 Easy!Appointments 的 MVC 分层和 cal.com 的 monorepo 包划分，本项目采用简化的模块化结构：

```
retouching-booking/
├── apps/
│   ├── miniprogram/             # 客户端：微信小程序（uni-app）
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── calendar/
│   │   │   │   │   ├── BookingCalendar.vue      # 主日历组件（参考 cal.com Booker）
│   │   │   │   │   ├── DayCell.vue              # 单日格子（5 种状态）
│   │   │   │   │   └── CalendarLegend.vue       # 图例
│   │   │   │   ├── booking/
│   │   │   │   │   ├── BookingForm.vue           # 订单填写表单
│   │   │   │   │   ├── BookingSuccess.vue        # 预约成功页
│   │   │   │   │   └── OrderQuery.vue            # 订单查询
│   │   │   │   └── ui/                          # 基础 UI 组件（uni-ui）
│   │   │   ├── composables/
│   │   │   │   ├── useCalendar.ts               # 日历状态管理（仿 useAvailableSlots）
│   │   │   │   ├── useBooking.ts                # 预约提交逻辑
│   │   │   │   ├── useAuth.ts                   # 微信登录 + openid 管理
│   │   │   │   └── useOrderQuery.ts             # 订单查询
│   │   │   ├── api/
│   │   │   │   ├── request.ts                   # uni.request 封装（替代 Axios）
│   │   │   │   └── index.ts                     # 接口函数
│   │   │   └── pages/
│   │   │       ├── index/index.vue              # 首页（日历 + 表单）
│   │   │       ├── success/index.vue            # 预约成功页
│   │   │       └── query/index.vue              # 订单查询页
│   │   ├── pages.json                           # 页面路由配置（小程序专用）
│   │   ├── manifest.json                        # 小程序 AppID 等配置
│   │   └── vite.config.ts
│   │
│   └── admin/                   # 管理端前端（Vue 3 Web，不变）
│       └── src/
│           ├── components/
│           │   ├── schedule/
│           │   │   ├── ScheduleCalendar.vue     # 排期月历视图
│           │   │   └── DayOverride.vue          # 特定日期名额覆盖
│           │   ├── orders/
│           │   │   ├── OrderList.vue            # 订单列表（筛选+分页）
│           │   │   ├── OrderDetail.vue          # 订单详情侧滑
│           │   │   └── StatusFlow.vue           # 状态流转操作
│           │   └── config/
│           │       └── ConfigPanel.vue          # 全局配置面板
│           └── views/
│               ├── DashboardView.vue
│               ├── OrdersView.vue
│               └── ScheduleView.vue
│
└── packages/
    └── server/                  # NestJS 后端
        └── src/
            ├── modules/
            │   ├── schedule/                    # 排期模块（参考 Easy!Appts 可用性算法）
            │   │   ├── schedule.controller.ts
            │   │   ├── schedule.service.ts      # 核心：名额计算 + 状态判定
            │   │   ├── schedule.repository.ts   # Prisma Repository（参考 cal.com 模式）
            │   │   └── schedule.dto.ts
            │   ├── order/                       # 订单模块
            │   │   ├── order.controller.ts
            │   │   ├── order.service.ts         # 乐观锁 + 幂等控制
            │   │   ├── order.repository.ts
            │   │   └── order.dto.ts
            │   ├── wechat/                      # 微信模块（新增）
            │   │   ├── wechat.controller.ts     # wx.login code2session 接口
            │   │   ├── wechat.service.ts        # openid 换取 + 订阅消息推送
            │   │   └── wechat.dto.ts
            │   ├── config/                      # 配置模块
            │   │   ├── config.controller.ts
            │   │   └── config.service.ts
            │   └── auth/                        # JWT 鉴权
            │       ├── auth.controller.ts
            │       └── auth.guard.ts
            ├── common/
            │   ├── redis/                       # Redis 缓存服务
            │   ├── idempotency/                 # 幂等中间件
            │   └── rate-limit/                  # 限流
            └── prisma/
                └── schema.prisma
```

---

## 三、核心模块设计

### 3.1 日历可用性算法（借鉴 Easy!Appointments）

Easy!Appointments 的可用性生成算法（`availability generation algorithm`）核心思路是：**从工作计划中生成可用时间段，再减去已有预约**。本项目将其简化为**名额制**：

```typescript
// packages/server/src/modules/schedule/schedule.service.ts

/**
 * 参考 Easy!Appointments 的 availability generation 思路
 * 原版：生成可用时间段列表
 * 本项目：计算每日剩余名额，返回状态枚举
 */
async getCalendarData(startDate: string, days: number): Promise<DayStatus[]> {
  const config = await this.configService.getConfig();
  const result: DayStatus[] = [];

  for (let i = 0; i < days; i++) {
    const date = dayjs(startDate).add(i, 'day');
    const dateStr = date.format('YYYY-MM-DD');

    // 1. 判断是否在可预约范围内（参考 Easy!Appts 的 working plan 检查）
    const isRestDay = config.restDaysOfWeek.includes(date.day())
      || config.extraRestDates.includes(dateStr);
    const isPast = date.isBefore(dayjs().add(1, 'day'), 'day');

    if (isRestDay || isPast) {
      result.push({ date: dateStr, status: 'unavailable', availableSlots: 0 });
      continue;
    }

    // 2. 查询已预约数（不含已取消）—— Easy!Appts 同样排除 cancelled 状态
    const schedule = await this.scheduleRepository.findByDate(dateStr);
    const maxSlots = schedule?.maxSlots ?? config.defaultMaxSlots;
    const bookedSlots = schedule?.bookedSlots ?? 0;
    const available = maxSlots - bookedSlots;

    // 3. 状态映射（参考 cal.com 的 slot state 设计）
    let status: SlotStatus;
    if (available <= 0)      status = 'full';
    else if (available === 1) status = 'almost_full';
    else                      status = 'available';

    result.push({
      date: dateStr,
      status,
      availableSlots: available,
      maxSlots,
      version: schedule?.version ?? 0,
    });
  }

  return result;
}
```

### 3.2 日历前端组件（借鉴 cal.com Booker）

cal.com 的 Booker 组件将日历渲染与可用性状态解耦，通过 `useAvailableSlots` hook 统一管理。本项目的 `useCalendar` composable 采用相同思路，网络层替换为小程序的 `uni.request`：

```typescript
// apps/miniprogram/src/api/request.ts

/**
 * uni.request 封装，对齐原 Axios 拦截器的功能
 * 小程序不支持 XMLHttpRequest，必须使用 uni.request
 */
function request<T>(options: UniApp.RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    uni.request({
      ...options,
      header: {
        'Content-Type': 'application/json',
        // 幂等 key 由调用方在 header 中注入
        ...options.header,
      },
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data as T);
        } else {
          reject(res);
        }
      },
      fail: reject,
    });
  });
}

export const api = {
  get: <T>(url: string) =>
    request<T>({ url: `${BASE_URL}${url}`, method: 'GET' }),
  post: <T>(url: string, data: object, header?: object) =>
    request<T>({ url: `${BASE_URL}${url}`, method: 'POST', data, header }),
};
```

```typescript
// apps/miniprogram/src/composables/useCalendar.ts

/**
 * 仿 cal.com useAvailableSlots hook 设计
 * 职责：获取 & 缓存日历数据，驱动 DayCell 状态渲染
 * 小程序适配：缓存改用 wx.setStorageSync，无 localStorage
 */
export function useCalendar() {
  const days = ref<DayStatus[]>([]);
  const loading = ref(false);
  const selectedDate = ref<DayStatus | null>(null);

  async function fetchCalendar(forceRefresh = false) {
    // 本地 60s 缓存（cal.com 的 slot cache 策略）
    // 小程序用 wx.getStorageSync 替代内存变量，页面跳转后缓存不丢失
    if (!forceRefresh) {
      const cached = wx.getStorageSync('calendar_cache');
      const cacheTime = wx.getStorageSync('calendar_cache_time');
      if (cached && Date.now() - cacheTime < 60_000) {
        days.value = cached;
        return;
      }
    }
    loading.value = true;
    try {
      const res = await api.get<CalendarResponse>('/schedule/calendar');
      wx.setStorageSync('calendar_cache', res.data);
      wx.setStorageSync('calendar_cache_time', Date.now());
      days.value = res.data;
    } finally {
      loading.value = false;
    }
  }

  // 并发冲突后强制刷新（对应 PRD 3.4 冲突处理）
  function refresh() { return fetchCalendar(true); }

  function selectDate(day: DayStatus) {
    if (day.status === 'full' || day.status === 'unavailable') return;
    selectedDate.value = day;
  }

  return { days, loading, selectedDate, fetchCalendar, refresh, selectDate };
}
```

### 3.3 乐观锁订单提交（核心并发控制）

```typescript
// packages/server/src/modules/order/order.service.ts

async submitOrder(dto: CreateOrderDto): Promise<Order> {
  // 1. 幂等检查（Easy!Appts 同样有 idempotency_key 机制）
  const existing = await this.orderRepo.findByIdempotencyKey(dto.idempotencyKey);
  if (existing) return existing; // 返回原订单，前端视为成功

  // 2. 乐观锁更新（核心防超卖逻辑）
  const updated = await this.prisma.$executeRaw`
    UPDATE schedules
    SET booked_slots = booked_slots + 1,
        version      = version + 1
    WHERE date         = ${dto.scheduleDate}
      AND version      = ${dto.expectedVersion}
      AND booked_slots < max_slots
  `;

  if (updated === 0) {
    // 自动重试 1 次（PRD 3.4 冲突重试策略）
    throw new ConflictException('SLOT_CONFLICT');
  }

  // 3. 创建订单记录
  return this.orderRepo.create({
    ...dto,
    orderNo: this.generateOrderNo(dto.scheduleDate),
    status: OrderStatus.PENDING,
  });
}
```

---

## 四、阶段性开发计划

---

### Phase 0 · 项目初始化（第 1 周）

**目标：** 搭建工程骨架，统一开发环境，所有成员能本地跑通 Hello World。

#### 任务清单

**基础工程**
- [ ] 初始化 monorepo（pnpm workspace）
- [ ] 创建 `apps/miniprogram`（uni-app）、`apps/admin`（Vue 3 Web）、`packages/server`（NestJS）三个子包
- [ ] uni-app 项目初始化：`npx degit dcloudio/uni-preset-vue#vite-ts miniprogram`
- [ ] 微信公众平台注册小程序，获取 AppID / AppSecret，填入 `manifest.json`
- [ ] 配置 ESLint + Prettier + TypeScript 严格模式
- [ ] 配置 GitHub Actions：PR 自动 lint + 类型检查

**数据库**
- [ ] 编写 Prisma schema（schedules / orders / config / users 四张表，新增 users 存储 openid）
- [ ] 编写初始 seed 数据（默认配置项）
- [ ] 本地 Docker Compose：MySQL 8 + Redis 7

**规范约定**
- [ ] Git 分支策略：`main`（生产）/ `dev`（集成）/ `feat/*`（功能）
- [ ] Commit message 规范（参考 cal.com：`feat(orders): ...`、`fix(calendar): ...`）
- [ ] PR 模板：变更说明 + 自测检查项 + 截图（UI 变更时）

#### 交付物
- 可运行的空项目骨架（含 uni-app 小程序工程）
- `docker-compose.yml`（本地开发环境）
- Prisma schema + migration 文件（含 users 表）
- 微信开发者工具可预览的空白小程序
- README 包含本地启动步骤

---

### Phase 1 · 核心后端（第 2–3 周）

**目标：** 实现全部 P0 级 API，并发安全，可独立通过接口测试。

#### 模块 1：配置服务（第 2 周前半）

| 任务 | 说明 |
|------|------|
| `GET /api/admin/config` | 返回全局配置 |
| `PUT /api/admin/config` | 更新配置（每日上限、休息日等）|
| `PUT /api/admin/schedule/:date/override` | 特定日期名额覆盖 |
| ConfigService 单元测试 | 覆盖默认值、边界值 |

#### 模块 2：排期日历 API（第 2 周后半）

参考 Easy!Appointments 可用性算法实现：

| 任务 | 说明 |
|------|------|
| `GET /api/schedule/calendar` | 生成未来 N 天状态数组 |
| ScheduleService 可用性算法 | 5 种状态判定逻辑 |
| Redis 缓存层 | TTL 60s，写操作主动失效 |
| 降级处理 | Redis 宕机时直查 MySQL |
| ScheduleService 单元测试 | 覆盖全部状态路径 |

#### 模块 3：订单提交 API（第 3 周）

| 任务 | 说明 |
|------|------|
| `POST /api/order/submit` | 乐观锁 + 幂等提交 |
| `GET /api/order/query` | 手机号 + 订单号双验证查询 |
| 并发冲突重试逻辑 | 服务端自动重试 1 次 |
| 同手机同日期重复预约拦截 | 联合唯一索引 |
| 限速中间件 | 同 IP 每分钟 ≤ 10 次 |
| OrderService 单元测试 | 覆盖幂等、冲突、重复预约场景 |

#### 模块 4：微信登录模块（第 3 周，新增）

小程序客户端通过 `wx.login` 获取 code，后端用 code 换取 openid，与订单绑定：

| 任务 | 说明 |
|------|------|
| `POST /api/wechat/login` | code → openid → 返回自定义 session_key |
| users 表创建/查询 | openid 首次登录自动建档 |
| openid 与订单关联 | orders 表增加 `user_id` 外键（可选，用于「我的预约」）|
| session_key 存储 | 后端存 Redis，TTL 7 天 |

```typescript
// packages/server/src/modules/wechat/wechat.service.ts

async wxLogin(code: string): Promise<{ sessionKey: string }> {
  // 用 code 换取 openid（微信服务端接口，服务端调用，不暴露 AppSecret）
  const res = await fetch(
    `https://api.weixin.qq.com/sns/jscode2session` +
    `?appid=${APP_ID}&secret=${APP_SECRET}&js_code=${code}&grant_type=authorization_code`
  );
  const { openid } = await res.json();

  // upsert 用户记录
  const user = await this.prisma.users.upsert({
    where: { openid },
    create: { openid },
    update: { lastLoginAt: new Date() },
  });

  // 生成自定义 session_key，存 Redis
  const sessionKey = randomUUID();
  await this.redis.set(`session:${sessionKey}`, user.id, 'EX', 604800);
  return { sessionKey };
}
```

#### 模块 5：管理员鉴权（第 3 周）

| 任务 | 说明 |
|------|------|
| `POST /api/admin/login` | 账号密码 → JWT |
| JWT Guard | 保护所有 `/api/admin/*` 路由 |
| Token 有效期 7 天 | 过期返回 401 |

#### 并发压测（第 3 周末）

```bash
# 使用 autocannon 模拟 50 并发同时提交同一日期
npx autocannon -c 50 -d 10 \
  -m POST \
  -H "Content-Type: application/json" \
  -b '{"scheduleDate":"2026-06-01","expectedVersion":0,...}' \
  http://localhost:3000/api/order/submit
```

**验收标准：** 无超卖（booked_slots ≤ max_slots），失败方返回 code 1001。

#### 交付物
- 全部 P0 API 可用（Postman Collection）
- 微信登录接口可用（需真机或微信开发者工具测试）
- 单元测试覆盖率 ≥ 70%
- 并发测试报告（无超卖）

---

### Phase 2 · 客户端小程序（第 4–5 周）

**目标：** 用 uni-app 实现完整的客户预约流程，微信开发者工具真机预览通过。

> uni-app 使用 Vue 3 语法，`useCalendar` / `useBooking` 等 composable 逻辑基本不变，主要差异在网络层（`uni.request`）、存储层（`wx.setStorageSync`）和路由层（`uni.navigateTo`）。

#### 第 4 周：小程序基础 + 日历组件

| 任务 | 说明 |
|------|------|
| `pages.json` 路由配置 | 配置 index / success / query 三个页面，设置 tabBar |
| `request.ts` 封装 | `uni.request` Promise 化，注入 session_key header |
| `useAuth` composable | `wx.login` → 调后端换 sessionKey → `wx.setStorageSync` |
| 小程序启动时静默登录 | `App.vue` onLaunch 中执行，用户无感知 |
| `useCalendar` composable | 同 3.2 设计，缓存改用 `wx.setStorageSync` |
| `BookingCalendar.vue` | 月历网格，`swiper` 组件实现左右翻月（小程序原生） |
| `DayCell.vue` | 5 种状态，用 `wxss` 类名替代 Tailwind |
| `CalendarLegend.vue` | 图例组件 |
| 今日高亮 + 禁用逻辑 | T+1 限制，当天不可点 |

**小程序样式规范（替代 Tailwind，对应 PRD 3.2 颜色）：**

```css
/* apps/miniprogram/src/components/calendar/DayCell.vue <style> */

.dc-avail  { background: #EAF3DE; }
.dc-avail .dn { color: #27500A; }

.dc-hot    { background: #FAEEDA; border: 1px solid #EF9F27; }
.dc-hot .dn { color: #633806; }

.dc-full   { background: #FCEBEB; opacity: 0.6; }
.dc-full .dn { color: #791F1F; }

.dc-off    { background: #F2F2F7; }
.dc-off .dn { color: #AEAEB2; }

.dc-today  { outline: 2rpx solid #378ADD; }
.dc-sel    { outline: 3rpx solid #1D9E75; }
```

#### 第 5 周：表单 + 成功页 + 小程序特性适配

| 任务 | 说明 |
|------|------|
| `BookingForm.vue` | 5 个字段 + 实时校验，使用 `uni-forms` 组件 |
| 手机号字段 | 使用 `<button open-type="getPhoneNumber">` 一键获取（需小程序认证）；降级方案：手动输入 |
| `useBooking` composable | 幂等 key 生成、提交、重复提交防护 |
| `BookingSuccess.vue` | 订单凭证展示；用 `uni.setClipboardData` 实现复制订单号 |
| 订阅消息授权 | 预约成功时调 `wx.requestSubscribeMessage`，用户授权后服务端可推送通知 |
| `OrderQuery.vue` | 手机号 + 订单号查询（P1）|
| 异常提示 | 用 `uni.showToast` / `uni.showModal` 替代浏览器 Toast |
| 并发冲突后刷新 | 收到 1001 → `refresh()` 强制刷新日历 + 保留表单 |

**幂等 key 生成（小程序版）：**

```typescript
// apps/miniprogram/src/composables/useBooking.ts

function generateIdempotencyKey(): string {
  // wx.getStorageSync 持久化，页面关闭后重开仍能防重复提交
  let key = wx.getStorageSync('pending_idempotency_key');
  if (!key) {
    key = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    wx.setStorageSync('pending_idempotency_key', key);
  }
  return key;
}

// 提交成功后清除，防止下次预约复用同一个 key
function clearIdempotencyKey() {
  wx.removeStorageSync('pending_idempotency_key');
}
```

**一键获取手机号（需微信认证资质）：**

```html
<!-- apps/miniprogram/src/pages/index/index.vue -->

<!-- 方式一：认证后可用，用户体验最佳 -->
<button open-type="getPhoneNumber" @getphonenumber="onGetPhone">
  一键填入手机号
</button>

<!-- 方式二：降级方案，手动输入 -->
<uni-easyinput v-model="form.phone" type="number" placeholder="请输入手机号" />
```

#### 交付物
- 微信开发者工具可完整走通预约流程
- 真机预览通过（iOS + Android 各一台）
- 5 种日历状态视觉截图
- 订阅消息授权弹窗触发正常

---

### Phase 3 · 管理后台（第 6–7 周）

**目标：** 实现管理员全部操作界面，对应 PRD 第六章原型。

#### 第 6 周：排期管理 + 订单列表

| 任务 | 说明 |
|------|------|
| 管理员登录页 + JWT 存储 | `localStorage`（Web 端）+ Axios 请求头注入 |
| Token 过期自动跳转登录 | 401 响应拦截器处理，保存跳转路径 |
| `ScheduleCalendar.vue` | 月历视图，色块显示饱和度（满/紧/宽/休）|
| 设置每日上限弹窗 | 实时更新，失效 Redis 缓存 |
| 添加休息日弹窗 | 日期选择器 + 确认 |
| 特定日期名额覆盖 | 点击日格 → 弹窗修改 |
| `OrderList.vue` | 表格 + 状态筛选 Tab + 分页 |

#### 第 7 周：订单详情 + 状态操作

| 任务 | 说明 |
|------|------|
| `OrderDetail.vue` | 侧滑面板，展示完整订单信息 |
| `StatusFlow.vue` | 状态流转进度条 + 操作按钮 |
| 状态变更 API 对接 | `PATCH /api/admin/order/:id/status` |
| 二次确认弹窗 | 取消订单时弹窗 |
| 取消订单名额释放 | 后端取消后 booked_slots -1，失效缓存 |

#### 交付物
- 管理后台全流程可用
- 订单状态流转端到端测试通过
- 管理员鉴权安全测试（未授权访问返回 401）

---

### Phase 4 · 集成测试 + 优化（第 8 周）

**目标：** 全链路测试，性能达标，准备上线。

#### 功能测试矩阵

| 测试场景 | 预期结果 |
|---------|---------|
| 10 并发抢最后 1 个名额 | 仅 1 人成功，其余返回 1001 |
| 同手机同日期重复提交 | 第 2 次返回 1003 |
| 同 idempotency_key 重复请求 | 返回原订单号（code 1005）|
| Redis 宕机时提交订单 | 降级走 MySQL，正常返回 |
| 管理员设置休息日后 60s 内 | 前端日历刷新后显示灰色 |
| 取消订单后名额 | booked_slots 立即 -1 |
| 管理员 Token 过期 | 401 → 跳转登录，返回后路径保留 |
| 小程序 session_key 过期 | 重新静默登录，用户无感知 |
| 小程序冷启动（无缓存）| 日历正常加载，无白屏 |
| 网络超时（>5s）| `uni.showModal` 提示超时，表单内容保留 |

#### 性能测试

```bash
# 日历接口：100 并发，目标 P99 ≤ 1s
npx autocannon -c 100 -d 30 http://localhost:3000/api/schedule/calendar

# 订单提交：50 并发，目标无超卖
npx autocannon -c 50 -d 10 -m POST ... http://localhost:3000/api/order/submit
```

#### 安全检查

- [ ] 手机号脱敏（响应中 138\*\*\*\*0000）
- [ ] SQL 注入防护（Prisma ORM 参数化查询）
- [ ] 管理后台 CSRF Token（Web 端）
- [ ] 客户端限速（同 IP 每分钟 ≤ 10 次）
- [ ] JWT 过期 + 篡改检测
- [ ] AppSecret 不能出现在小程序包内（必须在服务端调用 code2session）
- [ ] `wx.setStorageSync` 中不存储敏感信息（手机号、openid 等）
- [ ] 小程序合法域名配置正确，不依赖「不校验域名」开关上线

#### 上线部署

```
# 生产环境 docker-compose（单机）
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]

  api:
    build: ./packages/server
    environment:
      DATABASE_URL: mysql://...
      REDIS_URL: redis://redis:6379
      JWT_SECRET: <强随机串>
    restart: unless-stopped

  mysql:
    image: mysql:8.0
    volumes: [mysql_data:/var/lib/mysql]

  redis:
    image: redis:7-alpine
    command: redis-server --save 60 1
```

#### 交付物
- 测试报告（功能 + 并发 + 安全）
- 小程序审核提交（微信公众平台）
- 上线部署文档
- 监控告警配置（日志 + 错误率）

---

### Phase 5（可选）· 迭代增强（第 9 周起）

对应 PRD 第十四章产品优化建议：

| 功能 | 优先级 | 说明 |
|------|--------|------|
| 微信订阅消息推送 | P1 | Phase 2 已做用户授权，本阶段接通服务端推送：新订单提醒管理员、预约成功通知客户 |
| 数据统计图表 | P2 | 预约趋势折线图，热门日期热力图 |
| 候补队列 | V2.0 | 名额释放时自动通知候补客户 |
| 微信/支付宝支付 | V1.2 | 定金预约模式 |
| 多管理员支持 | V2.0 | 角色权限扩展 |

---

## 五、开发里程碑总览

```
Week 1   │ Phase 0 │ 工程骨架 + DB Schema + 本地环境
─────────┼─────────┼────────────────────────────────────
Week 2   │         │ 配置 API + 排期日历 API
Week 3   │ Phase 1 │ 订单 API + 鉴权 + 并发测试
─────────┼─────────┼────────────────────────────────────
Week 4   │         │ 小程序基础 + 日历组件
Week 5   │ Phase 2 │ 预约表单 + 成功页 + 小程序特性适配
─────────┼─────────┼────────────────────────────────────
Week 6   │         │ 管理后台：排期 + 订单列表
Week 7   │ Phase 3 │ 管理后台：订单详情 + 状态操作
─────────┼─────────┼────────────────────────────────────
Week 8   │ Phase 4 │ 集成测试 + 性能优化 + 上线部署
─────────┼─────────┼────────────────────────────────────
Week 9+  │ Phase 5 │ 迭代增强（按需）
```

**总计：8 周核心开发，1 人全栈可行，2 人前后端分工更稳。**

---

## 六、关键风险与应对

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| 并发超卖 | 中 | 高 | 乐观锁 + 数据库事务，Phase 1 末并发测试验收 |
| Redis 单点故障 | 低 | 中 | 降级直查 MySQL，不阻断核心流程 |
| 幂等 key 碰撞 | 极低 | 低 | UUID v4，数据库唯一索引兜底 |
| 管理员 Token 泄露 | 低 | 高 | 短有效期（7 天）+ HTTPS 强制 + Refresh 机制（V2）|
| 日历缓存脏数据 | 中 | 低 | 写操作主动失效 + 提交前后端二次校验 |
| 小程序审核被拒 | 中 | 高 | 提前阅读微信审核规范；预约类小程序需提供「服务类目」资质（摄影/个人工作室）|
| AppSecret 泄露 | 低 | 高 | AppSecret 仅存服务端环境变量，绝不打包进小程序 |
| 手机号获取资质不足 | 中 | 中 | 降级为手动输入；认证通过后再启用一键获取 |

---

*文档版本 Dev-1.0（微信小程序版）· 修图服务预约排期系统开发实施文档 · 2026-05*
