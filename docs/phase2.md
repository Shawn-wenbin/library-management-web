# Phase 2：读者核心功能

## 1. 阶段总结

实施前已阅读 `AGENTS.md`、`docs/PROJECT_SPEC.md`、`docs/api/openapi.json`，检查当前代码和 Git 状态。起始工作区干净，基线为 `27910a1`，已有 Phase 1 工程、认证、路由守卫及页面占位。

本阶段实现图书浏览、搜索/筛选/排序/分页、图书详情、借阅、我的借阅、归还和个人信息展示。所有生产请求使用既有 Axios Client 与真实 OpenAPI 路径，没有增加运行时 mock。

代码实现与自动化验证结果记录于第 7 节。随后使用用户提供的 READER 账号完成真实 Chrome 与 FastAPI 借还联调，结果单独记录于第 9 节。

未修改后端、原始 OpenAPI 或依赖版本；没有实现 Phase 3 管理员 CRUD，没有执行 Git 提交或 push。

## 2. 新增与修改内容

- `/books`：关键词、分类、作者、仅看可借、排序字段/方向、分页和手动刷新。表格展示书名、作者、分类、出版社、馆藏总数/可借数及可借状态。
- `/books/:bookId`：书名、副标题、ISBN、作者、分类、出版社、出版日期、简介、馆藏总数/可借数及借阅操作。无效编号不发请求，404 显示资源不存在。
- `/me/loans`：全部、当前、历史借阅；借阅编号、图书编号链接、馆藏副本编号、借出/应还/归还时间、状态、逾期标记和归还确认。
- `/me`：用户编号、用户名、姓名、邮箱、角色、账号状态、注册及更新时间；复用当前用户缓存。
- 通用错误展示组件：复用 `ApiError`，提供重试和 422 字段消息，常见字段显示中文名称。
- Loading、空数据、请求失败、请求中禁用、成功反馈均有对应展示。
- 图书表格和借阅表格支持横向滚动，筛选区在小屏幕切换为单列。

## 3. 主要文件

- `src/features/books/`：生成类型引用、API、Query Hooks、URL 参数解析、筛选表单、图书列表及详情。
- `src/features/authors/`：只读作者接口与分页选项组件。
- `src/features/categories/hooks.ts`：只读分类查询。
- `src/features/loans/`：借阅类型、API、Query/Mutation Hooks、借阅按钮和我的借阅列表。
- `src/features/users/Profile.tsx`：个人信息展示。
- `src/pages/BooksPage/`、`BookDetailPage/`、`MyLoansPage/`、`ProfilePage/`：页面编排。
- `src/components/PageHeader/`、`RequestError/`：公共标题与错误反馈；`Loading/` 新增可配置加载文案。
- `src/api/queryKeys.ts`：集中维护图书、作者、分类、我的借阅缓存键。
- `src/api/errors.ts`、`client.test.ts`：联调后增加真实错误信封兼容与回归测试。
- `src/utils/searchParams.ts`、`usePageCorrection.ts`、`formatDate.ts`：URL 参数、分页纠正、日期显示。
- `src/router/index.tsx`、`src/styles/global.css`：读者路由及响应式样式。
- `src/test/reader.test.tsx`、`src/features/books/search.test.ts`：读者流程与参数边界测试。
- `src/test/fixtures.ts`、`src/test/setup.ts`、`src/features/auth/auth.test.tsx`：契约类型约束的测试数据、jsdom 兼容和认证回归。
- `README.md`、`docs/phase2.md`：阶段与使用说明。

页面只负责组合组件；API、查询、交互及状态均按 feature 分离。服务端数据不复制到 Zustand。

## 4. 实际使用的后端 API

### 图书与筛选选项

- `GET /api/v1/books`：使用 `page`、`page_size`、`keyword`、`category_id`、`author_id`、`available_only`、`sort_by`、`sort_order` 和 `is_active=true`。页容量不超过 100，关键词最多 255 个字符，空白关键词不提交。
- `GET /api/v1/books/{entity_id}`：获取 `BookOutput`，使用后端默认的 `is_active=true`。
- `GET /api/v1/categories`：返回分类数组。
- `GET /api/v1/authors`：使用 `page`、`page_size=100` 分页获取作者，提供“加载更多作者”。没有假设作者接口支持关键词查询。
- `GET /api/v1/authors/{entity_id}`：URL 中选中的作者尚未加载到选项时恢复名称。

排序字段严格限定为 `id`、`title`、`publication_date`、`created_at`；方向为 `asc` 或 `desc`。

### 借阅与归还

