import { useMutation, useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { useAuthStore } from '../../store/authStore'
import { getCurrentUser, login } from './api'

export function useCurrentUser() {
  const token = useAuthStore((state) => state.token)
  const sessionVersion = useAuthStore((state) => state.sessionVersion)
  return useQuery({
    queryKey: queryKeys.auth.me(sessionVersion),
    queryFn: ({ signal }) => getCurrentUser(signal),
    enabled: Boolean(token),
    retry: false,
  })
}

export function useLogin() {
  return useMutation({
    mutationFn: login,
    onSuccess: ({ access_token }) =>
      useAuthStore.getState().setToken(access_token),
  })
}

export function logout() {
  useAuthStore.getState().setToken(null)
}
