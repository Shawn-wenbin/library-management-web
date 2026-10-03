import { Card, Typography } from 'antd'
import { Navigate, useLocation } from 'react-router'
import { LoginForm } from '../../features/auth/LoginForm'
import { SessionBoundary } from '../../features/auth/SessionBoundary'
import { useAuthStore } from '../../store/authStore'

function returnPath(state: unknown) {
  if (typeof state !== 'object' || !state || !('from' in state)) return '/books'
  const from = state.from
  return typeof from === 'string' &&
    from.startsWith('/') &&
    !from.startsWith('//') &&
    !from.includes('\\') &&
    !/^\/login(?:[/?#]|$)/.test(from)
    ? from
    : '/books'
}

export function LoginPage() {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()
  if (token)
    return (
      <SessionBoundary>
        {() => <Navigate to={returnPath(location.state)} replace />}
      </SessionBoundary>
    )

  return (
    <main className="login-page">
      <div className="login-intro">
        <span className="brand-caption">LIBRARY MANAGEMENT</span>
        <Typography.Title>阅读，从这里开始。</Typography.Title>
        <Typography.Paragraph>
          登录图书管理系统，开启你的阅读之旅。
        </Typography.Paragraph>
      </div>
      <Card className="login-card">
        <Typography.Title level={2}>欢迎回来</Typography.Title>
        <Typography.Paragraph type="secondary">
          使用你的图书馆账号登录
        </Typography.Paragraph>
        <LoginForm />
      </Card>
    </main>
  )
}
