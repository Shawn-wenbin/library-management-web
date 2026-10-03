# Phase 3：管理员 CRUD

## 1. 范围与基线

实施前已阅读 `AGENTS.md`、`docs/PROJECT_SPEC.md`、`docs/api/openapi.json`，检查现有认证、读者功能与 Git 状态。基线提交为 `1e6038c`，起始工作区干净。

本阶段实现用户、图书、作者、分类、实体馆藏和全部借阅管理。全部生产请求使用既有 Axios Client 和真实 OpenAPI 路径；类型从生成的 `paths` 提取或复用已有公共类型，未手写后端 DTO。

未修改后端、OpenAPI、依赖版本或环境配置；未进入 Phase 4，未执行 Git 提交或 push。

## 2. 页面与交互

- `/admin/users`：用户分页、角色/启用状态筛选、详情抽屉、启用/禁用、角色修改。启停和权限变更均需确认；刷新身份缓存后，自身降级会立即由 AdminGuard 拦截。
- `/admin/books`：复用关键词、作者、分类、可借、排序筛选，增加上架/下架筛选；支持新增、编辑、下架和馆藏入口。下架使用 DELETE，界面不称为永久删除；编辑可通过 `is_active` 重新上架。
- `/admin/authors`：后端分页查询，新增、编辑及删除，支持名称和简介；关联图书导致的 409 直接显示后端业务消息。
- `/admin/categories`：完整分类数组采用本地分页；支持新增、编辑和删除，名称和描述按契约校验。
- `/admin/books/:bookId/copies`：按图书分页及状态查询、新增副本、编辑位置/入库日期、独立修改状态。借出副本禁用手动状态操作；任何副本都不能手动设为 BORROWED。
- `/admin/loans`：全部借阅分页、用户编号/图书编号/状态筛选、逾期专用查询、借出/应还/归还时间、后端逾期标记及确认归还。已归还记录不再提供归还按钮。

全部管理员路由位于已有 AuthGuard 与 AdminGuard 下。前端权限控制仅用于交互，实际权限与业务规则仍由 FastAPI 执行。

## 3. 主要文件

- `src/pages/admin/*/index.tsx`：六个管理员页面的布局与功能组合。
- `src/router/index.tsx`：将管理员占位页替换为真实功能页面。
- `src/features/users/`：`AdminUsers.tsx`、`UserDetails.tsx` 及管理员 API、类型、Hooks。
- `src/features/books/`：`AdminBooks.tsx`、`BookEditor.tsx`、管理员 API/类型/Hooks；`BookFilters.tsx` 增加可选上架筛选。
- `src/features/authors/`：`AdminAuthors.tsx`、`AuthorsSelect.tsx` 及管理员 API/类型/Hooks；原作者 API 复用公共类型。
- `src/features/categories/`：`AdminCategories.tsx` 及管理员 API/类型/Hooks，复用既有分类查询。
- `src/features/bookCopies/`：馆藏列表、编辑表单、状态选项、API、类型与 Hooks。
- `src/features/loans/`：`AdminLoans.tsx` 及管理员查询；原借还 Hooks 增加馆藏缓存失效。
- `src/api/queryKeys.ts`、`useApiMutation.ts`：集中管理新增查询键、写操作成功/冲突后的缓存刷新。
- `src/components/ManagementTable/`、`EditorModal/`：本阶段表格分页、请求状态和编辑弹窗共用逻辑。
- `src/components/RequestError/index.tsx`、`src/utils/formRules.ts`：中文字段提示与表单基础校验。
- `src/test/admin.test.tsx`：管理员路由、CRUD、表单校验和缓存一致性测试。
- `docs/phase3.md`：本阶段报告。

## 4. 使用的真实 API

以下路径省略公共前缀 `/api/v1`。业务 API 使用 `/v1/...`，由默认 Base URL `/api` 拼接。

### 用户

- `GET /users`：`page`、`page_size`、`role`、`is_active`。
- `GET /users/{user_id}`：详情抽屉按 ID 查询。
- `PATCH /users/{user_id}/status`：仅提交 `{ is_active }`。
- `PATCH /users/{user_id}/role`：仅提交 `{ role }`。
- `GET /users/me`：复用已有身份查询；用户修改后刷新，避免当前管理员身份过期。

### 图书

- `GET /books`：沿用全部真实筛选、排序、分页字段，增加 `is_active=false` 的下架列表。
- `POST /books`：提交 `BookCreate` 允许字段。
- `PATCH /books/{entity_id}`：提交 `BookPatch` 允许字段，不携带 ID、时间戳、嵌套作者/分类和馆藏计数。
- `DELETE /books/{entity_id}`：OpenAPI 标注 `Deactivate Book`，204 表示下架成功。

作者选择复用 `GET /authors` 的分页加载及已有筛选组件的 `GET /authors/{entity_id}`；分类选择复用 `GET /categories`。

### 作者与分类

- `GET /authors`：仅支持 `page`、`page_size`，不发送虚构关键词参数。
- `POST /authors`、`PATCH /authors/{entity_id}`、`DELETE /authors/{entity_id}`。
- `GET /categories`：返回数组，不向后端发送分页参数。
- `POST /categories`、`PATCH /categories/{entity_id}`、`DELETE /categories/{entity_id}`。

创建成功响应为 201，编辑为 200，删除为 204。

### 实体馆藏

