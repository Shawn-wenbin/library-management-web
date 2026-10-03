import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import { Providers } from '../app/providers'
import { bindAuthCache, createQueryClient } from '../app/queryClient'
import { AppRoutes } from '../router'
import { useAuthStore } from '../store/authStore'
import type { Copy } from '../features/bookCopies/adminTypes'
import { admin, author, book, category, loan, pageOf, reader } from './fixtures'

vi.setConfig({ testTimeout: 20_000 })
let mock: MockAdapter
let client: ReturnType<typeof createQueryClient>
let unbind: () => void
const copy: Copy = {
  id: 11,
  book_id: book.id,
  barcode: 'LIB-001',
  location: 'A-1',
  acquired_at: '2026-01-01',
  status: 'AVAILABLE',
  created_at: book.created_at,
  updated_at: book.updated_at,
}
beforeEach(() => {
  mock = new MockAdapter(apiClient)
  client = createQueryClient()
  client.setDefaultOptions({
    queries: { retry: false, staleTime: 60_000 },
    mutations: { retry: false },
  })
  unbind = bindAuthCache(client)
  useAuthStore.getState().setToken('admin-token')
  mock.onGet('/v1/users/me').reply(200, admin)
  mock.onGet('/v1/users').reply(200, pageOf([reader]))
  mock.onGet(`/v1/users/${reader.id}`).reply(200, reader)
  mock.onGet('/v1/authors').reply(200, pageOf([author]))
  mock.onGet('/v1/categories').reply(200, [category])
  mock.onGet('/v1/books').reply(200, pageOf([book]))
  mock.onGet(`/v1/books/${book.id}/copies`).reply(200, pageOf([copy]))
  mock.onGet('/v1/loans').reply(200, pageOf([loan]))
  mock.onGet('/v1/loans/overdue').reply(200, pageOf([loan]))
})
afterEach(() => {
  unbind()
  client.clear()
  mock.restore()
})
function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="location">
      {location.pathname}
      {location.search}
    </output>
  )
}
function renderApp(path: string) {
  return render(
    <Providers client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
        <LocationProbe />
      </MemoryRouter>
    </Providers>,
  )
}
function paramsAt(path: string) {
  return mock.history.get.filter((request) => request.url === path).at(-1)
    ?.params
}
async function clickButton(name: string | RegExp) {
  await userEvent.click(await screen.findByRole('button', { name }))
}
async function save() {
  await userEvent.click(
    within(screen.getByRole('dialog')).getByRole('button', { name: /保\s*存/ }),
  )
}
async function select(label: string, option: string) {
  await userEvent.click(
    within(screen.getByRole('dialog')).getByLabelText(label),
  )
  await userEvent.click(
    await screen.findByText(option, {
      selector: '.ant-select-item-option-content',
    }),
  )
}

