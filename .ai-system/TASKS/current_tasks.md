# 当前任务

> 阶段：Phase 5 — V1.0.1 伪上线 ✅
> 更新时间：2026-05-25

---

## ✅ V1.0.1 已完成

### Bug 修复
- [x] 系统配置保存失效（snake_case → camelCase 映射）
- [x] 配置变更后小程序缓存不更新（30s + 下拉刷新）
- [x] PM2 .env 不加载（dotenv main.ts 预加载）
- [x] UI对齐 + 翻页箭头（← →）

### 新功能 · 联系方式硬字段
- [x] Order 表 contactMethod + contactValue 列
- [x] customerPhone 改为可选
- [x] 小程序表单重排（联系方式 → 姓名下方第一位）
- [x] 查询去重 contactValue 替代 phone

### 新功能 · 自定义预约表单
- [x] Order 表 custom_fields JSON 列
- [x] booking_form_fields 配置读写
- [x] GET /api/config/booking-form 公开接口
- [x] 管理后台字段配置 UI + 字段标识自动生成（拼音）
- [x] 小程序表单动态渲染
- [x] 管理后台订单详情自定义字段展示

### 部署固化
- [x] ecosystem.config.js
- [x] deploy.sh
- [x] .env.example 更新
- [x] request.ts IS_PROD 开关

---

## 🔴 上线前

- [ ] 域名 + SSL 证书
- [ ] Nginx HTTPS 配置
- [ ] 微信公众平台合法域名
- [ ] 小程序提交审核

## 🔮 V1.1 后续迭代

- [ ] 微信订阅消息推送
- [ ] 微信一键获取手机号
- [ ] 数据统计图表
- [ ] Swagger API 文档
- [ ] CI/CD
