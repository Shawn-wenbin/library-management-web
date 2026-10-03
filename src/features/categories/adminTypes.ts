import type { paths } from '../../api/generated/schema'

export type Category =
  paths['/api/v1/categories']['get']['responses'][200]['content']['application/json'][number]
export type CategoryCreate =
  paths['/api/v1/categories']['post']['requestBody']['content']['application/json']
export type CategoryPatch =
  paths['/api/v1/categories/{entity_id}']['patch']['requestBody']['content']['application/json']
