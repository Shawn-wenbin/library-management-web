import { Descriptions, Tag } from 'antd'
import { useCurrentUser } from '../auth/hooks'
import { Loading } from '../../components/Loading'
import { RequestError } from '../../components/RequestError'
import { formatDateTime } from '../../utils/formatDate'

export function Profile() {
  const query = useCurrentUser()
  if (query.isPending) return <Loading label="正在加载个人信息…" />
  if (query.isError)
    return (
      <RequestError
        error={query.error}
        retry={() => void query.refetch()}
        loading={query.isFetching}
      />
    )
  const user = query.data
  return (
    <Descriptions
      bordered
      column={{ xs: 1, sm: 2, md: 2 }}
      items={[
        { key: 'id', label: '用户编号', children: user.id },
        { key: 'username', label: '用户名', children: user.username },
        { key: 'name', label: '姓名', children: user.full_name || '未填写' },
        { key: 'email', label: '邮箱', children: user.email },
        {
          key: 'role',
          label: '角色',
          children: user.role === 'ADMIN' ? '管理员' : '读者',
        },
        {
          key: 'active',
          label: '账号状态',
          children: (
            <Tag color={user.is_active ? 'green' : 'red'}>
              {user.is_active ? '启用' : '停用'}
            </Tag>
          ),
        },
        {
          key: 'created',
          label: '注册时间',
          children: formatDateTime(user.created_at),
        },
        {
          key: 'updated',
          label: '更新时间',
          children: formatDateTime(user.updated_at),
        },
      ]}
    />
  )
}
