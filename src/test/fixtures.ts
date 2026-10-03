import type { CurrentUser } from '../features/auth/types'
import type { Book } from '../features/books/types'
import type { Loan } from '../features/loans/types'

export const reader: CurrentUser = {
  id: 1,
  username: 'reader',
  full_name: '测试读者',
  email: 'reader@example.com',
  role: 'READER',
  is_active: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
export const admin: CurrentUser = {
  ...reader,
  id: 2,
  username: 'admin',
  full_name: '测试管理员',
  role: 'ADMIN',
}

const timestamps = {
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
}
export const category = {
  id: 3,
  name: '文学',
  description: null,
  ...timestamps,
}
export const author = {
  id: 4,
  name: '测试作者',
  biography: null,
  ...timestamps,
}
export const book: Book = {
  id: 7,
  title: '测试图书',
  subtitle: '读者之旅',
  isbn: '9780000000001',
  category_id: category.id,
  category,
  authors: [author],
  publisher: '测试出版社',
  publication_date: '2025-01-01',
  description: '这是图书简介。',
  cover_url: null,
  is_active: true,
  total_copies: 3,
  available_copies: 2,
  ...timestamps,
}
export const loan: Loan = {
  id: 9,
  user_id: reader.id,
  book_id: book.id,
  book_copy_id: 11,
  borrowed_at: '2026-01-01T00:00:00Z',
  due_at: '2026-02-01T00:00:00Z',
  returned_at: null,
  status: 'BORROWED',
  is_overdue: true,
  ...timestamps,
}
export function pageOf<T>(
  items: T[],
  page = 1,
  pageSize = 20,
  total = items.length,
) {
  return { items, page, page_size: pageSize, total }
}
