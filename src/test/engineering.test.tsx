import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lazy } from 'react'
import { Link, MemoryRouter, Route, Routes } from 'react-router'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { ManagementTable } from '../components/ManagementTable'
import { PageBoundary } from '../router/PageBoundary'
import { ApiError } from '../api/errors'

function Broken(): never {
  throw new Error('private stack and account details')
}

describe('错误边界与页面加载', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it('应用异常显示安全反馈，重试可以恢复子树', async () => {
    const view = render(
      <ErrorBoundary>
        <Broken />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('应用暂时无法显示')
    expect(screen.queryByText(/private stack/)).not.toBeInTheDocument()
    view.rerender(
      <ErrorBoundary>
        <p>应用已恢复</p>
      </ErrorBoundary>,
    )
    await userEvent.click(screen.getByRole('button', { name: '重试应用' }))
    expect(screen.getByText('应用已恢复')).toBeInTheDocument()
  })

  it('页面异常保留外部导航，切换路径后自动恢复', async () => {
    render(
      <MemoryRouter initialEntries={['/broken']}>
        <nav aria-label="主导航">
          <Link to="/healthy">个人信息</Link>
        </nav>
        <Routes>
          <Route element={<PageBoundary />}>
            <Route path="broken" element={<Broken />} />
            <Route path="healthy" element={<p>正常页面</p>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('页面暂时无法显示')
    await userEvent.click(screen.getByRole('link', { name: '个人信息' }))
    expect(await screen.findByText('正常页面')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('页面模块未就绪时显示统一 Loading，就绪后展示页面', async () => {
    let resolve!: (module: { default: () => React.ReactNode }) => void
    const Page = lazy(
      () =>
        new Promise<{ default: () => React.ReactNode }>((done) => {
          resolve = done
        }),
    )
    render(
      <MemoryRouter>
        <PageBoundary>
          <Page />
        </PageBoundary>
      </MemoryRouter>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('正在加载页面…')
    await act(async () => resolve({ default: () => <p>按需加载完成</p> }))
    expect(await screen.findByText('按需加载完成')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('页面模块加载失败由页面边界处理，并提供刷新入口', async () => {
    const Page = lazy(() =>
      Promise.reject(
        new Error('Failed to fetch dynamically imported module: private-url'),
      ),
    )
    render(
      <MemoryRouter>
        <PageBoundary>
          <Page />
        </PageBoundary>
      </MemoryRouter>,
    )
    expect(await screen.findByRole('alert')).toHaveTextContent(
      '页面暂时无法显示',
    )
    expect(screen.getByRole('button', { name: '刷新页面' })).toBeInTheDocument()
    expect(screen.queryByText(/private-url/)).not.toBeInTheDocument()
  })
})

describe('统一列表状态', () => {
  const columns = [{ title: '名称', dataIndex: 'name' }]
  const initial = {
    isPending: true,
    isFetching: true,
    isError: false,
    error: null,
    refetch: vi.fn(),
  }
  it('初始加载、成功空结果和失败不会混淆，失败可重试', async () => {
    const view = render(
      <MemoryRouter>
        <ManagementTable query={initial} label="图书" columns={columns} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('正在加载图书…')
    expect(screen.queryByText('暂无图书')).not.toBeInTheDocument()
    view.rerender(
      <MemoryRouter>
        <ManagementTable
          query={{
            ...initial,
            isPending: false,
            isFetching: false,
            data: { items: [], total: 0 },
          }}
          label="图书"
          columns={columns}
        />
      </MemoryRouter>,
    )
    expect(screen.getByText('暂无图书')).toBeInTheDocument()
    const refetch = vi.fn()
    view.rerender(
      <MemoryRouter>
        <ManagementTable
          query={{
            ...initial,
            isPending: false,
            isFetching: false,
            isError: true,
            error: new ApiError('服务暂时不可用', 500),
            refetch,
          }}
          label="图书"
          columns={columns}
        />
      </MemoryRouter>,
    )
    expect(screen.queryByText('暂无图书')).not.toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveTextContent('服务暂时不可用')
    await userEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    expect(refetch).toHaveBeenCalledOnce()
  })

  it('后台刷新保留已有行，刷新失败撤下旧行并显示请求错误', async () => {
    const query = {
      ...initial,
      isPending: false,
      data: { items: [{ id: 1, name: '缓存图书' }], total: 1 },
    }
    const view = render(
      <MemoryRouter>
        <ManagementTable query={query} label="图书" columns={columns} />
      </MemoryRouter>,
    )
    expect(screen.getByText('缓存图书')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    view.rerender(
      <MemoryRouter>
        <ManagementTable
          query={{
            ...query,
            isFetching: false,
            isError: true,
            error: new ApiError('无权限访问', 403),
          }}
          label="图书"
          columns={columns}
        />
      </MemoryRouter>,
    )
    await waitFor(() =>
      expect(screen.queryByText('缓存图书')).not.toBeInTheDocument(),
    )
    expect(screen.getByRole('alert')).toHaveTextContent('无权限访问')
  })
})