- `POST /api/v1/loans`：仅提交 JSON `{ "book_id": number }`，成功响应为 201 的 `LoanOutput`。不传 `user_id`，不提供代他人借阅入口，不自行选择副本或设置借期。
- `GET /api/v1/loans/me`：使用 `page`、`page_size`、`status`，兼容 URL 中的 `book_id` 并显示可移除筛选标签。`status` 仅为 `BORROWED` 或 `RETURNED`，全部借阅时省略。
- `POST /api/v1/loans/{loan_id}/return`：使用借阅记录 ID，发送无请求体的 POST，成功响应为 200 的 `LoanOutput`。

### 个人信息与既有认证

- `GET /api/v1/users/me`：沿用 Phase 1 当前用户 Query，页面、布局与守卫共享缓存。
- `POST /api/v1/auth/login`：沿用 Phase 1 登录逻辑。

业务请求使用 `/v1/...`，与默认 Axios Base URL `/api` 组合得到真实契约路径。参数、请求体、响应类型均从 `src/api/generated/schema.d.ts` 的 `paths` 提取，未手写整套 DTO。重新运行 `pnpm api:generate` 后生成文件无差异。

## 5. 核心流程

### 查询与 URL

1. 从 URL 读取筛选、排序、页码和页容量，用同一组参数生成 Query Key 和请求。
2. 查询按钮提交表单，重置页码到 1；切换分页保留已提交条件；切换页容量回到第 1 页。
3. 刷新或浏览器后退时，表单根据 URL 恢复。由列表进入详情再返回时保留原筛选。
4. 非法页码、编号和排序回退到有效值；页容量上限 100。正整数编号仅接受 JavaScript 可精确表示的安全整数。
5. 后端返回总数后，如果当前页超出末页，替换 URL 页码并重新查询；支持归还后当前借阅末页消失的情况。

### 借阅

1. 详情使用真实 `is_active` 和 `available_copies` 决定按钮是否可用，最终可借性由后端确认。
2. Mutation 提交当前图书 ID，期间禁用按钮且不自动重试。
3. 成功后失效全部图书与借阅缓存，当前活跃查询立即重取；等待缓存刷新后展示成功及后端应还时间。
4. 409 展示后端可识别的冲突消息并刷新相关缓存；422 展示校验字段和原因。

### 归还

1. 仅 `BORROWED` 记录提供操作，点击后显示确认弹层。
2. 确认后按 `loan_id` 提交，无需表单字段；期间禁用全部归还按钮。
3. 成功后刷新我的借阅、图书详情及列表缓存。筛选和页容量保留，越界页码自动纠正。
4. 失败展示错误，不伪造成功状态；业务冲突也会触发数据刷新。

## 6. 关键设计决策

- 使用 TanStack Query 管理全部服务端数据，借还使用 Mutation；请求传递 `AbortSignal`，兼容既有退出登录取消查询机制。
- 借还刷新使用集中 Query Key 的前缀失效，覆盖不同分页和筛选缓存，避免“仅看可借”结果或历史记录保留旧数据。
- Mutation 回调检查会话版本，防止旧会话完成的写操作刷新新会话缓存。
- 列表切换参数时不把旧页当作新页结果显示；请求失败保留错误提示和重试入口。
- 归还等待期间切换借阅标签不会重置 Mutation，避免丢失提交锁。
- 逾期展示直接使用 `LoanOutput.is_overdue`；时间按浏览器本地时区显示，不推测服务端借期或重新定义逾期规则。
- 不调用管理员全部借阅或馆藏写接口。图书详情的馆藏信息来自 `BookOutput.total_copies` 与 `available_copies`。

## 7. 验证结果

- `pnpm lint`：通过。
- `pnpm test`：通过，4 个测试文件、56 项测试全部成功（Phase 1 原有 28 项，Phase 2 新增 28 项，其中真实联调修复新增 7 项）。
- `pnpm build`：通过，TypeScript 检查和 Vite 生产构建成功。
- `pnpm format:check`：通过。
- `pnpm api:generate`：通过，生成类型与仓库原文件一致。
- `git diff --check`：通过。

新增测试覆盖 URL 条件恢复、分页/后退/重置、关键词长度校验、作者后续分页、分类/可借筛选、列表 Loading/Empty/Error 与重试、详情字段/返回筛选、非法编号、404/403、借阅请求体和防重复提交、馆藏不可借、409/422、借还缓存失效、当前/历史借阅、归还确认与末页回退、业务接口 401、个人信息查询复用，以及非法 URL 参数边界。原有认证和通用 API 错误处理测试全部回归通过。

