import { lazy } from 'react'
import { PageBoundary } from './PageBoundary'
import { Navigate, Route, Routes } from 'react-router'
import { Result } from 'antd'
import { AppLayout } from '../components/AppLayout'
import { AdminGuard } from './AdminGuard'
import { AuthGuard } from './AuthGuard'

const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((module) => ({
    default: module.LoginPage,
  })),
)
const BooksPage = lazy(() =>
  import('../pages/BooksPage').then((module) => ({
    default: module.BooksPage,
  })),
)
const BookDetailPage = lazy(() =>
  import('../pages/BookDetailPage').then((module) => ({
    default: module.BookDetailPage,
  })),
)
const MyLoansPage = lazy(() =>
  import('../pages/MyLoansPage').then((module) => ({
    default: module.MyLoansPage,
  })),
)
const ProfilePage = lazy(() =>
  import('../pages/ProfilePage').then((module) => ({
    default: module.ProfilePage,
  })),
)
const AdminUsersPage = lazy(() =>
  import('../pages/admin/UsersPage').then((module) => ({
    default: module.AdminUsersPage,
  })),
)
const AdminBooksPage = lazy(() =>
  import('../pages/admin/BooksPage').then((module) => ({
    default: module.AdminBooksPage,
  })),
)
const AdminAuthorsPage = lazy(() =>
  import('../pages/admin/AuthorsPage').then((module) => ({
    default: module.AdminAuthorsPage,
  })),
)
const AdminCategoriesPage = lazy(() =>
  import('../pages/admin/CategoriesPage').then((module) => ({
    default: module.AdminCategoriesPage,
  })),
)
const AdminLoansPage = lazy(() =>
  import('../pages/admin/LoansPage').then((module) => ({
    default: module.AdminLoansPage,
  })),
)
const AdminBookCopiesPage = lazy(() =>
  import('../pages/admin/BookCopiesPage').then((module) => ({
    default: module.AdminBookCopiesPage,
  })),
)

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PageBoundary>
            <LoginPage />
          </PageBoundary>
        }
      />
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
