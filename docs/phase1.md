# Phase 1：工程基础与认证

## 1. 阶段总结

本阶段从仅包含项目规范和 OpenAPI 的前端仓库开始，完成 React + TypeScript + Vite 工程初始化，以及登录、身份恢复、权限路由和基础布局。

阶段状态：代码实现与自动化检查已完成；真实后端账号联调尚未完成。验收时本地 `127.0.0.1:8000` 无法连接，因此不能将真实登录和浏览器刷新联调标记为通过。

实施依据：

- [开发规范](../AGENTS.md)
- [项目规格](./PROJECT_SPEC.md)
- [后端 OpenAPI 契约](./api/openapi.json)

本阶段没有修改 FastAPI 后端或原始 OpenAPI，没有执行 Git 提交或 push，也没有提前实现 Phase 2–4。

## 2. 完成的改动

### 2.1 工程与开发环境

- 初始化 React、TypeScript、Vite，使用 pnpm 管理依赖并生成锁文件。
- 在 `package.json` 固定包管理器版本，声明 Node.js 最低版本为 22.12.0。
- 配置 React Router、Ant Design 中文语言包和基础主题。
- 配置 Axios、TanStack Query 和 Zustand。
- 配置 ESLint、Prettier、Vitest、React Testing Library 和 jsdom。
- 配置开发代理：`/api` 原样转发到 `http://127.0.0.1:8000`。
- 提供 `.env.example`，通过 `VITE_API_BASE_URL` 配置 API 基础路径，默认值为 `/api`。
- 完善 `.gitignore`，忽略真实环境配置、依赖、构建产物和测试覆盖率产物。
- 添加 README，说明本地运行、接口契约、认证设计及阶段边界。

`pnpm-workspace.yaml` 仅保存 esbuild 构建脚本许可；仓库仍是单包前端项目，没有改造成 monorepo。

### 2.2 API 类型与请求基础设施

- 增加 `api:generate` 命令，根据本地 OpenAPI 生成 TypeScript 类型。
- 创建单例 Axios Client，统一 Base URL、15 秒超时、Bearer Token 和错误标准化。
- 增加 `ApiError`，统一表达状态码、用户可读消息和表单校验项。
- 集中维护 Query Key，为认证查询提供会话隔离。

### 2.3 登录与权限

- 实现用户名、密码登录表单及必填、密码长度校验。
- 登录期间禁用表单和提交按钮，避免重复提交。
- 实现 token 持久化、当前用户查询、身份恢复和本地退出登录。
- 实现 `AuthGuard`、`AdminGuard`，覆盖直接输入受保护 URL 的访问场景。
- 实现统一 Layout、角色导航、当前用户名称和角色展示。
- 身份查询包含加载、失败、重试、缺失数据和账号停用反馈。
- 为后续业务路由提供占位页面，不调用对应业务 API。

## 3. 主要文件与最终结构

工程入口与配置包括：

- [package.json](../package.json)：依赖、运行命令和类型生成命令。
- [vite.config.ts](../vite.config.ts)：React 插件、开发代理与测试配置。
- [tsconfig.json](../tsconfig.json)：严格 TypeScript 检查。
- [eslint.config.js](../eslint.config.js)、[.prettierrc.json](../.prettierrc.json)：代码规范。
- [.env.example](../.env.example)、[.gitignore](../.gitignore)：环境变量示例与忽略规则。
- [README.md](../README.md)：项目运行说明。

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

页面负责展示与编排，认证请求和业务 Hooks 位于 `features/auth`，统一网络基础设施位于 `api`。本阶段未为空的后续业务模块提前创建目录。

## 4. 实际使用的后端接口

### 4.1 登录

`POST /api/v1/auth/login`

请求类型为 `application/json`，必填字段为 `username` 和 `password`。密码长度为 8–128 个字符。

成功响应类型为 `TokenOutput`，包含必填的 `access_token`；`token_type` 可省略，契约默认值为 `bearer`。

### 4.2 当前用户

`GET /api/v1/users/me`

请求携带 `Authorization: Bearer <token>`，成功响应类型为 `UserOutput`。前端使用其中的 `role` 判断角色，使用 `is_active` 判断账号是否启用；`role` 的契约枚举为 `READER | ADMIN`。

业务请求写作 `/v1/auth/login`、`/v1/users/me`，与 Axios 默认 Base URL `/api` 组合后得到契约路径，避免重复拼接 `/api`。

