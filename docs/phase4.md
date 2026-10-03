# Phase 4：工程化收尾

## 1. 范围与基线

实施前已阅读 `AGENTS.md`、`docs/PROJECT_SPEC.md`、`docs/api/openapi.json`，检查代码和 Git 状态。基线为 `5771139`（Phase 3），起始工作区干净。

README 仍描述 Phase 2 和管理员占位，与现有 Phase 3 代码冲突，已在实施前说明并更新为实际功能。接口和页面能力继续以本地 OpenAPI 为准。本阶段完成测试补充、错误边界、统一空/加载状态、路由代码拆分、重复逻辑收敛、README 和构建检查。没有进入额外业务阶段。

没有修改后端、OpenAPI、依赖版本或环境配置，没有执行 Git 提交或 push。

## 2. 修改文件与实现

- `src/components/ErrorBoundary/index.tsx`：应用/页面共用渲染异常边界，提供重试与刷新，不展示内部异常内容。
- `src/main.tsx`：顶层边界包裹 Providers 和应用，覆盖布局、守卫等顶层渲染失败。
- `src/router/PageBoundary.tsx`、`src/components/AppLayout/index.tsx`：页面错误边界与 Suspense；页面失败保留导航，路径/会话变化后重置。筛选变化不重建整页，保留 Mutation 反馈与编辑状态。
- `src/router/index.tsx`：登录、四个读者页面、六个管理员页面使用独立动态 import；保留 AuthGuard / AdminGuard 的嵌套顺序，身份未确认或读者访问管理路由时不运行管理查询。
- `src/components/EmptyState/index.tsx`、`Loading/index.tsx`、`src/styles/global.css`：统一 Ant Design 空状态与带可读标签的全页/紧凑加载状态。
- `src/components/ManagementTable/index.tsx`、`src/features/books/BookList.tsx`、`src/features/loans/MyLoans.tsx`：读者与管理员表格共用加载、空、错误、刷新、分页与越界页纠正逻辑；保留各业务列、筛选和返回链接。初始加载、成功空结果、请求失败明确区分；后台刷新保留行，失败撤下旧行。
- `src/features/auth/SessionBoundary.tsx`、`src/features/users/UserDetails.tsx`：使用明确的身份/详情加载标签。
- `src/features/authors/AuthorSelect.tsx`、`AuthorsSelect.tsx`、`src/features/books/BookFilters.tsx`、`BookEditor.tsx`：作者/分类选项加载和空结果使用共享组件，失败显示失败状态与既有重试入口。
- `src/api/useApiMutation.ts`、`src/features/loans/hooks.ts`：将会话版本绑定到单次提交，借还操作复用统一 Mutation，收敛成功/409 缓存失效逻辑。
- `src/api/mutationSession.test.tsx`、`src/test/engineering.test.tsx`：新增缓存隔离、错误恢复、模块加载和列表状态测试。
- `src/test/setup.ts`：为首次懒加载模块转换设置 5 秒异步 UI 等待窗口。
- 删除未被路由使用的 `src/pages/PlaceholderPage/index.tsx`。
- `README.md`：最终功能、路由、架构、契约限制、运行命令、质量检查、部署与验证边界。
- `docs/phase4.md`：本阶段记录。

## 3. 关键设计与修复

### 错误边界

顶层边界负责应用渲染异常，页面边界负责业务页面渲染和动态 import 失败。页面失败后仍能通过导航切换页面；手动重试重建子树，模块加载失败可通过刷新重新加载资源。页面边界按路径和会话版本重置，不因 URL 筛选变化重建页面。

HTTP 请求和事件提交错误继续由现有 `RequestError`、表单和 Mutation 处理，不把普通 API 错误升级为整个应用异常。没有将服务端内部堆栈或捕获的异常详情显示在界面。

### 写请求会话隔离

新增回归测试发现：原 Mutation 在渲染期间读取会话版本，但在途 Mutation 的回调选项可能随着组件重新渲染更新。旧请求结束时可能采用新版本回调，错误地刷新新用户缓存。

