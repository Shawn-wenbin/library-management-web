import { useState } from 'react'
import { Alert, Button, Form, Input, Popconfirm, Space } from 'antd'
import { useSearchParams } from 'react-router'
import { ManagementTable } from '../../components/ManagementTable'
import { EditorModal } from '../../components/EditorModal'
import { RequestError } from '../../components/RequestError'
import { paginationParams } from '../../utils/searchParams'
import { requiredText, optionalText } from '../../utils/formRules'
import { useSaveCategory, useDeleteCategory } from './adminHooks'
import { useCategories } from './hooks'
import type { Category, CategoryCreate } from './adminTypes'

export function AdminCategories() {
  const [search] = useSearchParams()
  const query = useCategories()
  const { page, page_size } = paginationParams(search)
  const tableQuery = {
    ...query,
    data: query.data
      ? {
          items: query.data.slice((page - 1) * page_size, page * page_size),
          total: query.data.length,
        }
      : undefined,
  }
  const [editing, setEditing] = useState<Category | 'new' | null>(null)
  const save = useSaveCategory()
  const remove = useDeleteCategory()
  const pending = save.isPending || remove.isPending
  function edit(record: Category | 'new') {
    save.reset()
    remove.reset()
    setEditing(record)
  }
  return (
    <div className="content-stack">
      <div>
        <Button type="primary" disabled={pending} onClick={() => edit('new')}>
          新增分类
        </Button>
      </div>
      {!editing && save.isSuccess && (
        <Alert type="success" message="分类保存成功" showIcon />
      )}
      {remove.isSuccess && (
        <Alert type="success" message="分类删除成功" showIcon />
      )}
      {remove.error && <RequestError error={remove.error} />}
      <ManagementTable<Category>
        query={tableQuery}
        label="分类"
        columns={[
          { title: '编号', dataIndex: 'id' },
          { title: '分类名称', dataIndex: 'name' },
          {
            title: '分类描述',
            dataIndex: 'description',
            ellipsis: true,
            render: (value: string | null) => value || '—',
          },
          {
            title: '操作',
            key: 'actions',
            render: (_, record) => (
              <Space>
                <Button disabled={pending} onClick={() => edit(record)}>
                  编辑
                </Button>
                <Popconfirm
                  title={`确认删除${record.name}？`}
                  description="关联图书等业务限制由服务器校验。"
                  okText="确认删除"
                  cancelText="取消"
                  disabled={pending}
                  okButtonProps={{ disabled: pending }}
                  onConfirm={() => {
                    if (!pending) {
                      save.reset()
                      remove.mutate(record.id)
                    }
                  }}
                >
                  <Button danger disabled={pending}>
                    删除
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      {editing && (
        <EditorModal<CategoryCreate>
          title={editing === 'new' ? '新增分类' : '编辑分类'}
          initialValues={
            editing === 'new'
              ? { name: '', description: null }
              : { name: editing.name, description: editing.description }
          }
          pending={save.isPending}
          error={save.error}
          onClose={() => setEditing(null)}
          onSubmit={(values) =>
            save.mutateAsync({
              id: editing === 'new' ? undefined : editing.id,
              values: {
                name: values.name.trim(),
                description: values.description?.trim() || null,
              },
            })
          }
        >
          <Form.Item name="name" label="分类名称" rules={requiredText(100)}>
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="分类描述"
            rules={optionalText(500)}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </EditorModal>
      )}
    </div>
  )
}
