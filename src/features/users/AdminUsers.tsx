import { useState } from 'react'
import { Alert, Button, Form, Popconfirm, Select, Space, Tag } from 'antd'
import { useSearchParams } from 'react-router'
import { ManagementTable } from '../../components/ManagementTable'
import { RequestError } from '../../components/RequestError'
import { paginationParams, updateSearchParams } from '../../utils/searchParams'
import { useUsers, useUpdateUser } from './adminHooks'
import { UserDetails } from './UserDetails'
import type { User, UserParams } from './adminTypes'

export function AdminUsers() {
  const [search, setSearch] = useSearchParams()
  const role = search.get('role')
  const active = search.get('is_active')
  const params: UserParams = {
    ...paginationParams(search),
    role: role === 'ADMIN' || role === 'READER' ? role : undefined,
    is_active:
      active === 'true' ? true : active === 'false' ? false : undefined,
  }
  const query = useUsers(params)
  const mutation = useUpdateUser()
  const [selected, setSelected] = useState<number>()
  return (
    <div className="content-stack">
      <Form<UserParams>
        key={search.toString()}
        layout="inline"
        initialValues={params}
        onFinish={(values) =>
          setSearch(updateSearchParams(search, { ...values, page: 1 }))
        }
      >
        <Form.Item name="role" label="角色">
          <Select
            allowClear
            placeholder="全部角色"
            style={{ width: 140 }}
            options={[
              { value: 'ADMIN', label: '管理员' },
              { value: 'READER', label: '读者' },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="is_active"
          label="账号状态"
          getValueProps={(value?: boolean) => ({
            value: value === undefined ? undefined : String(value),
          })}
          normalize={(value?: string) =>
            value === undefined ? undefined : value === 'true'
          }
        >
          <Select
            allowClear
            placeholder="全部状态"
            style={{ width: 140 }}
            options={[
              { value: 'true', label: '启用' },
              { value: 'false', label: '禁用' },
            ]}
          />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">
            查询
          </Button>
          <Button onClick={() => setSearch({})}>重置</Button>
        </Space>
      </Form>
      {mutation.isSuccess && (
        <Alert type="success" showIcon message="用户更新成功" />
      )}
      {mutation.error && <RequestError error={mutation.error} />}
      <ManagementTable<User>
        label="用户"
        query={query}
        columns={[
          { title: '编号', dataIndex: 'id' },
          { title: '用户名', dataIndex: 'username' },
          { title: '姓名', dataIndex: 'full_name' },
          { title: '邮箱', dataIndex: 'email' },
          {
            title: '角色',
            key: 'role',
            render: (_, user) => (user.role === 'ADMIN' ? '管理员' : '读者'),
          },
          {
            title: '状态',
            key: 'status',
            render: (_, user) => (
              <Tag color={user.is_active ? 'green' : 'default'}>
                {user.is_active ? '启用' : '禁用'}
              </Tag>
            ),
          },
          {
            title: '操作',
            key: 'actions',
            render: (_, user) => (
              <Space wrap>
                <Button onClick={() => setSelected(user.id)}>查看</Button>
                <Popconfirm
                  title={`确认${user.is_active ? '禁用' : '启用'}用户 ${user.username}？`}
                  okText="确认修改"
                  cancelText="取消"
                  disabled={mutation.isPending}
                  okButtonProps={{ disabled: mutation.isPending }}
                  onConfirm={() => {
                    if (!mutation.isPending)
                      mutation.mutate({
                        id: user.id,
                        kind: 'status',
                        values: { is_active: !user.is_active },
                      })
                  }}
                >
                  <Button disabled={mutation.isPending}>
                    {user.is_active ? '禁用账号' : '启用账号'}
                  </Button>
                </Popconfirm>
                <Popconfirm
                  title={`确认将 ${user.username} 改为${user.role === 'ADMIN' ? '读者' : '管理员'}？`}
                  description="此操作会改变该用户的管理权限。"
                  okText="确认修改"
                  cancelText="取消"
                  disabled={mutation.isPending}
                  okButtonProps={{ disabled: mutation.isPending }}
                  onConfirm={() => {
                    if (!mutation.isPending)
                      mutation.mutate({
                        id: user.id,
                        kind: 'role',
                        values: {
                          role: user.role === 'ADMIN' ? 'READER' : 'ADMIN',
                        },
                      })
                  }}
                >
                  <Button disabled={mutation.isPending}>
                    改为{user.role === 'ADMIN' ? '读者' : '管理员'}
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
      {selected !== undefined && (
        <UserDetails id={selected} onClose={() => setSelected(undefined)} />
      )}
    </div>
  )
}
