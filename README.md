# 修图约 · Pixbook

> 修图服务预约排期系统 — 微信小程序版 V1.0.1

<p align="center">
  <img src="apps/miniprogram/src/static/miniprogram-ico.png" width="120" alt="Pixbook Logo">
</p>

面向个人修图师和小型工作室的在线预约排期系统，解决人工排期混乱、超额接单、沟通成本高等痛点。

---

## 功能

### 📱 小程序（用户端）

| 页面 | 功能 |
|------|------|
| 首页 | 品牌展示 + 三步引导（选日期→填需求→提交） |
| 日历 | 月视图 · 5 色状态 · 点击选中 · 下拉刷新 |
| 表单 | 基础字段 + 自定义字段动态渲染（修图档位/附加项目/角色/联系方式） |
| 成功页 | 订单信息卡片 · 一键复制订单号 |
| 查询页 | 姓名+手机号 或 姓名+订单号 |

### 🖥️ 管理后台

| 页面 | 功能 |
|------|------|
| 总览 | 汇总卡片 + 最近订单 |
| 订单管理 | 筛选 · 分页 · 详情（含自定义字段）· 6 种状态流转 |
| 排期管理 | 月历 · 单日名额/休息日 · 当日预约列表 |
| 系统配置 | 基础参数 + 预约表单字段增删改（select/multi_select/text） |

### 状态流转

```
待确认(0) → 已确认(1) → 修图中(2) → 待交付(3) → 已完成(4)
    │            │            │
    └─── 已取消(5) ←───────────┘
```

---

## 技术栈

| 层 | 技术 |
|----|------|
| 小程序 | uni-app + Vue 3 + TypeScript |
| 管理后台 | Vue 3 + Vite + Element Plus + TypeScript |
| 后端 | NestJS + Prisma ORM + MySQL 8 + Redis 7 |
| 部署 | PM2 + Nginx + Bash 脚本 |

---

## 项目结构

```
Pixbook/
├── apps/
│   ├── miniprogram/         # uni-app 微信小程序
│   │   └── src/
│   │       ├── pages/       # home / index / success / query
│   │       ├── components/  # calendar / booking
│   │       ├── composables/ # useCalendar / useBooking / useAuth / useOrderQuery
│   │       └── api/         # request.ts
│   └── admin/               # Vue 3 管理后台
│       └── src/
│           ├── views/       # Dashboard / Orders / Schedule / Config
│           └── components/  # AdminLayout
├── packages/
│   └── server/              # NestJS 后端
│       └── src/modules/
│           ├── schedule/    # 排期日历 API
│           ├── order/       # 订单提交/查询/管理 + customFields
│           ├── wechat/      # 微信静默登录
│           ├── config/      # 全局配置 + booking_form_fields
│           └── auth/        # JWT 鉴权
├── ecosystem.config.js      # PM2 进程管理
├── deploy.sh                # 一键部署脚本
├── setup-env.sh             # 环境检测安装脚本
├── .env.example             # 环境变量模板
├── docs/                    # 部署指南 + 审核清单
└── .ai-system/              # 项目管理文档
```

---

## 部署

### 快速开始

```bash
# 1. 克隆代码
git clone https://github.com/skyblueeedemo/Pixbook.git
cd Pixbook

# 2. 环境检测（自动识别宝塔 / Ubuntu，缺什么装什么）
bash setup-env.sh

# 3. 配置环境变量
cp .env.example packages/server/.env
vim packages/server/.env

# 4. 初始化数据库
pnpm --prefix packages/server db:migrate
pnpm --prefix packages/server db:seed

# 5. 一键部署
./deploy.sh
```

---

### 环境要求

| 组件 | 说明 |
|------|------|
| Node.js 24+ | `setup-env.sh` 自动检测 |
| pnpm 9+ | 脚本自动安装 |
| PM2 | 脚本自动安装 |
| MySQL 8 | 宝塔软件商店安装 / `apt install mysql-server` |
| Redis 7 | 宝塔软件商店安装 / `apt install redis-server` |
| Nginx | 宝塔软件商店安装 / `apt install nginx` |

