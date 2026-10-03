import {
  useMutation,
  useQueryClient,
  type QueryKey,
} from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { ApiError } from './errors'

// Keep the mutation pending until all affected active lists have refreshed.
export function useApiMutation<TData, TVariables>(
  mutationFn: (values: TVariables) => Promise<TData>,
  keys: readonly QueryKey[],
) {
  const client = useQueryClient()
  const session = useAuthStore((state) => state.sessionVersion)
  const refresh = async () => {
    if (session !== useAuthStore.getState().sessionVersion) return
    await Promise.all(
      keys.map((queryKey) => client.invalidateQueries({ queryKey })),
    )
  }
  return useMutation({
    mutationFn,
    retry: false,
    onSuccess: refresh,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) return refresh()
    },
  })
}
