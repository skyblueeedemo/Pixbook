# 开发规则 · Rules

> 在此目录下放置编码规范、分支策略、Code Review 规则等

---

## Git 分支策略

- `main` — 生产环境
- `dev` — 集成测试
- `feat/*` — 功能分支
- `fix/*` — 修复分支

## Commit Message 规范

```
feat(模块): 简短描述
fix(模块): 简短描述
docs: 文档变更
refactor: 重构
test: 测试
```

## 代码规范

- TypeScript 严格模式
- ESLint + Prettier 统一格式化
- 组件名 PascalCase，文件名 kebab-case
- API 接口遵循 RESTful 约定
