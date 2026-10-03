import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { getBook, getBooks } from './api'
import type { BookParams } from './types'

export function useBooks(params: BookParams) {
  return useQuery({
    queryKey: queryKeys.books.list(params),
    queryFn: ({ signal }) => getBooks(params, signal),
  })
}

export function useBook(id: number) {
  return useQuery({
    queryKey: queryKeys.books.detail(id),
    queryFn: ({ signal }) => getBook(id, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
  })
}
