import { apiClient } from '../../api/client'
import type {
  CopyPage,
  CopyParams,
  Copy,
  CopyCreate,
  CopyPatch,
  CopyStatusInput,
} from './adminTypes'

export async function getCopies(
  id: number,
  params: CopyParams,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<CopyPage>(`/v1/books/${id}/copies`, { params, signal })
  ).data
}

export async function createCopy(id: number, body: CopyCreate) {
  return (await apiClient.post<Copy>(`/v1/books/${id}/copies`, body)).data
}

export async function updateCopy(id: number, body: CopyPatch) {
  return (await apiClient.patch<Copy>(`/v1/copies/${id}`, body)).data
}

export async function setCopyStatus(id: number, body: CopyStatusInput) {
  return (await apiClient.patch<Copy>(`/v1/copies/${id}/status`, body)).data
}
