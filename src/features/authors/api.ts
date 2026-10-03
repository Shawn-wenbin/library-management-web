import { apiClient } from '../../api/client'
import type { Author, AuthorPage } from './adminTypes'

export async function getAuthors(page: number, signal?: AbortSignal) {
  return (
    await apiClient.get<AuthorPage>('/v1/authors', {
      params: { page, page_size: 100 },
      signal,
    })
  ).data
}

export async function getAuthor(id: number, signal?: AbortSignal) {
  return (await apiClient.get<Author>(`/v1/authors/${id}`, { signal })).data
}
