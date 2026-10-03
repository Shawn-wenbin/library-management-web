import type { paths } from '../../api/generated/schema'

export type MyLoanParams = NonNullable<
  paths['/api/v1/loans/me']['get']['parameters']['query']
>
export type LoanPage =
  paths['/api/v1/loans/me']['get']['responses'][200]['content']['application/json']
export type Loan = LoanPage['items'][number]
export type LoanCreate =
  paths['/api/v1/loans']['post']['requestBody']['content']['application/json']
