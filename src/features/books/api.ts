import { apiClient } from '../../api/client'
import type { Book, BookPage, BookParams } from './types'

export async function getBooks(params: BookParams, signal?: AbortSignal) {
  return (await apiClient.get<BookPage>('/v1/books', { params, signal })).data
}

export async function getBook(id: number, signal?: AbortSignal) {
  return (await apiClient.get<Book>(`/v1/books/${id}`, { signal })).data
}
