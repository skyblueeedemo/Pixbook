# Phase 2 · 客户端小程序

> 时间：第 4–5 周
> 目标：uni-app 实现完整的客户预约流程，真机预览通过
> 状态：🟢 已完成（2026-05-24）

---

## 任务清单

### 小程序基础 + 日历组件 ✅

| 任务 | 说明 | 状态 |
|------|------|:--:|
| `pages.json` 路由配置 + TabBar | index / success / query | ✅ |
| `request.ts` 封装 | `uni.request` Promise 化，LAN IP 真机适配 | ✅ |
| `useAuth` composable | `wx.login` → sessionKey → Redis | ✅ |
| 小程序启动静默登录 | `App.vue` onLaunch | ✅ |
| `useCalendar` composable | 按月查询 / 本地缓存 / refresh | ✅ |
| `BookingCalendar.vue` | 月历网格 + ◀ ▶ 翻月 | ✅ |
| `DayCell.vue` | inline-block 7 列，5 种状态色 | ✅ |
| `CalendarLegend.vue` | 图例组件 | ✅ |
| 今日/过去禁用 | T+1 规则 + 灰色不可选 | ✅ |

### 表单 + 成功页 + 查询 ✅

| 任务 | 说明 | 状态 |
|------|------|:--:|
| `BookingForm.vue` | 5 字段 + 校验 + 乐观锁提交 | ✅ |
| `useBooking` composable | 幂等 key + 提交 + 防重 | ✅ |
| `BookingSuccess.vue` | 订单号 / 日期 / 张数 / 复制 | ✅ |
| `OrderQuery.vue` | 姓名 + 手机号 或 姓名 + 订单号 | ✅ |
| 刷新同步 | `onShow` → refresh → 名额同步 + 自动取消选择 | ✅ |
| 真机预览 | LAN IP 192.168.31.191，扫码通过 | ✅ |
| 订阅消息授权 | — | ⬜ P1 延后 |

---

## CSS 踩坑记录

| 问题 | 解决 |
|------|------|
| `scoped` 样式在 uni-app 中不稳定 | 全部去掉 `scoped`，用全局 style |
| `rpx` 单位渲染异常 | 改用纯 `px` |
| `calc()` + `aspect-ratio` + `flexbox` 不兼容 | 改用 `inline-block` + 固定 `width:13.5%` |
| 微信 `input` 原生组件不认 `padding` | 外层 `view.fd-ib` 画边框，内层 `input` 无边框 |
| 日期格子崩塌成竖线 | `width:14.28%` (100/7) + `height:50px` |

---

## 交付物

| 交付物 | 验收标准 | 状态 |
|--------|---------|:--:|
| 完整预约流程 | 日历 → 表单 → 成功页 | ✅ |
| 真机预览 | iOS + Android 扫码通过 | ✅ |
| 5 种日历状态 | 视觉正确 | ✅ |
| 订单查询 | 双模式查询 | ✅ |
| 微信登录 | 静默获取 openid | ✅ |
