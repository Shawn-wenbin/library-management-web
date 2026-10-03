import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from './client'
import { useAuthStore } from '../store/authStore'

let mock: MockAdapter
beforeEach(() => {
  mock = new MockAdapter(apiClient)
})
afterEach(() => mock.restore())

describe('统一 Axios Client', () => {
  it('使用 /api baseURL 并携带当前 Bearer token', async () => {
    useAuthStore.getState().setToken('session-token')
    mock.onGet('/v1/users/me').reply(200, {})
    await apiClient.get('/v1/users/me')
    expect(mock.history.get[0]?.baseURL).toBe('/api')
    expect(mock.history.get[0]?.headers?.Authorization).toBe(
      'Bearer session-token',
    )
  })

  it('401 清理失效 token 和持久化登录状态', async () => {
    useAuthStore.getState().setToken('expired')
    mock.onGet('/v1/users/me').reply(401, { arbitrary: 'unknown error shape' })
    await expect(apiClient.get('/v1/users/me')).rejects.toMatchObject({
      status: 401,
    })
    expect(useAuthStore.getState().token).toBeNull()
    expect(
      JSON.parse(localStorage.getItem('library-auth') || '{}').state.token,
    ).toBeNull()
  })

  it('旧会话延迟返回的 401 不清理新会话', async () => {
    useAuthStore.getState().setToken('old')
    mock.onGet('/v1/users/me').reply(() => {
      useAuthStore.getState().setToken('new')
      return [401, {}]
    })
    await expect(apiClient.get('/v1/users/me')).rejects.toMatchObject({
      status: 401,
    })
    expect(useAuthStore.getState().token).toBe('new')
  })

  it('登录请求不附加已有 token，其 401 不误清理其他会话', async () => {
    useAuthStore.getState().setToken('existing')
    mock.onPost('/v1/auth/login').reply(401)
    await expect(
      apiClient.post('/v1/auth/login', {}, { skipAuth: true }),
    ).rejects.toMatchObject({ status: 401 })
    expect(mock.history.post[0]?.headers?.Authorization).toBeUndefined()
    expect(useAuthStore.getState().token).toBe('existing')
  })

  it.each([
    [403, { detail: 'Forbidden' }, '无权限访问'],
    [404, {}, '请求的资源不存在'],
    [409, { detail: '图书不可借' }, '图书不可借'],
    [409, { unexpected: [] }, '操作存在冲突，请刷新后重试'],
    [422, { detail: 'unknown shape' }, '提交的信息不符合要求，请检查表单'],
    [500, { detail: 'sensitive stack trace' }, '服务暂时不可用，请稍后重试'],
  ])('标准化 %s 响应并保留有效会话', async (status, body, message) => {
    useAuthStore.getState().setToken('valid')
    mock.onGet('/v1/users/me').reply(status, body)
    await expect(apiClient.get('/v1/users/me')).rejects.toMatchObject({
      status,
      message,
    })
    expect(useAuthStore.getState().token).toBe('valid')
  })

  it('422 只接受有效的校验项', async () => {
    const issue = {
      loc: ['body', 'password'],
      msg: '密码太短',
      type: 'string_too_short',
    }
    mock
      .onPost('/v1/auth/login')
      .reply(422, { detail: [issue, null, { loc: [] }] })
    await expect(apiClient.post('/v1/auth/login')).rejects.toMatchObject({
      issues: [issue],
    })
  })

  it('网络错误提供可理解的反馈', async () => {
    mock.onGet('/v1/users/me').networkError()
    await expect(apiClient.get('/v1/users/me')).rejects.toMatchObject({
      message: '无法连接服务器，请检查网络后重试',
    })
  })
})
