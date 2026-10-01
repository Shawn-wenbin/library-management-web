# PROJECT_SPEC.md

## 1. 项目名称

Library Management Web

前端仓库建议名称：

```text
library-management-web
```

对应后端仓库：

```text
library-management-system
```

两个仓库独立维护。

---

## 2. 项目目标

为已经完成的 FastAPI + MySQL 图书管理系统实现一个基于 React + TypeScript 的 Web 前端。

该项目不是纯 UI Demo，而是用于训练和验证完整的前后端工程链路：

```text
Browser
  ↓
React
  ↓
Axios / TanStack Query
  ↓
FastAPI REST API
  ↓
Service
  ↓
Repository
  ↓
AsyncSession
  ↓
MySQL
```

前端必须基于真实后端 API 契约开发，不自行构造不存在的接口。

---

## 3. 项目范围

### 包含

- 登录
- 当前用户信息
- 图书浏览
- 图书搜索
- 图书筛选
- 图书详情
- 我的借阅
- 图书借阅
- 图书归还
- 用户个人信息展示
- 管理员图书管理
- 管理员作者管理
- 管理员分类管理
- 管理员实体馆藏管理
- 管理员用户管理
- 管理员借阅管理
- 基础错误处理
- 权限路由
- Loading / Empty / Error 状态
- 响应式基础布局
- 前端测试

### 不包含

- 图书预约
- 统计报表
- 借阅排行榜
- Dashboard 数据可视化
- 支付
- 消息通知中心
- 多租户
- SSR
- 微前端
- GraphQL
- WebSocket
- AI 功能

---

## 4. 用户角色

系统存在两类角色：

### READER

普通读者。

可执行：

- 登录
- 查看图书
- 搜索图书
- 查看图书详情
- 借阅图书
- 归还自己的图书
- 查看自己的借阅记录
- 查看个人信息

### ADMIN

管理员。

拥有 READER 基础能力，并额外可执行：

- 管理用户
- 管理图书
- 管理作者
- 管理分类
- 管理实体馆藏
- 查看全部借阅
- 处理管理员允许的借阅相关操作

最终权限以后端 OpenAPI 和实际 RBAC 为准。

---

## 5. 技术方案

### 基础技术

- React
- TypeScript
- Vite
- pnpm

### 路由

- React Router

### UI

- Ant Design

### HTTP

- Axios

### Server State

- TanStack Query

### Client State

- Zustand

### 类型契约

- FastAPI OpenAPI
- openapi-typescript

### 测试

- Vitest
- React Testing Library
- 后期可增加 Playwright

---

## 6. 页面信息架构

### 公共页面

```text
/login
```

### READER 页面

```text
/books
/books/:bookId
/me
/me/loans
```

### ADMIN 页面

```text
/admin/users
/admin/books
/admin/books/:bookId/copies
/admin/authors
/admin/categories
/admin/loans
```

如果后端实际接口不支持某个页面所需能力，则以真实后端能力为准调整。

---

## 7. 应用布局

登录后使用统一后台式布局。

建议结构：

```text
┌──────────────────────────────────────────────┐
│ Header                                       │
├──────────────┬───────────────────────────────┤
│ Sidebar      │                               │
│              │                               │
│ Navigation   │        Page Content           │
│              │                               │
│              │                               │
└──────────────┴───────────────────────────────┘
```

### READER 菜单

- 图书
- 我的借阅
- 个人信息

### ADMIN 菜单

- 图书
- 我的借阅
- 用户管理
- 图书管理
- 作者管理
- 分类管理
- 馆藏管理
- 借阅管理

不增加统计仪表盘。

---

## 8. 登录流程

```text
LoginPage
  ↓
提交用户名/邮箱 + 密码
  ↓
FastAPI Login API
  ↓
access_token
  ↓
保存 token
  ↓
获取当前用户
  ↓
根据角色进入系统
```

### 认证恢复

浏览器刷新后：

1. 检查本地 token。
2. 请求当前用户接口。
3. 成功则恢复登录态。
4. 401 则清理 token 并进入登录页。

---

## 9. API 契约

后端 OpenAPI 为唯一事实来源。

后端导出的：

```text
openapi.json
```

复制或同步至：

```text
docs/api/openapi.json
```

然后生成前端类型：

```text
src/api/generated/
```

推荐命令形式：

```bash
pnpm exec openapi-typescript docs/api/openapi.json -o src/api/generated/schema.d.ts
```

具体脚本应写入 `package.json`，例如：

```json
{
  "scripts": {
    "api:generate": "openapi-typescript docs/api/openapi.json -o src/api/generated/schema.d.ts"
  }
}
```

不得手工修改生成文件。

---

## 10. Axios Client

统一配置：

```text
src/api/client.ts
```

职责：

- Base URL
- Authorization Header
- 错误响应标准化
- 401 登录失效处理
- 403 权限提示
- 409 业务冲突提示
- 422 参数校验错误
- 5xx 服务异常

业务模块只能复用统一 Client。

---

## 11. Query Key 设计

建议集中维护：

```text
src/api/queryKeys.ts
```

示例：

```text
auth.me
books.list(params)
books.detail(id)
users.list(params)
authors.list(params)
categories.list(params)
bookCopies.list(bookId, params)
loans.me(params)
loans.list(params)
```

不得使用到处散落的字符串作为 Query Key。

---

## 12. 图书模块

### 图书列表

支持：

- 分页
- 关键词搜索
- 分类筛选
- 作者筛选
- 仅看可借（若后端支持）
- 排序（若后端支持）

