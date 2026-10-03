import { useQuery } from '@tanstack/react-query'
import { apiClient } from '../../api/client'
import { queryKeys } from '../../api/queryKeys'
import type { paths } from '../../api/generated/schema'

type Categories =
  paths['/api/v1/categories']['get']['responses'][200]['content']['application/json']

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories.all,
    queryFn: async ({ signal }) =>
      (await apiClient.get<Categories>('/v1/categories', { signal })).data,
  })
}
