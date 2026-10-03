import { describe, expect, it } from 'vitest'
import { bookSearchParams } from './search'

describe('URL 查询参数约束', () => {
  it('限制页容量，忽略非法编号和排序，不开放下架图书查询', () => {
    expect(
      bookSearchParams(
        new URLSearchParams(
          'page=-1&page_size=999&category_id=abc&author_id=9007199254740992&sort_by=invalid&sort_order=invalid&is_active=false',
        ),
      ),
    ).toEqual({
      page: 1,
      page_size: 100,
      category_id: undefined,
      author_id: undefined,
      keyword: undefined,
      sort_by: 'id',
      sort_order: 'asc',
      available_only: false,
      is_active: true,
    })
  })
  it('空白关键词不传给要求最短一个字符的 API', () => {
    expect(
      bookSearchParams(new URLSearchParams('keyword=+++')).keyword,
    ).toBeUndefined()
  })
})
