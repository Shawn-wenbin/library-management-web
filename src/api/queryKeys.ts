import type { BookParams } from '../features/books/types'
import type { MyLoanParams } from '../features/loans/types'
import type {
  LoanParams,
  OverdueLoanParams,
} from '../features/loans/adminTypes'
import type { AuthorParams } from '../features/authors/adminTypes'
import type { CopyParams } from '../features/bookCopies/adminTypes'
import type { UserParams } from '../features/users/adminTypes'

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
    all: ['authors'] as const,
    page: (params: AuthorParams) => ['authors', 'page', params] as const,
    list: ['authors', 'list'] as const,
    detail: (id: number) => ['authors', 'detail', id] as const,
  },
  categories: { all: ['categories'] as const },
  loans: {
    all: ['loans'] as const,
    me: (params: MyLoanParams) => ['loans', 'me', params] as const,
    list: (params: LoanParams) => ['loans', 'list', params] as const,
    overdue: (params: OverdueLoanParams) =>
      ['loans', 'overdue', params] as const,
  },
  users: {
    all: ['users'] as const,
    list: (params: UserParams) => ['users', 'list', params] as const,
    detail: (id: number) => ['users', 'detail', id] as const,
  },
  bookCopies: {
    all: ['bookCopies'] as const,
    list: (id: number, params: CopyParams) =>
      ['bookCopies', 'list', id, params] as const,
  },
}
