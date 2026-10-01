# AGENTS.md

## 1. 项目说明

这是 `library-management-web` 前端仓库。

项目目标：为已经完成的 FastAPI + MySQL 图书管理后端提供一个基于 React + TypeScript 的前端应用。

后端是独立仓库，已经完成并作为既有 API 契约存在。前端不得为了方便实现而擅自修改、猜测或重新定义后端接口。

开发前必须先阅读：

- `AGENTS.md`
- `docs/PROJECT_SPEC.md`
- `docs/api/openapi.json`（若存在）

如果上述文档与实际代码冲突，应优先检查当前仓库状态和 OpenAPI 契约，并在实施前说明冲突，不得静默做出破坏性假设。

---

## 2. 技术栈约定

前端统一采用：

- React
- TypeScript
- Vite
- React Router
- Ant Design
- Axios
- TanStack Query
- Zustand（仅用于少量真正的客户端全局状态）
- Vitest
- React Testing Library
- pnpm
- ESLint
- Prettier

如项目初始化时 `package.json` 已存在，以当前项目实际依赖为准，不要未经要求大版本升级。

---

## 3. 架构原则

采用 feature-based architecture。

核心职责划分：

- `pages/`：页面级编排，只负责组合功能模块和页面布局。
- `features/`：业务功能，包括 API 调用、业务 hooks、局部组件。
- `components/`：跨业务复用的通用 UI 组件。
- `api/`：Axios Client、OpenAPI 生成类型、Query Keys 等网络基础设施。
- `router/`：路由、鉴权守卫、管理员守卫。
- `store/`：仅保存必要的客户端全局状态。
- `utils/`：无业务耦合的工具函数。
- `styles/`：全局样式和主题级配置。

禁止把所有 API、类型、组件和业务逻辑集中到少数超大文件中。

---

## 4. 推荐目录

```text
src/
├── app/
│   ├── App.tsx
│   ├── providers.tsx
│   └── queryClient.ts
│
├── pages/
│   ├── LoginPage/
│   ├── BooksPage/
│   ├── BookDetailPage/
│   ├── MyLoansPage/
│   ├── ProfilePage/
│   └── admin/
│       ├── UsersPage/
│       ├── BooksPage/
│       ├── AuthorsPage/
│       ├── CategoriesPage/
│       ├── BookCopiesPage/
│       └── LoansPage/
│
├── features/
│   ├── auth/
│   ├── books/
│   ├── users/
│   ├── authors/
│   ├── categories/
│   ├── bookCopies/
│   └── loans/
│
├── components/
│   ├── AppLayout/
│   ├── PageHeader/
│   ├── Loading/
│   ├── EmptyState/
│   └── ErrorBoundary/
│
├── api/
│   ├── client.ts
│   ├── generated/
│   └── queryKeys.ts
│
├── router/
│   ├── index.tsx
│   ├── AuthGuard.tsx
│   └── AdminGuard.tsx
│
├── store/
│   └── authStore.ts
│
├── types/
├── utils/
├── styles/
└── main.tsx
```

实际实现可在不破坏职责边界的前提下调整。

---

## 5. API 契约与 OpenAPI 规则

后端 FastAPI 是 API 的唯一事实来源。

优先使用后端导出的 OpenAPI：

```text
docs/api/openapi.json
```

前端不得手工复制整套后端 DTO。

应优先从 OpenAPI 生成 TypeScript 类型。推荐使用 `openapi-typescript`；如果项目后续采用 Orval 等工具，必须先说明原因并保持生成代码与手写代码分离。

生成文件统一放在：

```text
src/api/generated/
```

生成文件不得手工修改。

如果后端 OpenAPI 与前端需求不一致：

1. 不得伪造字段。
2. 不得静默增加前端假接口。
3. 先记录差异。
4. 仅在用户明确要求后再修改后端仓库。

---

## 6. Axios 规则

统一创建单例 Axios Client：

```text
src/api/client.ts
```

不得在页面组件中直接零散创建 Axios 实例。

Axios Client 应统一处理：

- API Base URL
- Bearer Token
- 401
- 403
- 422
- 409
- 5xx
- 网络异常

不得在业务组件中重复实现通用错误处理。

---

## 7. TanStack Query 规则

后端数据属于 Server State。

以下数据默认使用 TanStack Query，而不是 `useEffect + useState` 手工维护：

- 图书列表
- 图书详情
- 用户列表
- 作者列表
- 分类列表
- 实体馆藏
- 借阅记录
- 当前用户

查询统一通过 Query Key 管理。

写操作使用 Mutation。

Mutation 成功后，应通过合理的 `invalidateQueries` 或缓存更新保持 UI 与后端一致。

不要为了“方便”把 Server State 再复制一份到 Zustand。

---

