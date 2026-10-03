import { apiClient } from '../../api/client'
import type {
  AuthorPage,
  AuthorParams,
  Author,
  AuthorCreate,
  AuthorPatch,
} from './adminTypes'

export async function listAuthors(params: AuthorParams, signal?: AbortSignal) {
  return (await apiClient.get<AuthorPage>(`/v1/authors`, { params, signal }))
    .data
}

export async function createAuthor(body: AuthorCreate) {
  return (await apiClient.post<Author>(`/v1/authors`, body)).data
}

export async function updateAuthor(id: number, body: AuthorPatch) {
  return (await apiClient.patch<Author>(`/v1/authors/${id}`, body)).data
}

export async function deleteAuthor(id: number) {
  return (await apiClient.delete<void>(`/v1/authors/${id}`)).data
}
