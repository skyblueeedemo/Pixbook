# 项目状态 · Project State

> 最后更新：2026-05-25
> 状态：🔵 V1.0.1 伪上线完成

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

### 新功能
- 自定义预约表单字段（精修档位 / 附加项目 / 角色 / 联系方式）
- 管理后台字段配置 UI
- 小程序表单动态渲染
- 订单详情展示自定义字段

### 部署固化
- `ecosystem.config.js` — PM2 配置入库
- `deploy.sh` — 一键部署脚本
- `.env.example` — 生产环境注释

### 代码

| 端 | 改动 |
|----|------|
| 📱 小程序 | BookingForm 动态渲染 + 下拉刷新 + BASE_URL 环境切换 |
| 🖥️ 管理后台 | ConfigView 字段配置 + OrdersView 自定义字段展示 |
| ⚙️ 后端 | Order.customFields JSON + ConfigController key 映射 + ConfigPublicController |

---

## 待上线（需手动操作）

| 任务 | 说明 |
|------|------|
| 域名 + SSL | 小程序真机要求 HTTPS |
| Nginx HTTPS | 配置证书 |
| 微信合法域名 | 公众平台配置 |
| 小程序提交审核 | 参考 `docs/review-checklist.md` |
| 服务器部署 | 参考 `deploy.sh` |
