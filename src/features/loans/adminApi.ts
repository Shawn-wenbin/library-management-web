import { apiClient } from '../../api/client'
import type { LoanPage, LoanParams, OverdueLoanParams } from './adminTypes'

export async function getAllLoans(params: LoanParams, signal?: AbortSignal) {
  return (await apiClient.get<LoanPage>(`/v1/loans`, { params, signal })).data
}

export async function getOverdueLoans(
  params: OverdueLoanParams,
  signal?: AbortSignal,
) {
  return (
    await apiClient.get<LoanPage>(`/v1/loans/overdue`, { params, signal })
  ).data
}
