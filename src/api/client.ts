import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { normalizeApiError } from './errors'

declare module 'axios' {
  interface AxiosRequestConfig {
    skipAuth?: boolean
  }
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15_000,
  headers: { Accept: 'application/json' },
})

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (!config.skipAuth && token)
    config.headers.set('Authorization', `Bearer ${token}`)
  else config.headers.delete('Authorization')
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (axios.isCancel(error)) return Promise.reject(error)
    const normalized = normalizeApiError(error)
    if (normalized.status === 401 && axios.isAxiosError(error)) {
      const { token, setToken } = useAuthStore.getState()
      // A late response from an old session must not log out a newly signed-in user.
      if (
        token &&
        error.config?.headers.get('Authorization') === `Bearer ${token}`
      ) {
        setToken(null)
      }
    }
    return Promise.reject(normalized)
  },
)
