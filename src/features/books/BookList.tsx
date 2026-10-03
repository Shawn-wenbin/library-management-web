import { Button, Table, Tag } from 'antd'
import { Link, useSearchParams } from 'react-router'
import { RequestError } from '../../components/RequestError'
import { updateSearchParams } from '../../utils/searchParams'
import { usePageCorrection } from '../../utils/usePageCorrection'
import { BookFilters } from './BookFilters'
import { useBooks } from './hooks'
import { bookSearchParams } from './search'
import type { Book } from './types'

export function BookList() {
  const [search, setSearch] = useSearchParams()
  const params = bookSearchParams(search)
  const query = useBooks(params)
  usePageCorrection(
    params.page ?? 1,
    params.page_size ?? 20,
    query.isSuccess ? query.data.total : undefined,
  )
  return (
    <div className="content-stack">
      <BookFilters
        key={search.toString()}
        params={params}
        onApply={(values) =>
          setSearch(
            updateSearchParams(search, {
              ...values,
              keyword: values.keyword?.trim(),
              page: 1,
            }),
          )
        }
        onReset={() => setSearch({})}
      />
      <div>
        <Button loading={query.isFetching} onClick={() => void query.refetch()}>
          刷新图书
        </Button>
      </div>
      {query.isError && (
        <RequestError
          error={query.error}
          retry={() => void query.refetch()}
          loading={query.isFetching}
        />
      )}
      {query.isPending && <span role="status">正在加载图书…</span>}
      <Table<Book>
        rowKey="id"
        dataSource={query.isError ? [] : query.data?.items}
        loading={query.isFetching}
        scroll={{ x: 800 }}
        locale={{
          emptyText: query.isError
            ? '图书加载失败'
            : query.isPending
              ? ' '
              : '暂无符合条件的图书',
        }}
        columns={[
          {
            title: '书名',
            key: 'title',
            render: (_, book) => (
              <Link
                to={`/books/${book.id}`}
                state={{ booksSearch: search.toString() }}
              >
                {book.title}
              </Link>
            ),
          },
          {
            title: '作者',
            key: 'authors',
            render: (_, book) =>
              book.authors.map((author) => author.name).join('、') || '—',
          },
          {
            title: '分类',
            key: 'category',
            render: (_, book) => book.category.name,
          },
          {
            title: '出版社',
            dataIndex: 'publisher',
            render: (value: string | null) => value || '—',
          },
          {
            title: '馆藏 / 可借',
            key: 'copies',
            render: (_, book) =>
              `${book.total_copies} / ${book.available_copies}`,
          },
          {
            title: '状态',
            key: 'status',
            render: (_, book) => (
              <Tag
                color={
                  book.is_active && book.available_copies > 0
                    ? 'green'
                    : 'default'
                }
              >
                {book.is_active && book.available_copies > 0
                  ? '可借'
                  : '暂不可借'}
              </Tag>
            ),
          },
        ]}
        pagination={{
          current: params.page,
          pageSize: params.page_size,
          total: query.data?.total ?? 0,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50, 100],
          showTotal: (total) => `共 ${total} 本`,
          onChange: (page, pageSize) =>
            setSearch(
              updateSearchParams(search, {
                page: pageSize !== params.page_size ? 1 : page,
                page_size: pageSize,
              }),
            ),
        }}
      />
    </div>
  )
}
