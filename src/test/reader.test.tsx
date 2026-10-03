import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, useLocation, useNavigate } from 'react-router'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '../api/client'
import { queryKeys } from '../api/queryKeys'
import { Providers } from '../app/providers'
import { bindAuthCache, createQueryClient } from '../app/queryClient'
import { AppRoutes } from '../router'
import { useAuthStore } from '../store/authStore'
import { author, book, category, loan, pageOf, reader } from './fixtures'

let mock: MockAdapter
// Full Ant Design form/table interactions take longer than isolated unit tests in jsdom.
vi.setConfig({ testTimeout: 15_000 })
let client: ReturnType<typeof createQueryClient>
let unbind: () => void
beforeEach(() => {
  mock = new MockAdapter(apiClient)
  client = createQueryClient()
  client.setDefaultOptions({
    queries: { retry: false, staleTime: 60_000 },
    mutations: { retry: false },
  })
  unbind = bindAuthCache(client)
  useAuthStore.getState().setToken('reader-token')
  mock.onGet('/v1/users/me').reply(200, reader)
  mock.onGet('/v1/categories').reply(200, [category])
  mock.onGet('/v1/authors').reply(200, pageOf([author], 1, 100))
  mock.onGet(`/v1/authors/${author.id}`).reply(200, author)
  mock.onGet('/v1/books').reply(200, pageOf([book]))
  mock.onGet(`/v1/books/${book.id}`).reply(200, book)
  mock.onGet('/v1/loans/me').reply(200, pageOf([loan]))
})
afterEach(() => {
  unbind()
  client.clear()
  mock.restore()
})

