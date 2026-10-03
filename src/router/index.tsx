import { AdminUsersPage } from '../pages/admin/UsersPage'
import { AdminBooksPage } from '../pages/admin/BooksPage'
import { AdminAuthorsPage } from '../pages/admin/AuthorsPage'
import { AdminCategoriesPage } from '../pages/admin/CategoriesPage'
import { AdminLoansPage } from '../pages/admin/LoansPage'
import { AdminBookCopiesPage } from '../pages/admin/BookCopiesPage'
import { Navigate, Route, Routes } from 'react-router'
import { Result } from 'antd'
import { AppLayout } from '../components/AppLayout'
import { LoginPage } from '../pages/LoginPage'
import { BooksPage } from '../pages/BooksPage'
import { BookDetailPage } from '../pages/BookDetailPage'
import { MyLoansPage } from '../pages/MyLoansPage'
import { ProfilePage } from '../pages/ProfilePage'
import { AdminGuard } from './AdminGuard'
import { AuthGuard } from './AuthGuard'

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
            <Route path="admin/users" element={<AdminUsersPage />} />
            <Route path="admin/books" element={<AdminBooksPage />} />
            <Route path="admin/authors" element={<AdminAuthorsPage />} />
            <Route path="admin/categories" element={<AdminCategoriesPage />} />
            <Route path="admin/loans" element={<AdminLoansPage />} />
            <Route
              path="admin/books/:bookId/copies"
              element={<AdminBookCopiesPage />}
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
