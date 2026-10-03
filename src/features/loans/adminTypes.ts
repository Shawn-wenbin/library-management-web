import type { paths } from '../../api/generated/schema'

export type { Loan, LoanPage } from './types'
export type LoanParams = NonNullable<
  paths['/api/v1/loans']['get']['parameters']['query']
>
export type OverdueLoanParams = NonNullable<
  paths['/api/v1/loans/overdue']['get']['parameters']['query']
>
