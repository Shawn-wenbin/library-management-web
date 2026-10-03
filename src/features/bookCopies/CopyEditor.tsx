import { Form, Input } from 'antd'
import { EditorModal } from '../../components/EditorModal'
import { dateRules, optionalText, requiredText } from '../../utils/formRules'
import type { Copy, CopyCreate, CopyPatch } from './adminTypes'

type CopyForm = CopyPatch & Partial<Pick<CopyCreate, 'barcode'>>
export function CopyEditor({
  copy,
  pending,
  error,
  onSubmit,
  onClose,
}: {
  copy: Copy | 'new'
  pending: boolean
  error: Error | null
  onClose: () => void
  onSubmit: (values: CopyForm) => Promise<unknown>
}) {
  return (
    <EditorModal<CopyForm>
      title={copy === 'new' ? '新增馆藏' : `编辑馆藏 #${copy.id}`}
      initialValues={
        copy === 'new'
          ? {}
          : { location: copy.location, acquired_at: copy.acquired_at }
      }
      pending={pending}
      error={error}
      onClose={onClose}
      onSubmit={onSubmit}
    >
      {copy === 'new' && (
        <Form.Item name="barcode" label="条码" rules={requiredText(64)}>
          <Input />
        </Form.Item>
      )}
      <Form.Item name="location" label="馆藏位置" rules={optionalText(100)}>
        <Input />
      </Form.Item>
      <Form.Item name="acquired_at" label="入库日期" rules={dateRules}>
        <Input placeholder="YYYY-MM-DD" />
      </Form.Item>
    </EditorModal>
  )
}
