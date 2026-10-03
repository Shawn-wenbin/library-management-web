import { useState } from 'react'
import { Alert, Button, Form, Input, Popconfirm, Space } from 'antd'
import { useSearchParams } from 'react-router'
import { ManagementTable } from '../../components/ManagementTable'
import { EditorModal } from '../../components/EditorModal'
import { RequestError } from '../../components/RequestError'
import { paginationParams } from '../../utils/searchParams'
import { requiredText, optionalText } from '../../utils/formRules'
import { useSaveAuthor, useDeleteAuthor } from './adminHooks'
import { useAdminAuthors } from './adminHooks'
import type { Author, AuthorCreate } from './adminTypes'

export function AdminAuthors() {
  const [search] = useSearchParams()
  const query = useAdminAuthors(paginationParams(search))
  const [editing, setEditing] = useState<Author | 'new' | null>(null)
  const save = useSaveAuthor()
  const remove = useDeleteAuthor()
  const pending = save.isPending || remove.isPending
  function edit(record: Author | 'new') {
    save.reset()
    remove.reset()
    setEditing(record)
  }
  return (
    <div className="content-stack">
      <div>
        <Button type="primary" disabled={pending} onClick={() => edit('new')}>
          新增作者
        </Button>
      </div>
      {!editing && save.isSuccess && (
        <Alert type="success" message="作者保存成功" showIcon />
      )}
      {remove.isSuccess && (
        <Alert type="success" message="作者删除成功" showIcon />
      )}
      {remove.error && <RequestError error={remove.error} />}
      <ManagementTable<Author>
        query={query}
        label="作者"
        columns={[
          { title: '编号', dataIndex: 'id' },
          { title: '作者名称', dataIndex: 'name' },
          {
            title: '作者简介',
            dataIndex: 'biography',
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
        <EditorModal<AuthorCreate>
          title={editing === 'new' ? '新增作者' : '编辑作者'}
          initialValues={
            editing === 'new'
              ? { name: '', biography: null }
              : { name: editing.name, biography: editing.biography }
          }
          pending={save.isPending}
          error={save.error}
          onClose={() => setEditing(null)}
          onSubmit={(values) =>
            save.mutateAsync({
              id: editing === 'new' ? undefined : editing.id,
              values: {
                name: values.name.trim(),
                biography: values.biography?.trim() || null,
              },
            })
          }
        >
          <Form.Item name="name" label="作者名称" rules={requiredText(150)}>
            <Input />
          </Form.Item>
          <Form.Item
            name="biography"
            label="作者简介"
            rules={optionalText(16000)}
          >
            <Input.TextArea rows={4} />
          </Form.Item>
        </EditorModal>
      )}
    </div>
  )
}