function LocationProbe() {
  const location = useLocation()
  const navigate = useNavigate()
  return (
    <>
      <output data-testid="location">
        {location.pathname}
        {location.search}
      </output>
      <button onClick={() => navigate(-1)}>浏览器后退</button>
    </>
  )
}
function renderApp(path = '/books') {
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

describe('读者图书浏览', () => {
  it('从 URL 恢复核心筛选、排序、分页，调用真实列表契约', async () => {
    mock.onGet('/v1/books').reply(200, pageOf([book], 2, 10, 30))
    renderApp(
      '/books?keyword=测试&category_id=3&author_id=4&available_only=true&sort_by=title&sort_order=desc&page=2&page_size=10',
    )
    expect(
      await screen.findByRole('link', { name: book.title }),
    ).toBeInTheDocument()
    expect(paramsAt('/v1/books')).toEqual({
      keyword: '测试',
      category_id: 3,
      author_id: 4,
      available_only: true,
      sort_by: 'title',
      sort_order: 'desc',
      page: 2,
      page_size: 10,
      is_active: true,
    })
    expect(screen.getByLabelText('关键词')).toHaveValue('测试')
    expect(screen.getByLabelText('仅看可借')).toBeChecked()
    expect(screen.getByText('3 / 2')).toBeInTheDocument()
  })

  it('查询重置页码，分页保留筛选，浏览器后退恢复输入', async () => {
    mock
      .onGet('/v1/books')
      .reply((config) => [
        200,
        pageOf([book], config.params.page, config.params.page_size, 45),
      ])
    renderApp('/books?keyword=旧词&page=2')
    await screen.findByRole('link', { name: book.title })
    const user = userEvent.setup()
    await user.clear(screen.getByLabelText('关键词'))
    await user.type(screen.getByLabelText('关键词'), ' 新词 ')
    await user.click(screen.getByRole('button', { name: /查\s*询/ }))
    await waitFor(() =>
      expect(paramsAt('/v1/books')).toMatchObject({ keyword: '新词', page: 1 }),
    )
    await user.click(screen.getByTitle('下一页'))
    await waitFor(() =>
      expect(paramsAt('/v1/books')).toMatchObject({ keyword: '新词', page: 2 }),
    )
    await user.click(screen.getByRole('button', { name: '浏览器后退' }))
    await waitFor(() =>
      expect(screen.getByTestId('location')).toHaveTextContent('page=1'),
    )
    await user.click(screen.getByRole('button', { name: '浏览器后退' }))
    await waitFor(() =>
      expect(screen.getByLabelText('关键词')).toHaveValue('旧词'),
    )
    await user.click(screen.getByRole('button', { name: /重\s*置/ }))
    await waitFor(() =>
      expect(screen.getByTestId('location').textContent).toBe('/books'),
    )
    expect(screen.getByLabelText('关键词')).toHaveValue('')
  })

  it('关键词超过契约长度时显示表单校验，不发送查询', async () => {
    renderApp()
    await screen.findByRole('link', { name: book.title })
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('关键词'))
    await user.paste('长'.repeat(256))
    await user.click(screen.getByRole('button', { name: /查\s*询/ }))
    expect(
      await screen.findByText('关键词不能超过 255 个字符'),
    ).toBeInTheDocument()
    expect(
      mock.history.get.filter((request) => request.url === '/v1/books'),
    ).toHaveLength(1)
  })

  it('作者列表支持加载后续页并提交所选作者，分类和可借筛选写入 URL', async () => {
    mock.onGet('/v1/authors').reply((config) => [
      200,
      pageOf(
        [
          {
            ...author,
            id: config.params.page === 1 ? 4 : 104,
            name: config.params.page === 1 ? '测试作者' : '后页作者',
          },
        ],
        config.params.page,
        100,
        101,
      ),
    ])
    renderApp()
    await screen.findByRole('link', { name: book.title })
    const user = userEvent.setup()
    await user.click(screen.getByLabelText('作者'))
    await user.click(
      await screen.findByRole('button', { name: '加载更多作者' }),
    )
    await user.click(await screen.findByText('后页作者'))
    await user.click(screen.getByLabelText('分类'))
    await user.click(
      await screen.findByText('文学', {
        selector: '.ant-select-item-option-content',
      }),
    )
    await user.click(screen.getByLabelText('仅看可借'))
    await user.click(screen.getByRole('button', { name: /查\s*询/ }))
    await waitFor(() =>
      expect(paramsAt('/v1/books')).toMatchObject({
        author_id: 104,
        category_id: 3,
        available_only: true,
        page: 1,
      }),
    )
    expect(screen.getByTestId('location')).toHaveTextContent('author_id=104')
  })

  it('列表加载、空结果和请求失败可重试', async () => {
    let resolve!: (response: [number, unknown]) => void
    mock.onGet('/v1/books').reply(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    renderApp()
    expect(await screen.findByText('正在加载图书…')).toBeInTheDocument()
    await act(async () => resolve([500, { detail: 'private stack' }]))
    expect(await screen.findByRole('alert')).toHaveTextContent('服务暂时不可用')
    expect(screen.queryByText('private stack')).not.toBeInTheDocument()
    mock.onGet('/v1/books').reply(200, pageOf([]))
    await userEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    expect(await screen.findByText('暂无符合条件的图书')).toBeInTheDocument()
  })

  it('详情展示真实字段和简介，返回列表保留筛选', async () => {
    renderApp('/books?keyword=测试')
    await userEvent.click(await screen.findByRole('link', { name: book.title }))
    expect(await screen.findByText(book.description!)).toBeInTheDocument()
    expect(screen.getByText(book.isbn!)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '借阅此书' })).toBeEnabled()
    await userEvent.click(screen.getByRole('link', { name: '返回图书列表' }))
    expect(await screen.findByLabelText('关键词')).toHaveValue('测试')
  })

  it.each([404, 403])('详情 %s 显示明确错误', async (status) => {
    mock.onGet(`/v1/books/${book.id}`).reply(status)
    renderApp(`/books/${book.id}`)
    expect(await screen.findByRole('alert')).toHaveTextContent(
      status === 404 ? '请求的资源不存在' : '无权限访问',
    )
    expect(
      screen.queryByRole('button', { name: '借阅此书' }),
    ).not.toBeInTheDocument()
  })

  it('无效的详情 ID 不发请求', async () => {
    renderApp('/books/not-a-number')
    expect(await screen.findByText('无效的图书编号')).toBeInTheDocument()
    expect(
      mock.history.get.some((request) => request.url?.startsWith('/v1/books/')),
    ).toBe(false)
  })
})

