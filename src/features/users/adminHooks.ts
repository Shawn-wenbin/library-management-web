import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '../../api/queryKeys'
import { useApiMutation } from '../../api/useApiMutation'
import { getUsers, getUser, setUserRole, setUserStatus } from './adminApi'
import type { UserParams, UserRoleInput, UserStatusInput } from './adminTypes'

export function useUsers(params: UserParams) {
  return useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: ({ signal }) => getUsers(params, signal),
  })
}
export function useUser(id?: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id ?? 0),
    queryFn: ({ signal }) => getUser(id ?? 0, signal),
    enabled: id !== undefined,
  })
}
export function useUpdateUser() {
  return useApiMutation(
    (
      action: { id: number } & (
        | { kind: 'role'; values: UserRoleInput }
        | { kind: 'status'; values: UserStatusInput }
      ),
    ) =>
      action.kind === 'role'
        ? setUserRole(action.id, action.values)
        : setUserStatus(action.id, action.values),
    [queryKeys.users.all, queryKeys.auth.all],
  )
}