页面状态必须与 URL Query Parameters 保持合理同步，至少保证刷新页面时核心筛选条件不完全丢失。

### 图书详情

展示：

- 书名
- ISBN
- 作者
- 分类
- 出版社
- 简介
- 馆藏相关信息
- 是否可借

如果后端提供借阅操作：

- READER 可执行借阅
- 成功后刷新详情和借阅相关缓存

---

## 13. 我的借阅

页面：

```text
/me/loans
```

至少支持：

- 当前借阅
- 历史借阅
- 应还时间
- 是否逾期
- 归还操作

归还成功后刷新：

- 我的借阅
- 图书详情
- 相关图书列表缓存

---

## 14. 管理员：图书管理

页面：

```text
/admin/books
```

支持：

- 查询
- 分页
- 新增
- 编辑
- 下架

建议采用：

- Ant Design Table
- Modal 或 Drawer Form

删除语义以真实后端为准。如果后端是下架，不在前端显示为“永久删除”。

---

## 15. 管理员：作者管理

页面：

```text
/admin/authors
```

支持：

- 查询
- 新增
- 编辑
- 删除或后端允许的禁用操作

如果作者存在关联图书导致后端 409，应明确展示业务冲突信息。

---

## 16. 管理员：分类管理

页面：

```text
/admin/categories
```

支持：

- 查询
- 新增
- 编辑
- 删除

存在关联图书时，遵循后端业务规则。

---

## 17. 管理员：实体馆藏

页面：

```text
/admin/books/:bookId/copies
```

支持：

- 查看图书下所有实体副本
- 新增馆藏副本
- 编辑位置等允许字段
- 修改合法状态

馆藏状态以后端定义为准。

不得允许前端绕过业务流程，把正在借阅的副本强行改回 AVAILABLE。

---

## 18. 管理员：用户管理

页面：

```text
/admin/users
```

支持：

- 用户列表
- 分页
- 查看用户信息
- 启用 / 禁用
- 修改角色（仅当后端支持）

不得允许普通 READER 进入该页面。

---

## 19. 管理员：借阅管理

页面：

```text
/admin/loans
```

支持：

- 查询全部借阅
- 根据后端能力筛选
- 查看借阅状态
- 查看逾期状态
- 管理员允许的归还等操作

不添加统计图表。

---

## 20. 错误体验

至少统一处理：

### 401

登录失效：

- 清除登录状态
- 跳转 `/login`

### 403

显示：

```text
无权限访问
```

### 404

显示资源不存在。

### 409

展示后端业务冲突信息，例如：

- 图书不可借
- 重复借阅
- 图书存在关联不能删除

### 422

解析 FastAPI 参数校验错误，并尽量映射到表单。

### 5xx

展示通用服务异常信息，不暴露内部堆栈。

---

## 21. Loading / Empty / Error

所有异步页面必须覆盖：

```text
Loading
Success
Empty
Error
```

不得只处理成功状态。

Mutation 期间必须防止重复提交。

---

## 22. 本地开发连接

推荐架构：

```text
React + Vite
localhost:5173
      ↓
     /api
      ↓
Vite Proxy
      ↓
FastAPI
localhost:8000
      ↓
MySQL
localhost:3306
```

`vite.config.ts` 通过 `/api` 代理 FastAPI。

前端业务代码只请求：

```text
/api/v1/...
```

避免散落硬编码后端 host。

---

## 23. 环境变量

`.env.example`：

```text
VITE_API_BASE_URL=/api
```

真实 `.env` 不提交 Git。

---

## 24. 建议开发阶段

### Phase 1：工程基础与认证

目标：

- 初始化 React + TypeScript + Vite
- 配置 pnpm
- React Router
- Ant Design
- Axios
- TanStack Query
- Zustand
- ESLint / Prettier
- Vite Proxy
- OpenAPI Type Generation
- LoginPage
- AuthGuard
- AdminGuard
- Current User
- AppLayout

验收：

- 可以登录真实 FastAPI 后端
- 刷新页面可以恢复登录状态
- READER 不能进入 ADMIN 路由
- 401 / 403 基础处理正确
- lint / test / build 通过

---

### Phase 2：读者核心功能

目标：

- 图书列表
- 搜索 / 筛选 / 分页
- 图书详情
- 借阅
- 我的借阅
- 归还
- 个人信息

验收：

- 使用真实后端 API
- Query / Mutation 缓存更新正确
- Loading / Empty / Error 状态完整
- 409 / 422 错误可理解

---

### Phase 3：管理员 CRUD

目标：

- 用户管理
- 图书管理
- 作者管理
- 分类管理
- 实体馆藏管理
- 全部借阅管理

验收：

- AdminGuard 正确
- CRUD 使用真实 API
- 表单校验完整
- Table 分页与刷新状态正确
- 后端业务冲突正确展示

---

### Phase 4：工程化收尾

目标：

- 完善测试
- 错误边界
- 统一空状态
- 统一加载状态
- 代码拆分
- README
- 构建检查
- 可选 Playwright E2E

验收：

```bash
pnpm lint
pnpm test
pnpm build
```

全部通过。

---

## 25. 最终完成标准

项目完成时，应满足：

- 前端独立 Git 仓库。
- 可以连接真实 FastAPI 后端。
- API 契约以 OpenAPI 为准。
- READER / ADMIN 路由和 UI 正确区分。
- 图书、借阅和管理员 CRUD 主流程可用。
- Server State 使用 TanStack Query 管理。
- 不存在大量页面级直接 Axios 调用。
- TypeScript 无明显 `any` 滥用。
- lint / test / build 通过。
- 不包含预约和统计模块。
