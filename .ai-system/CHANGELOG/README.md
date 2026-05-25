# 变更日志 · Changelog

## 2026-05-25 · V1.0.1 伪上线

- 🐛 修复系统配置保存失效（snake_case → camelCase 映射）
- 🐛 修复配置变更后小程序缓存不更新（30s + 下拉刷新）
- 🐛 修复 PM2 .env 不加载（main.ts dotenv 预加载）
- ✨ 新增自定义预约表单（修图档位/附加项目/角色/联系方式）
- ✨ 管理后台字段配置 UI
- ✨ 小程序表单动态渲染（select/multi_select/text）
- ✨ 管理后台订单详情展示自定义字段
- 🔧 PM2 配置入库（ecosystem.config.js）
- 🔧 一键部署脚本（deploy.sh）
- 🔧 .env.example 生产环境注释
- 🔧 小程序 BASE_URL 环境切换开关

## 2026-05-24 · Phase 0-3 完成

- ✅ Phase 0 — monorepo + Docker + Prisma + 三端骨架
- ✅ Phase 1 — 6 P0 API + 乐观锁 + 17 单元测试 + 10 并发零超卖
- ✅ Phase 2 — 小程序：日历/表单/查询/微信登录/真机预览
- ✅ Phase 3 — 管理后台：登录/订单列表/状态流转/系统配置/仪表盘

## 2026-05 · 项目初始化

- 完成 PRD V1.0 文档
- 完成 Dev Spec V1.0（微信小程序版）文档
- 初始化 `.ai-system/` 项目管理结构
