import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { useApiMutation } from '../../api/useApiMutation'
import {
  createAuthor,
  updateAuthor,
  deleteAuthor,
  listAuthors,
} from './adminApi'
import type { AuthorCreate, AuthorParams } from './adminTypes'

const affected = [queryKeys.authors.all, queryKeys.books.all]
export function useAdminAuthors(params: AuthorParams) {
  return useQuery({
    queryKey: queryKeys.authors.page(params),
    queryFn: ({ signal }) => listAuthors(params, signal),
  })
}
export function useSaveAuthor() {
  return useApiMutation(
    ({ id, values }: { id?: number; values: AuthorCreate }) =>
      id === undefined ? createAuthor(values) : updateAuthor(id, values),
    affected,
  )
}
export function useDeleteAuthor() {
  return useApiMutation(deleteAuthor, affected)
}
