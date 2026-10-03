import { apiClient } from '../../api/client'
import type { paths } from '../../api/generated/schema'

type AuthorPage =
  paths['/api/v1/authors']['get']['responses'][200]['content']['application/json']
type Author = AuthorPage['items'][number]

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
