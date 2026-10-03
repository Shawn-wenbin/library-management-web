import type { paths } from '../../api/generated/schema'

export type BookParams = NonNullable<
  paths['/api/v1/books']['get']['parameters']['query']
>
export type BookPage =
  paths['/api/v1/books']['get']['responses'][200]['content']['application/json']
export type Book =
  paths['/api/v1/books/{entity_id}']['get']['responses'][200]['content']['application/json']
