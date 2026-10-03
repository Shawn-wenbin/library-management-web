import { queryKeys } from '../../api/queryKeys'
import { useApiMutation } from '../../api/useApiMutation'
import { createCategory, updateCategory, deleteCategory } from './adminApi'
import type { CategoryCreate } from './adminTypes'

const affected = [queryKeys.categories.all, queryKeys.books.all]
export function useSaveCategory() {
  return useApiMutation(
    ({ id, values }: { id?: number; values: CategoryCreate }) =>
      id === undefined ? createCategory(values) : updateCategory(id, values),
    affected,
  )
}
export function useDeleteCategory() {
  return useApiMutation(deleteCategory, affected)
}
