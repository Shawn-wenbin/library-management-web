# Library Management Web

基于 React + TypeScript 的图书管理前端，对接独立维护的 FastAPI + MySQL 后端。已实现 Phase 1–4：认证、读者功能、管理员 CRUD 和工程化收尾。

项目规范见 [PROJECT_SPEC](docs/PROJECT_SPEC.md)，开发约束见 [AGENTS.md](AGENTS.md)。阶段记录：[Phase 1](docs/phase1.md)、[Phase 2](docs/phase2.md)、[Phase 3](docs/phase3.md)、[Phase 4](docs/phase4.md)。

## 本地运行

需要 Node.js >= 22.12 和 `package.json` 中指定版本的 pnpm。没有 pnpm 时先执行 `corepack enable pnpm`。

```bash
pnpm install --frozen-lockfile
cp .env.example .env
pnpm dev
```

启动既有 FastAPI 服务后，打开 Vite 输出的本地地址（默认 `http://localhost:5173`），使用后端已有的用户名和密码登录。前端不创建测试账号，不提供模拟登录。

`.env.example` 默认配置：

```dotenv
VITE_API_BASE_URL=/api
```

统一 Axios Client 请求 `/v1/...`，与 Base URL 拼成 `/api/v1/...`。Vite 将 `/api` 原样代理到 `http://127.0.0.1:8000`，保留 `/api` 前缀。后端地址调整在 `vite.config.ts` 中完成，不在业务代码中硬编码 host。`.env` 不提交 Git。

如果设置独立 API 域名，Base URL 应包含后端 `/api` 前缀，并由后端正确配置 CORS。Vite 环境变量在构建时写入静态文件；修改生产配置后需要重新构建，不能存放密码或其他秘密。

## 功能与路由

公共页面：

- `/login`：用户名登录；JWT token 持久化、刷新后恢复身份。

READER 和 ADMIN 共用：

- `/books`：关键词、作者、分类、可借筛选、排序和分页。
- `/books/:bookId`：图书详情、馆藏数量及借阅。
- `/me/loans`：全部、当前、历史借阅；应还时间、后端逾期标记和确认归还。
- `/me`：当前用户个人信息展示。

仅 ADMIN 可进入：

- `/admin/users`：列表、角色/状态筛选、详情、启用/禁用、角色变更。
- `/admin/books`：查询、新增、编辑、下架、重新上架及馆藏入口。
- `/admin/authors`：分页查询、新增、编辑、删除。
- `/admin/categories`：查询、本地分页、新增、编辑、删除。
- `/admin/books/:bookId/copies`：图书下的副本查询、新增、编辑位置/入库日期、合法状态修改。
- `/admin/loans`：全部借阅、用户/图书/状态筛选、专用逾期查询、归还。

馆藏管理需要具体图书，从图书管理表格进入；侧栏说明入口位置。列表筛选、分页与 URL 同步，写操作后刷新相关缓存，并纠正已空的末页。提交期间禁止重复操作，删除、下架、归还和权限变更提供确认。

前端 `AuthGuard` 和 `AdminGuard` 控制页面访问体验，实际权限和业务规则由 FastAPI 执行。没有预约、统计、注册页面、个人资料编辑或管理员代借等扩展功能。

## API 契约与限制

唯一接口契约是 [docs/api/openapi.json](docs/api/openapi.json)。更新后执行：

```bash
pnpm api:generate
```

