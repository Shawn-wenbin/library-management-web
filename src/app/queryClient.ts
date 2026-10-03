import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/errors'
import { useAuthStore } from '../store/authStore'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: (count, error) =>
          count < 1 &&
          error instanceof ApiError &&
          (!error.status || error.status >= 500),
      },
      mutations: { retry: false },
    },
  })
}

export function bindAuthCache(client: QueryClient) {
  return useAuthStore.subscribe((state, previous) => {
    if (state.sessionVersion !== previous.sessionVersion) {
      // clear() cancels in-flight queries and removes all account-specific data.
      client.clear()
    }
  })
}
