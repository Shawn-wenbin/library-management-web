import { Descriptions, Tag, Typography } from 'antd'
import { BorrowButton } from '../loans/BorrowButton'
import { Loading } from '../../components/Loading'
import { RequestError } from '../../components/RequestError'
import { useBook } from './hooks'

export function BookDetails({ bookId }: { bookId: number }) {
  const query = useBook(bookId)
  if (query.isPending) return <Loading label="正在加载图书详情…" />
  if (query.isError)
    return (
      <RequestError
        error={query.error}
        retry={() => void query.refetch()}
        loading={query.isFetching}
      />
    )
  const book = query.data
  return (
    <div className="content-stack">
      <div>
        <Typography.Title level={3}>{book.title}</Typography.Title>
        {book.subtitle && (
          <Typography.Paragraph type="secondary">
            {book.subtitle}
          </Typography.Paragraph>
        )}
        <Tag
          color={
            book.is_active && book.available_copies > 0 ? 'green' : 'default'
          }
        >
          {book.is_active && book.available_copies > 0 ? '可借' : '暂不可借'}
        </Tag>
      </div>
      <Descriptions
        bordered
        column={{ xs: 1, sm: 2, md: 2 }}
        items={[
          { key: 'isbn', label: 'ISBN', children: book.isbn || '—' },
          {
            key: 'authors',
            label: '作者',
            children:
              book.authors.map((author) => author.name).join('、') || '—',
          },
          { key: 'category', label: '分类', children: book.category.name },
          {
            key: 'publisher',
            label: '出版社',
            children: book.publisher || '—',
          },
          {
            key: 'publication',
            label: '出版日期',
            children: book.publication_date || '—',
          },
          {
            key: 'copies',
            label: '馆藏总数 / 可借数量',
            children: `${book.total_copies} / ${book.available_copies}`,
          },
        ]}
      />
      <div>
        <Typography.Title level={4}>简介</Typography.Title>
        <Typography.Paragraph className="preserve-lines">
          {book.description || '暂无简介'}
        </Typography.Paragraph>
      </div>
      <BorrowButton book={book} />
    </div>
  )
}
