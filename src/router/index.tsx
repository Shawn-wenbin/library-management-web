import { Navigate, Route, Routes } from 'react-router'
import { Result } from 'antd'
import { AppLayout } from '../components/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { PlaceholderPage } from '../pages/PlaceholderPage'
import { AdminGuard } from './AdminGuard'
import { AuthGuard } from './AuthGuard'
import { adminNavigation } from './navigation'

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          <Route index element={<Navigate to="/books" replace />} />
          <Route path="books" element={<PlaceholderPage title="图书" />} />
          <Route
            path="books/:bookId"
            element={<PlaceholderPage title="图书详情" />}
          />
          <Route path="me" element={<PlaceholderPage title="个人信息" />} />
          <Route
            path="me/loans"
            element={<PlaceholderPage title="我的借阅" />}
          />
          <Route element={<AdminGuard />}>
            {adminNavigation.map(({ path, label }) => (
              <Route
                key={path}
                path={path}
                element={<PlaceholderPage title={label} />}
              />
            ))}
            <Route
              path="admin/books/:bookId/copies"
              element={<PlaceholderPage title="馆藏管理" />}
            />
          </Route>
          <Route
            path="*"
            element={<Result status="404" title="页面不存在" />}
          />
        </Route>
      </Route>
    </Routes>
  )
}
