import { PageHeader } from '../../../components/PageHeader'
import { AdminBooks } from '../../../features/books/AdminBooks'

export function AdminBooksPage() {
  return (
    <>
      <PageHeader title="图书管理" />
      <AdminBooks />
    </>
  )
}
