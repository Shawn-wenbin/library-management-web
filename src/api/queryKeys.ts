import type { BookParams } from '../features/books/types'
import type { MyLoanParams } from '../features/loans/types'

export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: (sessionVersion: number) => ['auth', 'me', sessionVersion] as const,
  },
  books: {
    all: ['books'] as const,
    list: (params: BookParams) => ['books', 'list', params] as const,
    detail: (id: number) => ['books', 'detail', id] as const,
  },
  authors: {
    list: ['authors', 'list'] as const,
    detail: (id: number) => ['authors', 'detail', id] as const,
  },
  categories: { all: ['categories'] as const },
  loans: {
    all: ['loans'] as const,
    me: (params: MyLoanParams) => ['loans', 'me', params] as const,
  },
}
