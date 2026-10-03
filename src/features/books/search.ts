import { paginationParams, positiveInteger } from '../../utils/searchParams'
import type { BookParams } from './types'

export function bookSearchParams(search: URLSearchParams): BookParams {
  const sort = search.get('sort_by')
  return {
    ...paginationParams(search),
    keyword: search.get('keyword')?.trim() || undefined,
    category_id: positiveInteger(search.get('category_id')),
    author_id: positiveInteger(search.get('author_id')),
    available_only: search.get('available_only') === 'true',
    sort_by:
      sort === 'title' || sort === 'publication_date' || sort === 'created_at'
        ? sort
        : 'id',
    sort_order: search.get('sort_order') === 'desc' ? 'desc' : 'asc',
    is_active: true,
  }
}
