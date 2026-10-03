import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { MemoryRouter } from 'react-router'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '../../api/client'
import { queryKeys } from '../../api/queryKeys'
import { Providers } from '../../app/providers'
import { bindAuthCache, createQueryClient } from '../../app/queryClient'
import { AppRoutes } from '../../router'
import { useAuthStore } from '../../store/authStore'
import { admin, reader, pageOf } from '../../test/fixtures'

let mock: MockAdapter
let client: ReturnType<typeof createQueryClient>
let unbind: () => void
beforeEach(() => {
  mock = new MockAdapter(apiClient)
  mock.onGet('/v1/books').reply(200, pageOf([]))
  mock.onGet('/v1/authors').reply(200, pageOf([]))
  mock.onGet('/v1/categories').reply(200, [])
  mock.onGet('/v1/loans/me').reply(200, pageOf([]))
  client = createQueryClient()
  unbind = bindAuthCache(client)
})
afterEach(() => {
  unbind()
  client.clear()
  mock.restore()
})

function renderApp(path = '/login') {
  return render(
    <Providers client={client}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </Providers>,
  )
}

async function fillLogin() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('用户名'), 'reader')
  await user.type(screen.getByLabelText('密码'), 'password123')
  await user.click(screen.getByRole('button', { name: /登\s*录/ }))
}

describe('登录与身份恢复', () => {
  it('未登录进入受保护路由时展示登录，且不查询当前用户', async () => {
    renderApp('/admin/users')
    expect(
      await screen.findByRole('heading', { name: '欢迎回来' }),
    ).toBeInTheDocument()
    expect(mock.history.get).toHaveLength(0)
  })

  it('校验必填项与密码长度，不发送无效请求', async () => {
    renderApp()
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: /登\s*录/ }))
    expect(
      await screen.findByText('请输入用户名', {
        selector: '.ant-form-item-explain-error',
      }),
    ).toBeInTheDocument()
    expect(
      await screen.findByText('请输入密码', {
        selector: '.ant-form-item-explain-error',
      }),
    ).toBeInTheDocument()
    await user.type(screen.getByLabelText('用户名'), 'reader')
    await user.type(screen.getByLabelText('密码'), 'short')
    await user.click(screen.getByRole('button', { name: /登\s*录/ }))
    expect(
      await screen.findByText('密码长度应为 8–128 个字符'),
    ).toBeInTheDocument()
    expect(mock.history.post).toHaveLength(0)
  })

  it('按契约发送 JSON，保存 token，查询身份后回到原路由', async () => {
    mock
      .onPost('/v1/auth/login')
      .reply(200, { access_token: 'signed-in', token_type: 'bearer' })
    mock.onGet('/v1/users/me').reply(200, reader)
    renderApp('/me/loans')
    await fillLogin()
    expect(
      await screen.findByRole('heading', { name: '我的借阅' }),
    ).toBeInTheDocument()
    expect(JSON.parse(mock.history.post[0]?.data as string)).toEqual({
      username: 'reader',
      password: 'password123',
    })
    expect(mock.history.post[0]?.headers?.['Content-Type']).toBe(
      'application/json',
    )
    expect(mock.history.get[0]?.headers?.Authorization).toBe('Bearer signed-in')
    expect(screen.getByText('测试读者')).toBeInTheDocument()
    expect(
      client.getQueryData(
        queryKeys.auth.me(useAuthStore.getState().sessionVersion),
      ),
    ).toEqual(reader)
    expect(
      JSON.parse(localStorage.getItem('library-auth') || '{}').state,
    ).toEqual({ token: 'signed-in' })
  })

  it('提交期间禁止重复提交', async () => {
    mock.onPost('/v1/auth/login').reply(() => new Promise(() => {}))
    renderApp()
    await fillLogin()
    expect(screen.getByRole('button', { name: /登\s*录/ })).toBeDisabled()
    expect(screen.getByLabelText('用户名')).toBeDisabled()
    expect(mock.history.post).toHaveLength(1)
  })

  it('错误凭据保留登录表单并显示错误', async () => {
    mock.onPost('/v1/auth/login').reply(401, { detail: 'bad credentials' })
    renderApp()
    await fillLogin()
    expect(
      await screen.findByText('登录凭据无效或已过期，请重新登录'),
    ).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBeNull()
  })

  it('422 将后端校验信息映射到登录字段', async () => {
    mock.onPost('/v1/auth/login').reply(422, {
      detail: [
        {
          loc: ['body', 'username'],
          msg: '用户名格式不正确',
          type: 'value_error',
        },
      ],
    })
    renderApp()
    await fillLogin()
    expect(await screen.findByText('用户名格式不正确')).toBeInTheDocument()
  })

  it('从本地 token 恢复身份，等待期间不展示受保护内容', async () => {
    localStorage.setItem(
      'library-auth',
      JSON.stringify({ state: { token: 'stored-token' }, version: 0 }),
    )
    await useAuthStore.persist.rehydrate()
    mock.onGet('/v1/users/me').withDelayInMs(40).reply(200, reader)
    renderApp('/books')
    expect(screen.getByRole('status')).toHaveTextContent('正在确认登录状态')
    expect(
      screen.queryByRole('heading', { name: '图书' }),
    ).not.toBeInTheDocument()
    expect(await screen.findByText('测试读者')).toBeInTheDocument()
    expect(mock.history.get[0]?.headers?.Authorization).toBe(
      'Bearer stored-token',
    )
  })

  it('恢复身份时 401 清除 token、缓存并回到登录页', async () => {
    useAuthStore.getState().setToken('expired')
    client.setQueryData(['private-data'], { secret: 'old account' })
    mock.onGet('/v1/users/me').reply(401)
    renderApp('/books')
    expect(
      await screen.findByRole('heading', { name: '欢迎回来' }),
    ).toBeInTheDocument()
    expect(useAuthStore.getState().token).toBeNull()
    expect(client.getQueryData(['private-data'])).toBeUndefined()
  })

  it.each([403, 500])('身份查询 %s 显示错误，可重试恢复', async (status) => {
    useAuthStore.getState().setToken('valid')
    mock
      .onGet('/v1/users/me')
      .replyOnce(status)
      .onGet('/v1/users/me')
      .reply(200, reader)
    renderApp('/books')
    expect(
      await screen.findByText(
        status === 403 ? '无权限访问' : '服务暂时不可用，请稍后重试',
      ),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: '图书' }),
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /重\s*试/ }))
    expect(await screen.findByText('测试读者')).toBeInTheDocument()
  })

  it('退出登录清理当前用户与其他服务端缓存', async () => {
    useAuthStore.getState().setToken('valid')
    mock.onGet('/v1/users/me').reply(200, reader)
    renderApp('/books')
    await screen.findByText('测试读者')
    client.setQueryData(['private-data'], { secret: 'old account' })
    await userEvent.click(screen.getByRole('button', { name: '退出登录' }))
    expect(
      await screen.findByRole('heading', { name: '欢迎回来' }),
    ).toBeInTheDocument()
    expect(client.getQueryCache().getAll()).toHaveLength(0)
  })

  it('登录状态失效后立即撤下受保护页面', async () => {
    useAuthStore.getState().setToken('valid')
    mock.onGet('/v1/users/me').reply(200, reader)
    renderApp('/books')
    await screen.findByText('测试读者')
    mock.onGet('/v1/users/me').reply(401)
    await act(async () => {
      await client.invalidateQueries({ queryKey: queryKeys.auth.all })
    })
    expect(
      await screen.findByRole('heading', { name: '欢迎回来' }),
    ).toBeInTheDocument()
  })
})