`openapi-typescript` 输出 `src/api/generated/schema.d.ts`；生成文件不手工修改，也不参与 Prettier/ESLint 格式改写。功能模块从生成的 `paths` 和 `components` 提取类型，统一复用 Axios Client。实际接口与参数记录见 [Phase 2](docs/phase2.md#4-实际使用的后端-api) 和 [Phase 3](docs/phase3.md#4-使用的真实-api)。

契约决定的交互：

- 登录为 `POST /api/v1/auth/login` 的 JSON `{ username, password }`；没有声明邮箱登录能力。
- 当前身份来自 `GET /api/v1/users/me`；认证使用 HTTP Bearer，没有 refresh token 或退出接口。
- 图书 DELETE 是下架，不显示为永久删除；`is_active` 是布尔条件，管理列表区分上架和下架。
- 作者没有关键词查询；分类返回完整数组，由前端分页。
- 管理员用户接口没有创建/删除能力；馆藏没有删除能力，条码不能编辑。
- 馆藏 BORROWED 状态由借还流程改变，禁止手动设置 BORROWED 或手动修改借出副本的状态。
- 借阅输出没有嵌套用户名和书名，列表展示真实编号。
- OpenAPI 未逐接口描述 RBAC 或完整馆藏状态转换矩阵，后端进行最终校验。

OpenAPI 未声明 401/403/409/5xx 的完整错误 schema。Phase 2 联调观察到 `{ code, message, details }` 信封及不含 `msg` 的 422 校验项，与标准 FastAPI `detail` 数组存在差异。错误层对未知数据安全收窄，同时兼容两种格式；没有修改后端契约或伪造生成类型。

## 状态与异常处理

服务端数据由 TanStack Query 管理，Query Key 集中定义。Zustand 只持久化 token 和会话版本，当前用户仍来自查询缓存。会话切换取消在途查询并清空缓存；旧会话的 401 和写操作成功/409 响应不会清理或刷新新会话数据。写操作在提交时记录会话版本，成功或 409 后刷新相关图书、馆藏、借阅或管理数据。

- 401：清理失效登录态，守卫跳转登录页。
- 403：显示“无权限访问”。
- 404：显示资源不存在；未知页面显示 404。
- 409：展示后端业务原因并刷新相关缓存。
- 422：显示参数错误，编辑表单映射到可定位的字段并保留输入。
- 5xx / 网络异常：使用统一可读提示，服务端内部堆栈不展示。

加载与成功空结果使用共享 `Loading` / `EmptyState`；请求失败保留重试入口，不显示成正常空结果。列表后台刷新保留已有数据，刷新失败撤下旧行。页面代码按路由加载，等待时显示统一加载状态。

应用和页面错误边界处理渲染异常与页面模块加载失败，提供重试和刷新。页面异常时保留主导航，切换路径或会话后重置页面边界；仅修改筛选条件不会重建整页。事件处理和异步请求错误由 Mutation / 请求错误层处理。

## 目录与技术栈

React 19、TypeScript、Vite、React Router、Ant Design、Axios、TanStack Query、Zustand；测试使用 Vitest、React Testing Library 和 Axios adapter mock。

```text
src/
├── app/          # 应用、Providers、QueryClient 和会话缓存绑定
├── api/          # Client、错误解析、Query Keys、Mutation、生成类型
├── features/     # auth/books/users/authors/categories/bookCopies/loans
├── pages/        # 读者与管理员页面编排
├── components/   # Layout、表格、编辑弹窗、加载/空状态/错误边界
├── router/       # 路由、导航、鉴权和页面边界
├── store/        # 少量客户端登录状态
├── utils/        # 日期、表单、URL 和页码纠正
├── styles/       # 全局样式与响应式布局
└── test/         # Fixtures、测试环境和业务集成测试
```

`pnpm-workspace.yaml` 仅保存 esbuild 构建脚本许可，项目仍是单包仓库。

## 质量检查

```bash
pnpm lint
pnpm test
pnpm build
pnpm format:check
```

`pnpm test` 单次运行；`pnpm test:watch` 交互监听；`pnpm format` 格式化手写代码。新增路由懒加载后的首次模块转换可能较慢，测试环境为异步 UI 断言提供 5 秒等待窗口。

测试覆盖登录表单、身份恢复、权限守卫、401/403/409/422/500 与网络异常、读者借还、管理员 CRUD、字段校验、URL 分页、缓存刷新、错误边界、模块加载和会话隔离。最终执行结果见 [Phase 4 验证记录](docs/phase4.md#5-验证结果)。

自动化测试使用真实组件、路由和 Query/Mutation，HTTP 层由 adapter mock 控制，不能替代真实服务器联调。Phase 2 已记录读者真实 Chrome + FastAPI 借还联调；本阶段未进行真实 ADMIN 数据库写入联调，也未增加可选 Playwright E2E。没有将凭据或 token 写入仓库。

## 构建与部署

```bash
pnpm build
pnpm preview
```

`dist/` 是生产静态输出，不提交 Git。`pnpm preview` 用于本地检查构建。实际静态服务器需提供以下配置：

1. `/api/...` 转发到 FastAPI，保留 URI 前缀；API 错误不得回退到前端 HTML。
2. BrowserRouter 的业务路径回退到 `index.html`，支持直接访问详情/管理页和刷新。
3. `/assets/` 缺失资源返回 404；带 hash 的资源可长期缓存，`index.html` 应重新验证。

以下 Nginx 示例需要按部署环境修改静态目录和后端地址：

```nginx
server {
    listen 80;
    server_name _;
    root /srv/library-management-web/dist;
    index index.html;

    location ^~ /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location ^~ /assets/ {
        try_files $uri =404;
        add_header Cache-Control "public, max-age=31536000, immutable";
    }

    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

页面已经按路由分块，但共享入口仍超过 Vite 默认 500 kB 提示阈值，构建可以完成。更新部署时保留仍在使用的旧 hash 资源，避免已打开页面加载旧分块失败；遇到页面模块加载失败，可使用错误边界的“刷新页面”获取新版本。