> `setup-env.sh` 会自动检测以上组件，已安装的跳过，缺失的给出安装命令。
> 如果 MySQL/Redis 不想装宿主机，可以用 `docker compose up -d` 替代（项目自带 `docker-compose.yml`）。

---

### 初次部署

clone 后在项目根目录执行：

```bash
# 安装 Node 依赖
pnpm install

# 建库建表 + 种子数据
pnpm --prefix packages/server db:migrate
pnpm --prefix packages/server db:seed

# 构建
pnpm build:server
pnpm build:admin

# 启动
pm2 start ecosystem.config.js
pm2 save
```

配置 Nginx（宝塔在「网站」→「添加站点」→ 配置文件）：

```nginx
server {
    listen 80;
    server_name 你的域名或IP;

    root /home/admin/Pixbook/apps/admin/dist;

    location /api {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

### 日常更新

```bash
git pull && ./deploy.sh
```

`deploy.sh` 自动执行：install → migrate → build → PM2 重启。

> 服务器访问不了 GitHub？手动拉代码后跑：
> ```bash
> pnpm install && pnpm build:server && pnpm build:admin && pm2 restart pixbook-api
> ```

---

### 服务器重启后

```bash
pm2 resurrect
```

如果 PM2 没保存过状态：

```bash
pm2 start ecosystem.config.js
pm2 save
```

Nginx / MySQL / Redis 在宝塔中默认开机自启，无需手动操作。

---

## 本地开发

```bash
pnpm dev:server   # 后端 API → http://localhost:3000
pnpm dev:admin    # 管理后台 → http://localhost:5173
pnpm dev:mp       # 小程序 → 微信开发者工具打开 dist/dev/mp-weixin
```

本地没有 MySQL/Redis？项目自带 `docker-compose.yml`：

```bash
docker compose up -d   # 启动 MySQL 8 + Redis 7
```

---

## 测试

### 单元测试

```bash
pnpm --prefix packages/server test
```

### 并发测试

```bash
pnpm --prefix packages/server test:concurrent
```

### 全链路测试

1. 小程序 → 首页 → 开始预约 → 选日期 → 填表单 → 提交
2. 管理后台 → 订单管理 → 查看详情（含自定义字段）→ 流转状态
3. 小程序 → 查询页 → 确认状态更新

---

## 小程序审核

详见 [`docs/review-checklist.md`](docs/review-checklist.md)。

上线前检查：
- [ ] 域名 + SSL 证书（HTTPS）
- [ ] 微信公众平台配置合法域名
- [ ] `.env` 修改所有占位符
- [ ] `request.ts` 中 `IS_PROD = true`

---

## 文档索引

| 文档 | 说明 |
|------|------|
| [项目状态](.ai-system/project_state.md) | V1.0.1 伪上线 |
| [里程碑](.ai-system/TASKS/milestone.md) | M0-M5 |
| [路线图](.ai-system/TASKS/roadmap.md) | 开发时间线 |
| [阶段计划](.ai-system/STAGES/) | Phase 0-5 |
| [决策记录](.ai-system/MEMORY/decisions.md) | 20 条架构决策 |
| [经验教训](.ai-system/MEMORY/learnings.md) | 15 条踩坑经验 |
| [错误记录](.ai-system/MEMORY/mistakes.md) | 19 条 Bug 记录 |
| [架构演进](.ai-system/MEMORY/architecture_history.md) | V1.0 → V1.0.1 |
| [部署指南](docs/deployment.md) | Nginx + HTTPS 详细配置 |
| [审核清单](docs/review-checklist.md) | 小程序提审准备 |

---

## 项目状态

🔵 **V1.0.1 伪上线完成**

### MVP 交付（V1.0.0）

- 17 单元测试 · 11 API 端点 · 10 并发零超卖
- Phase 0-4 全部完成 · 管理后台 + 小程序 + 后端 API 全栈可用

### V1.0.1 新增

- Bug 修复：配置保存 / 缓存同步 / .env 加载
- 自定义预约表单字段（动态渲染 + JSON 存储）
- PM2 + deploy.sh + setup-env.sh 部署三件套
- 首页引导页 + 成功页美化 + 日历动效 + 表单分组
- 待域名 + HTTPS 后正式上线
