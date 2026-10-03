import type { components } from '../api/generated/schema'

const readerNavigation = [
  { path: '/books', label: '图书' },
  { path: '/me/loans', label: '我的借阅' },
  { path: '/me', label: '个人信息' },
]
export const adminNavigation = [
  { path: '/admin/users', label: '用户管理' },
  { path: '/admin/books', label: '图书管理' },
  { path: '/admin/authors', label: '作者管理' },
  { path: '/admin/categories', label: '分类管理' },
  { path: '/admin/loans', label: '借阅管理' },
]

export function getNavigation(role: components['schemas']['Role']) {
  return role === 'ADMIN'
    ? [...readerNavigation, ...adminNavigation]
    : readerNavigation
}
