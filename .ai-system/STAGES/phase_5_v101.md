# Phase 5 · V1.0.1 伪上线

> 时间：第 9–10 周
> 目标：Bug 修复 + 部署固化 + 自定义预约表单 + 全链路验证 + 生产上线
> 状态：🟢 已上线（2026-05-26）

---

## Bug 修复

| 任务 | 根因 | 修复 | 状态 |
|------|------|------|:--:|
| 系统配置保存后不生效 | 前后端 key 名 snake_case vs camelCase 不匹配 | ConfigController 加 mapSnakeToCamel 映射 | ✅ |
| 配置修改后小程序不更新 | 客户端缓存 60s + 无主动刷新 | 缓存缩至 30s + 下拉刷新 | ✅ |
| 排期管理设额度后小程序不同步 | 同上 | 同上 | ✅ |
| PM2 启动后 .env 不加载 | CWD 不在 packages/server | main.ts 顶部 dotenv 预加载 | ✅ |
| UI对齐问题 + 翻页箭头 | inline-block 对齐偏差，翻页无视觉提示 | 修复对齐 + 翻页按钮加 ← → 箭头 | ✅ |

## 新功能 · 联系方式硬字段

| 任务 | 说明 | 状态 |
|------|------|:--:|
| Order 表新增 contactMethod/contactValue | Prisma migration + DTO 更新 | ✅ |
| customerPhone 改为可选 | schema 字段 Optional，表单不再强制 | ✅ |
| 小程序表单重排 | 联系方式提升到姓名下方第一位，手机号下移选填 | ✅ |
| 查询逻辑适配 | contactValue 替代 phone 参与去重 + 查询 | ✅ |
| 种子数据清理 | 移除 contact_method/contact_value JSON key | ✅ |

## 新功能 · 自定义预约表单

| 任务 | 说明 | 状态 |
|------|------|:--:|
| DB 新增 custom_fields JSON 列 | Order 表 Prisma migration | ✅ |
| 后端 booking_form_fields 配置 | ConfigService 读写 + 公开接口 GET /api/config/booking-form | ✅ |
| 管理后台字段配置 UI | ConfigView 字段增删改 + 字段标识自动生成（拼音） + 编辑框隐藏 | ✅ |
| 小程序表单动态渲染 | select/multi_select/text 三类型 + 必填校验 | ✅ |
| 管理后台订单详情展示 | customFields 格式化展示 | ✅ |

## 部署固化

| 任务 | 说明 | 状态 |
|------|------|:--:|
| ecosystem.config.js | PM2 配置入库 | ✅ |
| deploy.sh | 一键部署脚本（git pull → install → migrate → build → restart） | ✅ |
| .env.example 更新 | 生产环境注释 + 部署指引 | ✅ |
| request.ts 环境切换 | IS_PROD 开关 + DEV_URL/PROD_URL | ✅ |
| setup-domain.sh | 域名 + SSL + Nginx 一键脚本 | ✅ |

## 生产部署

| 任务 | 说明 | 状态 |
|------|------|:--:|
| 域名 pixbook.top | DNS A 记录 → 120.55.96.207 | ✅ |
| SSL 证书 | Let's Encrypt / certbot 自动续期 | ✅ |
| Nginx 反向代理 | /api → NestJS:3000 + 管理后台静态文件 | ✅ |
| 管理后台上线 | https://pixbook.top | ✅ |
| 小程序 PROD_URL | https://pixbook.top/api | ✅ |

## 全链路测试

| 测试项 | 结果 |
|------|:--:|
| 管理后台登录 | ✅ |
| 系统配置修改 → 排期管理同步 | ✅ |
| 小程序日历展示 | ✅ |
| 小程序预约提交 | ✅ |
| 自定义字段填写 + 提交 | ✅ |
| 管理后台查看订单详情（含自定义字段） | ✅ |
| 订单状态流转 | ✅ |
| 订单取消释放名额 | ✅ |

## 交付物

| 交付物 | 路径 |
|------|------|
| Git Tag | `v1.0.1` — 初版全链路跑通 |
| PM2 配置 | `ecosystem.config.js` |
| 部署脚本 | `deploy.sh` |
| 域名脚本 | `setup-domain.sh` |
| 环境脚本 | `setup-env.sh` |
| 环境变量模板 | `.env.example` |
| 数据库迁移 | prisma migration（custom_fields 列） |
| 阶段文档 | `.ai-system/STAGES/phase_5_v101.md` |
