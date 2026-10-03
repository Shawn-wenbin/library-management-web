import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { Button, Select, Space } from 'antd'
import { queryKeys } from '../../api/queryKeys'
import { EmptyState } from '../../components/EmptyState'
import { Loading } from '../../components/Loading'
import { RequestError } from '../../components/RequestError'
import { getAuthor, getAuthors } from './api'

export function AuthorSelect({
  value,
  onChange,
  id,
}: {
  value?: number
  onChange?: (value: number | undefined) => void
  id?: string
}) {
  const query = useInfiniteQuery({
    queryKey: queryKeys.authors.list,
    queryFn: ({ pageParam, signal }) => getAuthors(pageParam, signal),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.page * last.page_size < last.total ? last.page + 1 : undefined,
  })
  const authors = query.data?.pages.flatMap((page) => page.items) ?? []
  const selected = useQuery({
    queryKey: queryKeys.authors.detail(value ?? 0),
    queryFn: ({ signal }) => getAuthor(value ?? 0, signal),
    enabled:
      value !== undefined && !authors.some((author) => author.id === value),
  })
  const options = new Map(
    authors.map((author) => [
      author.id,
      { value: author.id, label: author.name },
    ]),
  )
  if (value !== undefined && !options.has(value)) {
    options.set(value, {
      value,
      label: selected.data?.name ?? `作者 #${value}`,
    })
  }
  return (
    <Space direction="vertical" className="full-width">
      <Select
        id={id}
        allowClear
        placeholder="全部作者"
        value={value}
        onChange={onChange}
        loading={query.isFetching}
        options={[...options.values()]}
        notFoundContent={
          query.isPending ? (
            <Loading compact label="正在加载作者…" />
          ) : query.isError ? (
            '作者加载失败'
          ) : (
            <EmptyState description="暂无作者" />
          )
        }
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
      {query.isError && (
        <RequestError
          error={query.error}
          retry={() => void query.refetch()}
          loading={query.isFetching}
        />
      )}
      {selected.isError && (
        <RequestError
          error={selected.error}
          retry={() => void selected.refetch()}
          loading={selected.isFetching}
        />
      )}
    </Space>
  )
}
