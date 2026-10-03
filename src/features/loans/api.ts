import { apiClient } from '../../api/client'
import type { Loan, LoanCreate, LoanPage, MyLoanParams } from './types'

export async function getMyLoans(params: MyLoanParams, signal?: AbortSignal) {
  return (await apiClient.get<LoanPage>('/v1/loans/me', { params, signal }))
    .data
}

export async function borrowBook(bookId: number) {
  const body: LoanCreate = { book_id: bookId }
  return (await apiClient.post<Loan>('/v1/loans', body)).data
}

export async function returnLoan(loanId: number) {
  return (await apiClient.post<Loan>(`/v1/loans/${loanId}/return`)).data
}
