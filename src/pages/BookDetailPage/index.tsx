import { Result } from 'antd'
import { Link, useLocation, useParams } from 'react-router'
import { PageHeader } from '../../components/PageHeader'
import { BookDetails } from '../../features/books/BookDetails'
import { positiveInteger } from '../../utils/searchParams'

export function BookDetailPage() {
  const { bookId } = useParams()
  const id = positiveInteger(bookId ?? null)
  const { state }: { state: unknown } = useLocation()
  const search =
    state &&
    typeof state === 'object' &&
    'booksSearch' in state &&
    typeof state.booksSearch === 'string'
      ? state.booksSearch
      : ''
  return (
    <>
      <PageHeader
        title="图书详情"
        extra={<Link to={{ pathname: '/books', search }}>返回图书列表</Link>}
      />
      {id ? (
        <BookDetails key={id} bookId={id} />
      ) : (
        <Result status="404" title="无效的图书编号" />
      )}
    </>
  )
}
