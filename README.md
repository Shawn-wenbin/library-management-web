# Library Management Web

独立的 React + TypeScript 前端仓库。目前仅实现 Phase 1：工程基础与认证。

## 本地运行

需要 Node.js >= 22.12 和 pnpm（`packageManager` 固定版本）。没有 pnpm 时先执行 `corepack enable pnpm`。

```bash
pnpm install --frozen-lockfile
pnpm dev
```

默认 Base URL 为 `/api`。可复制 `.env.example` 为 `.env` 后配置 `VITE_API_BASE_URL`。
Vite 开发服务器将 `/api` 原样代理到 `http://127.0.0.1:8000`；不删除 `/api` 前缀。
启动既有 FastAPI 服务并使用已有用户名和密码登录。前端不创建测试账号、不提供模拟登录。
生产部署需要配置 API 反向代理以及 SPA 路由回退到 `index.html`；Vite 开发代理不是生产代理。

## 命令

```bash
pnpm api:generate
pnpm lint
pnpm test
pnpm build
pnpm format:check
```

`pnpm test` 单次运行；`pnpm test:watch` 交互监听；`pnpm format` 格式化手写代码。
`pnpm-workspace.yaml` 仅保存 esbuild 的构建脚本许可，项目仍为单包仓库。

## 当前目录

```text
src/
├── api/
│   ├── generated/schema.d.ts
│   ├── client.ts
│   ├── client.test.ts
│   ├── errors.ts
│   └── queryKeys.ts
├── app/
│   ├── App.tsx
│   ├── providers.tsx
│   └── queryClient.ts
├── components/
│   ├── AppLayout/index.tsx
│   └── Loading/index.tsx
├── features/auth/
│   ├── api.ts
│   ├── types.ts
│   ├── hooks.ts
│   ├── LoginForm.tsx
│   ├── SessionBoundary.tsx
│   └── auth.test.tsx
├── pages/
│   ├── LoginPage/index.tsx
│   └── PlaceholderPage/index.tsx
├── router/
│   ├── index.tsx
│   ├── navigation.ts
│   ├── AuthGuard.tsx
│   └── AdminGuard.tsx
├── store/authStore.ts
├── styles/global.css
├── test/
│   ├── fixtures.ts
│   └── setup.ts
└── main.tsx
```

## OpenAPI 契约与差异

唯一契约是 `docs/api/openapi.json`。`pnpm api:generate` 调用 `openapi-typescript`，输出 `src/api/generated/schema.d.ts`。生成文件不手工编辑，也不参与 Prettier/ESLint 格式改写。认证模块从生成的 `paths` 引用请求和响应类型，没有复制后端 DTO。

本阶段仅调用两个接口：

- `POST /api/v1/auth/login`：JSON `{ username, password }`，密码 8–128 字符；成功返回 `access_token`，`token_type` 可省略、默认 `bearer`。
- `GET /api/v1/users/me`：请求头 `Authorization: Bearer <token>`，成功返回 `UserOutput`，其中 `role` 为 `READER | ADMIN`。

规范提到用户名/邮箱登录，但契约仅声明 `username`，因此界面只承诺用户名登录。
OpenAPI 未声明 401/403/409/5xx 的响应 schema；错误层按状态码处理未知数据，409 仅在安全识别到字符串 `detail` 时展示原文，否则使用通用提示。此兼容处理不等于确认后端返回该结构。422 使用已声明的校验项结构，并做运行时收窄。5xx 不展示服务端内部错误内容。
OpenAPI 仅声明 HTTP Bearer，未逐接口描述角色授权规则；前端管理路由按项目规范限制为 ADMIN，实际权限仍由后端执行。
没有 refresh token 或退出登录接口，退出仅清除本地会话和查询缓存。

## 认证与数据管理

登录使用 TanStack Query Mutation。登录成功后 Zustand 将 token 持久化至 localStorage；当前用户不写入 Zustand。身份查询成功且账号启用后进入原目标路由（默认 `/books`）。
刷新页面时同步读取本地 token，由 `useCurrentUser` 查询后端恢复身份。Query Key 在 `src/api/queryKeys.ts` 集中定义，按客户端会话版本隔离，不把 token 放入 Query Key。相同会话的守卫和布局共用查询缓存。当前用户查询失败显示重试和重新登录入口，不把网络故障当作退出登录。

`AuthGuard` 在身份确认前显示 Loading，未登录回到 `/login` 并记录内部返回地址。`AdminGuard` 嵌套于 `AuthGuard` 下，READER 直接访问管理员 URL 也会看到 403。菜单根据后端返回的角色生成。馆藏入口需要具体图书，本阶段菜单禁用并注明从图书进入，不伪造 bookId。

统一 Axios Client 提供 Base URL、15 秒超时、Bearer 头、状态码错误标准化。当前会话的 401 清除 token，缓存订阅取消查询并清空账号数据，守卫随后跳转登录。旧请求晚到的 401 不会清理新登录会话。403 明确显示“无权限访问”；409、422、5xx 和网络错误统一转为 `ApiError`。登录请求不附带旧 token。

用户信息与异步状态由 TanStack Query 管理；登录 Mutation 不自动重试，避免重复提交。退出与会话切换清空所有服务端缓存。侧栏折叠仅为组件内状态。

## 阶段边界与验证

图书、借阅、个人信息和管理员业务路由只显示占位，不发送业务请求。没有实现 Phase 2–4、注册、资料修改、预约或统计模块。

Vitest + React Testing Library 通过 Axios adapter mock 验证真实组件、路由、查询缓存和拦截器：表单校验/提交、认证恢复、退出、401/403/409/422/500、网络异常、身份重试、角色导航、停用账号以及旧会话响应隔离。
这些自动化测试不替代使用真实后端账号的端到端联调。
