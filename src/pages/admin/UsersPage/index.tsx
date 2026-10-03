import { PageHeader } from '../../../components/PageHeader'
import { AdminUsers } from '../../../features/users/AdminUsers'

export function AdminUsersPage() {
  return (
    <>
      <PageHeader title="用户管理" />
      <AdminUsers />
    </>
  )
}
