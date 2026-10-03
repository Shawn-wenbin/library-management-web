import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { getAllLoans, getOverdueLoans } from './adminApi'
import type { LoanParams } from './adminTypes'

export function useAllLoans(params: LoanParams, overdue: boolean) {
  const overdueParams = {
    page: params.page,
    page_size: params.page_size,
    user_id: params.user_id,
    book_id: params.book_id,
  }
  return useQuery({
    queryKey: overdue
      ? queryKeys.loans.overdue(overdueParams)
      : queryKeys.loans.list(params),
    queryFn: ({ signal }) =>
      overdue
        ? getOverdueLoans(overdueParams, signal)
        : getAllLoans(params, signal),
  })
}