describe('借阅和缓存一致性', () => {
  it('只提交 book_id，期间禁用，成功刷新详情并失效所有列表与我的借阅缓存', async () => {
    let resolve!: (response: [number, unknown]) => void
    let borrowed = false
    mock.onPost('/v1/loans').reply(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    mock
      .onGet(`/v1/books/${book.id}`)
      .reply(() => [200, { ...book, available_copies: borrowed ? 1 : 2 }])
    const listKey = queryKeys.books.list({ page: 2 })
    const loansKey = queryKeys.loans.me({ status: 'BORROWED' })
    client.setQueryData(listKey, pageOf([book]))
    client.setQueryData(loansKey, pageOf([]))
    renderApp(`/books/${book.id}`)
    await userEvent.click(
      await screen.findByRole('button', { name: '借阅此书' }),
    )
    expect(screen.getByRole('button', { name: '借阅此书' })).toBeDisabled()
    expect(mock.history.post).toHaveLength(1)
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      book_id: book.id,
    })
    expect(mock.history.post[0]?.headers?.Authorization).toBe(
      'Bearer reader-token',
    )
    borrowed = true
    await act(async () => resolve([201, loan]))
    expect(await screen.findByText('借阅成功')).toBeInTheDocument()
    expect(screen.getByText('3 / 1')).toBeInTheDocument()
    expect(client.getQueryState(listKey)?.isInvalidated).toBe(true)
    expect(client.getQueryState(loansKey)?.isInvalidated).toBe(true)
  })

  it('无可借馆藏时禁止提交', async () => {
    mock
      .onGet(`/v1/books/${book.id}`)
      .reply(200, { ...book, available_copies: 0 })
    renderApp(`/books/${book.id}`)
    expect(
      await screen.findByRole('button', { name: '借阅此书' }),
    ).toBeDisabled()
    expect(screen.getByText('暂不可借')).toBeInTheDocument()
    expect(mock.history.post).toHaveLength(0)
  })

  it.each([
    [409, { detail: '不可重复借阅此书' }, '不可重复借阅此书'],
    [
      409,
      { code: 'DUPLICATE_LOAN', message: '该图书尚未归还', details: null },
      '该图书尚未归还',
    ],
    [
      422,
      {
        code: 'VALIDATION_ERROR',
        message: '请求参数不合法',
        details: [{ loc: ['body', 'book_id'], type: 'greater_than' }],
      },
      '图书编号：数值必须大于允许的下限',
    ],
    [
      422,
      {
        detail: [
          {
            loc: ['body', 'book_id'],
            msg: '图书编号无效',
            type: 'value_error',
          },
        ],
      },
      '图书编号：图书编号无效',
    ],
  ])('借阅 %s 显示业务反馈并恢复按钮', async (status, body, message) => {
    mock.onPost('/v1/loans').reply(status, body)
    renderApp(`/books/${book.id}`)
    await userEvent.click(
      await screen.findByRole('button', { name: '借阅此书' }),
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '借阅此书' })).toBeEnabled(),
    )
    expect(screen.queryByText('借阅成功')).not.toBeInTheDocument()
  })
})

