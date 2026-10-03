import { useState } from 'react'
import { Alert, Button, Popconfirm, Space, Tag } from 'antd'
import { Link, useSearchParams } from 'react-router'
import { ManagementTable } from '../../components/ManagementTable'
import { RequestError } from '../../components/RequestError'
import { updateSearchParams } from '../../utils/searchParams'
import { BookFilters } from './BookFilters'
import { bookSearchParams } from './search'
import { useBooks } from './hooks'
import { useSaveBook, useDeactivateBook } from './adminHooks'
import { BookEditor } from './BookEditor'
import type { Book } from './adminTypes'

export function AdminBooks() {
  const [search, setSearch] = useSearchParams()
  const params = {
    ...bookSearchParams(search),
    is_active: search.get('is_active') !== 'false',
  }
  const query = useBooks(params)
  const [editing, setEditing] = useState<Book | 'new' | null>(null)
  const save = useSaveBook()
  const deactivate = useDeactivateBook()
  const pending = save.isPending || deactivate.isPending
  function edit(book: Book | 'new') {
    save.reset()
    deactivate.reset()
    setEditing(book)
  }
  return (
    <div className="content-stack">
      <BookFilters
        admin
        key={search.toString()}
        params={params}
        onReset={() => setSearch({})}
        onApply={(values) =>
          setSearch(
            updateSearchParams(search, {
              ...values,
              keyword: values.keyword?.trim(),
              page: 1,
            }),
          )
        }
      />
      <div>
        <Button type="primary" disabled={pending} onClick={() => edit('new')}>
          新增图书
        </Button>
      </div>
      {!editing && save.isSuccess && (
        <Alert type="success" showIcon message="图书保存成功" />
      )}
      {deactivate.isSuccess && (
        <Alert type="success" showIcon message="图书已下架" />
      )}
      {deactivate.error && <RequestError error={deactivate.error} />}
      <ManagementTable<Book>
        query={query}
        label="图书"
        columns={[
          { title: '编号', dataIndex: 'id' },
          { title: '书名', dataIndex: 'title' },
          { title: 'ISBN', dataIndex: 'isbn' },
          {
            title: '分类',
            key: 'category',
            render: (_, book) => book.category.name,
          },
          {
            title: '作者',
            key: 'authors',
            render: (_, book) =>
              book.authors.map((author) => author.name).join('、') || '—',
          },
          {
            title: '馆藏 / 可借',
            key: 'copies',
            render: (_, book) =>
              `${book.total_copies} / ${book.available_copies}`,
          },
          {
            title: '状态',
            key: 'active',
            render: (_, book) => (
              <Tag>{book.is_active ? '已上架' : '已下架'}</Tag>
            ),
          },
          {
            title: '操作',
            key: 'actions',
            render: (_, book) => (
              <Space wrap>
                <Button disabled={pending} onClick={() => edit(book)}>
                  编辑
                </Button>
                <Link
                  to={`/admin/books/${book.id}/copies`}
                  state={{ booksSearch: search.toString() }}
                >
                  馆藏管理
                </Link>
                {book.is_active && (
                  <Popconfirm
                    title={`确认下架《${book.title}》？`}
                    description="下架后读者将无法借阅该书。"
                    okText="确认下架"
                    cancelText="取消"
                    disabled={pending}
                    okButtonProps={{ disabled: pending }}
                    onConfirm={() => {
                      if (!pending) {
                        save.reset()
                        deactivate.mutate(book.id)
                      }
                    }}
                  >
                    <Button danger disabled={pending}>
                      下架
                    </Button>
                  </Popconfirm>
                )}
              </Space>
            ),
          },
        ]}
      />
      {editing && (
        <BookEditor
          book={editing}
          pending={save.isPending}
          error={save.error}
          onClose={() => setEditing(null)}
          onSubmit={(values) =>
            save.mutateAsync({
              id: editing === 'new' ? undefined : editing.id,
              values,
            })
          }
        />
      )}
    </div>
  )
}
