# Phase 2 · 客户端小程序

> 时间：第 4–5 周
> 目标：uni-app 实现完整的客户预约流程，真机预览通过
> 状态：⚪ 待开始

---

## 任务清单

### 第 4 周：小程序基础 + 日历组件

| 任务 | 说明 |
|------|------|
| `pages.json` 路由配置 | index / success / query 三个页面 |
| `request.ts` 封装 | `uni.request` Promise 化 |
| `useAuth` composable | `wx.login` → sessionKey |
| 小程序启动静默登录 | `App.vue` onLaunch |
| `useCalendar` composable | 缓存用 `wx.setStorageSync` |
| `BookingCalendar.vue` | 月历网格，swiper 翻月 |
| `DayCell.vue` | 5 种状态 wxss 样式 |
| `CalendarLegend.vue` | 图例组件 |
| 今日高亮 + 禁用逻辑 | T+1 限制 |

### 第 5 周：表单 + 成功页 + 小程序特性

| 任务 | 说明 |
|------|------|
| `BookingForm.vue` | 5 字段 + uni-forms 校验 |
| 手机号一键获取 | `open-type="getPhoneNumber"` |
| `useBooking` composable | 幂等 key + 提交 + 防重 |
| `BookingSuccess.vue` | 订单凭证 + 复制订单号 |
| 订阅消息授权 | `wx.requestSubscribeMessage` |
| `OrderQuery.vue` | 手机号 + 订单号查询 |
| 异常提示 | `uni.showToast` / `uni.showModal` |

---

## 交付物

- [ ] 微信开发者工具完整预约流程
- [ ] 真机预览通过（iOS + Android）
- [ ] 5 种日历状态视觉截图
- [ ] 订阅消息授权弹窗正常触发

---

## 样式规范

```css
.dc-avail  { background: #EAF3DE; }  /* 可预约 */
.dc-hot    { background: #FAEEDA; }  /* 即将约满 */
.dc-full   { background: #FCEBEB; }  /* 已满 */
.dc-off    { background: #F2F2F7; }  /* 不可预约 */
.dc-today  { outline: 2rpx solid #378ADD; }  /* 今日 */
.dc-sel    { outline: 3rpx solid #1D9E75; }  /* 已选中 */
```