describe('我的借阅和个人信息', () => {
  it('按契约展示应还时间和逾期，切换当前/历史并重置分页', async () => {
    mock.onGet('/v1/loans/me').reply((config) => [
      200,
      pageOf(
        [
          {
            ...loan,
            status:
              config.params.status === 'RETURNED' ? 'RETURNED' : 'BORROWED',
            is_overdue: config.params.status !== 'RETURNED',
          },
        ],
        config.params.page,
        20,
        21,
      ),
    ])
    renderApp('/me/loans?page=2')
    expect(await screen.findByText('逾期')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: `图书 #${book.id}` }),
    ).toHaveAttribute('href', `/books/${book.id}`)
    const user = userEvent.setup()
    await user.click(screen.getByRole('tab', { name: '当前借阅' }))
    await waitFor(() =>
      expect(paramsAt('/v1/loans/me')).toMatchObject({
        status: 'BORROWED',
        page: 1,
      }),
    )
    await user.click(screen.getByRole('tab', { name: '历史借阅' }))
    expect(await screen.findByText('已归还')).toBeInTheDocument()
    expect(paramsAt('/v1/loans/me')).toMatchObject({
      status: 'RETURNED',
      page: 1,
    })
    expect(
      screen.queryByRole('button', { name: /归\s*还/ }),
    ).not.toBeInTheDocument()
    expect(
      mock.history.get.some((request) => request.url === '/v1/loans'),
    ).toBe(false)
  })

  it('归还需确认，使用 loan_id 和空请求体，成功回退已空的末页并刷新缓存', async () => {
    let returned = false
    let resolve!: (response: [number, unknown]) => void
    mock
      .onGet('/v1/loans/me')
      .reply((config) => [
        200,
        pageOf(
          returned && config.params.page === 2 ? [] : [loan],
          config.params.page,
          1,
          returned ? 1 : 2,
        ),
      ])
    mock.onPost(`/v1/loans/${loan.id}/return`).reply(
      () =>
        new Promise((done) => {
          resolve = done
        }),
    )
    client.setQueryData(queryKeys.books.detail(book.id), book)
    client.setQueryData(queryKeys.books.list({}), pageOf([book]))
    renderApp('/me/loans?status=BORROWED&page=2&page_size=1')
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /归\s*还/ }))
    expect(mock.history.post).toHaveLength(0)
    await user.click(screen.getByRole('button', { name: '确认归还' }))
    await waitFor(() => expect(mock.history.post).toHaveLength(1))
    expect(mock.history.post[0]?.data).toBeUndefined()
    expect(screen.getByRole('button', { name: /^归\s*还$/ })).toBeDisabled()
    returned = true
    await act(async () =>
      resolve([
        200,
        {
          ...loan,
          status: 'RETURNED',
          returned_at: '2026-02-01T00:00:00Z',
          is_overdue: false,
        },
      ]),
    )
    expect(await screen.findByText('归还成功')).toBeInTheDocument()
    await waitFor(() =>
      expect(paramsAt('/v1/loans/me')).toMatchObject({
        status: 'BORROWED',
        page: 1,
      }),
    )
    expect(
      client.getQueryState(queryKeys.books.detail(book.id))?.isInvalidated,
    ).toBe(true)
    expect(client.getQueryState(queryKeys.books.list({}))?.isInvalidated).toBe(
      true,
    )
  })

  it('归还冲突保留反馈和记录，可再次操作', async () => {
    mock
      .onPost(`/v1/loans/${loan.id}/return`)
      .reply(409, { detail: '此借阅已归还，请刷新' })
    renderApp('/me/loans')
    await userEvent.click(
      await screen.findByRole('button', { name: /归\s*还/ }),
    )
    await userEvent.click(screen.getByRole('button', { name: '确认归还' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '此借阅已归还，请刷新',
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /^归\s*还$/ })).toBeEnabled(),
    )
  })

  it('我的借阅空状态与网络失败可重试', async () => {
    mock.onGet('/v1/loans/me').networkError()
    renderApp('/me/loans')
    expect(await screen.findByRole('alert')).toHaveTextContent('无法连接服务器')
    mock.onGet('/v1/loans/me').reply(200, pageOf([]))
    await userEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    expect(await screen.findByText('暂无借阅记录')).toBeInTheDocument()
  })

  it('业务接口 401 清除会话和缓存并跳转登录', async () => {
    mock.onGet('/v1/loans/me').reply(401)
    renderApp('/me/loans')
    expect(
      await screen.findByRole('heading', { name: '欢迎回来' }),
    ).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBeNull()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it('个人信息复用当前用户查询，显示契约字段', async () => {
    renderApp('/me')
    expect(await screen.findByText(reader.email)).toBeInTheDocument()
    const content = within(screen.getByRole('main'))
    expect(content.getByText(reader.username)).toBeInTheDocument()
    expect(content.getByText(reader.full_name!)).toBeInTheDocument()
    expect(content.getByText('启用')).toBeInTheDocument()
    expect(
      mock.history.get.filter((request) => request.url === '/v1/users/me'),
    ).toHaveLength(1)
  })
})
