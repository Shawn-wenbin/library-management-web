import { queryKeys } from '../../api/queryKeys'
import { useApiMutation } from '../../api/useApiMutation'
import { createBook, updateBook, deactivateBook } from './adminApi'
import type { BookCreate } from './adminTypes'

const affected = [queryKeys.books.all, queryKeys.bookCopies.all]
export function useSaveBook() {
  return useApiMutation(
    ({ id, values }: { id?: number; values: BookCreate }) =>
      id === undefined ? createBook(values) : updateBook(id, values),
    affected,
  )
}
export function useDeactivateBook() {
  return useApiMutation(deactivateBook, affected)
}