构建有非阻断提示：主 JS 包约 1,276.50 kB，gzip 后约 405.02 kB，超过 Vite 默认 500 kB 阈值。未提前开展 Phase 4 的代码拆分优化。

## 8. 契约差异、限制与未完成项

- `LoanOutput` 没有书名、作者或嵌套图书对象。我的借阅显示“图书 #编号”及详情链接，不伪造字段，也不为每条历史记录额外请求图书。
- 作者列表无关键词参数，使用完整的后端分页能力加载选项，不在前端承诺远程作者搜索。
- 详情接口默认查询上架图书，历史借阅关联图书若已下架可能返回 404；借阅记录本身仍可查看，归还直接依赖 `loan_id`。
- OpenAPI 未声明 401/403/409/5xx 错误响应 schema，也未逐接口标明角色 RBAC；真实错误响应信封及 422 差异见第 9 节，实际授权由后端执行。
- 个人信息按规格实现只读展示，没有扩展资料修改、密码修改或注册。
- 自动化测试使用 Axios adapter mock；READER 真实借还及错误处理已另行验证。未提供 ADMIN 账号，未验证管理员身份登录；未通过制造大量借阅或改动历史记录验证借阅上限、逾期限制等其他规则。
- Phase 3 管理员页面保持占位；未增加预约、统计或 Dashboard。

## 9. 真实后端账号联调（2026-10-03）

### 环境与账号

- 后端：本机 FastAPI `127.0.0.1:8000`，健康检查正常。
- 前端：本仓库 Vite `127.0.0.1:5178`，通过 `/api` 代理访问真实后端。
- 浏览器：本机 Chrome 无头模式，独立临时用户目录；没有使用前端 mock 或修改浏览器响应。
- 账号：`shang`，`GET /users/me` 确认角色为 `READER`。密码和 token 未写入仓库、文档或测试数据。
- 运行中 `/openapi.json` 与仓库契约完整比对一致，但实际全局错误处理器的响应形状未被该契约准确描述。

### 实际通过的业务场景

1. 在真实登录表单输入账号，登录成功；浏览器刷新后恢复身份及图书页面。
2. 个人信息与后端当前用户一致；读者直接访问管理员页面被守卫拦截，后端 `GET /users` 返回真实 403。
3. 图书关键词、分类、作者、仅看可借、排序和分页参数恢复；刷新保留筛选；无匹配关键词出现空状态；重置和翻到第 2 页成功。
4. 图书详情展示真实数据。选择图书 #3《MySQL 事务与索引》借阅，可借数量从 2 降至 1，页面自动刷新数量及应还时间。
5. 重复借阅同种图书返回真实 409；修复后页面显示“不能同时借阅同种图书的多个副本”。
6. 我的借阅显示新增记录，确认归还后显示成功；当前借阅移除该记录，历史借阅显示“已归还”；后端和详情可借数量恢复为 2。
7. 使用超长 URL 关键词触发真实 422，页面显示“请求参数不合法”和“关键词：输入内容过长”；另验证后端非法页码返回 422。
8. 移动端 390 px 视口检查通过，文档宽度为 390 px，没有整页横向溢出。
9. 在独立浏览器中注入无效 token，观察真实后端 401，前端清除 token 并回到登录页；重新登录后主动退出也正常。该认证复验未发现未捕获的浏览器 JavaScript 异常。

### 联调发现与修复

实际错误响应为：

```json
{
  "code": "VALIDATION_ERROR",
  "message": "请求参数不合法",
  "details": [{ "loc": ["query", "page"], "type": "greater_than_equal" }]
}
```

此前解析仅识别标准 FastAPI `detail`，导致 409 只能显示通用提示，422 缺少字段原因。现已在统一错误层安全识别 `code/message/details`，同时保留原契约格式兼容；校验项没有 `msg` 时按 `type` 生成中文说明，未知类型使用通用字段提示。没有猜测缺失的数值上限或下限，没有修改生成类型。401/403 保持统一反馈，5xx 继续隐藏内部错误信息。

新增 7 项自动化回归验证真实 404/403/409/500 信封、422 字段解析，以及页面上的实际 409/422 反馈。

### 数据影响与验证边界

两轮借还共新增借阅 #5、#6，均属于图书 #3，最终都已归还。数据库保留两条真实借阅历史；没有删除记录，没有归还或修改用户原有借阅，图书可借数量恢复至测试前的 2。

复验中浏览器脚本曾遇到导航上下文切换及等待停滞，已调整临时脚本的导航等待和超时；该问题不作为前端业务失败，也没有为此修改应用路由。没有将浏览器自动化依赖加入项目。
