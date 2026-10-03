import type { CurrentUser } from '../features/auth/types'

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
