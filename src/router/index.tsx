import { Navigate, Route, Routes } from 'react-router'
import { Result } from 'antd'
import { AppLayout } from '../components/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { BooksPage } from '../pages/BooksPage'
import { BookDetailPage } from '../pages/BookDetailPage'
import { MyLoansPage } from '../pages/MyLoansPage'
import { ProfilePage } from '../pages/ProfilePage'
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
          <Route path="books" element={<BooksPage />} />
          <Route path="books/:bookId" element={<BookDetailPage />} />
          <Route path="me" element={<ProfilePage />} />
          <Route path="me/loans" element={<MyLoansPage />} />
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
