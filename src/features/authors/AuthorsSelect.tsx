import { useInfiniteQuery } from '@tanstack/react-query'
import { Button, Select } from 'antd'
import { queryKeys } from '../../api/queryKeys'
import { RequestError } from '../../components/RequestError'
import { getAuthors } from './api'
import type { Author } from './adminTypes'

export function AuthorsSelect({
  id,
  value,
  onChange,
  initialAuthors = [],
}: {
  id?: string
  value?: number[]
  onChange?: (value: number[]) => void
  initialAuthors?: Author[]
}) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.authors.list,
    queryFn: ({ pageParam, signal }) => getAuthors(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.page_size < last.total ? last.page + 1 : undefined,
  })
  const authors = new Map(initialAuthors.map((author) => [author.id, author]))
  query.data?.pages.forEach((page) =>
    page.items.forEach((author) => authors.set(author.id, author)),
  )
  return (
    <>
      <Select
        id={id}
        mode="multiple"
        value={value}
        onChange={onChange}
        allowClear
        optionFilterProp="label"
        placeholder="选择作者（可多选）"
        loading={query.isFetching}
        options={[...authors.values()].map((author) => ({
          value: author.id,
          label: author.name,
        }))}
        notFoundContent={query.isPending ? '正在加载作者…' : '暂无作者'}
        popupRender={(menu) => (
          <>
            {menu}
            {query.hasNextPage && (
              <Button
                block
                type="text"
                loading={query.isFetchingNextPage}
                onClick={() => void query.fetchNextPage()}
              >
                加载更多作者
              </Button>
            )}
          </>
        )}
      />
      {query.error && (
        <RequestError
          error={query.error}
          retry={() => void query.refetch()}
          loading={query.isFetching}
        />
      )}
    </>
  )
}
