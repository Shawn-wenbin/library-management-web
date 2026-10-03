import { useId, useRef, type ReactNode } from 'react'
import { Form, Modal } from 'antd'
import type { NamePath } from 'antd/es/form/interface'
import { ApiError } from '../../api/errors'
import { RequestError } from '../RequestError'

export function EditorModal<T extends object>({
  title,
  initialValues,
  pending,
  error,
  onSubmit,
  onClose,
  children,
}: {
  title: string
  initialValues: Partial<T>
  pending: boolean
  error: Error | null
  onSubmit: (values: T) => Promise<unknown>
  onClose: () => void
  children: ReactNode
}) {
  const [form] = Form.useForm<T>()
  const formId = useId()
  const submitting = useRef(false)
  async function submit(values: T) {
    if (pending || submitting.current) return
    submitting.current = true
    try {
      await onSubmit(values)
      onClose()
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        const fields = form.getFieldsValue()
        form.setFields(
          error.issues.flatMap((issue) => {
            const name = issue.loc[0] === 'body' ? issue.loc[1] : undefined
            // A nested array error belongs to the registered top-level form field.
            return typeof name === 'string' && Object.hasOwn(fields, name)
              ? [{ name: name as NamePath<T>, errors: [issue.msg] }]
              : []
          }),
        )
      }
    } finally {
      submitting.current = false
    }
  }
  return (
    <Modal
      open
      title={title}
      okText="保存"
      cancelText="取消"
      confirmLoading={pending}
      onOk={() => form.submit()}
      onCancel={onClose}
      closable={!pending}
      maskClosable={!pending}
      keyboard={!pending}
      cancelButtonProps={{ disabled: pending }}
    >
      <Form
        name={formId}
        form={form}
        layout="vertical"
        initialValues={initialValues}
        disabled={pending}
        onFinish={submit}
      >
        {error && <RequestError error={error} />}
        {children}
      </Form>
    </Modal>
  )
}
