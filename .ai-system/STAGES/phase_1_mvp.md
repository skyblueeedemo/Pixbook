# Phase 1 · 核心后端

> 时间：第 2–3 周
> 目标：实现全部 P0 级 API，并发安全，可独立通过接口测试
> 状态：⚪ 待开始

---

## 模块拆解

### 模块 1：配置服务（第 2 周前半）

| 任务 | 说明 |
|------|------|
| `GET /api/admin/config` | 返回全局配置 |
| `PUT /api/admin/config` | 更新配置 |
| `PUT /api/admin/schedule/:date/override` | 特定日期名额覆盖 |
| ConfigService 单元测试 | 覆盖默认值、边界值 |

### 模块 2：排期日历 API（第 2 周后半）

| 任务 | 说明 |
|------|------|
| `GET /api/schedule/calendar` | 生成未来 N 天状态数组 |
| ScheduleService 可用性算法 | 5 种状态判定逻辑 |
| Redis 缓存层 | TTL 60s，写操作主动失效 |
| 降级处理 | Redis 宕机时直查 MySQL |

### 模块 3：订单提交 API（第 3 周）

| 任务 | 说明 |
|------|------|
| `POST /api/order/submit` | 乐观锁 + 幂等提交 |
| `GET /api/order/query` | 双验证查询 |
| 并发冲突重试 | 自动重试 1 次 |
| 限速中间件 | 同 IP 每分钟 ≤ 10 次 |

### 模块 4：微信登录（第 3 周）

| 任务 | 说明 |
|------|------|
| `POST /api/wechat/login` | code → openid → session_key |
| users 表创建/查询 | openid 自动建档 |

### 模块 5：管理员鉴权

| 任务 | 说明 |
|------|------|
| `POST /api/admin/login` | 账号密码 → JWT |
| JWT Guard | 保护 `/api/admin/*` |

---

## 交付物

- [ ] 全部 P0 API 可用
- [ ] Postman Collection
- [ ] 单元测试覆盖率 ≥ 70%
- [ ] 并发测试报告（无超卖）
