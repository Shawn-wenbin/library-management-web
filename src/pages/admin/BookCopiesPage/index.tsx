import { Result } from 'antd'
import { Link, useLocation, useParams } from 'react-router'
import { PageHeader } from '../../../components/PageHeader'
import { AdminBookCopies } from '../../../features/bookCopies/AdminBookCopies'
import { positiveInteger } from '../../../utils/searchParams'

export function AdminBookCopiesPage() {
  const { bookId } = useParams()
  const id = positiveInteger(bookId ?? null)
  const { state } = useLocation()
  const search = typeof state?.booksSearch === 'string' ? state.booksSearch : ''
  if (!id) return <Result status="404" title="无效的图书编号" />
  return (
    <>
      <PageHeader title={`馆藏管理 · 图书 #${id}`} />
      <Link to={`/admin/books${search ? `?${search}` : ''}`}>返回图书管理</Link>
      <AdminBookCopies key={id} bookId={id} />
    </>
  )
}
