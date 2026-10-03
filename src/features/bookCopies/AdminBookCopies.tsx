import { useState } from 'react'
import { Alert, Button, Form, Select, Space, Tag } from 'antd'
import { useSearchParams } from 'react-router'
import { EditorModal } from '../../components/EditorModal'
import { ManagementTable } from '../../components/ManagementTable'
import { paginationParams, updateSearchParams } from '../../utils/searchParams'
import { CopyEditor } from './CopyEditor'
import { useCopies, useSaveCopy, useCopyStatus } from './hooks'
import { copyStatuses, manualCopyStatuses, copyStatusLabel } from './status'
import type { Copy, CopyParams, CopyStatusInput } from './adminTypes'

export function AdminBookCopies({ bookId }: { bookId: number }) {
  const [search, setSearch] = useSearchParams()
  const params: CopyParams = {
    ...paginationParams(search),
    status: copyStatuses.find(({ value }) => value === search.get('status'))
      ?.value,
  }
  const query = useCopies(bookId, params)
  const save = useSaveCopy(bookId)
  const status = useCopyStatus()
  const [editing, setEditing] = useState<Copy | 'new' | null>(null)
  const [changing, setChanging] = useState<Copy | null>(null)
  const pending = save.isPending || status.isPending
  function edit(copy: Copy | 'new') {
    save.reset()
    status.reset()
    setEditing(copy)
  }
  return (
    <div className="content-stack">
      <Space wrap>
        <Button type="primary" disabled={pending} onClick={() => edit('new')}>
          新增馆藏
        </Button>
        <Select
          aria-label="馆藏状态筛选"
          style={{ width: 180 }}
          allowClear
          placeholder="全部馆藏状态"
          value={params.status}
          options={copyStatuses}
          onChange={(value) =>
            setSearch(updateSearchParams(search, { status: value, page: 1 }))
          }
        />
      </Space>
      {!editing && save.isSuccess && (
        <Alert type="success" showIcon message="馆藏保存成功" />
      )}
      {!changing && status.isSuccess && (
        <Alert type="success" showIcon message="馆藏状态更新成功" />
      )}
      <ManagementTable<Copy>
        query={query}
        label="馆藏"
        columns={[
          { title: '编号', dataIndex: 'id' },
          { title: '条码', dataIndex: 'barcode' },
          { title: '位置', dataIndex: 'location' },
          { title: '入库日期', dataIndex: 'acquired_at' },
          {
            title: '状态',
            key: 'status',
            render: (_, copy) => <Tag>{copyStatusLabel(copy.status)}</Tag>,
          },
          {
            title: '操作',
            key: 'actions',
            render: (_, copy) => (
              <Space wrap>
                <Button disabled={pending} onClick={() => edit(copy)}>
                  编辑
                </Button>
                <Button
                  disabled={pending || copy.status === 'BORROWED'}
                  onClick={() => {
                    save.reset()
                    status.reset()
                    setChanging(copy)
                  }}
                >
                  修改状态
                </Button>
                {copy.status === 'BORROWED' && (
                  <span>借出馆藏请通过归还流程处理</span>
                )}
              </Space>
            ),
          },
        ]}
      />
      {editing && (
        <CopyEditor
          copy={editing}
          pending={save.isPending}
          error={save.error}
          onClose={() => setEditing(null)}
          onSubmit={(values) => {
            const editable = {
              location: values.location?.trim() || null,
              acquired_at: values.acquired_at || null,
            }
            if (editing !== 'new')
              return save.mutateAsync({
                kind: 'edit',
                id: editing.id,
                values: editable,
              })
            // The create form requires a barcode; never send a status or book_id in its body.
            if (!values.barcode?.trim())
              return Promise.reject(new Error('请输入条码'))
            return save.mutateAsync({
              kind: 'create',
              values: { ...editable, barcode: values.barcode.trim() },
            })
          }}
        />
      )}
      {changing && (
        <EditorModal<CopyStatusInput>
          title={`修改馆藏 #${changing.id} 状态`}
          initialValues={{ status: changing.status }}
          pending={status.isPending}
          error={status.error}
          onClose={() => setChanging(null)}
          onSubmit={(values) => status.mutateAsync({ id: changing.id, values })}
        >
          <Form.Item
            name="status"
            label="馆藏状态"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select options={manualCopyStatuses} />
          </Form.Item>
        </EditorModal>
      )}
    </div>
  )
}
