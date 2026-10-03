import { PageHeader } from '../../components/PageHeader'
import { BookList } from '../../features/books/BookList'

export function BooksPage() {
  return (
    <>
      <PageHeader title="图书" description="查找图书，查看馆藏与可借情况。" />
      <BookList />
    </>
  )
}
