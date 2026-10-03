import { apiClient } from '../../api/client'
import type { CurrentUser, LoginInput, TokenOutput } from './types'

export async function login(input: LoginInput) {
  const { data } = await apiClient.post<TokenOutput>('/v1/auth/login', input, {
    skipAuth: true,
  })
  return data
}

export async function getCurrentUser(signal: AbortSignal) {
  const { data } = await apiClient.get<CurrentUser>('/v1/users/me', { signal })
  return data
}
