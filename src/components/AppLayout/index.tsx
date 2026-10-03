import { useState } from 'react'
import { Button, Layout, Menu, Space, Tag, Typography } from 'antd'
import { Link, Outlet, useLocation } from 'react-router'
import { logout, useCurrentUser } from '../../features/auth/hooks'
import { getNavigation } from '../../router/navigation'

export function AppLayout() {
  const { data: user } = useCurrentUser()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)
  if (!user) return null
  const items: { key: string; label: React.ReactNode; disabled?: boolean }[] =
    getNavigation(user.role).map(({ path, label }) => ({
      key: path,
      label: <Link to={path}>{label}</Link>,
    }))
  if (user.role === 'ADMIN')
    items.push({
      key: 'copies',
      label: <span>馆藏管理（从图书进入）</span>,
      disabled: true,
    })
  const selectedKey = items
    .filter(
      ({ key }) =>
        location.pathname === key || location.pathname.startsWith(`${key}/`),
    )
    .sort((a, b) => b.key.length - a.key.length)[0]?.key
  return (
    <Layout className="app-layout">
      <Layout.Sider
        theme="light"
        breakpoint="lg"
        collapsedWidth={0}
        collapsed={collapsed}
        onCollapse={setCollapsed}
      >
        <div className="sidebar-brand">图书管理系统</div>
        <nav aria-label="主导航">
          <Menu
            mode="inline"
            items={items}
            selectedKeys={selectedKey ? [selectedKey] : []}
          />
        </nav>
      </Layout.Sider>
      <Layout>
        <Layout.Header className="app-header">
          <Typography.Text strong>我的图书馆</Typography.Text>
          <Space wrap>
            <Typography.Text>{user.full_name || user.username}</Typography.Text>
            <Tag color={user.role === 'ADMIN' ? 'gold' : 'green'}>
              {user.role === 'ADMIN' ? '管理员' : '读者'}
            </Tag>
            <Button onClick={logout}>退出登录</Button>
          </Space>
        </Layout.Header>
        <Layout.Content className="app-content">
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
