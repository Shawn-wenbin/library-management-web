import { Alert, Button, Form, Input } from 'antd'
import { ApiError } from '../../api/errors'
import { useLogin } from './hooks'
import type { LoginInput } from './types'

export function LoginForm() {
  const [form] = Form.useForm<LoginInput>()
  const mutation = useLogin()

  async function submit(values: LoginInput) {
    if (mutation.isPending) return
    try {
      await mutation.mutateAsync(values)
    } catch (error: unknown) {
      if (error instanceof ApiError) {
        form.setFields(
          error.issues.flatMap((issue) => {
            const name = issue.loc.at(-1)
            return name === 'username' || name === 'password'
              ? [{ name, errors: [issue.msg] }]
              : []
          }),
        )
      }
    }
  }

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={submit}
      requiredMark={false}
      disabled={mutation.isPending}
    >
      {mutation.isError && (
        <Alert
          type="error"
          showIcon
          message={mutation.error.message}
          className="login-error"
        />
      )}
      <Form.Item
        label="用户名"
        name="username"
        rules={[{ required: true, whitespace: true, message: '请输入用户名' }]}
      >
        <Input
          autoComplete="username"
          size="large"
          placeholder="请输入用户名"
        />
      </Form.Item>
      <Form.Item
        label="密码"
        name="password"
        rules={[
          { required: true, message: '请输入密码' },
          { min: 8, max: 128, message: '密码长度应为 8–128 个字符' },
        ]}
      >
        <Input.Password
          autoComplete="current-password"
          size="large"
          placeholder="请输入密码"
        />
      </Form.Item>
      <Button
        type="primary"
        htmlType="submit"
        size="large"
        block
        loading={mutation.isPending}
      >
        登录
      </Button>
    </Form>
  )
}