describe('角色权限与导航', () => {
  it.each(['/admin/users', '/admin/books/1/copies'])(
    'READER 无法直接进入 %s',
    async (path) => {
      useAuthStore.getState().setToken('reader-token')
      mock.onGet('/v1/users/me').reply(200, reader)
      renderApp(path)
      expect(await screen.findByText('无权限访问')).toBeInTheDocument()
      expect(
        screen.queryByRole('link', { name: '用户管理' }),
      ).not.toBeInTheDocument()
      expect(screen.getByRole('link', { name: '个人信息' })).toBeInTheDocument()
    },
  )

  it('ADMIN 可以进入管理路由并展示管理员导航', async () => {
    useAuthStore.getState().setToken('admin-token')
    mock.onGet('/v1/users/me').reply(200, admin)
    renderApp('/admin/users')
    expect(
      await screen.findByRole('heading', { name: '用户管理' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '借阅管理' })).toBeInTheDocument()
    expect(screen.getByText('测试管理员')).toBeInTheDocument()
    expect(
      screen.getByText('馆藏管理（从图书进入）').closest('li'),
    ).toHaveAttribute('aria-disabled', 'true')
  })

  it('被停用账号无法进入应用', async () => {
    useAuthStore.getState().setToken('disabled')
    mock.onGet('/v1/users/me').reply(200, { ...reader, is_active: false })
    renderApp('/books')
    expect(await screen.findByText('账号已停用')).toBeInTheDocument()
    await waitFor(() =>
      expect(screen.queryByRole('navigation')).not.toBeInTheDocument(),
    )
  })
})