### 4.3 类型生成方式

执行：

```bash
pnpm api:generate
```

实际命令为：

```bash
openapi-typescript docs/api/openapi.json -o src/api/generated/schema.d.ts
```

[认证类型](../src/features/auth/types.ts) 从生成的 `paths` 中提取请求体和成功响应类型。生成文件不手工修改，并排除在 ESLint 和 Prettier 的手写代码检查范围之外。

## 5. 登录、恢复与退出流程

### 5.1 登录

1. 用户填写用户名、密码，表单执行基础校验。
2. `useLogin` 通过 Mutation 调用登录接口，登录请求不携带旧 token。
3. 成功后将 `access_token` 写入 Zustand，并持久化到 localStorage。
4. `useCurrentUser` 请求当前用户，身份确认期间展示 Loading。
5. 身份查询成功且账号启用后，返回此前访问的内部路由；没有返回地址时进入 `/books`。
6. 返回目标若为管理路由，仍须经过 `AdminGuard` 校验。

### 5.2 刷新恢复

1. 应用读取本地 token。
2. 有 token 时，由 TanStack Query 查询当前用户。
3. 查询成功后恢复布局、身份和角色导航。
4. 401 清除登录状态并回到登录页。
5. 网络故障、403 或服务异常显示明确反馈，提供重试和重新登录入口。

当前用户查询不自动重试，由用户主动选择重试，避免将故障状态隐藏在后台重试中。

### 5.3 退出与会话失效

退出登录将 token 设为 `null`，更新客户端会话版本。缓存订阅随后清空 QueryClient 中的缓存并取消进行中的查询，守卫切换到登录页。

后端契约没有退出接口，因此此操作仅结束本地登录状态，不代表服务端撤销 JWT。

## 6. 代码设计亮点

### 6.1 用生成类型连接真实契约与业务代码

请求体和响应类型直接关联 OpenAPI 的具体路径，而非手工维护第二套 DTO。后端契约更新后可重新生成类型，并通过 TypeScript 检查发现受影响的调用位置。

类型生成提供编译期约束，并不自动验证运行时响应；未声明的错误体仍作为 `unknown` 安全收窄。

### 6.2 分离客户端会话状态与服务端用户数据

[authStore](../src/store/authStore.ts) 仅保存 token、内存中的会话版本和更新方法，持久化内容只有 token。当前用户由 [认证 Hooks](../src/features/auth/hooks.ts) 和 TanStack Query 管理，布局与守卫共用同一份查询结果。

这样避免将用户数据复制到 Zustand 后，再编写额外同步逻辑。侧栏折叠状态只存在于布局组件内部。

### 6.3 会话版本隔离缓存，并清理旧查询

[Query Key](../src/api/queryKeys.ts) 使用 `['auth', 'me', sessionVersion]`，避免将 token 本身放进缓存键。

[bindAuthCache](../src/app/queryClient.ts) 订阅会话版本变化，登录、退出或替换会话时清理缓存。身份查询把 TanStack Query 的 `AbortSignal` 传给 Axios，使取消查询能够传递到请求层。

全局查询默认在网络错误或 5xx 时最多重试一次；认证查询显式关闭自动重试。Mutation 默认不重试。

### 6.4 防止旧会话的 401 误伤新会话

[Axios Client](../src/api/client.ts) 处理 401 时，会比较失败请求实际携带的 Authorization 与当前 token。只有匹配时才清理当前会话。

例如旧 token 发出的请求延迟返回 401，而用户已经重新登录并获得不同 token，此时旧响应不会将新会话退出。登录请求通过 `skipAuth` 排除旧 token，错误凭据也不会误清理其他现有会话。

### 6.5 身份状态展示与权限决策分开

[SessionBoundary](../src/features/auth/SessionBoundary.tsx) 统一处理身份加载、查询失败、重试、缺失数据和停用账号。

[AuthGuard](../src/router/AuthGuard.tsx) 决定是否允许进入受保护路由；[AdminGuard](../src/router/AdminGuard.tsx) 在身份确认后判断管理员角色。菜单隐藏与路由拦截同时存在，但实际资源权限始终由后端校验。

### 6.6 错误标准化与表单反馈分工清晰

[errors.ts](../src/api/errors.ts) 将不同 HTTP 错误统一为 `ApiError`：

