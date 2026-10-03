import { apiClient } from '../../api/client'
import type {
  UserPage,
  UserParams,
  User,
  UserStatusInput,
  UserRoleInput,
} from './adminTypes'

export async function getUsers(params: UserParams, signal?: AbortSignal) {
  return (await apiClient.get<UserPage>(`/v1/users`, { params, signal })).data
}

export async function getUser(id: number, signal?: AbortSignal) {
  return (await apiClient.get<User>(`/v1/users/${id}`, { signal })).data
}

export async function setUserStatus(id: number, body: UserStatusInput) {
  return (await apiClient.patch<User>(`/v1/users/${id}/status`, body)).data
}

export async function setUserRole(id: number, body: UserRoleInput) {
  return (await apiClient.patch<User>(`/v1/users/${id}/role`, body)).data
}
