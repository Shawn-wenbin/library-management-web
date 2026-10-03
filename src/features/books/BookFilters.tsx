import { Button, Checkbox, Form, Input, Select, Space } from 'antd'
import { AuthorSelect } from '../authors/AuthorSelect'
import { useCategories } from '../categories/hooks'
import { EmptyState } from '../../components/EmptyState'
import { Loading } from '../../components/Loading'
import { RequestError } from '../../components/RequestError'
import type { BookParams } from './types'

export function BookFilters({
  params,
  onApply,
  onReset,
  admin = false,
}: {
  params: BookParams
  onApply: (values: BookParams) => void
  onReset: () => void
  admin?: boolean
}) {
  const categories = useCategories()
  return (
    <Form layout="vertical" initialValues={params} onFinish={onApply}>
      <div className="book-filters">
        {admin && (
          <Form.Item
            name="is_active"
            label="上架状态"
            getValueProps={(value: boolean) => ({ value: String(value) })}
            normalize={(value: string) => value === 'true'}
          >
            <Select
              options={[
                { value: 'true', label: '已上架' },
                { value: 'false', label: '已下架' },
              ]}
            />
          </Form.Item>
        )}
        <Form.Item
          name="keyword"
          label="关键词"
          rules={[{ max: 255, message: '关键词不能超过 255 个字符' }]}
        >
          <Input allowClear placeholder="输入图书关键词" />
        </Form.Item>
        <Form.Item name="category_id" label="分类">
          <Select
            allowClear
            placeholder="全部分类"
            loading={categories.isFetching}
            options={categories.data?.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            notFoundContent={
              categories.isPending ? (
                <Loading compact label="正在加载分类…" />
              ) : categories.isError ? (
                '分类加载失败'
              ) : (
                <EmptyState description="暂无分类" />
              )
            }
          />
        </Form.Item>
        <Form.Item name="author_id" label="作者">
          <AuthorSelect />
        </Form.Item>
        <Form.Item name="sort_by" label="排序字段">
          <Select
            options={[
              { value: 'id', label: '图书编号' },
              { value: 'title', label: '书名' },
              { value: 'publication_date', label: '出版日期' },
              { value: 'created_at', label: '入库时间' },
            ]}
          />
        </Form.Item>
        <Form.Item name="sort_order" label="排序方向">
          <Select
            options={[
              { value: 'asc', label: '升序' },
              { value: 'desc', label: '降序' },
            ]}
          />
        </Form.Item>
      </div>
      <Space wrap className="filter-actions">
        <Form.Item name="available_only" valuePropName="checked" noStyle>
          <Checkbox>仅看可借</Checkbox>
        </Form.Item>
        <Button type="primary" htmlType="submit">
          查询
        </Button>
        <Button onClick={onReset}>重置</Button>
      </Space>
      {categories.isError && (
        <RequestError
          error={categories.error}
          retry={() => void categories.refetch()}
          loading={categories.isFetching}
        />
      )}
    </Form>
  )
}
