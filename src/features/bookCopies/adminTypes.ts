import type { paths } from '../../api/generated/schema'

export type CopyPage =
  paths['/api/v1/books/{entity_id}/copies']['get']['responses'][200]['content']['application/json']
export type CopyParams = NonNullable<
  paths['/api/v1/books/{entity_id}/copies']['get']['parameters']['query']
>
export type Copy =
  paths['/api/v1/copies/{entity_id}/status']['patch']['responses'][200]['content']['application/json']
export type CopyCreate =
  paths['/api/v1/books/{entity_id}/copies']['post']['requestBody']['content']['application/json']
export type CopyPatch =
  paths['/api/v1/copies/{entity_id}']['patch']['requestBody']['content']['application/json']
export type CopyStatusInput =
  paths['/api/v1/copies/{entity_id}/status']['patch']['requestBody']['content']['application/json']
