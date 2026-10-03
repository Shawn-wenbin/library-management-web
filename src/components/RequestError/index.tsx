import { Alert, Button } from 'antd'
import { ApiError } from '../../api/errors'

const fieldLabels: Record<string, string> = {
  book_id: '图书编号',
  loan_id: '借阅编号',
  keyword: '关键词',
  category_id: '分类',
  author_id: '作者',
  page: '页码',
  page_size: '每页条数',
  status: '状态',
  user_id: '用户编号',
  name: '名称',
  title: '书名',
  author_ids: '作者',
  biography: '作者简介',
  description: '描述',
  barcode: '条码',
  location: '馆藏位置',
  acquired_at: '入库日期',
  publication_date: '出版日期',
  cover_url: '封面地址',
  role: '角色',
  is_active: '启用状态',
  isbn: 'ISBN',
  publisher: '出版社',
  subtitle: '副标题',
  sort_by: '排序字段',
  sort_order: '排序方向',
}

export function RequestError({
  error,
  retry,
  loading = false,
}: {
  error: Error
  retry?: () => void
  loading?: boolean
}) {
  const issues = error instanceof ApiError ? error.issues : []
  return (
    <Alert
      type="error"
      showIcon
      role="alert"
      message={error.message}
      description={
        issues.length > 0 ? (
          <ul>
            {issues.map((issue, index) => {
              const field = String(issue.loc.at(-1) ?? '')
              return (
                <li key={index}>
                  {fieldLabels[field] ?? field}：{issue.msg}
                </li>
              )
            })}
          </ul>
        ) : undefined
      }
      action={
        retry ? (
          <Button loading={loading} onClick={retry}>
            重试
          </Button>
        ) : undefined
      }
    />
  )
}
