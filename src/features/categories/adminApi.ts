import { apiClient } from '../../api/client'
import type { Category, CategoryCreate, CategoryPatch } from './adminTypes'

export async function createCategory(body: CategoryCreate) {
  return (await apiClient.post<Category>(`/v1/categories`, body)).data
}

export async function updateCategory(id: number, body: CategoryPatch) {
  return (await apiClient.patch<Category>(`/v1/categories/${id}`, body)).data
}

export async function deleteCategory(id: number) {
  return (await apiClient.delete<void>(`/v1/categories/${id}`)).data
}
