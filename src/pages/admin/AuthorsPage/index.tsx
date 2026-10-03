import { PageHeader } from '../../../components/PageHeader'
import { AdminAuthors } from '../../../features/authors/AdminAuthors'

export function AdminAuthorsPage() {
  return (
    <>
      <PageHeader title="作者管理" />
      <AdminAuthors />
    </>
  )
}
