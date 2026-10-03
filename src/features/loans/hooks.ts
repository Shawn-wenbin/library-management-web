import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { useApiMutation } from '../../api/useApiMutation'
import { borrowBook, getMyLoans, returnLoan } from './api'
import type { Loan, MyLoanParams } from './types'

export function useMyLoans(params: MyLoanParams) {
  return useQuery({
    queryKey: queryKeys.loans.me(params),
    queryFn: ({ signal }) => getMyLoans(params, signal),
  })
}

function useLoanMutation(mutationFn: (id: number) => Promise<Loan>) {
  return useApiMutation(mutationFn, [
    queryKeys.books.all,
    queryKeys.loans.all,
    queryKeys.bookCopies.all,
  ])
}

export function useBorrowBook() {
  return useLoanMutation(borrowBook)
}

export function useReturnLoan() {
  return useLoanMutation(returnLoan)
}
