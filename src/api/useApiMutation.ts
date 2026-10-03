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
  const refresh = async (session: number) => {
    if (session !== useAuthStore.getState().sessionVersion) return
    await Promise.all(
      keys.map((queryKey) => client.invalidateQueries({ queryKey })),
    )
  }
  return useMutation({
    mutationFn,
    retry: false,
    // Mutation options can update on rerender. Bind the session to this submission.
    onMutate: () => ({ session: useAuthStore.getState().sessionVersion }),
    onSuccess: (_data, _variables, context) => refresh(context.session),
    onError: (error, _variables, context) => {
      if (context && error instanceof ApiError && error.status === 409)
        return refresh(context.session)
    },
  })
}
