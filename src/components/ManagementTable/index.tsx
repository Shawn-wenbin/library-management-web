import { Button, Table, type TableProps } from 'antd'
import { useSearchParams } from 'react-router'
import { RequestError } from '../RequestError'
import { paginationParams, updateSearchParams } from '../../utils/searchParams'
import { usePageCorrection } from '../../utils/usePageCorrection'

export function ManagementTable<T extends { id: number }>({
  query,
  columns,
  label,
}: {
  query: {
    data?: { items: T[]; total: number }
    isPending: boolean
    isFetching: boolean
    isError: boolean
    error: Error | null
    refetch: () => unknown
  }
  columns: TableProps<T>['columns']
  label: string
}) {
  const [search, setSearch] = useSearchParams()
  const params = paginationParams(search)
  usePageCorrection(
    params.page,
    params.page_size,
    !query.isError ? query.data?.total : undefined,
  )
  return (
    <>
      <div>
        <Button loading={query.isFetching} onClick={() => void query.refetch()}>
          刷新{label}
        </Button>
      </div>
      {query.error && (
        <RequestError
          error={query.error}
          retry={() => void query.refetch()}
          loading={query.isFetching}
        />
      )}
      {query.isPending && <span role="status">正在加载{label}…</span>}
      <Table<T>
        rowKey="id"
        columns={columns}
        dataSource={query.isError ? [] : query.data?.items}
        loading={query.isFetching}
        scroll={{ x: 1000 }}
        locale={{
          emptyText: query.isError
            ? `${label}加载失败`
            : query.isPending
              ? ' '
              : `暂无${label}`,
        }}
        pagination={{
          current: params.page,
          pageSize: params.page_size,
          total: query.data?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) => `共 ${total} 条`,
          onChange: (page, pageSize) =>
            setSearch(
              updateSearchParams(search, {
                page: pageSize !== params.page_size ? 1 : page,
                page_size: pageSize,
              }),
            ),
        }}
      />
    </>
  )
}
