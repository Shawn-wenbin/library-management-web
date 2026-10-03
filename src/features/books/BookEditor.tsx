import { Form, Input, Select, Switch } from 'antd'
import { EditorModal } from '../../components/EditorModal'
import { EmptyState } from '../../components/EmptyState'
import { Loading } from '../../components/Loading'
import { RequestError } from '../../components/RequestError'
import { dateRules, requiredText, optionalText } from '../../utils/formRules'
import { AuthorsSelect } from '../authors/AuthorsSelect'
import { useCategories } from '../categories/hooks'
import type { Book, BookCreate } from './adminTypes'

export function BookEditor({
  book,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  book: Book | 'new'
  pending: boolean
  error: Error | null
  onSubmit: (values: BookCreate) => Promise<unknown>
  onClose: () => void
}) {
  const categories = useCategories()
  const initial: Partial<BookCreate> =
    book === 'new'
      ? { title: '', author_ids: [], is_active: true }
      : {
          title: book.title,
          subtitle: book.subtitle,
          isbn: book.isbn,
          publisher: book.publisher,
          publication_date: book.publication_date,
          description: book.description,
          cover_url: book.cover_url,
          category_id: book.category_id,
          author_ids: book.authors.map((author) => author.id),
          is_active: book.is_active,
        }
  return (
    <EditorModal<BookCreate>
      title={book === 'new' ? '新增图书' : '编辑图书'}
      initialValues={initial}
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={(values) =>
        onSubmit({
          ...values,
          title: values.title.trim(),
          subtitle: values.subtitle?.trim() || null,
          isbn: values.isbn?.trim() || null,
          publisher: values.publisher?.trim() || null,
          publication_date: values.publication_date || null,
          description: values.description?.trim() || null,
          cover_url: values.cover_url?.trim() || null,
          author_ids: values.author_ids ?? [],
        })
      }
    >
      <Form.Item name="title" label="书名" rules={requiredText(255)}>
        <Input />
      </Form.Item>
      <Form.Item name="subtitle" label="副标题" rules={optionalText(255)}>
        <Input />
      </Form.Item>
      <Form.Item name="isbn" label="ISBN" rules={optionalText(64)}>
        <Input />
      </Form.Item>
      <Form.Item
        name="category_id"
        label="分类"
        rules={[{ required: true, message: '请选择分类' }]}
      >
        <Select
          loading={categories.isFetching}
          notFoundContent={
            categories.isPending ? (
              <Loading compact label="正在加载分类…" />
            ) : categories.isError ? (
              '分类加载失败'
            ) : (
              <EmptyState description="暂无分类" />
            )
          }
          options={categories.data?.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
      </Form.Item>
      {categories.error && (
        <RequestError
          error={categories.error}
          retry={() => void categories.refetch()}
          loading={categories.isFetching}
        />
      )}
      <Form.Item
        name="author_ids"
        label="作者"
        rules={[{ type: 'array', max: 100, message: '最多选择 100 位作者' }]}
      >
        <AuthorsSelect initialAuthors={book === 'new' ? [] : book.authors} />
      </Form.Item>
      <Form.Item name="publisher" label="出版社" rules={optionalText(150)}>
        <Input />
      </Form.Item>
      <Form.Item name="publication_date" label="出版日期" rules={dateRules}>
        <Input placeholder="YYYY-MM-DD" />
      </Form.Item>
      <Form.Item
        name="cover_url"
        label="封面地址"
        rules={[
          ...optionalText(500),
          {
            validator: (_, value: string | null | undefined) => {
              if (!value) return Promise.resolve()
              try {
                new URL(value)
                return Promise.resolve()
              } catch {
                return Promise.reject(new Error('请输入有效的完整 URL'))
              }
            },
          },
        ]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        name="description"
        label="图书简介"
        rules={optionalText(16000)}
      >
        <Input.TextArea rows={4} />
      </Form.Item>
      <Form.Item name="is_active" label="上架" valuePropName="checked">
        <Switch />
      </Form.Item>
    </EditorModal>
  )
}