修复后 `onMutate` 记录本次提交的会话版本，成功和 409 回调从该请求上下文读取版本；版本不匹配直接结束，不失效新用户缓存。借还与管理员写操作复用相同实现，保持当前会话正常缓存刷新、请求不重试和等待刷新后解除提交状态的行为。

### 代码拆分

使用 React `lazy` + `Suspense` 按路由加载页面，保持 feature-based 职责划分，没有引入新构建插件或人工划分复杂第三方依赖包。移除失效占位页，复用表格和 Mutation 实现，避免相同逻辑维护多份。

## 4. 实际使用的后端 API

本阶段没有新增 API 能力。页面拆分和状态组件复用沿用 Phase 1–3 的真实接口，API DTO 仍引用既有 OpenAPI 生成类型；生成文件不手工编辑。

改动直接涉及的调用（公共前缀 `/api/v1`）：

- `GET /users/me`、`GET /users/{user_id}`：身份和详情加载状态。
- `GET /books`、`GET /loans/me`：读者列表和共用分页/异步状态。
- `GET /authors`、`GET /authors/{entity_id}`、`GET /categories`：作者/分类选项。
- `POST /loans`、`POST /loans/{loan_id}/return`：借还和统一 Mutation 缓存失效。
- 既有管理员用户、图书、作者、分类和馆藏写接口继续通过 `useApiMutation` 运行；请求路径和字段保持 OpenAPI 定义，详见 [Phase 3 接口记录](phase3.md#4-使用的真实-api)。

继续保留既有契约差异记录：RBAC/馆藏状态转换矩阵没有完整描述；401/403/409/5xx 未声明完整响应 schema；实际错误信封与标准 422 结构不同，由错误层安全兼容。没有增加假字段、假接口或后端变更。

## 5. 验证结果

2026-10-04 最终检查：

- `pnpm lint`：通过，无错误或警告。
- `pnpm test`：通过，7 个测试文件、94 项测试全部成功；既有 84 项回归通过，新增 10 项。
- `pnpm build`：通过，TypeScript 检查及 Vite 生产构建成功。
- `pnpm format:check`：通过。
- `pnpm api:generate`：通过；`git diff --exit-code -- docs/api/openapi.json src/api/generated/schema.d.ts` 确认契约和生成文件无差异。
- `git diff --check`：通过。

新增 6 项工程化测试覆盖应用异常安全反馈及重试恢复、页面异常后导航恢复、懒加载等待/失败、列表加载/空/错误区分和后台刷新失败撤下旧行。新增 4 项写请求回归测试覆盖通用管理员及读者借还 Mutation 的旧会话成功/409 响应，并在请求未完成时切换会话和重新渲染，验证新用户缓存不被失效。

初次全量回归中有 3 项因首次动态模块加载/转换超过默认 1 秒断言窗口失败；设置合理的 5 秒异步等待后，定向回归和最终全量检查均通过。新增会话隔离测试初次暴露了真实回调上下文问题，修复后全部通过，没有跳过最终验收测试。

最终入口 JS 为约 852.89 kB（gzip 276.14 kB），较 Phase 3 单入口约 1349.12 kB（gzip 425.47 kB）减少。路由及共用模块已输出独立分块，按访问页面加载；这是入口体积变化，不代表所有页面累计下载量同比减少。共享入口仍超过 Vite 默认 500 kB 阈值，有非阻断体积提示；未提高告警阈值或隐藏提示。

## 6. 验证边界与剩余事项

本阶段通过 Axios adapter mock 测试真实组件、路由、拦截器和 TanStack Query。没有进行真实 ADMIN 数据库写入联调，后端细粒度 RBAC、唯一性冲突和馆藏转换仍需真实账号验证；读者真实借还联调历史见 [Phase 2](phase2.md#9-真实后端账号联调2026-10-03)。

可选 Playwright E2E 本次没有引入。没有接口缺失造成的本阶段阻塞，没有预约、统计等范围外功能。部署仍需配置 API 代理、SPA 回退和分块资源缓存策略；README 已提供示例，本次没有执行部署。
