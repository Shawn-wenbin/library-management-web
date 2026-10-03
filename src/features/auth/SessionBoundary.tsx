import type { ReactNode } from 'react'
import { Button, Result, Space } from 'antd'
import { Loading } from '../../components/Loading'
import { logout, useCurrentUser } from './hooks'
import type { CurrentUser } from './types'

export function SessionBoundary({
  children,
}: {
  children: (user: CurrentUser) => ReactNode
}) {
  const query = useCurrentUser()
  if (query.isPending) return <Loading label="正在确认登录状态…" />
  if (query.isError)
    return (
      <Result
        status="warning"
        title="无法确认登录状态"
        subTitle={query.error.message}
        extra={
          <Space>
            <Button
              type="primary"
              loading={query.isFetching}
              onClick={() => void query.refetch()}
            >
              重试
            </Button>
            <Button onClick={logout}>重新登录</Button>
          </Space>
        }
      />
    )
  if (!query.data)
    return (
      <Result
        status="warning"
        title="未获取到用户信息"
        extra={<Button onClick={logout}>重新登录</Button>}
      />
    )
  if (!query.data.is_active)
    return (
      <Result
        status="403"
        title="账号已停用"
        extra={<Button onClick={logout}>返回登录</Button>}
      />
    )
  return children(query.data)
}
