import { PageHeader } from '../../../components/PageHeader'
import { AdminLoans } from '../../../features/loans/AdminLoans'

export function AdminLoansPage() {
  return (
    <>
      <PageHeader title="借阅管理" />
      <AdminLoans />
    </>
  )
}
