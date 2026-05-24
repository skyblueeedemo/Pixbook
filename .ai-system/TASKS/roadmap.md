# 开发路线图 · Roadmap

## 阶段总览

```
Week 1   │ Phase 0 │ ✅ 工程骨架 + DB + Docker
Week 2-3 │ Phase 1 │ ✅ 6 API + 乐观锁 + 测试
Week 4-5 │ Phase 2 │ ✅ 小程序：日历/表单/查询/登录/真机
Week 6-7 │ Phase 3 │ 🔴 管理后台
Week 8   │ Phase 4 │ ⬜ 集成测试 + 上线
```

> 当前进度：M0 + M1 + M2 已完成，进入 M3。

## Phase 0 · 工程骨架 ✅

uni-app + NestJS + Prisma + Docker Compose 全部跑通。

## Phase 1 · 核心后端 ✅

- schedule / order / wechat / config / auth 五大模块
- 乐观锁并发控制，10 并发零超卖
- 17 单元测试全过

## Phase 2 · 小程序 ✅

- 日历月视图 + 5 种状态色
- 预约表单 + 校验 + 提交
- 成功页 + 订单查询
- 微信静默登录 + 真机预览

## Phase 3 · 管理后台 🔴

- 登录页（已有骨架）
- 订单列表 + 筛选 + 分页
- 订单详情 + 状态流转
- 配置管理

## Phase 4 · 上线 ⬜

- 全链路测试
- 小程序审核提交
- 部署文档