## 8. Zustand 使用规则

Zustand 只允许承载少量客户端全局状态，例如：

- 登录 token
- 当前用户的必要身份状态
- 侧边栏折叠状态
- 主题偏好

如果状态天然来自后端，则优先使用 TanStack Query。

---

## 9. 路由与权限

至少实现：

- `AuthGuard`
- `AdminGuard`

前端权限只是用户体验控制，不是安全边界。

即使前端判断用户是管理员，真正权限仍由 FastAPI 后端校验。

不得通过隐藏按钮代替后端权限控制。

---

## 10. 认证规则

第一版沿用现有 FastAPI JWT 认证方案。

前端应：

1. 登录成功后保存 access token。
2. Axios 请求自动携带 `Authorization: Bearer <token>`。
3. 应用启动后通过后端当前用户接口恢复身份。
4. 401 时清理无效登录状态并跳转登录页。
5. 403 时显示明确的无权限反馈。

除非后端已经实现 refresh token，否则前端不得自行假设 refresh token 接口存在。

---

## 11. TypeScript 规范

- 禁止无理由使用 `any`。
- 对未知错误使用 `unknown` 并安全收窄。
- API 类型优先来自 OpenAPI 生成结果。
- 组件 Props 使用明确类型。
- 不重复定义已有公共类型。
- 不滥用类型断言绕过真实问题。

---

## 12. React 规范

- 使用函数组件和 Hooks。
- 避免无意义的 `useMemo` / `useCallback`。
- 不把复杂业务逻辑全部写在页面组件中。
- 不在 render 中执行副作用。
- 表单提交、防重复提交、Loading、Empty、Error 状态必须明确处理。
- 表格操作必须考虑分页、筛选和刷新后的状态一致性。

---

## 13. Ant Design 规范

Ant Design 主要用于：

- Layout
- Menu
- Table
- Form
- Input
- Select
- Modal
- Drawer
- Pagination
- Message / Notification
- Descriptions
- Tag
- Button

优先复用 Ant Design 组件，不重复造基础 UI 轮子。

但不要把业务逻辑耦合进通用 UI 组件。

---

## 14. 环境变量

前端环境变量统一通过 Vite 使用：

```text
VITE_API_BASE_URL
```

提供 `.env.example`，不得提交真实敏感配置。

本地开发优先使用 Vite Proxy，使前端请求 `/api` 转发到 FastAPI。

禁止在业务代码中散落硬编码的：

```text
http://127.0.0.1:8000
```

---

## 15. 测试规则

至少覆盖：

### 单元 / 组件测试

- 登录表单
- AuthGuard
- AdminGuard
- 关键数据展示组件
- 关键表单校验

### API 相关测试

使用 mock 或测试层抽象验证：

- 401
- 403
- 409
- 422
- 500

### 后期可增加 E2E

可使用 Playwright 覆盖：

- 登录
- 图书查询
- 借书
- 还书
- 管理员 CRUD

不要一开始为了测试框架而阻塞核心页面开发。

---

## 16. 代码质量

提交前至少执行：

```bash
pnpm lint
pnpm test
pnpm build
```

如果项目定义了格式化命令，也应执行：

```bash
pnpm format:check
```

不得在测试失败时声称阶段完成。

---

## 17. Git 规则

- 前端仓库独立于 FastAPI 后端仓库。
- 不修改后端仓库，除非用户明确要求。
- 不提交 `.env`。
- 不提交 `node_modules/`。
- 不提交构建产物，除非项目明确需要。
- 每个 Phase 尽量保持改动聚焦。
- 不执行 destructive Git 操作。
- 不自动 push 远程仓库，除非用户明确要求。

---

## 18. 开发流程

每次接到一个 Phase 时：

1. 阅读 `AGENTS.md`。
2. 阅读 `docs/PROJECT_SPEC.md`。
3. 检查当前仓库代码和 Git 状态。
4. 检查 `docs/api/openapi.json` 或当前可用 API 契约。
5. 给出简洁实施计划。
6. 实施当前 Phase。
7. 执行 lint / test / build。
8. 汇报：
   - 修改文件
   - 关键设计决策
   - 使用的后端接口
   - 测试结果
   - 未完成项或接口阻塞
9. 停止，不提前进入下一 Phase。

---

## 19. 禁止事项

除非用户明确要求，否则不要：

- 修改 FastAPI 后端代码。
- 猜测不存在的 API。
- 增加预约管理模块。
- 增加统计报表模块。
- 引入 Redux。
- 引入 Next.js。
- 改造成 SSR。
- 改造成 monorepo。
- 引入复杂微前端。
- 引入 GraphQL。
- 引入过度抽象的 Repository / Service 前端层。
- 为简单项目搭建复杂设计系统。
- 一次性实现所有 Phase。
