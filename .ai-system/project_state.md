# 项目状态 · Project State

> 最后更新：2026-07-29
> 状态：🟡 已上线，Bug 修复中 (pixbook.top)
> Git Tag: `v1.0.1`

## 🔧 当前修复

### 日期顺延 Bug（2026-07-29）
- **根因**: 时区不安全的日期查询边界 — `new Date(localDate + 'T00:00:00.000Z')` 将本地日期当作 UTC 零点，在 UTC+8 服务器上 MySQL DATE 列比较偏移 8 小时
- **影响**: `getCalendar`、`getAdminCalendar`、`listOrders`、`submit` 中所有日期边界查询
- **修复**: 全部改为本地时区零点 `new Date(dateStr + 'T00:00:00')`；添加 `toLocalDate()` helper
- **涉及文件**: `schedule.service.ts`、`order.service.ts`

### 小程序 ERR_CONNECTION_RESET
- **根因**: `IS_PROD = true` 硬编码连接 `https://pixbook.top/api`，生产服务器不可达
- **修复**: 改用 `VITE_API_BASE` 环境变量 + `NODE_ENV` 自动判断；添加 15s 超时 + 错误日志
- **涉及文件**: `apps/miniprogram/src/api/request.ts`

---

## 完成总览

```
Phase 0 ████████████████████ ✅ 工程骨架
Phase 1 ████████████████████ ✅ 后端 API + 测试
Phase 2 ████████████████████ ✅ 小程序
Phase 3 ████████████████████ ✅ 管理后台
Phase 4 ████████████████████ ✅ 上线准备
Phase 5 ████████████████████ ✅ V1.0.1 伪上线
```

---

## V1.0.1 交付物

### Bug 修复
- 系统配置保存失效（snake_case / camelCase 映射）
- 小程序缓存 + 下拉刷新
- PM2 .env 加载（dotenv 预加载）
- 订单详情字段显示英文 key → 中文标签映射

### 新功能
- 自定义预约表单字段（修图档位 / 附加项目 / 角色）
- 联系方式升为硬字段（contactMethod + contactValue），手机号改可选
- 管理后台字段配置 UI（字段标识自动生成）
- 小程序表单动态渲染 + 表单分组
- 小程序首页引导页 + 成功页美化 + 日历动效
- 订单详情展示自定义字段 + 联系方式

### 部署固化
- `ecosystem.config.js` — PM2 配置入库
- `deploy.sh` — 一键部署脚本
- `setup-env.sh` — 环境检测安装脚本
- README 三场景部署（初次 / 更新 / 重启）

### UI 优化
- 日历选中动效（缩放 + 阴影）
- 成功页（渐变背景 + 圆形✓ + 卡片信息）
- 翻页按钮文字箭头（← →）
- 底部 tab 按需注入 + 图标展位

### 代码

| 端 | 改动 |
|----|------|
| 📱 小程序 | BookingForm（联系方式硬字段 + 表单重排）+ HomePage + 下拉刷新 + 按需注入 |
| 🖥️ 管理后台 | ConfigView（字段标识自动生成）+ OrdersView（联系方式 + 字段标签映射） |
| ⚙️ 后端 | Order.contactMethod/Value + customerPhone 可选 + ConfigPublicController |

---

### 生产部署（2026-05-26 完成）
- `setup-domain.sh` — 域名 + SSL + Nginx 一键配置
- 域名 `pixbook.top` + Let's Encrypt SSL
- Nginx 反向代理 `/api` → NestJS:3000
- 管理后台 `https://pixbook.top`
- 小程序 API 地址已切为 `https://pixbook.top/api`

## 待上线

| 任务 | 说明 |
|------|------|
| 微信公众平台合法域名 | https://pixbook.top |
| 小程序提交审核 | 参考 `docs/review-checklist.md` |
