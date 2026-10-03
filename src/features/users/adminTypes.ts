import type { paths } from '../../api/generated/schema'

export type UserPage =
  paths['/api/v1/users']['get']['responses'][200]['content']['application/json']
export type UserParams = NonNullable<
  paths['/api/v1/users']['get']['parameters']['query']
>
export type { CurrentUser as User } from '../auth/types'
export type UserStatusInput =
  paths['/api/v1/users/{user_id}/status']['patch']['requestBody']['content']['application/json']
export type UserRoleInput =
  paths['/api/v1/users/{user_id}/role']['patch']['requestBody']['content']['application/json']
