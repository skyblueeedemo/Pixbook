# 里程碑 · Milestones

---

## M0 · 工程骨架就绪（Week 1 末）🟢 DONE

- [x] 项目文档已就绪（PRD + Dev Spec）
- [x] monorepo 可本地启动
- [x] Docker Compose 环境可用
- [x] Prisma migration 通过
- [x] 后端 API 可访问（`GET /api/schedule/calendar`）
- [x] 管理后台可启动（`pnpm dev:admin` → :5173）
- [ ] 小程序空白页面可在微信开发者工具预览（延后到 Phase 2）

## M1 · 后端核心可用（Week 3 末）🟢 DONE

- [x] 全部 P0 API 通过 curl 测试
- [x] 并发测试零超卖
- [ ] 微信登录接口可用（代码已写，待真机联调）
- [x] 单元测试 17 个（OrderService + ScheduleService）

## M2 · 客户端可预约（Week 5 末）🔴 NEXT

- [ ] 完整预约流程走通（日历 → 表单 → 成功页）
- [ ] 真机预览通过（iOS + Android）
- [ ] 5 种日历状态视觉正确

## M3 · 管理后台可用（Week 7 末）

- [ ] 全流程管理操作通过
- [ ] 订单状态流转端到端测试通过
- [ ] 管理员鉴权安全测试通过

## M4 · 上线就绪（Week 8 末）

- [ ] 全链路测试通过
- [ ] 性能测试达标
- [ ] 小程序审核提交
- [ ] 部署文档完成
