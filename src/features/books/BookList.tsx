import { Tag } from 'antd'
import { Link, useSearchParams } from 'react-router'
import { updateSearchParams } from '../../utils/searchParams'
import { ManagementTable } from '../../components/ManagementTable'
import { BookFilters } from './BookFilters'
import { useBooks } from './hooks'
import { bookSearchParams } from './search'
import type { Book } from './types'

export function BookList() {
  const [search, setSearch] = useSearchParams()
  const params = bookSearchParams(search)
  const query = useBooks(params)
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
      <ManagementTable<Book>
        query={query}
        label="图书"
        emptyDescription="暂无符合条件的图书"
        loadingLabel="正在加载图书…"
        scrollX={800}
        totalUnit="本"
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
      />
    </div>
  )
}
