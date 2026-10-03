import { apiClient } from '../../api/client'
import type { Book, BookCreate, BookPatch } from './adminTypes'

export async function createBook(body: BookCreate) {
  return (await apiClient.post<Book>(`/v1/books`, body)).data
}

export async function updateBook(id: number, body: BookPatch) {
  return (await apiClient.patch<Book>(`/v1/books/${id}`, body)).data
}

export async function deactivateBook(id: number) {
  return (await apiClient.delete<void>(`/v1/books/${id}`)).data
}