describe('管理员守卫与查询状态', () => {
  it.each([
    '/admin/users',
    '/admin/books',
    '/admin/authors',
    '/admin/categories',
    '/admin/books/7/copies',
    '/admin/loans',
  ])('读者不能访问 %s，且不发送管理查询', async (path) => {
    mock.onGet('/v1/users/me').reply(200, reader)
    renderApp(path)
    expect(await screen.findByText('无权限访问')).toBeInTheDocument()
    expect(mock.history.get.map((request) => request.url)).toEqual([
      '/v1/users/me',
    ])
  })
  it('无效馆藏所属图书编号不发送请求', async () => {
    renderApp('/admin/books/invalid/copies')
    expect(await screen.findByText('无效的图书编号')).toBeInTheDocument()
    expect(mock.history.get).toHaveLength(1)
  })
  it('管理员列表有加载、错误、重试和空状态', async () => {
    let resolve!: (value: [number, unknown]) => void
    mock.onGet('/v1/users').reply(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    renderApp('/admin/users')
    expect(await screen.findByText('正在加载用户…')).toBeInTheDocument()
    await act(async () => resolve([500, { detail: 'private stack' }]))
    expect(await screen.findByRole('alert')).toHaveTextContent('服务暂时不可用')
    mock.onGet('/v1/users').reply(200, pageOf([]))
    await clickButton(/重\s*试/)
    expect(await screen.findByText('暂无用户')).toBeInTheDocument()
  })
})

describe('用户管理', () => {
  it('提交禁用筛选重置页码，分页与刷新保留条件', async () => {
    mock
      .onGet('/v1/users')
      .reply((config) => [
        200,
        pageOf([reader], config.params.page, config.params.page_size, 45),
      ])
    renderApp('/admin/users?page=2')
    await screen.findByText(reader.email)
    await userEvent.click(screen.getByLabelText('账号状态'))
    await userEvent.click(
      await screen.findByText('禁用', {
        selector: '.ant-select-item-option-content',
      }),
    )
    await clickButton(/查\s*询/)
    await waitFor(() =>
      expect(paramsAt('/v1/users')).toMatchObject({
        is_active: false,
        page: 1,
      }),
    )
    await userEvent.click(screen.getByTitle('下一页'))
    await waitFor(() =>
      expect(paramsAt('/v1/users')).toMatchObject({
        is_active: false,
        page: 2,
      }),
    )
    await clickButton('刷新用户')
    expect(paramsAt('/v1/users')).toMatchObject({ is_active: false, page: 2 })
  })

  it('恢复角色与禁用筛选和分页，按 ID 请求详情', async () => {
    mock.onGet('/v1/users').reply(200, pageOf([reader], 2, 10, 21))
    renderApp('/admin/users?role=READER&is_active=false&page=2&page_size=10')
    await screen.findByText(reader.email)
    expect(paramsAt('/v1/users')).toEqual({
      role: 'READER',
      is_active: false,
      page: 2,
      page_size: 10,
    })
    await clickButton(/查\s*看/)
    expect(
      await within(screen.getByRole('dialog')).findByText(reader.username),
    ).toBeInTheDocument()
    expect(
      mock.history.get.some(
        (request) => request.url === `/v1/users/${reader.id}`,
      ),
    ).toBe(true)
  })
  it('启停确认使用 status PATCH，刷新用户与身份缓存', async () => {
    mock
      .onPatch(`/v1/users/${reader.id}/status`)
      .reply(200, { ...reader, is_active: false })
    client.setQueryData(queryKeys.users.detail(reader.id), reader)
    renderApp('/admin/users')
    await clickButton('禁用账号')
    expect(mock.history.patch).toHaveLength(0)
    await clickButton('确认修改')
    expect(await screen.findByText('用户更新成功')).toBeInTheDocument()
    expect(JSON.parse(mock.history.patch[0]?.data)).toEqual({
      is_active: false,
    })
    expect(
      client.getQueryState(queryKeys.users.detail(reader.id))?.isInvalidated,
    ).toBe(true)
    expect(
      mock.history.get.filter((request) => request.url === '/v1/users/me'),
    ).toHaveLength(2)
  })
  it('自身降级后重新获取身份，AdminGuard 立即阻止继续管理', async () => {
    let downgraded = false
    mock.onGet('/v1/users').reply(200, pageOf([admin]))
    mock
      .onGet('/v1/users/me')
      .reply(() => [200, { ...admin, role: downgraded ? 'READER' : 'ADMIN' }])
    mock.onPatch(`/v1/users/${admin.id}/role`).reply(() => {
      downgraded = true
      return [200, { ...admin, role: 'READER' }]
    })
    renderApp('/admin/users')
    await clickButton('改为读者')
    await clickButton('确认修改')
    expect(await screen.findByText('无权限访问')).toBeInTheDocument()
    expect(JSON.parse(mock.history.patch[0]?.data)).toEqual({ role: 'READER' })
  })
})

describe('作者与分类 CRUD', () => {
  it('作者名称必填并限制长度，创建期间锁定，成功刷新作者和图书', async () => {
    let resolve!: (value: [number, unknown]) => void
    mock.onPost('/v1/authors').reply(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    client.setQueryData(queryKeys.books.detail(book.id), book)
    renderApp('/admin/authors')
    await clickButton('新增作者')
    await save()
    expect(await screen.findByText('请输入内容')).toBeInTheDocument()
    expect(mock.history.post).toHaveLength(0)
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('作者名称'))
    await user.paste('名'.repeat(151))
    await save()
    expect(await screen.findByText('最多 150 个字符')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('作者名称'))
    await user.type(screen.getByLabelText('作者名称'), ' 新作者 ')
    await save()
    await waitFor(() => expect(mock.history.post).toHaveLength(1))
    expect(JSON.parse(mock.history.post[0]?.data)).toEqual({
      name: '新作者',
      biography: null,
    })
    expect(screen.getByLabelText('作者名称')).toBeDisabled()
    expect(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: /取\s*消/,
      }),
    ).toBeDisabled()
    await act(async () => resolve([201, { ...author, name: '新作者' }]))
    expect(await screen.findByText('作者保存成功')).toBeInTheDocument()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(
      client.getQueryState(queryKeys.books.detail(book.id))?.isInvalidated,
    ).toBe(true)
    expect(
      mock.history.get.filter((request) => request.url === '/v1/authors'),
    ).toHaveLength(2)
  })
  it('作者 PATCH 的 422 错误映射到表单字段并保留输入，修正后可保存', async () => {
    mock.onPatch(`/v1/authors/${author.id}`).reply(422, {
      detail: [
        { loc: ['body', 'name'], msg: '该名称不合法', type: 'value_error' },
      ],
    })
    renderApp('/admin/authors')
    await clickButton(/编\s*辑/)
    await userEvent.clear(screen.getByLabelText('作者名称'))
    await userEvent.type(screen.getByLabelText('作者名称'), '修改作者')
    await save()
    expect(
      await screen.findByText('该名称不合法', {
        selector: '.ant-form-item-explain-error',
      }),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('作者名称')).toHaveValue('修改作者')
    expect(JSON.parse(mock.history.patch[0]?.data)).toEqual({
      name: '修改作者',
      biography: null,
    })
    mock.onPatch(`/v1/authors/${author.id}`).reply(200, author)
    await save()
    expect(await screen.findByText('作者保存成功')).toBeInTheDocument()
  })
  it('作者关联冲突显示后端消息并重取列表，失败不伪造删除', async () => {
    mock.onDelete(`/v1/authors/${author.id}`).reply(409, {
      code: 'AUTHOR_IN_USE',
      message: '作者存在关联图书，无法删除',
      details: null,
    })
    renderApp('/admin/authors')
    await clickButton(/删\s*除/)
    await clickButton('确认删除')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '作者存在关联图书，无法删除',
    )
    expect(screen.getByText(author.name)).toBeInTheDocument()
    expect(
      mock.history.get.filter((request) => request.url === '/v1/authors'),
    ).toHaveLength(2)
  })
  it('删除作者后保持页容量并纠正已空的末页', async () => {
    let deleted = false
    mock
      .onGet('/v1/authors')
      .reply((config) => [
        200,
        pageOf(
          deleted && config.params.page === 2 ? [] : [author],
          config.params.page,
          1,
          deleted ? 1 : 2,
        ),
      ])
    mock.onDelete(`/v1/authors/${author.id}`).reply(() => {
      deleted = true
      return [204]
    })
    renderApp('/admin/authors?page=2&page_size=1')
    await clickButton(/删\s*除/)
    await clickButton('确认删除')
    expect(await screen.findByText('作者删除成功')).toBeInTheDocument()
    await waitFor(() =>
      expect(paramsAt('/v1/authors')).toEqual({ page: 1, page_size: 1 }),
    )
    expect(screen.getByTestId('location')).toHaveTextContent(
      'page=1&page_size=1',
    )
  })
  it('分类完整数组本地分页，编辑后刷新，删除成功回退页码', async () => {
    let deleted = false
    mock
      .onGet('/v1/categories')
      .reply(() => [
        200,
        deleted
          ? [{ ...category, id: 1, name: '首页分类' }]
          : [{ ...category, id: 1, name: '首页分类' }, category],
      ])
    mock.onPatch(`/v1/categories/${category.id}`).reply(200, category)
    mock.onDelete(`/v1/categories/${category.id}`).reply(() => {
      deleted = true
      return [204]
    })
    renderApp('/admin/categories?page=2&page_size=1')
    expect(await screen.findByText(category.name)).toBeInTheDocument()
    expect(screen.queryByText('首页分类')).not.toBeInTheDocument()
    expect(paramsAt('/v1/categories')).toBeUndefined()
    await clickButton(/编\s*辑/)
    await userEvent.type(screen.getByLabelText('分类描述'), '新描述')
    await save()
    expect(await screen.findByText('分类保存成功')).toBeInTheDocument()
    expect(JSON.parse(mock.history.patch[0]?.data)).toEqual({
      name: category.name,
      description: '新描述',
    })
    await clickButton(/删\s*除/)
    await clickButton('确认删除')
    expect(await screen.findByText('首页分类')).toBeInTheDocument()
    expect(screen.getByTestId('location')).toHaveTextContent('page=1')
  })
  it('分类新增使用 POST，仅发送契约字段', async () => {
    mock.onPost('/v1/categories').reply(201, category)
    renderApp('/admin/categories')
    await clickButton('新增分类')
    await userEvent.type(screen.getByLabelText('分类名称'), '新分类')
    await save()
    expect(await screen.findByText('分类保存成功')).toBeInTheDocument()
    expect(JSON.parse(mock.history.post[0]?.data)).toEqual({
      name: '新分类',
      description: null,
    })
  })
})

