import type { paths } from '../../api/generated/schema'

export type AuthorPage =
  paths['/api/v1/authors']['get']['responses'][200]['content']['application/json']
export type AuthorParams = NonNullable<
  paths['/api/v1/authors']['get']['parameters']['query']
>
export type Author =
  paths['/api/v1/authors/{entity_id}']['patch']['responses'][200]['content']['application/json']
export type AuthorCreate =
  paths['/api/v1/authors']['post']['requestBody']['content']['application/json']
export type AuthorPatch =
  paths['/api/v1/authors/{entity_id}']['patch']['requestBody']['content']['application/json']
