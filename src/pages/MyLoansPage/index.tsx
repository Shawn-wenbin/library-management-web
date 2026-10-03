import { PageHeader } from '../../components/PageHeader'
import { MyLoans } from '../../features/loans/MyLoans'

export function MyLoansPage() {
  return (
    <>
      <PageHeader
        title="我的借阅"
        description="查看当前与历史借阅，并归还已借图书。"
      />
      <MyLoans />
    </>
  )
}
