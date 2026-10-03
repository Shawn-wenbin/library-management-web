import { PageHeader } from '../../../components/PageHeader'
import { AdminCategories } from '../../../features/categories/AdminCategories'

export function AdminCategoriesPage() {
  return (
    <>
      <PageHeader title="分类管理" />
      <AdminCategories />
    </>
  )
}