describe('图书与馆藏管理', () => {
  it('下架使用 DELETE，保留查询并刷新列表；馆藏入口保留返回筛选', async () => {
    mock.onDelete(`/v1/books/${book.id}`).reply(204)
    renderApp('/admin/books?keyword=测试&is_active=true')
    await clickButton(/下\s*架/)
    await clickButton('确认下架')
    expect(await screen.findByText('图书已下架')).toBeInTheDocument()
    expect(mock.history.delete[0]?.url).toBe(`/v1/books/${book.id}`)
    expect(paramsAt('/v1/books')).toMatchObject({
      keyword: '测试',
      is_active: true,
    })
    await userEvent.click(screen.getByRole('link', { name: '馆藏管理' }))
    await screen.findByText(copy.barcode)
    await userEvent.click(screen.getByRole('link', { name: '返回图书管理' }))
    expect(await screen.findByLabelText('关键词')).toHaveValue('测试')
  })
  it('下架图书可编辑上架；只发送可写字段，清空可选字段发送 null', async () => {
    mock.onGet('/v1/books').reply(200, pageOf([{ ...book, is_active: false }]))
    mock.onPatch(`/v1/books/${book.id}`).reply(200, book)
    renderApp('/admin/books?is_active=false')
    await clickButton(/编\s*辑/)
    expect(paramsAt('/v1/books')).toMatchObject({ is_active: false })
    expect(
      screen.queryByRole('button', { name: /^下\s*架$/ }),
    ).not.toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('ISBN'))
    await userEvent.click(screen.getByRole('switch', { name: '上架' }))
    await save()
    expect(await screen.findByText('图书保存成功')).toBeInTheDocument()
    expect(JSON.parse(mock.history.patch[0]?.data)).toEqual({
      title: book.title,
      subtitle: book.subtitle,
      isbn: null,
      category_id: category.id,
      author_ids: [author.id],
      publisher: book.publisher,
      publication_date: book.publication_date,
      description: book.description,
      cover_url: null,
      is_active: true,
    })
  })
  it('图书新增验证必填、日期与 URL，选分类后 POST', async () => {
    mock.onPost('/v1/books').reply(201, book)
    renderApp('/admin/books')
    await clickButton('新增图书')
    await save()
    expect(await screen.findByText('请选择分类')).toBeInTheDocument()
    expect(mock.history.post).toHaveLength(0)
    await userEvent.type(screen.getByLabelText('书名'), '新图书')
    await select('分类', category.name)
    await userEvent.type(screen.getByLabelText('出版日期'), '2026-02-30')
    await userEvent.type(screen.getByLabelText('封面地址'), 'invalid')
    await save()
    expect(
      await screen.findByText('请输入有效日期（YYYY-MM-DD）'),
    ).toBeInTheDocument()
    expect(await screen.findByText('请输入有效的完整 URL')).toBeInTheDocument()
    expect(mock.history.post).toHaveLength(0)
    await userEvent.clear(screen.getByLabelText('出版日期'))
    await userEvent.clear(screen.getByLabelText('封面地址'))
    await save()
    expect(await screen.findByText('图书保存成功')).toBeInTheDocument()
    expect(JSON.parse(mock.history.post[0]?.data)).toMatchObject({
      title: '新图书',
      category_id: category.id,
      author_ids: [],
      is_active: true,
    })
  })
  it('馆藏创建不提交状态；编辑只提交允许字段并刷新图书缓存', async () => {
    mock.onPost(`/v1/books/${book.id}/copies`).reply(201, copy)
    mock.onPatch(`/v1/copies/${copy.id}`).reply(200, copy)
    client.setQueryData(queryKeys.books.detail(book.id), book)
    renderApp(`/admin/books/${book.id}/copies`)
    await clickButton('新增馆藏')
    await save()
    expect(await screen.findByText('请输入内容')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('条码'), ' NEW-001 ')
    await save()
    expect(await screen.findByText('馆藏保存成功')).toBeInTheDocument()
    expect(JSON.parse(mock.history.post[0]?.data)).toEqual({
      barcode: 'NEW-001',
      location: null,
      acquired_at: null,
    })
    expect(
      client.getQueryState(queryKeys.books.detail(book.id))?.isInvalidated,
    ).toBe(true)
    await clickButton(/编\s*辑/)
    expect(screen.queryByLabelText('条码')).not.toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('馆藏位置'))
    await save()
    expect(await screen.findByText('馆藏保存成功')).toBeInTheDocument()
    expect(JSON.parse(mock.history.patch[0]?.data)).toEqual({
      location: null,
      acquired_at: copy.acquired_at,
    })
  })
  it('借出副本禁止改状态；其他副本无法选择 BORROWED，使用独立 status PATCH', async () => {
    mock
      .onGet(`/v1/books/${book.id}/copies`)
      .reply(
        200,
        pageOf([
          copy,
          { ...copy, id: 12, barcode: 'BORROWED-001', status: 'BORROWED' },
        ]),
      )
    mock
      .onPatch(`/v1/copies/${copy.id}/status`)
      .reply(200, { ...copy, status: 'MAINTENANCE' })
    renderApp(`/admin/books/${book.id}/copies`)
    const borrowedRow = (await screen.findByText('BORROWED-001')).closest('tr')!
    expect(
      within(borrowedRow).getByRole('button', { name: '修改状态' }),
    ).toBeDisabled()
    await userEvent.click(
      within(screen.getByText(copy.barcode).closest('tr')!).getByRole(
        'button',
        { name: '修改状态' },
      ),
    )
    await userEvent.click(
      screen.getByLabelText('馆藏状态', { selector: 'input' }),
    )
    expect(
      screen.queryByText('借出', {
        selector: '.ant-select-item-option-content',
      }),
    ).not.toBeInTheDocument()
    await userEvent.click(
      await screen.findByText('维护', {
        selector: '.ant-select-item-option-content',
      }),
    )
    await save()
    expect(await screen.findByText('馆藏状态更新成功')).toBeInTheDocument()
    expect(JSON.parse(mock.history.patch[0]?.data)).toEqual({
      status: 'MAINTENANCE',
    })
  })
})