- 401：登录凭据无效或过期。
- 403：无权限访问。
- 404：资源不存在。
- 409：安全识别字符串 `detail` 后显示业务冲突，否则使用通用提示。
- 422：校验错误，保留有效的字段定位和错误消息。
- 5xx：统一服务异常提示，不展示内部堆栈。
- 网络异常：提示检查网络并重试。

[LoginForm](../src/features/auth/LoginForm.tsx) 只负责将校验项映射到用户名、密码字段，不重复判断通用 HTTP 状态。主动取消的请求保留取消语义，不转成普通网络错误。

### 6.7 测试覆盖真实组件协作

测试在 Axios adapter 层模拟响应，保留真实的表单、路由、QueryClient、Zustand 和拦截器运行过程。这样可以检查“收到 401 后页面是否真的回到登录页”等跨模块行为，而不仅是单独函数返回值。

## 7. 验证结果

以下为 Phase 1 实现完成时实际执行的结果；本次整理文档未重新运行代码测试。

- `pnpm lint`：通过。
- `pnpm test`：2 个测试文件、28 项测试全部通过。
- `pnpm build`：TypeScript 检查与 Vite 生产构建通过。
- `pnpm format:check`：通过。
- `pnpm api:generate`：成功生成类型。
- `git diff --check`：通过。

测试覆盖：

- 登录表单必填与密码长度校验、JSON 请求格式、提交期间禁用。
- 登录成功后的用户查询、原路由恢复、用户信息展示及 token 持久化。
- 错误凭据、422 字段反馈、本地 token 恢复、加载期间阻止访问。
- 401 清理状态和缓存、已登录页面会话失效后的跳转。
- 403、500 后的错误反馈和主动重试。
- 退出登录、旧会话 401 隔离、READER 路由拒绝、ADMIN 导航和停用账号。
- Axios 层的 404、409、异常校验项和网络错误处理。

构建存在非阻断提示：主 JS 包约 958 KB，gzip 后约 308 KB，超过 Vite 默认的 500 KB 提示阈值。本阶段保留基础打包配置，没有提前开展 Phase 4 的代码拆分优化。

## 8. 契约差异与已知限制

### 8.1 文档与 OpenAPI 的差异

- 项目规格提到“用户名/邮箱”，登录契约仅声明 `username`；界面只承诺用户名登录，不自行推断邮箱登录能力。
- OpenAPI 未定义 401、403、409、5xx 的响应 schema；错误层按状态码处理未知响应体。兼容字符串 `detail` 不等于确认后端一定使用该结构。
- OpenAPI 声明 HTTP Bearer，但未逐接口描述角色授权规则；前端按照项目规格限制管理路由，后端实际 RBAC 仍需联调验证。
- 没有 refresh token 或退出登录接口，前端没有新增或猜测对应请求。

### 8.2 尚未完成的验证

阶段验收时，在沙箱内外均无法连接本地后端 8000 端口，因此以下真实环境场景仍待验证：

- 使用已有 READER、ADMIN 账号登录。
- 浏览器刷新后恢复身份。
- 真实 JWT 失效时跳转登录。
- 后端实际 401、403 响应与权限行为。

自动化测试中的响应来自 mock，不代表上述端到端验证已经完成。

### 8.3 有意保留的阶段边界

图书、借阅、个人信息和管理员业务页面仅提供路由占位，不提供 CRUD 或业务数据。馆藏管理需要具体 bookId，当前菜单禁用并注明从图书进入，没有伪造图书 ID。

本阶段没有实现注册、资料修改、预约、统计或 Dashboard。生产环境还需部署方配置 API 反向代理与 SPA 路由回退；Vite 开发代理仅用于本地开发。

## 9. 后续阶段文档约定

每个 Phase 完成后，在 `docs/phaseN.md` 中记录该阶段的实际交付，沿用以下结构：

1. 阶段总结与完成状态。
2. 新增和修改内容。
3. 主要文件与目录结构。
4. 实际使用的后端 API 和类型契约。
5. 核心业务流程。
6. 代码设计亮点及其解决的问题。
7. 实际执行的测试、构建与检查结果。
8. 契约差异、已知限制与未完成项。

文档应区分“代码已实现”“自动化测试通过”和“真实后端联调通过”，不得把计划中的功能写成已完成内容。本文件作为 Phase 1 的交付记录，后续功能由对应阶段文档承接。
