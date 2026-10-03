import type { paths } from '../../api/generated/schema'

export type { Book } from './types'
export type BookCreate =
  paths['/api/v1/books']['post']['requestBody']['content']['application/json']
export type BookPatch =
  paths['/api/v1/books/{entity_id}']['patch']['requestBody']['content']['application/json']