describe('全部借阅管理', () => {
  it('编号筛选拒绝负数与非整数，不发送非法查询', async () => {
    renderApp('/admin/loans')
    await screen.findByText('逾期', { selector: '.ant-tag' })
    await userEvent.type(screen.getByLabelText('用户编号'), '-1')
    await userEvent.type(screen.getByLabelText('图书编号'), '1.5')
    await clickButton(/查\s*询/)
    expect(await screen.findAllByText('请输入有效的正整数编号')).toHaveLength(2)
    expect(
      mock.history.get.filter((request) => request.url === '/v1/loans'),
    ).toHaveLength(1)
  })

  it('按用户、图书、状态查询，逾期调用专用接口且省略 status', async () => {
    renderApp('/admin/loans?user_id=1&book_id=7&status=BORROWED')
    expect(
      await screen.findByText('逾期', { selector: '.ant-tag' }),
    ).toBeInTheDocument()
    expect(paramsAt('/v1/loans')).toEqual({
      user_id: 1,
      book_id: 7,
      status: 'BORROWED',
      page: 1,
      page_size: 20,
    })
    await userEvent.click(screen.getByLabelText('仅看逾期'))
    await clickButton(/查\s*询/)
    await waitFor(() =>
      expect(paramsAt('/v1/loans/overdue')).toEqual({
        user_id: 1,
        book_id: 7,
        page: 1,
        page_size: 20,
      }),
    )
    expect(screen.getByTestId('location')).not.toHaveTextContent('status=')
  })
  it('管理员归还期间禁止重复请求，并失效读者借阅、图书和馆藏缓存', async () => {
    let resolve!: (value: [number, unknown]) => void
    mock.onPost(`/v1/loans/${loan.id}/return`).reply(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    const keys = [
      queryKeys.loans.me({}),
      queryKeys.books.detail(book.id),
      queryKeys.bookCopies.list(book.id, {}),
    ]
    keys.forEach((key) => client.setQueryData(key, {}))
    renderApp('/admin/loans')
    await clickButton('归还')
    await clickButton('确认归还')
    await waitFor(() => expect(mock.history.post).toHaveLength(1))
    expect(screen.getByRole('button', { name: '归还' })).toBeDisabled()
    expect(mock.history.post[0]?.data).toBeUndefined()
    await act(async () => resolve([200, { ...loan, status: 'RETURNED' }]))
    expect(await screen.findByText('归还成功')).toBeInTheDocument()
    keys.forEach((key) =>
      expect(client.getQueryState(key)?.isInvalidated).toBe(true),
    )
  })
  it.each([403, 409])('归还 %s 反馈且恢复操作按钮', async (status) => {
    mock
      .onPost(`/v1/loans/${loan.id}/return`)
      .reply(status, { detail: '记录已被归还' })
    renderApp('/admin/loans')
    await clickButton('归还')
    await clickButton('确认归还')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      status === 403 ? '无权限访问' : '记录已被归还',
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '归还' })).toBeEnabled(),
    )
  })
})
