import { act, renderHook, waitFor } from '@testing-library/react'
import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { PropsWithChildren } from 'react'
import { Providers } from '../app/providers'
import { bindAuthCache, createQueryClient } from '../app/queryClient'
import { useAuthStore } from '../store/authStore'
import { useReturnLoan } from '../features/loans/hooks'
import { returnLoan } from '../features/loans/api'
import { loan } from '../test/fixtures'
import { apiClient } from './client'
import { queryKeys } from './queryKeys'
import { useApiMutation } from './useApiMutation'

let mock: MockAdapter
let client: ReturnType<typeof createQueryClient>
let unbind: () => void
beforeEach(() => {
  mock = new MockAdapter(apiClient)
  client = createQueryClient()
  unbind = bindAuthCache(client)
  useAuthStore.getState().setToken('old-session')
})
afterEach(() => {
  unbind()
  client.clear()
  mock.restore()
})

function Wrapper({ children }: PropsWithChildren) {
  return <Providers client={client}>{children}</Providers>
}
function useAdminMutation() {
  return useApiMutation(returnLoan, [
    queryKeys.books.all,
    queryKeys.loans.all,
    queryKeys.bookCopies.all,
  ])
}

describe('写操作跨会话隔离', () => {
  for (const [name, hook] of [
    ['通用管理员 Mutation', useAdminMutation],
    ['读者借还 Mutation', useReturnLoan],
  ] as const) {
    it.each([200, 409])(
      `${name} 的旧会话 %s 响应不刷新新用户缓存`,
      async (status) => {
        let resolve!: (reply: [number, unknown]) => void
        mock.onPost(`/v1/loans/${loan.id}/return`).reply(
          () =>
            new Promise((done) => {
              resolve = done
            }),
        )
        const { result, rerender } = renderHook(hook, { wrapper: Wrapper })
        let settled!: Promise<unknown>
        act(() => {
          settled = result.current
            .mutateAsync(loan.id)
            .catch((error: unknown) => error)
        })
        await waitFor(() => expect(mock.history.post).toHaveLength(1))
        act(() => useAuthStore.getState().setToken('new-session'))
        rerender()
        const key = queryKeys.books.list({ page: 1 })
        client.setQueryData(key, { marker: 'new user data' })
        const invalidate = vi.spyOn(client, 'invalidateQueries')
        await act(async () => {
          resolve([status, status === 200 ? loan : { detail: '借阅已经归还' }])
          await settled
        })
        expect(invalidate).not.toHaveBeenCalled()
        expect(client.getQueryData(key)).toEqual({ marker: 'new user data' })
        expect(client.getQueryState(key)?.isInvalidated).toBe(false)
        invalidate.mockRestore()
      },
    )
  }
})
