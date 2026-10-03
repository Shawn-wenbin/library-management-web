import type { paths } from '../../api/generated/schema'

export type LoginInput =
  paths['/api/v1/auth/login']['post']['requestBody']['content']['application/json']
export type TokenOutput =
  paths['/api/v1/auth/login']['post']['responses'][200]['content']['application/json']
export type CurrentUser =
  paths['/api/v1/users/me']['get']['responses'][200]['content']['application/json']
