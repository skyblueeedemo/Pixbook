# 架构演进记录 · Architecture History

## V1.0 · 初始架构（2026-05-24）

### 系统架构

```
┌─────────────────────────────────────────────────────┐
│                    客户端层                           │
│  ┌──────────────────┐  ┌──────────────────┐         │
│  │  微信小程序        │  │  管理后台 Web      │         │
│  │  uni-app + Vue 3  │  │  Vue 3 + Vite     │         │
│  │  uni.request      │  │  Axios + Element  │         │
│  └────────┬─────────┘  └────────┬─────────┘         │
│           │                     │                    │
│           └──────────┬──────────┘                    │
│                      │ HTTP / HTTPS                  │
├──────────────────────┼──────────────────────────────┤
│                      ▼                               │
│  ┌──────────────────────────────────┐               │
│  │     NestJS API Server             │               │
│  │  ┌───────┐ ┌───────┐ ┌───────┐  │               │
│  │  │schedule│ │ order │ │wechat │  │               │
│  │  ├───────┤ ├───────┤ ├───────┤  │               │
│  │  │config │ │ auth  │ │common │  │               │
│  │  └───────┘ └───────┘ └───────┘  │               │
│  └──────┬────────────┬──────────────┘               │
│         │            │                               │
│         ▼            ▼                               │
│  ┌──────────┐  ┌──────────┐                         │
│  │  MySQL 8 │  │ Redis 7  │                         │
│  └──────────┘  └──────────┘                         │
└─────────────────────────────────────────────────────┘
```

### 已完成模块

| 模块 | 职责 | 关键设计 |
|------|------|---------|
| schedule | 排期日历 API | Easy!Appointments 算法 + Redis TTL 60s |
| order | 订单提交/查询/状态流转 | 乐观锁 + 幂等 key + raw SQL |
| wechat | 微信静默登录 | code2session → openid 建档 → Redis session |
| config | 全局配置 CRUD | 每日上限/预约天数/休息日 |
| auth | 管理员 JWT 鉴权 | Guard + 401 拦截 |
| common | Redis 客户端 / 工具函数 | 降级处理 |

### 前端模块

| 模块 | 技术 | 页面数 |
|------|------|:--:|
| 小程序 | uni-app / Vue 3 / inline-block CSS | 3 (日历/成功/查询) |
| 管理后台 | Vue 3 / Vite / Element Plus | 4 (总览/订单/配置/排期) |

### 关键约束

- 手机号 + 日期联合唯一（已预约不可重复提交）
- 乐观锁 `version` 防超卖（10 并发零超卖已验证）
- 幂等 key（重复请求返回原单号）
- 日历缓存 60s TTL / 写操作主动失效
- T+1 规则（当天及以前不可预约）
- 取消订单自动释放名额（`GREATEST(booked_slots - 1, 0)`）

---

## V1.0.1 · 伪上线（2026-05-25）

### 变更概览

- 🐛 Bug 修复：配置保存 snake_case/camelCase 映射、缓存同步 30s、PM2 .env 加载
- ✨ 新功能：自定义预约表单字段（动态表单 schema + JSON 存储）
- 🔧 部署固化：PM2 ecosystem.config.js + deploy.sh 一键部署
- 🎨 UI 优化：成功页美化、日历动效、首页引导页、表单分组

### 新增/变更模块

| 模块 | 变更 |
|------|------|
| config | 新增 `booking_form_fields` JSON 配置 + ConfigPublicController 公开接口 |
| order | 新增 `custom_fields` JSON 列，提交/查询/列表均返回 |
| 小程序 | BookingForm 动态渲染 + 首页引导页 + 下拉刷新 |
| 管理后台 | ConfigView 字段配置 UI + OrdersView 自定义字段展示 |

### 新增文件

| 文件 | 用途 |
|------|------|
| `ecosystem.config.js` | PM2 进程管理配置 |
| `deploy.sh` | 一键部署脚本（git pull → install → migrate → build → restart） |
| `apps/miniprogram/src/pages/home/index.vue` | 小程序首页引导页 |

### 架构决策

- **D018**：自定义表单字段采用「config JSON schema + Order.customFields JSON」模式，零 migration 扩展
- **D019**：前后端 key 名映射放 Controller 层，兼容存量前端
- **D020**：PM2 配置纳入版本控制，部署流程可复现
- **D021**：联系方式升为硬字段（contactMethod + contactValue），phone 可选

### 变更日志（V1.0.1 增量）

| 日期 | 变更 |
|------|------|
| 05-25 | 联系方式升为 Order 硬字段，手机号改可选，表单重排 |
| 05-25 | UI 全面优化：成功页/日历动效/首页/表单分组 |
| 05-25 | setup-env.sh 环境安装脚本，README 三场景部署 |
