import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { useApiMutation } from '../../api/useApiMutation'
import { createCopy, getCopies, setCopyStatus, updateCopy } from './adminApi'
import type {
  CopyCreate,
  CopyParams,
  CopyPatch,
  CopyStatusInput,
} from './adminTypes'

const affected = [queryKeys.bookCopies.all, queryKeys.books.all]
export function useCopies(bookId: number, params: CopyParams) {
  return useQuery({
    queryKey: queryKeys.bookCopies.list(bookId, params),
    queryFn: ({ signal }) => getCopies(bookId, params, signal),
  })
}
export function useSaveCopy(bookId: number) {
  return useApiMutation(
    (
      action:
        | { kind: 'create'; values: CopyCreate }
        | { kind: 'edit'; id: number; values: CopyPatch },
    ) =>
      action.kind === 'create'
        ? createCopy(bookId, action.values)
        : updateCopy(action.id, action.values),
    affected,
  )
}
export function useCopyStatus() {
  return useApiMutation(
    ({ id, values }: { id: number; values: CopyStatusInput }) =>
      setCopyStatus(id, values),
    affected,
  )
}