- `GET /books/{entity_id}/copies`：`page`、`page_size`、`status`。
- `POST /books/{entity_id}/copies`：`barcode`、`location`、`acquired_at`；不提交状态或重复的 `book_id`。
- `PATCH /copies/{entity_id}`：仅提交 `location`、`acquired_at`；不提供条码编辑。
- `PATCH /copies/{entity_id}/status`：仅提交 `{ status }`。

状态枚举严格沿用 AVAILABLE、BORROWED、MAINTENANCE、LOST、RETIRED。借出状态通过借还流程变更，其他转换由后端校验。

### 全部借阅

- `GET /loans`：`page`、`page_size`、`user_id`、`book_id`、`status`。
- `GET /loans/overdue`：`page`、`page_size`、`user_id`、`book_id`。开启“仅看逾期”时移除状态条件，不向该接口发送 `status`。
- `POST /loans/{loan_id}/return`：无请求体，复用已有归还 Mutation。

## 5. 表单、分页与缓存设计

### 表单校验

- 作者名称必填、最多 150 字符，简介最多 16000 字符；分类名称必填、最多 100 字符，描述最多 500 字符。
- 图书书名必填、最多 255 字符，分类必选；作者最多 100 位。ISBN 64、副标题 255、出版社 150、简介 16000、封面 URL 500 字符；日期校验真实日历日期，封面校验完整 URL。
- 新增馆藏条码必填、最多 64 字符，位置最多 100 字符，入库日期校验真实日期。
- 编号筛选只接受 JavaScript 可精确表示的正整数；分页沿用已有解析与页容量上限 100。
- 必填文本拒绝纯空白；可选文本清空提交 `null`，作者清空提交空数组。
- 422 错误保留表单输入，并将 `body` 下已注册字段的错误映射到对应控件；数组元素错误映射到所属表单字段。409 显示后端冲突消息；其他错误复用统一解析。
- 弹窗等待写入和缓存刷新完成后关闭。请求期间禁止编辑/关闭，提交锁避免重复提交；弹窗表单使用独立 ID，避免与列表筛选中的同名控件冲突。

### 分页与刷新

- 筛选、页码、页容量保存在 URL，刷新和浏览器后退可恢复。
- 查询条件或页容量变化回到第 1 页；普通翻页保留当前筛选。
- Mutation 后保留当前查询条件，若结果减少导致当前页越界，自动替换为最后有效页；分类本地分页采用相同纠正机制。
- 所有查询提供 Loading、Empty、Error 和刷新/重试入口；表格支持横向滚动。

### 缓存

- 全部服务端数据使用 TanStack Query，没有复制到 Zustand。
- 用户修改失效用户列表/详情及当前身份缓存；作者/分类修改失效选项和相关图书缓存。
- 图书/馆藏修改失效图书与馆藏查询；借还操作失效图书、全部借阅、我的借阅和馆藏查询。
- 409 同样刷新相关缓存以恢复服务器实际状态；不进行乐观伪造成功。
- 查询传递 AbortSignal；写操作刷新前检查会话版本，避免旧会话请求完成后影响新会话缓存。写请求不自动重试。

## 6. 验证结果

- `pnpm lint`：通过。
- `pnpm test`：通过，5 个测试文件、84 项测试全部成功；本阶段新增 28 项，既有 56 项全部回归通过。
- `pnpm build`：通过，TypeScript 检查和 Vite 生产构建成功。
- `pnpm format:check`：通过。
- `pnpm api:generate`：通过，生成文件与原版本无差异。
- `git diff --check`：通过。

构建仍有非阻断的包体积提示：主 JS 约 1349.12 kB，gzip 后约 425.47 kB，超过 Vite 默认 500 kB 阈值。本阶段未提前实施 Phase 4 拆包优化。

新增测试覆盖六条管理员路由对读者的拦截、用户筛选/分页/刷新/详情、启停和自身降级、作者/分类增改删、409/422、表单长度/必填/日期/URL/编号校验、下架语义、请求字段白名单、馆藏状态限制、逾期专用查询、归还确认/防重复与跨模块缓存刷新。

## 7. 契约限制与验证边界

- 用户接口没有管理员创建/删除能力，没有实现这些操作，也未借用公共注册接口冒充管理员创建。
- 作者没有关键词查询，分类没有后端分页；按实际能力提供查询与刷新。
- 图书 `is_active` 为非空布尔参数，没有“全部上架状态”接口语义，提供上架/下架两个列表。
- 馆藏没有删除接口，编辑不允许修改条码或直接修改状态；OpenAPI 未声明完整状态转换矩阵，前端明确禁用借出状态的手动转换，其余转换以服务器结果为准。
- `LoanOutput` 不含用户名、书名，管理列表显示真实编号，不伪造嵌套字段，不额外逐条请求历史关联资源。
- OpenAPI 未逐接口声明角色 RBAC，也未声明 401/403/409/5xx 的完整错误 schema；继续复用 Phase 2 对真实错误信封的兼容处理。
- 本阶段验证使用 Axios adapter mock 与真实组件、路由、Query/Mutation。未使用真实 ADMIN 账号做数据库写入联调；真实服务器的角色权限细则、唯一性冲突及馆藏状态转换仍需实际账号联调确认。
- 无接口缺失导致的本阶段实现阻塞。没有增加预约、统计、管理员代借、用户注册管理等扩展；没有实施 Phase 4 的全局错误边界、拆包、README 重写或 E2E 建设。
