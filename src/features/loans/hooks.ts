import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { ApiError } from '../../api/errors'
import { useAuthStore } from '../../store/authStore'
import { borrowBook, getMyLoans, returnLoan } from './api'
import type { Loan, MyLoanParams } from './types'

export function useMyLoans(params: MyLoanParams) {
  return useQuery({
    queryKey: queryKeys.loans.me(params),
    queryFn: ({ signal }) => getMyLoans(params, signal),
  })
}

function useLoanMutation(mutationFn: (id: number) => Promise<Loan>) {
  const client = useQueryClient()
  // A mutation from a previous login must not invalidate the new user's cache.
  const sessionVersion = useAuthStore((state) => state.sessionVersion)
  const refresh = async () => {
    if (useAuthStore.getState().sessionVersion !== sessionVersion) return
    await Promise.all([
      client.invalidateQueries({ queryKey: queryKeys.books.all }),
      client.invalidateQueries({ queryKey: queryKeys.loans.all }),
    ])
  }
  return useMutation({
    mutationFn,
    onSuccess: refresh,
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) return refresh()
    },
  })
}

export function useBorrowBook() {
  return useLoanMutation(borrowBook)
}

export function useReturnLoan() {
  return useLoanMutation(returnLoan)
}
