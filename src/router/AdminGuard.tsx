import { Result } from 'antd'
import { Outlet } from 'react-router'
import { useCurrentUser } from '../features/auth/hooks'

// Always nested below AuthGuard: identity has been fetched before rendering.
export function AdminGuard() {
  const { data: user } = useCurrentUser()
  if (user?.role !== 'ADMIN')
    return (
      <Result
        status="403"
        title="无权限访问"
        subTitle="此页面仅对管理员开放。"
      />
    )
  return <Outlet />
}
